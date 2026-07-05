<script lang="ts">
  import UnitIcon from './UnitIcon.svelte';
  import { getTheme } from '../lib/theme.svelte';
  import { QUANTA, SPIRAL } from '../lib/master-config';

  interface Props {
    cx: number;
    cy: number;
    programShortname: string;
    isUnlocked?: boolean;
  }

  let { cx, cy, programShortname, isUnlocked = false }: Props = $props();

  const theme  = $derived(getTheme());
  const colors = $derived(isUnlocked ? theme.unit.inProgress : theme.unit.locked);

  const isNano = $derived(QUANTA.nanoPrograms.includes(programShortname));
  const label  = $derived(isNano ? QUANTA.nanoLabel : QUANTA.label);
  const url    = $derived(isNano ? QUANTA.nanoUrl   : QUANTA.url);

  // Sphere geometry — matches SPIRAL.unitSize in master-config
  const size = SPIRAL.unitSize;
  const r    = size / 2;       // 50
  const sw   = 3.5;
  const pr   = r - sw / 2;
  const circ = 2 * Math.PI * pr;
  // Fixed progress — visually "in-progress" (value from master-config → QUANTA.fixedProgress)
  const dashOff = circ - QUANTA.fixedProgress * circ;
  // Inner content scale factor (same formula as UnitNode compact)
  const cs = r / 50;           // 1.0 for r=50
  const firstWord = $derived(label.split(' ')[0]);

  // Saturn-style orbital ring band — the ring itself is the title container (matches UnitNode).
  const RING_RY = 13;                          // orbital tilt: edge curvature
  const BAND_HH = 14;                          // half the ring band height (holds the title)
  const BAND_YC = -RING_RY;                    // shift up so the near band centres the title on y=0
  const bandW   = $derived(Math.max(firstWord.length * 11 * cs + 38, size * 0.85)); // title is drawn inside scale(cs)
  const ringRX  = $derived(Math.max(bandW / 2, r + 12)); // ring extends past the sphere sides

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
   *  scale(cs) group — scaling the text back up lands the glyphs on the real band midline. */
  function titlePath(): string {
    const f = (n: number) => n.toFixed(1);
    const RX = ringRX / cs, RY = RING_RY / cs, YC = BAND_YC / cs;
    return `M ${f(-RX)} ${f(YC)} A ${f(RX)} ${f(RY)} 0 0 0 ${f(RX)} ${f(YC)}`;
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<g
  class="quanta"
  class:unlocked={isUnlocked}
  transform="translate({cx},{cy})"
  onclick={() => { if (isUnlocked) window.open(url, '_blank'); }}
  onkeydown={(e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isUnlocked) { e.preventDefault(); window.open(url, '_blank'); }
  }}
  tabindex={isUnlocked ? 0 : -1}
  role={isUnlocked ? 'link' : undefined}
  aria-label={label}
>
  <defs>
    <radialGradient id="qc-grad" cx="35%" cy="35%" r="65%">
      <stop offset="0%"   stop-color={colors.g1} />
      <stop offset="100%" stop-color={colors.g2} />
    </radialGradient>
    <path id="qc-title-path" d={titlePath()} fill="none" />
  </defs>

  <!-- Ambient glow halos (in-progress only) — same rgba values as UnitNode pass-1 halos -->
  {#if isUnlocked}
    <circle cx="0" cy="0" r={r + 38} fill="rgba(245,158,11,0.05)" />
    <circle cx="0" cy="0" r={r + 22} fill="rgba(245,158,11,0.10)" />
    <circle cx="0" cy="0" r={r + 10} fill="rgba(245,158,11,0.18)" />
    <circle class="heartbeat" cx="0" cy="0" r={r + 3}
            fill="none" stroke={colors.glow} stroke-width="0.8" stroke-opacity="0.25" />
  {/if}

  <!-- Hover halo -->
  <circle class="halo-ring" cx="0" cy="0" r={r + 5}
          fill="none" stroke={colors.glow} stroke-width="0.8" />

  <!-- Orbital ring: far band, behind the sphere (dim, peeks around the sides) -->
  <path d={ringBand(false)} fill={colors.ring} fill-opacity={isUnlocked ? 0.28 : 0.2}
        stroke={colors.ring} stroke-opacity="0.4" stroke-width="1" />

  <!-- Main sphere -->
  <circle class:heartbeat={isUnlocked} cx="0" cy="0" r={r} fill="url(#qc-grad)" />

  {#if isUnlocked}
    <!-- Progress ring background -->
    <circle cx="0" cy="0" r={pr}
            fill="none" stroke={theme.progressRingBg} stroke-width={sw} />
    <!-- Progress ring (45%) -->
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
        <UnitIcon icon="rocket" size={14} color={colors.icon} />
      </g>
      <text text-anchor="middle" dominant-baseline="middle"
            class="lbl-inside-pill" fill="#001f3f">
        <textPath href="#qc-title-path" startOffset="50%">{firstWord}</textPath>
      </text>
    </g>
  {:else}
    <!-- Locked: near band crossing in front -->
    <path d={ringBand(true)} fill={colors.ring} fill-opacity="0.4"
          stroke={colors.ring} stroke-opacity="0.7" stroke-width="1.5"
          stroke-linejoin="round" />
    <g transform="scale({cs})" class="dimmed">
      <g transform="translate(-7,-32)">
        <svg x="0" y="0" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke={colors.icon} stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </g>
      <text text-anchor="middle" dominant-baseline="middle"
            class="lbl-inside-pill" fill="#4b5563" fill-opacity="0.6">
        <textPath href="#qc-title-path" startOffset="50%">{firstWord}</textPath>
      </text>
    </g>
  {/if}
</g>

<style>
  .quanta          { cursor: default; outline: none; }
  .quanta.unlocked { cursor: pointer; }
  .dimmed          { fill-opacity: 0.35; stroke-opacity: 0.35; }

  .halo-ring {
    stroke-opacity: 0;
    transition: stroke-opacity 0.3s ease, stroke-width 0.3s ease;
    pointer-events: none;
  }
  @media (hover: hover) {
    .quanta:hover .halo-ring {
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

  .lbl-inside-pill { font: 700 16px/1 'Rubik', system-ui, sans-serif; pointer-events: none; }
</style>
