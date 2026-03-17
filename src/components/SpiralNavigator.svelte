<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProgramData, ProgramUnit } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import { PREV_PROGRAM_CONFIG, NEXT_PROGRAM_CONFIG, FUTURE_PROGRAM_CONFIG } from '../lib/program-config';
  import UnitNode from './UnitNode.svelte';
  import SunNode from './SunNode.svelte';
  import DistantGalaxy from './DistantGalaxy.svelte';
  import {
    type SpiralConfig,
    getSpiralNodePositions,
    getSpiralSvgPath,
    getProgressSvgPath,
    getOrbitPaths,
    getProgressFraction,
  } from '../lib/spiral-math';

  interface Props {
    program: ProgramData;
    onUnitSelected: (unit: ProgramUnit) => void;
  }

  let { program, onUnitSelected }: Props = $props();

  // --- Content coordinate space (fixed, where the galaxy lives) ---
  const W = 1030;
  const H = 728;

  const spiral: SpiralConfig = {
    cx: W / 2, cy: H * 0.55,
    r0x: 145, r0y: 125,
    r1x: 355, r1y: 315,
    startAngle: -Math.PI / 2,
    turns: 1.3,
  };

  const nodeSize = 68;

  const positions = $derived(getSpiralNodePositions(spiral, program.units.length));
  const fullPath = $derived(getSpiralSvgPath(spiral, 600));
  const orbitRings = $derived(getOrbitPaths(spiral));
  const progressFrac = $derived(getProgressFraction(program.units));
  const progressPath = $derived(getProgressSvgPath(spiral, progressFrac, 600));

  // --- Dynamic viewBox: adapts to container aspect ratio ---
  let containerEl: HTMLDivElement | undefined = $state();
  let cW = $state(1030);
  let cH = $state(728);

  onMount(() => {
    if (!containerEl) return;
    const ro = new ResizeObserver(([entry]) => {
      cW = entry.contentRect.width;
      cH = entry.contentRect.height;
    });
    ro.observe(containerEl);
    return () => ro.disconnect();
  });

  // Content bounding box (everything that must be visible)
  const CONTENT = { x: 20, y: 0, w: 990, h: 728 };

  const vb = $derived.by(() => {
    const containerAR = cW / cH;
    const contentAR = CONTENT.w / CONTENT.h;

    let vbW: number, vbH: number;

    if (containerAR >= contentAR) {
      // Landscape/desktop: keep original proportions, expand width to fill
      vbH = CONTENT.h;
      vbW = vbH * containerAR;
    } else {
      // Portrait/tablet: keep content width, expand height to match AR
      vbW = CONTENT.w;
      vbH = vbW / containerAR;
    }

    // Center on the main galaxy
    const centerX = spiral.cx;
    const centerY = spiral.cy;

    return {
      x: centerX - vbW / 2,
      y: centerY - vbH / 2,
      w: vbW,
      h: vbH,
    };
  });

  // Is portrait?
  const isPortrait = $derived(cW / cH < 1.0);

  // Distant galaxy positions — always relative to the dynamic viewBox
  const dgNext = $derived({
    cx: vb.x + vb.w * (isPortrait ? 0.30 : 0.10),
    cy: vb.y + vb.h * (isPortrait ? 0.10 : 0.12),
  });
  const dgFuture = $derived({
    cx: vb.x + vb.w * (isPortrait ? 0.72 : 0.88),
    cy: vb.y + vb.h * (isPortrait ? 0.06 : 0.08),
  });
  const dgPrev = $derived({
    cx: vb.x + vb.w * (isPortrait ? 0.30 : 0.15),
    cy: vb.y + vb.h * (isPortrait ? 0.90 : 0.88),
  });

  function handleUnitClick(unit: (typeof program.units)[0]) {
    if (unit.status === 'locked') return;
    if (unit.activities && unit.activities.length > 0) {
      onUnitSelected(unit);
    } else if (unit.courseUrl && unit.courseUrl !== '#') {
      window.open(unit.courseUrl, '_blank');
    }
  }

  const t = $derived(getTheme());
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
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color={t.bg.center} />
          <stop offset="60%" stop-color={t.bg.mid} />
          <stop offset="100%" stop-color={t.bg.edge} />
        </radialGradient>

        <!-- Title text orbit path -->
        <path id="title-orbit"
              d="M {spiral.cx - 380},{spiral.cy} a 380,340 0 1,1 760,0 a 380,340 0 1,1 -760,0 a 380,340 0 1,1 760,0 a 380,340 0 1,1 -760,0" fill="none" />

        <!-- Title glow -->
        <filter id="title-glow" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="8" in="SourceGraphic" result="blur-wide" />
          <feFlood flood-color="#0075BF" flood-opacity="0.7" result="color-wide" />
          <feComposite in="color-wide" in2="blur-wide" operator="in" result="glow-wide" />
          <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="blur-tight" />
          <feFlood flood-color="#ffffff" flood-opacity="0.4" result="color-tight" />
          <feComposite in="color-tight" in2="blur-tight" operator="in" result="glow-tight" />
          <feMerge>
            <feMergeNode in="glow-wide" />
            <feMergeNode in="glow-tight" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Progress arc glow -->
        <filter id="path-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" in="SourceGraphic" result="blur-outer" />
          <feFlood flood-color={t.progress.glow} flood-opacity="0.3" result="color-outer" />
          <feComposite in="color-outer" in2="blur-outer" operator="in" result="glow-outer" />
          <feGaussianBlur stdDeviation="4" in="SourceGraphic" result="blur-inner" />
          <feFlood flood-color="#ffffff" flood-opacity="0.2" result="color-inner" />
          <feComposite in="color-inner" in2="blur-inner" operator="in" result="glow-inner" />
          <feMerge>
            <feMergeNode in="glow-outer" />
            <feMergeNode in="glow-inner" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Background — covers the full dynamic viewBox -->
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#bg-grad)" opacity="0.85" />

      <!-- Program title -->
      <text class="title-orbit-text" fill="#ffffff" opacity="1" filter="url(#title-glow)">
        <textPath href="#title-orbit" startOffset="54%" text-anchor="middle">
          {program.fullname}
        </textPath>
      </text>

      <!-- Distant galaxies -->
      <DistantGalaxy config={NEXT_PROGRAM_CONFIG} cx={dgNext.cx} cy={dgNext.cy} scale={0.32} opacity={0.50} fontScale={0.7} />
      <DistantGalaxy config={FUTURE_PROGRAM_CONFIG} cx={dgFuture.cx} cy={dgFuture.cy} scale={0.20} opacity={0.22} fontScale={0.7} />
      <DistantGalaxy config={PREV_PROGRAM_CONFIG} cx={dgPrev.cx} cy={dgPrev.cy} scale={0.30} opacity={0.35} fontScale={0.6} />

      <!-- Orbit rings -->
      {#each orbitRings as ring, i (i)}
        <path d={ring} fill="none" stroke={t.orbit} stroke-width="1.2" />
      {/each}

      <!-- Sun -->
      <SunNode unit={program.sun} cx={spiral.cx} cy={spiral.cy}
               allCompleted={program.units.every(u => u.status === 'completed')} />

      <!-- Spiral path -->
      <path d={fullPath} fill="none" stroke={t.spiral} stroke-width="3"
            stroke-dasharray="12 8" stroke-linecap="round" />

      <!-- Progress arc -->
      {#if progressPath}
        <path d={progressPath} fill="none" stroke={t.progress.stroke}
              stroke-width="5.5" stroke-linecap="round" filter="url(#path-glow)" />
        <path d={progressPath} fill="none" stroke="rgba(255,255,255,0.35)"
              stroke-width="1.5" stroke-linecap="round" />
      {/if}

      <!-- Unit nodes -->
      {#each program.units as unit, i (unit.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g onclick={() => handleUnitClick(unit)}
           onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') handleUnitClick(unit); }}>
          <UnitNode
            {unit}
            x={positions[i].x} y={positions[i].y + (i === 1 ? 10 : 0)}
            galacticCenterX={spiral.cx} galacticCenterY={spiral.cy}
            size={nodeSize} index={i}
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
