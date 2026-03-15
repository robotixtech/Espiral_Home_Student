<script lang="ts">
  import type { ProgramUnit } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';

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
  onclick={() => { if (unit.courseUrl && unit.courseUrl !== '#') window.open(unit.courseUrl, '_top'); }}
  onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' && unit.courseUrl && unit.courseUrl !== '#') window.open(unit.courseUrl, '_top'); }}
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
    </style>
  </defs>

  <!-- Pulse rings -->
  <circle cx="0" cy="0" r={r + 14} fill="none" stroke={s.pulse} stroke-width="0.6" opacity="0.15"
          style="animation: sun-pulse 4s ease-in-out infinite; transform-origin: center;" />
  <circle cx="0" cy="0" r={r + 26} fill="none" stroke={s.pulse} stroke-width="0.4" opacity="0.08"
          style="animation: sun-pulse 4s ease-in-out 1s infinite; transform-origin: center;" />

  <!-- Main body -->
  <circle cx="0" cy="0" r={r} fill="url(#sun-grad)" filter="url(#sun-glow)" />

  <!-- 3D highlight -->
  <circle cx="-6" cy="-8" r={r * 0.35} fill={s.highlight} />

  <!-- Icon -->
  <svg x="-13" y="-13" width="26" height="26" viewBox="0 0 24 24"
       fill="none" stroke={s.icon} stroke-width="1.6"
       stroke-linecap="round" stroke-linejoin="round" opacity="0.8">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>

  <!-- Label -->
  <text y={r + 15} text-anchor="middle" fill={s.label} class="sun-label">
    {unit.label}
  </text>
</g>

<style>
  .sun-node { cursor: pointer; }
  .sun-node:hover { opacity: 0.92; }
  .sun-label { font: 700 13px/1 'Inter', system-ui, sans-serif; letter-spacing: 0.5px; }
</style>
