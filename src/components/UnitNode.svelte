<script lang="ts">
  import type { ProgramUnit } from '../lib/types';
  import UnitIcon from './UnitIcon.svelte';
  import { getTheme } from '../lib/theme.svelte';
  import { STATUS_LABELS } from '../lib/program-config';

  const theme = $derived(getTheme());

  interface Props {
    unit: ProgramUnit;
    x: number;
    y: number;
    galacticCenterX: number;
    galacticCenterY: number;
    size?: number;
    index: number;
    /** Compact mode: show only the short displayName, no status pill */
    compact?: boolean;
    /** Flip label to point outward (away from galactic center) instead of inward */
    labelOutward?: boolean;
    /** Distance in px from the unit's visual edge to the label center (default 16) */
    labelGap?: number;
    /** When false, suppress the compact label (label is drawn externally, e.g. as a curved textPath) */
    showLabel?: boolean;
  }

  let {
    unit, x, y,
    galacticCenterX, galacticCenterY,
    size = 62, index,
    compact = false,
    labelOutward = false,
    labelGap = 16,
    showLabel = true,
  }: Props = $props();

  const sw = 3.5;
  const isStart = $derived(index === 0);
  const sz = $derived(isStart ? size * 1.15 : size);
  const r = $derived(sz / 2);
  const pr = $derived(r - sw / 2);
  const circ = $derived(2 * Math.PI * pr);
  const dashOff = $derived(circ - (unit.progress / 100) * circ);

  const gradId = $derived(`g${index}`);
  const glowId = $derived(`w${index}`);

  const colors = $derived.by(() => {
    switch (unit.status) {
      case 'completed': return theme.unit.completed;
      case 'in-progress': return theme.unit.inProgress;
      default: return theme.unit.locked;
    }
  });

  const shortName = $derived(unit.displayName);

  const statusText = $derived.by(() => {
    if (unit.status === 'completed') return STATUS_LABELS.completed;
    if (unit.status === 'in-progress') return `${STATUS_LABELS.inProgress} · ${unit.progress}%`;
    return STATUS_LABELS.locked;
  });

  const iconSize = $derived(isStart ? 28 : 24);
  const iconOff = $derived(iconSize / 2);
  const labelBelow = $derived(y >= galacticCenterY);
  const fullLabelGap = 12;
  const isActive = $derived(unit.status !== 'locked');

  // Inward-direction label for compact mode — positions text toward galaxy center,
  // away from the outward activity fan so they don't collide.
  const inDx      = $derived(galacticCenterX - x);
  const inDy      = $derived(galacticCenterY - y);
  const inDist    = $derived(Math.sqrt(inDx * inDx + inDy * inDy));
  const inNx      = $derived(inDist < 1 ? 0 : inDx / inDist);
  const inNy      = $derived(inDist < 1 ? -1 : inDy / inDist);
  // labelOutward flips the radial direction so labels face away from the center
  const lDirX     = $derived(labelOutward ? -inNx : inNx);
  const lDirY     = $derived(labelOutward ? -inNy : inNy);
  const lblX      = $derived((r + labelGap) * lDirX);
  const lblY      = $derived((r + labelGap) * lDirY);
  const lblAnchor = $derived(lDirX > 0.3 ? 'start' : lDirX < -0.3 ? 'end' : 'middle');
  const lblWords  = $derived(unit.label.split(' ')[0]);
  const isInProgress = $derived(unit.status === 'in-progress');

  let selected = $state(false);
  function onSelect() {
    if (!isActive) return;
    selected = true;
    setTimeout(() => { selected = false; }, 500);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<g
  class="node"
  class:clickable={isActive}
  class:locked={!isActive}
  class:selected={selected}
  transform="translate({x}, {y})"
  tabindex={isActive ? 0 : -1}
  role={isActive ? 'button' : undefined}
  onclick={onSelect}
  onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
>
  <defs>
    <radialGradient id={gradId} cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color={colors.g1} />
      <stop offset="100%" stop-color={colors.g2} />
    </radialGradient>
    {#if isActive}
      <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feFlood flood-color={colors.glow} flood-opacity="0.3" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    {/if}
  </defs>

  {#if isActive}
    <circle class:heartbeat={isInProgress} cx="0" cy="0" r={r + 3} fill="none" stroke={colors.glow} stroke-width="0.8" opacity="0.25" />
    <!-- Hover glow border -->
    <circle class="halo-ring" cx="0" cy="0" r={r + 5} fill="none"
            stroke={colors.glow} stroke-width="0.8" opacity="0" />
    <!-- Selected: soft ambient glow -->
    <circle class="selected-glow" cx="0" cy="0" r={r + 12} fill="none"
            stroke={colors.glow} stroke-width="0" opacity="0" />
    <!-- Selected: solid border -->
    <circle class="selected-ring" cx="0" cy="0" r={r + 5} fill="none"
            stroke="#ffffff" stroke-width="0" opacity="0" />
  {/if}

  <circle
    class:heartbeat={isInProgress}
    cx="0" cy="0" r={r}
    fill="url(#{gradId})"
    filter={isActive ? `url(#${glowId})` : undefined}
  />

  {#if isActive}
    <circle cx="0" cy="0" r={pr} fill="none" stroke={theme.progressRingBg} stroke-width={sw} />
    <circle
      cx="0" cy="0" r={pr}
      fill="none" stroke={colors.ring} stroke-width={sw}
      stroke-dasharray={circ} stroke-dashoffset={dashOff}
      stroke-linecap="round" transform="rotate(-90)"
      class="progress-ring"
    />

  {/if}

  {#if !isActive}
    <circle cx="0" cy="0" r={r + 3} fill="none" stroke={colors.ring} stroke-width="1.5" opacity="0.7" />
    <svg x="-11" y="-13" width="22" height="26" viewBox="0 0 24 24"
         fill="none" stroke={colors.icon} stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  {:else}
    <g transform="translate({-iconOff}, {-iconOff - 5})">
      <UnitIcon icon={unit.icon} size={iconSize} color={colors.icon} />
    </g>
    <text x="0" y={iconOff + 3} text-anchor="middle" dominant-baseline="middle"
          class="lbl-unit-id" fill={colors.icon}>
      {unit.displayName}
    </text>
  {/if}

  <!-- Labels -->
  {#if compact}
    {#if showLabel}
      <text x={lblX} y={lblY} text-anchor={lblAnchor} dominant-baseline="middle"
            class="lbl-compact" fill={theme.text.primary}>
        {lblWords}
      </text>
      <text x={lblX} y={lblY + 13} text-anchor={lblAnchor} dominant-baseline="middle"
            class="lbl-compact-sub" fill={theme.text.secondary}>
        {unit.displayName}
      </text>
    {/if}
  {:else}
    {#if labelBelow}
      <g transform="translate(0, {r + fullLabelGap})">
        <text y="2" text-anchor="middle" class="lbl-name" fill={theme.text.primary}>
          {unit.label}
        </text>
        <text y="20" text-anchor="middle" class="lbl-desc" fill={theme.text.secondary}>
          {shortName}
        </text>
        {#if statusText}
          <rect x="-42" y="28" width="84" height="18" rx="9"
                fill={colors.lBg} stroke={colors.lBorder} stroke-width="0.5" />
          <text y="41" text-anchor="middle" class="lbl-status" fill={colors.lText}>
            {statusText}
          </text>
        {/if}
      </g>
    {:else}
      <g transform="translate(0, {-(r + fullLabelGap)})">
        {#if statusText}
          <rect x="-42" y="-48" width="84" height="18" rx="9"
                fill={colors.lBg} stroke={colors.lBorder} stroke-width="0.5" />
          <text y="-35" text-anchor="middle" class="lbl-status" fill={colors.lText}>
            {statusText}
          </text>
        {/if}
        <text y="-16" text-anchor="middle" class="lbl-desc" fill={theme.text.secondary}>
          {shortName}
        </text>
        <text y="3" text-anchor="middle" class="lbl-name" fill={theme.text.primary}>
          {unit.label}
        </text>
      </g>
    {/if}
  {/if}
</g>

<style>
  .node { cursor: default; outline: none; }
  .node.clickable { cursor: pointer; }
  .node.clickable:hover .halo-ring {
    opacity: 0.7;
    stroke-width: 2;
  }

  .halo-ring {
    transition: opacity 0.3s ease, stroke-width 0.3s ease;
    pointer-events: none;
  }
  .node.clickable:hover .halo-ring {
    animation: border-pulse 1.2s ease-in-out infinite;
  }
  @keyframes border-pulse {
    0%, 100% { opacity: 0.4; stroke-width: 0.5; }
    50% { opacity: 0.8; stroke-width: 1.5; }
  }
  /* Selected state — solid border + soft ambient glow */
  .node.selected .halo-ring {
    animation: none !important;
    opacity: 0.9;
    stroke-width: 1.5;
    transition: opacity 0.3s ease, stroke-width 0.3s ease;
  }
  .node.selected .selected-ring {
    opacity: 0.6;
    stroke-width: 1;
    transition: opacity 0.4s ease;
  }
  .node.selected .selected-glow {
    opacity: 0.25;
    stroke-width: 6;
    transition: opacity 0.5s ease, stroke-width 0.5s ease;
  }

  .selected-glow, .selected-ring {
    pointer-events: none;
    transition: opacity 0.3s ease, stroke-width 0.3s ease;
  }

  .node.locked { opacity: 1.0; }

  /* Heartbeat pulse for in-progress units */
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
  .progress-ring { transition: stroke-dashoffset 1s ease; }
  .lbl-name { font: 700 16.5px/1 'Rubik', system-ui, sans-serif; }
  .lbl-desc { font: 400 13px/1 'Rubik', system-ui, sans-serif; }
  .lbl-status { font: 600 11px/1 'Rubik', system-ui, sans-serif; }
  .lbl-compact     { font: 700 14px/1 'Rubik', system-ui, sans-serif; }
  .lbl-compact-sub { font: 400 12px/1 'Rubik', system-ui, sans-serif; }
  .lbl-unit-id     { font: 700 9px/1 'Rubik', system-ui, sans-serif; opacity: 0.85; }
</style>
