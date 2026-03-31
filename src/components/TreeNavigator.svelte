<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProgramData, ProgramUnit, Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import { PREV_PROGRAM_CONFIG, NEXT_PROGRAM_CONFIG, FUTURE_PROGRAM_CONFIG } from '../lib/program-config';
  import UnitNode from './UnitNode.svelte';
  import DistantGalaxy from './DistantGalaxy.svelte';
  import ActivityNode from './ActivityNode.svelte';
  import { getActivityOrbitPositions } from '../lib/tree-math';

  interface Props {
    program: ProgramData;
    onUnitSelected: (unit: ProgramUnit) => void;
    onActivitySelected: (activity: Activity) => void;
  }

  let { program, onUnitSelected, onActivitySelected }: Props = $props();

  // ── Canvas ───────────────────────────────────────────────────────────────
  const W = 1400;
  const H = 1000;
  const cx = W / 2;   // 700
  const cy = H / 2;   // 500

  // ── Solar System Layout ──────────────────────────────────────────────────
  // Each unit is a planet on its own orbit ring around the central sun (C450).
  //
  // Planets are placed using the golden angle (~137.5°) between successive
  // orbits.  This irrational step guarantees that no two adjacent-ring planets
  // ever align radially, so activity-moon rings on neighbouring orbits cannot
  // overlap each other regardless of orbit step size.
  const SUN_R       = 38;
  const ORBIT_STEP  = 72;   // px between consecutive orbit radii
  const ORBIT_START = 85;   // radius of the innermost orbit
  const ACT_ORBIT   = 50;   // distance from planet centre to moon centre
  const UNIT_SIZE   = 68;   // diameter passed to UnitNode (r = 34)
  // Label must clear the moon ring: r(34) + ACT_ORBIT(50) + tiny_r(10) = 94px
  const LABEL_GAP   = 68;   // r + LABEL_GAP > 94  → label floats beyond moons

  const GOLDEN      = 137.508 * Math.PI / 180;  // golden angle in radians
  const START_ANGLE = -Math.PI / 2;             // first planet starts at 12 o'clock

  const t = $derived(getTheme());

  // One orbit radius per unit, growing outward
  const orbitRadii = $derived(program.units.map((_, i) => ORBIT_START + i * ORBIT_STEP));

  // Planet positions: each unit rotated by an additional golden angle from the previous
  const unitPositions = $derived(
    program.units.map((_, i) => {
      const a = START_ANGLE + i * GOLDEN;
      const r = ORBIT_START + i * ORBIT_STEP;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }),
  );

  // ── Activity moons ───────────────────────────────────────────────────────

  function displayActivities(unit: ProgramUnit): Activity[] {
    const raw = unit.activities ?? [];
    if (raw.length === 0) return raw;
    if (unit.status === 'locked') {
      return raw.map(a => ({ ...a, status: 'locked'    as const, progress: 0   }));
    }
    if (unit.status === 'completed') {
      return raw.map(a => ({ ...a, status: 'completed' as const, progress: 100 }));
    }
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

  const activityPositions = $derived.by(() =>
    program.units.map((unit, i) => {
      if (!unit.activities?.length) return [] as { x: number; y: number }[];
      const uPos = unitPositions[i];
      return getActivityOrbitPositions(uPos.x, uPos.y, cx, cy, unit.activities.length, ACT_ORBIT);
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

  const dgNext   = $derived({ cx: vb.x + vb.w * (isPortrait ? 0.30 : 0.10), cy: vb.y + vb.h * (isPortrait ? 0.10 : 0.12) });
  const dgFuture = $derived({ cx: vb.x + vb.w * (isPortrait ? 0.72 : 0.88), cy: vb.y + vb.h * (isPortrait ? 0.06 : 0.08) });
  const dgPrev   = $derived({ cx: vb.x + vb.w * (isPortrait ? 0.30 : 0.15), cy: vb.y + vb.h * (isPortrait ? 0.90 : 0.88) });

  // ── Interaction ──────────────────────────────────────────────────────────

  function handleUnitClick(unit: ProgramUnit) {
    if (unit.status === 'locked') return;
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
        <!-- Background -->
        <radialGradient id="ss-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%"   stop-color={t.bg.center} />
          <stop offset="60%"  stop-color={t.bg.mid} />
          <stop offset="100%" stop-color={t.bg.edge} />
        </radialGradient>

        <!-- Sun body gradient -->
        <radialGradient id="ss-sun" cx="35%" cy="35%" r="65%">
          <stop offset="0%"   stop-color="#fff9c4" />
          <stop offset="50%"  stop-color="#fbbf24" />
          <stop offset="100%" stop-color="#b45309" />
        </radialGradient>

        <!-- Sun glow -->
        <filter id="ss-sun-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="16" in="SourceGraphic" result="blur" />
          <feFlood flood-color="#f59e0b" flood-opacity="0.45" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Orbit-ring glow for in-progress arc -->
        <filter id="ss-orbit-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" in="SourceGraphic" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#ss-bg)" opacity="0.88" />

      <!-- Distant galaxies -->
      <DistantGalaxy config={NEXT_PROGRAM_CONFIG}   cx={dgNext.cx}   cy={dgNext.cy}   scale={0.32} opacity={0.50} fontScale={0.7} />
      <DistantGalaxy config={FUTURE_PROGRAM_CONFIG} cx={dgFuture.cx} cy={dgFuture.cy} scale={0.20} opacity={0.22} fontScale={0.7} />
      <DistantGalaxy config={PREV_PROGRAM_CONFIG}   cx={dgPrev.cx}   cy={dgPrev.cy}   scale={0.30} opacity={0.35} fontScale={0.6} />

      <!-- ── Orbit rings — one per unit ──────────────────────────────── -->
      {#each program.units as unit, i (unit.id)}
        {@const orbR = orbitRadii[i]}
        {@const orbC = 2 * Math.PI * orbR}
        {#if unit.status === 'completed'}
          <circle cx={cx} cy={cy} r={orbR} fill="none"
                  stroke={t.unit.completed.glow} stroke-width="1" opacity="0.22" />
        {:else if unit.status === 'in-progress'}
          <!-- Faint base ring -->
          <circle cx={cx} cy={cy} r={orbR} fill="none"
                  stroke={t.unit.inProgress.ring} stroke-width="0.8"
                  stroke-dasharray="5 8" opacity="0.18" />
          <!-- Progress arc (starts at 12 o'clock via rotate) -->
          {@const dashLen = orbC * (unit.progress / 100)}
          <circle cx={cx} cy={cy} r={orbR} fill="none"
                  stroke={t.unit.inProgress.glow} stroke-width="2.5"
                  stroke-dasharray="{dashLen} {orbC}"
                  stroke-linecap="round"
                  transform="rotate(-90, {cx}, {cy})"
                  opacity="0.55"
                  filter="url(#ss-orbit-glow)" />
        {:else}
          <circle cx={cx} cy={cy} r={orbR} fill="none"
                  stroke="rgba(255,255,255,0.05)" stroke-width="0.8"
                  stroke-dasharray="3 8" />
        {/if}
      {/each}

      <!-- ── Central Sun ─────────────────────────────────────────────── -->
      <circle cx={cx} cy={cy} r={SUN_R + 36} fill="#f59e0b" opacity="0.04" />
      <circle cx={cx} cy={cy} r={SUN_R + 20} fill="#fbbf24" opacity="0.06" />
      <circle cx={cx} cy={cy} r={SUN_R}
              fill="url(#ss-sun)" filter="url(#ss-sun-glow)" />
      <text x={cx} y={cy + 1} text-anchor="middle" dominant-baseline="middle"
            class="sun-label" fill="#fff">
        {program.shortname}
      </text>

      <!-- ── Activity moons (rendered below planet nodes) ───────────── -->
      {#each program.units as unit, i (unit.id)}
        {#if unit.activities && unit.activities.length > 0}
          {@const uPos = unitPositions[i]}
          {@const acts = displayActivities(unit)}
          {@const aPos = activityPositions[i]}
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

      <!-- ── Planet nodes (rendered on top of moons) ────────────────── -->
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
            labelOutward={true}
            labelGap={LABEL_GAP}
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

  :global(.sun-label) {
    font: 700 13px/1 'Rubik', system-ui, sans-serif;
    letter-spacing: 1px;
  }
</style>
