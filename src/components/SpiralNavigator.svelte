<script lang="ts">
  import type { ProgramData } from '../lib/types';
  import { getTheme, toggleTheme } from '../lib/theme.svelte';
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
  }

  let { program }: Props = $props();

  const W = 970;
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


  function handleUnitClick(unit: (typeof program.units)[0]) {
    if (unit.status === 'locked') return;
    if (unit.courseUrl && unit.courseUrl !== '#') window.open(unit.courseUrl, '_top');
  }

  const t = $derived(getTheme());

</script>

<div class="galaxy-container">
  <!-- Theme toggle floating button -->
  <button class="theme-toggle" onclick={toggleTheme}
          style:background={t.toggleBg} style:color={t.toggleIcon}
          aria-label="Toggle theme">
    {#if t.mode === 'dark'}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    {:else}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    {/if}
  </button>

  <div class="galaxy-wrapper" style:box-shadow={t.wrapperShadow}>
    <svg viewBox="0 0 {W} {H}" class="galaxy-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color={t.bg.center} />
          <stop offset="60%" stop-color={t.bg.mid} />
          <stop offset="100%" stop-color={t.bg.edge} />
        </radialGradient>




        <!-- Elliptical path for the title text to follow (outer orbit area) -->
        <!-- Double-loop ellipse so textPath offsets >100% still render fully -->
        <path id="title-orbit"
              d="M {spiral.cx - 380},{spiral.cy} a 380,340 0 1,1 760,0 a 380,340 0 1,1 -760,0 a 380,340 0 1,1 760,0 a 380,340 0 1,1 -760,0" fill="none" />

        <!-- Title text glow — intense double-layer -->
        <filter id="title-glow" x="-30%" y="-60%" width="160%" height="220%">
          <!-- Wide outer glow -->
          <feGaussianBlur stdDeviation="8" in="SourceGraphic" result="blur-wide" />
          <feFlood flood-color="#0075BF" flood-opacity="0.7" result="color-wide" />
          <feComposite in="color-wide" in2="blur-wide" operator="in" result="glow-wide" />
          <!-- Tight inner glow -->
          <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="blur-tight" />
          <feFlood flood-color="#ffffff" flood-opacity="0.4" result="color-tight" />
          <feComposite in="color-tight" in2="blur-tight" operator="in" result="glow-tight" />
          <feMerge>
            <feMergeNode in="glow-wide" />
            <feMergeNode in="glow-tight" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="path-glow" x="-30%" y="-30%" width="160%" height="160%">
          <!-- Outer wide glow -->
          <feGaussianBlur stdDeviation="10" in="SourceGraphic" result="blur-outer" />
          <feFlood flood-color={t.progress.glow} flood-opacity="0.3" result="color-outer" />
          <feComposite in="color-outer" in2="blur-outer" operator="in" result="glow-outer" />
          <!-- Inner bright glow -->
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

      <!-- Background -->
      <rect width={W} height={H} fill="url(#bg-grad)" rx="16" opacity="0.85" />


      <!-- === PROGRAM TITLE — curved along outermost orbit === -->
      <text class="title-orbit-text" fill="#ffffff" opacity="1" filter="url(#title-glow)">
        <textPath href="#title-orbit" startOffset="54%" text-anchor="middle">
          {program.fullname}
        </textPath>
      </text>

      <!-- Distant galaxy: next program (C550) -->
      <!-- C550: nearby galaxy — larger, more visible -->
      <DistantGalaxy config={NEXT_PROGRAM_CONFIG} cx={W * 0.13} cy={H * 0.15} scale={0.32} opacity={0.50} fontScale={0.7} />
      <!-- C650: farther galaxy — smaller, dimmer -->
      <DistantGalaxy config={FUTURE_PROGRAM_CONFIG} cx={W * 0.90} cy={H * 0.10} scale={0.20} opacity={0.22} fontScale={0.7} />
      <!-- C350: completed program — below C450 -->
      <DistantGalaxy config={PREV_PROGRAM_CONFIG} cx={W * 0.12} cy={H * 0.88} scale={0.30} opacity={0.35} fontScale={0.6} />

      <!-- Orbit rings -->
      {#each orbitRings as ring}
        <path d={ring} fill="none" stroke={t.orbit} stroke-width="1.2" />
      {/each}

      <!-- Sun -->
      <SunNode unit={program.sun} cx={spiral.cx} cy={spiral.cy} />

      <!-- Spiral path (dashed) -->
      <path d={fullPath} fill="none" stroke={t.spiral} stroke-width="3"
            stroke-dasharray="12 8" stroke-linecap="round" />

      <!-- Progress arc -->
      {#if progressPath}
        <path d={progressPath} fill="none" stroke={t.progress.stroke}
              stroke-width="5.5" stroke-linecap="round" filter="url(#path-glow)" />
        <!-- Fluor highlight — thin bright core -->
        <path d={progressPath} fill="none" stroke="rgba(255,255,255,0.35)"
              stroke-width="1.5" stroke-linecap="round" />
      {/if}

      <!-- Unit nodes -->
      {#each program.units as unit, i}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g onclick={() => handleUnitClick(unit)}
           onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') handleUnitClick(unit); }}>
          <UnitNode
            {unit}
            x={positions[i].x} y={positions[i].y}
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
    width: 100vw;
    height: 100%;
    max-width: 100vw;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    position: relative;
  }

  .theme-toggle {
    position: absolute;
    right: 20px;
    top: 20px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s, opacity 0.2s;
  }
  .theme-toggle:hover { opacity: 0.75; }

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
    font: 900 28px/1 'Inter', system-ui, sans-serif;
    letter-spacing: 5px;
    text-transform: uppercase;
  }
</style>
