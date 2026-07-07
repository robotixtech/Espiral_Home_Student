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
  // Sphere size never depends on status — only fill colour does (see `colors`).
  const sz = $derived(isStart ? size * 1.15 : size);
  const r = $derived(sz / 2);
  const pr = $derived(r - sw / 2);
  const circ = $derived(2 * Math.PI * pr);
  const dashOff = $derived(circ - (unit.progress / 100) * circ);

  const gradId = $derived(`g${index}`);

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

  // Split label into lines of at most maxChars, max 2 lines
  function splitLabel(text: string, maxChars = 14): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      if (current && (current + ' ' + word).length > maxChars) {
        lines.push(current);
        current = word;
      } else {
        current = current ? current + ' ' + word : word;
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, 2);
  }

  // Compact icon: base 20.8, same size for inProgress and completed. Centred in the sphere.
  const C_ICON_BASE = 20.8;
  const cIcon   = $derived(
    unit.status === 'locked' ? C_ICON_BASE * 1.2   // locked lock icon +20%
    : C_ICON_BASE
  );
  const cIconTX = $derived(-cIcon / 2);                   // top-left x so the icon centres on x=0
  const cIconTY = $derived(-cIcon / 2);                   // top-left y so the icon centres on y=0

  // ID chip: a small tag straddling the sphere's bottom rim (half in, half out), like a
  // nameplate hanging off a badge — reads as an identifier, not a plate sunk in the centre.
  const CHIP_H = 17;
  const chipW  = $derived(Math.max(unit.displayName.length * 9 + 14, 26));

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
    <filter id="glow-{index}" filterUnits="userSpaceOnUse"
            x={-r - 20} y={-r - 20} width={(r + 20) * 2} height={(r + 20) * 2}>
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <!-- Lifts the ID chip off the sphere's surface with a soft drop shadow, so it reads as a
         badge affixed on top rather than a mark sunk into the sphere. -->
    <filter id="chip-shadow-{index}" filterUnits="userSpaceOnUse"
            x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>

  {#if isActive}
    <!-- Hover glow border -->
    <circle class="halo-ring" cx="0" cy="0" r={r + 5} fill="none"
            stroke={colors.glow} stroke-width="0.8" />
    <!-- Selected: soft ambient glow -->
    <circle class="selected-glow" cx="0" cy="0" r={r + 12} fill="none"
            stroke={colors.glow} stroke-width="0" />
    <!-- Selected: solid border -->
    <circle class="selected-ring" cx="0" cy="0" r={r + 5} fill="none"
            stroke="#ffffff" stroke-width="0" />
  {/if}

  <!-- Beat group: sphere, rings and pill scale together on heartbeat / hover,
       so the continuous sphere+pill outline moves as a single object. -->
  <g class="beat" class:heartbeat={isInProgress}>
    {#if isActive}
      <circle cx="0" cy="0" r={r + 3} fill="none" stroke={colors.glow} stroke-width="0.8" stroke-opacity="0.25" />
    {/if}

    <circle
      cx="0" cy="0" r={r}
      fill="url(#{gradId})"
      filter={unit.status === 'completed' ? `url(#glow-${index})` : undefined}
    />

    {#if isActive}
      <circle
        cx="0" cy="0" r={pr}
        fill="none" stroke={colors.ring} stroke-width={sw}
        stroke-dasharray={circ} stroke-dashoffset={dashOff}
        stroke-linecap="round" transform="rotate(-90)"
        class="progress-ring"
      />
    {/if}

  {#if !isActive}
    <!-- Icon centred in the sphere -->
    <svg x={cIconTX} y={cIconTY} width={cIcon} height={cIcon} viewBox="0 0 24 24"
         fill="none" stroke="#4b5563" stroke-opacity="0.6" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
    <!-- ID chip: nameplate straddling the bottom rim -->
    <rect class="id-chip" x={-chipW / 2} y={r - CHIP_H / 2} width={chipW} height={CHIP_H}
          rx={CHIP_H / 2} fill="#00102A" fill-opacity="0.92"
          stroke={colors.ring} stroke-width="1.3" filter="url(#chip-shadow-{index})" />
    <text x="0" y={r + 0.5} text-anchor="middle" dominant-baseline="middle"
          class="lbl-chip" fill="#e2e8f0">{unit.displayName}</text>
  {:else if compact}
    <!-- Icon centred in the sphere -->
    <g transform="translate({cIconTX},{cIconTY})">
      <UnitIcon icon={unit.icon} size={cIcon} color="#00102A" />
    </g>
    <!-- ID chip: nameplate straddling the bottom rim -->
    <rect class="id-chip" x={-chipW / 2} y={r - CHIP_H / 2} width={chipW} height={CHIP_H}
          rx={CHIP_H / 2} fill="#00102A" fill-opacity="0.92"
          stroke={colors.ring} stroke-width="1.3" filter="url(#chip-shadow-{index})" />
    <text x="0" y={r + 0.5} text-anchor="middle" dominant-baseline="middle"
          class="lbl-chip" fill="#ffffff">{unit.displayName}</text>
  {:else}
    <!-- Full mode (UnitDetailView center node, etc.) -->
    <g transform="translate({-iconOff}, {-iconOff - 5})">
      <UnitIcon icon={unit.icon} size={iconSize} color={colors.icon} />
    </g>
    <text x="0" y={iconOff + 3} text-anchor="middle" dominant-baseline="middle"
          class="lbl-unit-id" fill={colors.icon}>
      {unit.displayName}
    </text>
  {/if}
  </g>

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

  /* stroke-opacity instead of opacity — avoids GPU compositing layers on Mali-G52 */
  .halo-ring {
    stroke-opacity: 0;
    transition: stroke-opacity 0.3s ease, stroke-width 0.3s ease;
    pointer-events: none;
  }

  /* Only activate hover effects on real pointer devices — prevents stuck hover on Android touch */
  @media (hover: hover) {
    .node.clickable:hover .halo-ring {
      stroke-opacity: 0.85;
      stroke-width: 3;
      animation: border-pulse 1.2s ease-in-out infinite;
    }
  }
  @keyframes border-pulse {
    0%, 100% { stroke-opacity: 0.5; stroke-width: 1.5; }
    50%       { stroke-opacity: 1.0; stroke-width: 3; }
  }
  .node.selected .halo-ring {
    animation: none !important;
    stroke-opacity: 0.9;
    stroke-width: 1.5;
    transition: stroke-opacity 0.3s ease, stroke-width 0.3s ease;
  }
  .node.selected .selected-ring {
    stroke-opacity: 0.6;
    stroke-width: 1;
    transition: stroke-opacity 0.4s ease;
  }
  .node.selected .selected-glow {
    stroke-opacity: 0.25;
    stroke-width: 6;
    transition: stroke-opacity 0.5s ease, stroke-width 0.5s ease;
  }

  .selected-glow, .selected-ring {
    stroke-opacity: 0;
    pointer-events: none;
    transition: stroke-opacity 0.3s ease, stroke-width 0.3s ease;
  }

  /* Whole sphere+pill group shares one transform origin so scale stays centered */
  .beat { transform-origin: 0 0; }

  .heartbeat {
    animation: heartbeat 2s ease-in-out infinite;
    transform-origin: 0 0;
  }

  /* Hover: the entire shape (sphere + pill) breathes together, not just the sphere */
  @media (hover: hover) {
    .node.clickable:hover .beat { animation: heartbeat 2s ease-in-out infinite; }
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
  .lbl-unit-id     { font: 700 9px/1 'Rubik', system-ui, sans-serif; fill-opacity: 0.85; }
  .lbl-chip        { font: 700 11.5px/1 'Rubik', system-ui, sans-serif; pointer-events: none; letter-spacing: 0.2px; }
</style>
