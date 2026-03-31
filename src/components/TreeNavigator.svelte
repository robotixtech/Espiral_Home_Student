<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProgramData, ProgramUnit, Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import { PREV_PROGRAM_CONFIG, NEXT_PROGRAM_CONFIG, FUTURE_PROGRAM_CONFIG } from '../lib/program-config';
  import UnitNode from './UnitNode.svelte';
  import DistantGalaxy from './DistantGalaxy.svelte';
  import ActivityNode from './ActivityNode.svelte';
  import {
    type SpiralConfig,
    getSpiralNodePositions,
    getSpiralSvgPath,
    getProgressSvgPath,
    getOrbitPaths,
    getProgressFraction,
  } from '../lib/spiral-math';
  import { getActivityOrbitPositions } from '../lib/tree-math';

  interface Props {
    program: ProgramData;
    onUnitSelected: (unit: ProgramUnit) => void;
    onActivitySelected: (activity: Activity) => void;
  }

  let { program, onUnitSelected, onActivitySelected }: Props = $props();

  // ── Canvas coordinate space ──────────────────────────────────────────────
  // Larger canvas to accommodate activity fans around every unit.
  const W = 1300;
  const H = 950;

  // Spiral — smaller than original so activity fans fit within the canvas.
  const spiral: SpiralConfig = {
    cx: W / 2,        // 650
    cy: H * 0.53,     // ≈ 504 — slight downward offset for title text
    r0x: 110, r0y: 90,
    r1x: 310, r1y: 265,
    startAngle: -Math.PI / 2,
    turns: 1.85,
  };

  const cx = spiral.cx;
  const cy = spiral.cy;

  // Activity nodes hug the unit circle — tiny dots (r=10) sit ~6px from the unit edge
  const ACT_ORBIT = 50;
  const UNIT_SIZE = 68;

  const t = $derived(getTheme());

  // ── Positions ────────────────────────────────────────────────────────────

  // All units placed on the spiral — Onboarding is at the innermost point (t=0).
  const spiralPositions = $derived(getSpiralNodePositions(spiral, program.units.length));
  const unitPositions   = $derived(spiralPositions);

  // Spiral visual paths
  const fullPath     = $derived(getSpiralSvgPath(spiral, 600));
  const orbitRings   = $derived(getOrbitPaths(spiral));
  const progressFrac = $derived(getProgressFraction(program.units));
  const progressPath = $derived(getProgressSvgPath(spiral, progressFrac, 600));

  /**
   * Derive activity display states from the unit's status and progress.
   *
   * - locked unit     → all activities locked
   * - completed unit  → all activities completed
   * - in-progress     → activities unlock/complete proportionally to unit.progress
   *                     Each activity covers (100 / count)% of unit progress.
   *
   * This is a pure derivation — no separate emulator needed for activities.
   * The home emulator drives unit.progress; activity states follow automatically.
   */
  function displayActivities(unit: ProgramUnit): Activity[] {
    const raw = unit.activities ?? [];
    if (raw.length === 0) return raw;

    if (unit.status === 'locked') {
      return raw.map(a => ({ ...a, status: 'locked'    as const, progress: 0   }));
    }
    if (unit.status === 'completed') {
      return raw.map(a => ({ ...a, status: 'completed' as const, progress: 100 }));
    }

    // in-progress: each activity spans (100 / count)% of unit progress
    const count       = raw.length;
    const perActivity = 100 / count;
    return raw.map((act, i) => {
      const actStart = i * perActivity;
      const actEnd   = (i + 1) * perActivity;
      if (unit.progress >= actEnd) {
        return { ...act, status: 'completed'   as const, progress: 100 };
      }
      if (unit.progress >= actStart) {
        const actPct = ((unit.progress - actStart) / perActivity) * 100;
        return { ...act, status: 'in-progress' as const, progress: Math.min(actPct, 100) };
      }
      return { ...act, status: 'locked' as const, progress: 0 };
    });
  }

  // Activity positions — full 360° ring tightly around each unit.
  const activityPositions = $derived.by(() =>
    program.units.map((unit, i) => {
      if (!unit.activities?.length) return [] as { x: number; y: number }[];
      const uPos = unitPositions[i];
      return getActivityOrbitPositions(
        uPos.x, uPos.y,
        cx, cy,
        unit.activities.length,
        ACT_ORBIT,
      );
    }),
  );

  // ── Dynamic viewBox ───────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | undefined = $state();
  let cW = $state(W);
  let cH = $state(H);

  onMount(() => {
    if (!containerEl) return;
    const ro = new ResizeObserver(([entry]) => {
      cW = entry.contentRect.width;
      cH = entry.contentRect.height;
    });
    ro.observe(containerEl);
    return () => ro.disconnect();
  });

  const CONTENT = { w: W - 20, h: H };

  const vb = $derived.by(() => {
    const containerAR = cW / cH;
    const contentAR   = CONTENT.w / CONTENT.h;
    let vbW: number, vbH: number;
    if (containerAR >= contentAR) {
      vbH = CONTENT.h;
      vbW = vbH * containerAR;
    } else {
      vbW = CONTENT.w;
      vbH = vbW / containerAR;
    }
    return { x: cx - vbW / 2, y: cy - vbH / 2, w: vbW, h: vbH };
  });

  const isPortrait = $derived(cW / cH < 1.0);

  // Distant galaxy positions
  const dgNext   = $derived({ cx: vb.x + vb.w * (isPortrait ? 0.30 : 0.10), cy: vb.y + vb.h * (isPortrait ? 0.10 : 0.12) });
  const dgFuture = $derived({ cx: vb.x + vb.w * (isPortrait ? 0.72 : 0.88), cy: vb.y + vb.h * (isPortrait ? 0.06 : 0.08) });
  const dgPrev   = $derived({ cx: vb.x + vb.w * (isPortrait ? 0.30 : 0.15), cy: vb.y + vb.h * (isPortrait ? 0.90 : 0.88) });

  // ── Interaction ──────────────────────────────────────────────────────────

  function handleUnitClick(unit: ProgramUnit) {
    if (unit.status === 'locked') return;
    // in-progress units: activities shown inline — unit node itself is not a nav target
    if (unit.status === 'in-progress' && unit.activities && unit.activities.length > 0) return;
    if (unit.activities && unit.activities.length > 0) {
      onUnitSelected(unit);
    } else if (unit.courseUrl && unit.courseUrl !== '#') {
      window.open(unit.courseUrl, '_blank');
    }
  }


</script>

<div class="galaxy-container" bind:this={containerEl}>
  <div class="galaxy-wrapper" style:box-shadow={t.wrapperShadow}>
    <svg
      viewBox="{vb.x} {vb.y} {vb.w} {vb.h}"
      class="galaxy-svg"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="tree-bg-grad" cx="50%" cy="50%" r="60%">
          <stop offset="0%"   stop-color={t.bg.center} />
          <stop offset="60%"  stop-color={t.bg.mid} />
          <stop offset="100%" stop-color={t.bg.edge} />
        </radialGradient>

        <!-- Title orbit path -->
        <path id="tree-title-orbit"
              d="M {cx - 380},{cy} a 380,340 0 1,1 760,0 a 380,340 0 1,1 -760,0 a 380,340 0 1,1 760,0 a 380,340 0 1,1 -760,0"
              fill="none" />

        <!-- Title glow -->
        <filter id="tree-title-glow" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="8"  in="SourceGraphic" result="blur-wide" />
          <feFlood flood-color="#0075BF" flood-opacity="0.7" result="color-wide" />
          <feComposite in="color-wide" in2="blur-wide" operator="in" result="glow-wide" />
          <feGaussianBlur stdDeviation="2"  in="SourceGraphic" result="blur-tight" />
          <feFlood flood-color="#ffffff"  flood-opacity="0.4" result="color-tight" />
          <feComposite in="color-tight" in2="blur-tight" operator="in" result="glow-tight" />
          <feMerge>
            <feMergeNode in="glow-wide" />
            <feMergeNode in="glow-tight" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Progress arc glow -->
        <filter id="tree-path-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" in="SourceGraphic" result="blur-outer" />
          <feFlood flood-color={t.progress.glow} flood-opacity="0.3" result="color-outer" />
          <feComposite in="color-outer" in2="blur-outer" operator="in" result="glow-outer" />
          <feGaussianBlur stdDeviation="4"  in="SourceGraphic" result="blur-inner" />
          <feFlood flood-color="#ffffff"  flood-opacity="0.2" result="color-inner" />
          <feComposite in="color-inner" in2="blur-inner" operator="in" result="glow-inner" />
          <feMerge>
            <feMergeNode in="glow-outer" />
            <feMergeNode in="glow-inner" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

      </defs>

      <!-- Background -->
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#tree-bg-grad)" opacity="0.85" />

      <!-- Program title -->
      <text class="title-orbit-text" fill="#ffffff" filter="url(#tree-title-glow)">
        <textPath href="#tree-title-orbit" startOffset="54%" text-anchor="middle">
          {program.fullname}
        </textPath>
      </text>

      <!-- Distant galaxies -->
      <DistantGalaxy config={NEXT_PROGRAM_CONFIG}   cx={dgNext.cx}   cy={dgNext.cy}   scale={0.32} opacity={0.50} fontScale={0.7} />
      <DistantGalaxy config={FUTURE_PROGRAM_CONFIG} cx={dgFuture.cx} cy={dgFuture.cy} scale={0.20} opacity={0.22} fontScale={0.7} />
      <DistantGalaxy config={PREV_PROGRAM_CONFIG}   cx={dgPrev.cx}   cy={dgPrev.cy}   scale={0.30} opacity={0.35} fontScale={0.6} />

      <!-- Orbit rings (decorative ellipses following spiral curvature) -->
      {#each orbitRings as ring, i (i)}
        <path d={ring} fill="none" stroke={t.orbit} stroke-width="1.2" />
      {/each}

      <!-- Spiral path — background dashed line (units 1..n-1) -->
      <path d={fullPath} fill="none" stroke={t.spiral} stroke-width="3"
            stroke-dasharray="12 8" stroke-linecap="round" />

      <!-- Progress arc (glowing, covers all units on spiral) -->
      {#if progressPath}
        <path d={progressPath} fill="none" stroke={t.progress.stroke}
              stroke-width="5.5" stroke-linecap="round" filter="url(#tree-path-glow)" />
        <path d={progressPath} fill="none" stroke="rgba(255,255,255,0.35)"
              stroke-width="1.5" stroke-linecap="round" />
      {/if}

      <!-- ── Activity fans — ALL units with activities ───────────────── -->
      <!-- Rendered before unit nodes so unit circles sit on top of lines -->
      {#each program.units as unit, i (unit.id)}
        {#if unit.activities && unit.activities.length > 0}
          {@const uPos  = unitPositions[i]}
          {@const acts  = displayActivities(unit)}
          {@const aPos  = activityPositions[i]}

          <!-- Activity nodes orbit tightly around the unit (no connecting lines):
               in-progress → compact (full size, icon + label)
               completed / locked → tiny (small dot, no icon or label) -->
          {#each acts as act, j (act.id)}
            {#if aPos[j]}
              <ActivityNode
                activity={act}
                x={aPos[j].x}
                y={aPos[j].y}
                index={i * 10 + j}
                compact={act.status === 'in-progress'}
                tiny={act.status !== 'in-progress'}
                labelAngle={Math.atan2(aPos[j].y - uPos.y, aPos[j].x - uPos.x)}
                {onActivitySelected}
              />
            {/if}
          {/each}
        {/if}
      {/each}

      <!-- ── Unit nodes (on top of lines and activity nodes) ────────── -->
      {#each program.units as unit, i (unit.id)}
        {@const uPos = unitPositions[i]}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g
          onclick={() => handleUnitClick(unit)}
          onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') handleUnitClick(unit); }}
        >
          <UnitNode
            {unit}
            x={uPos.x}
            y={uPos.y}
            galacticCenterX={cx}
            galacticCenterY={cy}
            size={UNIT_SIZE}
            index={i}
            compact={true}
          />
        </g>
      {/each}
    </svg>
  </div>
</div>

<style>
  .galaxy-container {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  .galaxy-wrapper {
    width: 100%;
    height: 100%;
    border-radius: 0;
    overflow: hidden;
    transition: box-shadow 0.4s;
  }

  .galaxy-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  :global(.title-orbit-text) {
    font: 900 28px/1 'Rubik', system-ui, sans-serif;
    letter-spacing: 5px;
    text-transform: uppercase;
  }
</style>
