<script lang="ts">
  import UnitIcon from './UnitIcon.svelte';
  import { getTheme } from '../lib/theme.svelte';
  import { SPIRAL, IA_UNIT_CONFIG } from '../lib/master-config';

  interface Props {
    cx: number;
    cy: number;
    status: 'in-progress' | 'completed';
    progress: number;
    onSelect?: () => void;
  }

  let { cx, cy, status, progress, onSelect }: Props = $props();

  const theme  = $derived(getTheme());
  const colors = $derived(status === 'completed' ? theme.unit.completed : theme.unit.inProgress);
  const isIP   = $derived(status === 'in-progress');

  const size  = SPIRAL.unitSize;
  const r     = size / 2;        // 50
  const sw    = 3.5;
  const pr    = r - sw / 2;
  const circ  = 2 * Math.PI * pr;
  const dashOff = $derived(circ - (progress / 100) * circ);
  const cs    = r / 50;          // 1.0
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<g
  class="ia-node"
  transform="translate({cx},{cy})"
  onclick={onSelect}
  onkeydown={(e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); }
  }}
  tabindex="0"
  role="button"
  aria-label={IA_UNIT_CONFIG.ariaLabel}
>
  <defs>
    <radialGradient id="ia-grad" cx="35%" cy="35%" r="65%">
      <stop offset="0%"   stop-color={colors.g1} />
      <stop offset="100%" stop-color={colors.g2} />
    </radialGradient>
  </defs>

  <!-- Ambient halos -->
  {#if isIP}
    <circle cx="0" cy="0" r={r + 38} fill="rgba(245,158,11,0.05)" />
    <circle cx="0" cy="0" r={r + 22} fill="rgba(245,158,11,0.10)" />
    <circle cx="0" cy="0" r={r + 10} fill="rgba(245,158,11,0.18)" />
  {:else}
    <circle cx="0" cy="0" r={r + 38} fill="rgba(52,211,153,0.03)" />
    <circle cx="0" cy="0" r={r + 22} fill="rgba(52,211,153,0.07)" />
    <circle cx="0" cy="0" r={r + 10} fill="rgba(52,211,153,0.14)" />
  {/if}
  <circle class:heartbeat={isIP} cx="0" cy="0" r={r + 3}
          fill="none" stroke={colors.glow} stroke-width="0.8" stroke-opacity="0.25" />

  <!-- Hover halo -->
  <circle class="halo-ring" cx="0" cy="0" r={r + 5}
          fill="none" stroke={colors.glow} stroke-width="0.8" />

  <!-- Main sphere -->
  <circle class:heartbeat={isIP} cx="0" cy="0" r={r} fill="url(#ia-grad)" />

  <!-- Progress ring -->
  <circle cx="0" cy="0" r={pr}
          fill="none" stroke={theme.progressRingBg} stroke-width={sw} />
  <circle cx="0" cy="0" r={pr}
          fill="none" stroke={colors.ring} stroke-width={sw}
          stroke-dasharray={circ} stroke-dashoffset={dashOff}
          stroke-linecap="round" transform="rotate(-90)"
          class="progress-ring" />

  <!-- Inner content -->
  <g transform="scale({cs})">
    <g transform="translate(-7,-32)">
      <UnitIcon icon="signal" size={14} color={colors.icon} />
    </g>
    <text x="0.8" y="0.8" text-anchor="middle" dominant-baseline="middle"
          class="lbl-inside" fill="rgba(0,0,0,0.45)">{IA_UNIT_CONFIG.label}</text>
    <text x="0" y="0" text-anchor="middle" dominant-baseline="middle"
          class="lbl-inside" fill={colors.icon}>{IA_UNIT_CONFIG.label}</text>
    <text x="0.8" y="25.8" text-anchor="middle" dominant-baseline="middle"
          class="lbl-unit-num" fill="rgba(0,0,0,0.45)">{IA_UNIT_CONFIG.sublabel}</text>
    <text x="0" y="25" text-anchor="middle" dominant-baseline="middle"
          class="lbl-unit-num" fill={colors.icon}>{IA_UNIT_CONFIG.sublabel}</text>
  </g>
</g>

<style>
  .ia-node { cursor: pointer; outline: none; }

  .halo-ring {
    stroke-opacity: 0;
    transition: stroke-opacity 0.3s ease, stroke-width 0.3s ease;
    pointer-events: none;
  }
  @media (hover: hover) {
    .ia-node:hover .halo-ring {
      stroke-opacity: 0.85;
      stroke-width: 3;
      animation: border-pulse 1.2s ease-in-out infinite;
    }
  }
  @keyframes border-pulse {
    0%, 100% { stroke-opacity: 0.5; stroke-width: 1.5; }
    50%       { stroke-opacity: 1.0; stroke-width: 3; }
  }

  .progress-ring { transition: stroke-dashoffset 1s ease; }

  .heartbeat {
    animation: heartbeat 2s ease-in-out infinite;
    transform-origin: 0 0;
  }
  @keyframes heartbeat {
    0%   { transform: scale(1); }
    10%  { transform: scale(1.06); }
    20%  { transform: scale(1); }
    30%  { transform: scale(1.04); }
    40%  { transform: scale(1); }
    100% { transform: scale(1); }
  }

  .lbl-inside   { font: 700 13px/1 'Rubik', system-ui, sans-serif; pointer-events: none; }
  .lbl-unit-num { font: 400 10px/1 'Rubik', system-ui, sans-serif; pointer-events: none; fill-opacity: 0.7; }
</style>
