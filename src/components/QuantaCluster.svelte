<script lang="ts">
  import UnitIcon from './UnitIcon.svelte';
  import { getTheme } from '../lib/theme.svelte';

  interface Props {
    cx: number;
    cy: number;
    programShortname: string;
    isUnlocked?: boolean;
  }

  let { cx, cy, programShortname, isUnlocked = false }: Props = $props();

  const theme  = $derived(getTheme());
  const colors = $derived(isUnlocked ? theme.unit.inProgress : theme.unit.locked);

  const isNano = $derived(programShortname === 'C350' || programShortname === 'C450');
  const label  = $derived(isNano ? 'nanoQUANTA' : 'QUANTA');
  const url    = $derived(isNano ? 'https://www.robotix.es' : 'https://www.robotix.com');

  // Sphere geometry — matches UNIT_SIZE=100 in TreeNavigator
  const size = 100;
  const r    = size / 2;       // 50
  const sw   = 3.5;
  const pr   = r - sw / 2;
  const circ = 2 * Math.PI * pr;
  // Fixed progress at 45% — visually "in-progress"
  const dashOff = circ - 0.45 * circ;
  // Inner content scale factor (same formula as UnitNode compact)
  const cs = r / 50;           // 1.0 for r=50
  const firstWord = $derived(label.split(' ')[0]);
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
  {:else}
    <!-- Locked: outer border ring -->
    <circle cx="0" cy="0" r={r + 3} fill="none" stroke={colors.ring} stroke-width="1.5" stroke-opacity="0.7" />
  {/if}

  <!-- Inner content: icon/lock + label (same structure as UnitNode compact) -->
  <g transform="scale({cs})" class:dimmed={!isUnlocked}>
    <!-- Icon slot: rocket when unlocked, lock icon when locked — same position -->
    <g transform="translate(-7,-32)">
      {#if isUnlocked}
        <UnitIcon icon="rocket" size={14} color={colors.icon} />
      {:else}
        <svg x="0" y="0" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke={colors.icon} stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      {/if}
    </g>
    <text x="0" y="0" text-anchor="middle" dominant-baseline="middle"
          class="lbl-inside" fill={colors.icon}>{firstWord}</text>
    <text x="0" y="25" text-anchor="middle" dominant-baseline="middle"
          class="lbl-unit-num" fill={colors.icon}>OS</text>
  </g>
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
      stroke-opacity: 0.7;
      stroke-width: 2;
      animation: border-pulse 1.2s ease-in-out infinite;
    }
  }
  @keyframes border-pulse {
    0%, 100% { stroke-opacity: 0.4; stroke-width: 0.5; }
    50%       { stroke-opacity: 0.8; stroke-width: 1.5; }
  }

  .progress-ring { transition: stroke-dashoffset 1s ease; }

  .lbl-inside   { font: 700 13px/1 'Rubik', system-ui, sans-serif; pointer-events: none; }
  .lbl-unit-num { font: 400 10px/1 'Rubik', system-ui, sans-serif; pointer-events: none; fill-opacity: 0.7; }
</style>
