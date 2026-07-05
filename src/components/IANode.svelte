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
  const firstWord = IA_UNIT_CONFIG.label;

  // Saturn-style orbital ring band — the ring itself is the title container (matches UnitNode).
  const RING_RY = 13;                          // orbital tilt: edge curvature
  const BAND_HH = 14;                          // half the ring band height (holds the title)
  const BAND_YC = -RING_RY;                    // shift up so the near band centres the title on y=0
  const bandW   = Math.max(firstWord.length * 11 * cs + 38, size * 0.85); // title is drawn inside scale(cs)
  const ringRX  = Math.max(bandW / 2, r + 12); // ring extends past the sphere sides

  /** One curved band of the orbital ring. front=true → near band (crosses in front, carries
   *  the title); false → far band (passes behind the sphere). */
  function ringBand(front: boolean): string {
    const f = (n: number) => n.toFixed(1);
    const RX = ringRX, RY = RING_RY;
    const yT = BAND_YC - BAND_HH, yB = BAND_YC + BAND_HH;
    const sTop = front ? 0 : 1, sBot = front ? 1 : 0;
    return `M ${f(-RX)} ${f(yT)} A ${f(RX)} ${RY} 0 0 ${sTop} ${f(RX)} ${f(yT)} `
         + `L ${f(RX)} ${f(yB)} A ${f(RX)} ${RY} 0 0 ${sBot} ${f(-RX)} ${f(yB)} Z`;
  }
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

  <!-- Orbital ring: far band, behind the sphere (dim, peeks around the sides) -->
  <path d={ringBand(false)} fill={colors.ring} fill-opacity="0.28"
        stroke={colors.ring} stroke-opacity="0.4" stroke-width="1" />

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

  <!-- Orbital ring: near band crossing in front — this band IS the title container -->
  <path d={ringBand(true)} fill={colors.ring} fill-opacity="0.55"
        stroke={colors.ring} stroke-opacity="0.9" stroke-width="1.5"
        stroke-linejoin="round" />
  <g transform="scale({cs})">
    <g transform="translate(-7,-32)">
      <UnitIcon icon="signal" size={14} color={colors.icon} />
    </g>
    <text x="0" y="1" text-anchor="middle" dominant-baseline="middle"
          class="lbl-inside-pill" fill="#001f3f">{IA_UNIT_CONFIG.label}</text>
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

  .lbl-inside-pill { font: 700 16px/1 'Rubik', system-ui, sans-serif; pointer-events: none; }
  .lbl-unit-num { font: 400 10px/1 'Rubik', system-ui, sans-serif; pointer-events: none; fill-opacity: 0.7; }
</style>
