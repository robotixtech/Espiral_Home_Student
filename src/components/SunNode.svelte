<script lang="ts">
  import type { ProgramUnit } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import UnitIcon from './UnitIcon.svelte';

  interface Props {
    unit: ProgramUnit;
    cx: number;
    cy: number;
  }

  let { unit, cx, cy }: Props = $props();
  const r = 42;
  const theme = $derived(getTheme());
  const s = $derived(theme.sun);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<g
  class="sun-node"
  transform="translate({cx}, {cy})"
  tabindex="0"
  onclick={() => { if (unit.courseUrl && unit.courseUrl !== '#') window.open(unit.courseUrl, '_blank'); }}
  onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' && unit.courseUrl && unit.courseUrl !== '#') window.open(unit.courseUrl, '_blank'); }}
>
  <defs>
    <radialGradient id="sun-grad" cx="40%" cy="38%" r="60%">
      <stop offset="0%" stop-color={s.g1} />
      <stop offset="30%" stop-color={s.g2} />
      <stop offset="70%" stop-color={s.g3} />
      <stop offset="100%" stop-color={s.g4} />
    </radialGradient>

    <filter id="sun-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="8" result="blur1" />
      <feFlood flood-color={s.glow} flood-opacity={s.glowOpacity} result="color1" />
      <feComposite in="color1" in2="blur1" operator="in" result="glow1" />
      <feGaussianBlur stdDeviation="16" result="blur2" in="SourceGraphic" />
      <feFlood flood-color={s.g2} flood-opacity="0.12" result="color2" />
      <feComposite in="color2" in2="blur2" operator="in" result="glow2" />
      <feMerge>
        <feMergeNode in="glow2" />
        <feMergeNode in="glow1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <style>
      @keyframes sun-pulse {{
        0%, 100% {{ opacity: 0.15; transform: scale(1); }}
        50% {{ opacity: 0.25; transform: scale(1.08); }}
      }}
      @keyframes sun-wave-1 {{
        0% {{ r: {r + 10}; opacity: 0.6; stroke-width: 2; }}
        100% {{ r: {r + 45}; opacity: 0; stroke-width: 0.3; }}
      }}
      @keyframes sun-wave-2 {{
        0% {{ r: {r + 10}; opacity: 0.5; stroke-width: 1.8; }}
        100% {{ r: {r + 45}; opacity: 0; stroke-width: 0.3; }}
      }}
      @keyframes sun-wave-3 {{
        0% {{ r: {r + 10}; opacity: 0.4; stroke-width: 1.5; }}
        100% {{ r: {r + 45}; opacity: 0; stroke-width: 0.3; }}
      }}
    </style>
  </defs>

  <!-- Ambient pulse rings -->
  <circle class="orbit-ring ring-inner" cx="0" cy="0" r={r + 14} fill="none" stroke={s.pulse} stroke-width="0.6" opacity="0.15"
          style="animation: sun-pulse 4s ease-in-out infinite; transform-origin: center;" />
  <circle class="orbit-ring ring-outer" cx="0" cy="0" r={r + 26} fill="none" stroke={s.pulse} stroke-width="0.4" opacity="0.08"
          style="animation: sun-pulse 4s ease-in-out 1s infinite; transform-origin: center;" />

  <!-- Hover: expanding wave rings (3 staggered) -->
  <circle class="hover-wave w1" cx="0" cy="0" r={r + 10}
          fill="none" stroke={s.g2} stroke-width="0" opacity="0" />
  <circle class="hover-wave w2" cx="0" cy="0" r={r + 10}
          fill="none" stroke={s.g3} stroke-width="0" opacity="0" />
  <circle class="hover-wave w3" cx="0" cy="0" r={r + 10}
          fill="none" stroke={s.g4} stroke-width="0" opacity="0" />

  <!-- Main body -->
  <circle cx="0" cy="0" r={r} fill="url(#sun-grad)" filter="url(#sun-glow)" />

  <!-- 3D highlight -->
  <circle cx="-6" cy="-8" r={r * 0.35} fill={s.highlight} />

  <!-- Icon (from config) -->
  <g class="sun-icon" transform="translate(-16, -16)" opacity="0.8">
    <UnitIcon icon={unit.icon} size={32} color={s.icon} />
  </g>

  <!-- Label -->
  <text y={r + 15} text-anchor="middle" fill={s.label} class="sun-label">
    {unit.label}
  </text>
</g>

<style>
  .sun-node { cursor: pointer; outline: none; }
  .sun-label { font: 700 14.5px/1 'Rubik', system-ui, sans-serif; letter-spacing: 0.5px; }

  /* Orbit rings — subtle +30% on hover */
  .orbit-ring {
    transition: opacity 0.4s ease, stroke-width 0.4s ease;
  }
  .sun-node:hover .ring-inner {
    animation: sun-tilt-inner 1.4s ease-in-out infinite !important;
  }
  .sun-node:hover .ring-outer {
    animation: sun-tilt-outer 1.4s ease-in-out 0.3s infinite !important;
  }
  @keyframes sun-tilt-inner {
    0%, 100% { opacity: 0.15; stroke-width: 0.6; }
    50% { opacity: 0.45; stroke-width: 1.2; }
  }
  @keyframes sun-tilt-outer {
    0%, 100% { opacity: 0.08; stroke-width: 0.4; }
    50% { opacity: 0.25; stroke-width: 0.8; }
  }

  /* Hover waves — 3 expanding rings staggered */
  .hover-wave {
    pointer-events: none;
  }
  .sun-node:hover .w1 {
    animation: sun-wave-1 1.5s ease-out infinite;
  }
  .sun-node:hover .w2 {
    animation: sun-wave-2 1.5s ease-out 0.4s infinite;
  }
  .sun-node:hover .w3 {
    animation: sun-wave-3 1.5s ease-out 0.8s infinite;
  }

</style>
