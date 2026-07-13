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

  // Icon sized to exactly match the compact radar UnitNode icon (same formula as UnitNode's
  // C_ICON_BASE), divided by cs since this icon lives inside a scale(cs) group — so the
  // on-screen size comes out identical to the radar spheres' icon (2026-07-08 feedback).
  const RADAR_ICON_BASE = 20.8 * 1.2 * 0.85 * 1.3;
  const iconSize   = $derived(RADAR_ICON_BASE / cs);
  const ICON_CY    = -25; // vertical centre of the icon, in cs-scaled local space

  // Saturn-style orbital ring band — the ring itself is the title container (matches UnitNode).
  const RING_RY = 13;                          // orbital tilt: edge curvature
  const BAND_HH = 14;                          // half the ring band height (holds the title)
  const BAND_YC = 0;                           // ring + title centred on the sphere's true middle (2026-07-08 feedback)
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

  /** Baseline for the curved title: the near band's midline arc, so the title follows the
   *  exact curvature of the band. Coords are divided by cs because the title lives inside a
   *  scale(cs) group — scaling the text back up lands the glyphs on the real band midline.
   *  The +5.6 (≈0.35 × the 16px title font-size, cs cancels out — see the <text> markup,
   *  dominant-baseline is intentionally NOT used there) nudges the arc down from its raw
   *  apex so the glyphs' visual centre (not their alphabetic baseline) lands on the band's
   *  true middle: iPadOS Safari doesn't reliably support dominant-baseline on <textPath>
   *  text, rendering it flush with the path instead of vertically centred on it (title read
   *  as pinned to the top of the ring). A fixed numeric offset works identically everywhere
   *  since it no longer depends on that property at all. */
  function titlePath(): string {
    const f = (n: number) => n.toFixed(1);
    const RX = ringRX / cs, RY = RING_RY / cs, YC = BAND_YC / cs + 5.6;
    return `M ${f(-RX)} ${f(YC)} A ${f(RX)} ${f(RY)} 0 0 0 ${f(RX)} ${f(YC)}`;
  }

  /** Mix a hex colour with white; w = weight of the colour (0..1), the rest white. */
  function tint(hex: string, w: number): string {
    const n = parseInt(hex.replace('#', ''), 16);
    const m = (c: number) => Math.round(c * w + 255 * (1 - w));
    return `rgb(${m((n >> 16) & 255)} ${m((n >> 8) & 255)} ${m(n & 255)})`;
  }

  // HUD-style tick marks flanking the title (galactic/tech instrument feel). Plain <line>
  // primitives in node coords; the title width is × cs because it lives in a scale(cs) group.
  const TICK_GAP = 11;
  const TICK_L   = 4;
  const titleHalfW = firstWord.length * (16 * cs) * 0.31;
  const sideTicks  = $derived.by(() => {
    const startX = titleHalfW + TICK_GAP + TICK_L;
    const endX   = Math.max(startX, ringRX - 4 - TICK_L);
    const marks: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < 2; i++) {
      const x = startX + (endX - startX) * i;
      const frac = Math.min(x / ringRX, 0.999);
      const sinF = Math.sqrt(Math.max(0, 1 - frac * frac));
      const y = BAND_YC + RING_RY * sinF;
      let tx = -ringRX * sinF, ty = RING_RY * frac;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      marks.push({ x1: x - TICK_L * tx, y1: y - TICK_L * ty, x2: x + TICK_L * tx, y2: y + TICK_L * ty });
    }
    return marks;
  });
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
    <path id="ia-title-path" d={titlePath()} fill="none" />
    <filter id="ia-shadow" filterUnits="userSpaceOnUse"
            x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color={colors.ring} flood-opacity="0.5" />
    </filter>
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
  <path d={ringBand(false)} fill={tint(colors.ring, 0.1)} fill-opacity="0.4"
        stroke={colors.ring} stroke-opacity="0.8" stroke-width="1.5" />

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
  <path d={ringBand(true)} fill={tint(colors.ring, 0.1)} fill-opacity="0.92"
        stroke={colors.ring} stroke-width="2"
        stroke-linejoin="round" filter="url(#ia-shadow)" />
  {#each sideTicks as m}
    <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
          stroke={colors.ring} stroke-width="1.6" stroke-opacity="0.8" stroke-linecap="round" />
    <line x1={-m.x1} y1={m.y1} x2={-m.x2} y2={m.y2}
          stroke={colors.ring} stroke-width="1.6" stroke-opacity="0.8" stroke-linecap="round" />
  {/each}
  <g transform="scale({cs})">
    <g transform="translate({-iconSize / 2},{ICON_CY - iconSize / 2})">
      <UnitIcon icon="signal" size={iconSize} color="#00102A" />
    </g>
    <text text-anchor="middle"
          class="lbl-inside-pill" fill="#001f3f">
      <textPath href="#ia-title-path" startOffset="50%">{IA_UNIT_CONFIG.label}</textPath>
    </text>
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
</style>
