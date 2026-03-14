<script lang="ts">
  import type { ProgramData } from '../lib/types';
  import { getTheme, toggleTheme } from '../lib/theme.svelte';
  import UnitNode from './UnitNode.svelte';
  import SunNode from './SunNode.svelte';
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

  const W = 920;
  const H = 860;

  const spiral: SpiralConfig = {
    cx: W / 2, cy: H / 2,
    r0x: 145, r0y: 125,
    r1x: 355, r1y: 315,
    startAngle: -Math.PI / 2,
    turns: 1.3,
  };

  const nodeSize = 62;

  const positions = $derived(getSpiralNodePositions(spiral, program.units.length));
  const fullPath = $derived(getSpiralSvgPath(spiral, 600));
  const orbitRings = $derived(getOrbitPaths(spiral));
  const progressFrac = $derived(getProgressFraction(program.units));
  const progressPath = $derived(getProgressSvgPath(spiral, progressFrac, 600));

  const stars = Array.from({ length: 160 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.3 + 0.2,
    opacity: Math.random() * 0.5 + 0.15,
    dur: (3 + Math.random() * 5).toFixed(1),
    delay: (Math.random() * 4).toFixed(1),
  }));

  const shootingStars = [
    { x1: 120, y1: 40, x2: 60, y2: 90, dur: '3.5', delay: '1' },
    { x1: 780, y1: 120, x2: 720, y2: 170, dur: '4', delay: '5' },
    { x1: 850, y1: 700, x2: 800, y2: 740, dur: '3', delay: '8' },
  ];

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

        <radialGradient id="nebula-1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color={t.nebula.c1} stop-opacity={t.nebula.o1} />
          <stop offset="100%" stop-color={t.nebula.c1} stop-opacity="0" />
        </radialGradient>
        <radialGradient id="nebula-2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color={t.nebula.c2} stop-opacity={t.nebula.o2} />
          <stop offset="100%" stop-color={t.nebula.c2} stop-opacity="0" />
        </radialGradient>

        <radialGradient id="moon-grad-lg" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stop-color={t.moon.light} />
          <stop offset="50%" stop-color={t.moon.mid} />
          <stop offset="100%" stop-color={t.moon.dark} />
        </radialGradient>
        <radialGradient id="moon-grad-sm" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stop-color={t.moon.mid} />
          <stop offset="100%" stop-color={t.moon.dark} />
        </radialGradient>

        <linearGradient id="shoot-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color={t.star} stop-opacity="0.8" />
          <stop offset="100%" stop-color={t.star} stop-opacity="0" />
        </linearGradient>

        <!-- Elliptical path for the title text to follow (outer orbit area) -->
        <!-- Double-loop ellipse so textPath offsets >100% still render fully -->
        <path id="title-orbit"
              d="M {W/2 - 380},{H/2} a 380,340 0 1,1 760,0 a 380,340 0 1,1 -760,0 a 380,340 0 1,1 760,0 a 380,340 0 1,1 -760,0" fill="none" />

        <filter id="path-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feFlood flood-color={t.progress.glow} flood-opacity={t.progress.glowOpacity} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <style>
          @keyframes twinkle {{
            0%, 100% {{ opacity: 0.15; }}
            50% {{ opacity: 0.7; }}
          }}
          @keyframes shoot {{
            0% {{ opacity: 0; transform: translate(0, 0); }}
            5% {{ opacity: 1; }}
            15% {{ opacity: 1; transform: translate(-60px, 50px); }}
            20% {{ opacity: 0; transform: translate(-80px, 65px); }}
            100% {{ opacity: 0; transform: translate(-80px, 65px); }}
          }}
          @keyframes nebula-drift {{
            0%, 100% {{ transform: scale(1) translate(0, 0); opacity: 0.7; }}
            50% {{ transform: scale(1.08) translate(5px, -3px); opacity: 1; }}
          }}
          @keyframes planet-float {{
            0%, 100% {{ transform: translateY(0); }}
            50% {{ transform: translateY(-4px); }}
          }}
        </style>
      </defs>

      <!-- Background -->
      <rect width={W} height={H} fill="url(#bg-grad)" rx="16" />

      <!-- === PROGRAM TITLE — curved along outermost orbit === -->
      <text class="title-orbit-text" fill="#ffffff" opacity="1">
        <textPath href="#title-orbit" startOffset="54%" text-anchor="middle">
          {program.fullname}
        </textPath>
      </text>

      <!-- Nebulae -->
      <ellipse cx="100" cy="120" rx="160" ry="100" fill="url(#nebula-1)"
               style="animation: nebula-drift 25s ease-in-out infinite" />
      <ellipse cx="820" cy="740" rx="140" ry="100" fill="url(#nebula-2)"
               style="animation: nebula-drift 30s ease-in-out 5s infinite" />

      <!-- Stars -->
      {#each stars as s}
        <circle cx={s.x} cy={s.y} r={s.r} fill={t.star} opacity={s.opacity}
                style="animation: twinkle {s.dur}s ease-in-out {s.delay}s infinite" />
      {/each}

      <!-- Moons (corners only) -->
      <g style="animation: planet-float 9s ease-in-out infinite" opacity="0.45">
        <circle cx="52" cy="52" r="22" fill="url(#moon-grad-lg)" />
        <circle cx="44" cy="44" r="8" fill="rgba(255,255,255,0.1)" />
        <circle cx="48" cy="58" r="4" fill="rgba(0,0,0,0.12)" />
        <circle cx="60" cy="46" r="2.5" fill="rgba(0,0,0,0.1)" />
        <circle cx="55" cy="64" r="1.8" fill="rgba(0,0,0,0.08)" />
      </g>
      <g style="animation: planet-float 11s ease-in-out 3s infinite" opacity="0.4">
        <circle cx="875" cy="805" r="18" fill="url(#moon-grad-lg)" />
        <circle cx="868" cy="798" r="6" fill="rgba(255,255,255,0.08)" />
        <circle cx="872" cy="812" r="3.5" fill="rgba(0,0,0,0.1)" />
      </g>
      <g style="animation: planet-float 8s ease-in-out 5s infinite" opacity="0.35">
        <circle cx="880" cy="38" r="12" fill="url(#moon-grad-sm)" />
        <circle cx="875" cy="33" r="4" fill="rgba(255,255,255,0.1)" />
      </g>
      <g style="animation: planet-float 13s ease-in-out 7s infinite" opacity="0.3">
        <circle cx="38" cy="810" r="8" fill="url(#moon-grad-sm)" />
        <circle cx="35" cy="807" r="2.5" fill="rgba(255,255,255,0.08)" />
      </g>
      <g style="animation: planet-float 15s ease-in-out 2s infinite" opacity="0.2">
        <circle cx="320" cy="28" r="5" fill="url(#moon-grad-sm)" />
      </g>

      <!-- Shooting stars -->
      {#each shootingStars as ss}
        <line x1={ss.x1} y1={ss.y1} x2={ss.x2} y2={ss.y2}
              stroke="url(#shoot-grad)" stroke-width="1.5" stroke-linecap="round"
              opacity="0" style="animation: shoot {ss.dur}s ease-out {ss.delay}s infinite" />
      {/each}

      <!-- Orbit rings -->
      {#each orbitRings as ring}
        <path d={ring} fill="none" stroke={t.orbit} stroke-width="1" />
      {/each}

      <!-- Sun -->
      <SunNode unit={program.sun} cx={spiral.cx} cy={spiral.cy} />

      <!-- Spiral path (dashed) -->
      <path d={fullPath} fill="none" stroke={t.spiral} stroke-width="2.5"
            stroke-dasharray="12 8" stroke-linecap="round" />

      <!-- Progress arc -->
      {#if progressPath}
        <path d={progressPath} fill="none" stroke={t.progress.stroke}
              stroke-width="4.5" stroke-linecap="round" filter="url(#path-glow)" />
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
            isFinalProject={i === program.units.length - 1 && unit.icon === 'trophy'}
          />
        </g>
      {/each}
    </svg>
  </div>

  <!-- Legend -->
  <div class="legend">
    <div class="legend-item" style:color={t.legend.text}>
      <span class="dot" style:background={t.legend.completed}
            style:box-shadow="0 0 6px {t.legend.completed}80"></span>
      <span>Completado</span>
    </div>
    <div class="legend-item" style:color={t.legend.text}>
      <span class="dot" style:background={t.legend.active}
            style:box-shadow="0 0 6px {t.legend.active}80"></span>
      <span>En curso</span>
    </div>
    <div class="legend-item" style:color={t.legend.text}>
      <span class="dot" style:background={t.legend.locked}></span>
      <span>Bloqueado</span>
    </div>
  </div>
</div>

<style>
  .galaxy-container {
    width: 100%;
    max-width: 920px;
    margin: 0 auto;
    padding: 12px;
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
    border-radius: 16px;
    overflow: hidden;
    transition: box-shadow 0.4s;
  }

  .galaxy-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .legend {
    display: flex;
    justify-content: center;
    gap: 28px;
    padding: 14px 0 4px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font: 500 13px/1 'Inter', system-ui, sans-serif;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  :global(.title-orbit-text) {
    font: 700 24px/1 'Inter', system-ui, sans-serif;
    letter-spacing: 10px;
    text-transform: uppercase;
  }
</style>
