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

  // Compact icon: base 20.8, +20% then -15%, then +30%, then +30% again (2026-07-08, 2026-07-09
  // feedback) — the icon shouldn't compete with the unit number/code, but still needs to read
  // clearly at radar scale.
  const C_ICON_BASE = 20.8 * 1.2 * 0.85 * 1.3 * 1.3;
  const cIcon   = $derived(
    unit.status === 'locked' ? C_ICON_BASE * 1.2   // locked lock icon +20% on top of the base, for stroke visibility
    : C_ICON_BASE
  );

  // Craters — position/size as fractions of the sphere radius r (adapted from a reference
  // .crater CSS design). Tinted to each sphere's own gradient colour (colors.g2) rather than
  // a fixed hue, so it reads correctly on amber/green/grey/purple spheres alike. Plain rgba()
  // fill only — no opacity/filter attrs — the confirmed-safe pattern for Mali-G52 (see
  // project memory on the Samsung Tab A8 GPU artifact). Per-crater `alpha` so any one of them
  // can be made subtler without affecting the others (2026-07-07: crater-a was fighting the
  // unit number for attention — moved off the number's zone and toned down, no inner shadow).
  const CRATERS = [
    { cx: -0.66, cy:  0.68, r: 0.11, shadow: false, alpha: 0.14 }, // small, lower-left corner, subtle
    { cx:  0.59, cy: -0.41, r: 0.10, shadow: true,  alpha: 0.25 }, // medium, upper-right
    { cx:  0.73, cy:  0.19, r: 0.07, shadow: false, alpha: 0.22 }, // small, flat (older crater)
  ];
  function craterTone(hex: string, factor: number, alpha: number): string {
    const n = parseInt(hex.replace('#', ''), 16);
    const r8 = Math.round(((n >> 16) & 255) * factor);
    const g8 = Math.round(((n >> 8) & 255) * factor);
    const b8 = Math.round((n & 255) * factor);
    return `rgba(${r8},${g8},${b8},${alpha})`;
  }
  const craterShadow = $derived(craterTone(colors.g2, 0.6, 0.4));

  // Unit number: the dominant element inside the sphere — it's the code that orients the
  // child on the map, not the icon (2026-07-07 feedback). ~1/3 of the sphere's diameter,
  // reduced 30% (2026-07-09 feedback) as the icon grows to take more of the visual weight.
  const numberFont = $derived((2 * r) / 3 * 0.7);
  // Thin navy outline on the white glyphs: readability/accessibility fix — the sphere's fill
  // colour varies by status (amber/green/grey/purple), so a fixed dark edge guarantees the
  // text stays legible against any of them instead of relying on fill colour contrast alone.
  const numberStroke = $derived(numberFont * 0.05);
  // 3D depth for the active-state number: a solid navy "extrusion" edge (0-blur offset
  // duplicate text, no SVG filter involved) plus a light-from-above gradient fill. The
  // reference design's soft blurred drop-shadow was dropped — CSS filter/drop-shadow on SVG
  // lowers to feGaussianBlur, the confirmed Mali-G52 GPU-artifact trigger (project memory).
  const numberEdgeOffset = $derived(numberFont * 0.06);

  // Icon + number read as a single centred block (icon above, number below, small gap)
  // instead of being pinned to opposite poles with a dead zone between them.
  const BLOCK_GAP = 7;
  const blockH  = $derived(cIcon + BLOCK_GAP + numberFont);
  const iconCY  = $derived(-blockH / 2 + cIcon / 2);
  const cIconTX = $derived(-cIcon / 2);
  const cIconTY = $derived(iconCY - cIcon / 2);
  const numberY = $derived(blockH / 2 - numberFont / 2);

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
    <!-- Unit-number fill: light-from-above gradient, chalk-white family (neutral — not
         status-tinted, matches the "blanco tiza" text colour decision). -->
    <linearGradient id="num-grad-{index}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#FFFFFF" />
      <stop offset="70%"  stop-color="#F4F2EC" />
      <stop offset="100%" stop-color="#E6E1D2" />
    </linearGradient>
    <filter id="glow-{index}" filterUnits="userSpaceOnUse"
            x={-r - 20} y={-r - 20} width={(r + 20) * 2} height={(r + 20) * 2}>
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
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
      <!-- Toned down (2026-07-07 feedback): was brighter than the sphere's own surface -->
      <circle cx="0" cy="0" r={r + 3} fill="none" stroke={colors.glow} stroke-width="0.8" stroke-opacity="0.15" />
    {/if}

    <circle
      cx="0" cy="0" r={r}
      fill="url(#{gradId})"
      filter={unit.status === 'completed' ? `url(#glow-${index})` : undefined}
    />

    <!-- Craters -->
    <g transform="rotate({(index * 47) % 360})">
      {#each CRATERS as c}
        <circle cx={c.cx * r} cy={c.cy * r} r={c.r * r} fill={craterTone(colors.g2, 1, c.alpha)} />
        {#if c.shadow}
          <circle cx={(c.cx + c.r * 0.3) * r} cy={(c.cy + c.r * 0.35) * r}
                  r={c.r * r * 0.55} fill={craterShadow} />
        {/if}
      {/each}
    </g>

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
    <!-- Icon in the upper sphere -->
    <svg x={cIconTX} y={cIconTY} width={cIcon} height={cIcon} viewBox="0 0 24 24"
         fill="none" stroke="#4b5563" stroke-opacity="0.6" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
    <!-- Unit number: locked → flat, disabled look (no engraved shadow, dimmed fill) -->
    <text x="0" y={numberY} text-anchor="middle" dominant-baseline="middle"
          class="planet-number planet-number-disabled" fill="#F4F2EC" style="font-size: {numberFont}px; stroke-width: {numberStroke}px">
      {unit.displayName}
    </text>
  {:else if compact}
    <!-- Icon in the upper sphere -->
    <g transform="translate({cIconTX},{cIconTY})">
      <UnitIcon icon={unit.icon} size={cIcon} color="#00102A" />
    </g>
    <!-- Unit number: solid navy "extrusion" edge behind (0-blur offset duplicate, gives
         the letters thickness) + the real gradient-filled, navy-outlined text on top. -->
    <text x="0" y={numberY + numberEdgeOffset} text-anchor="middle" dominant-baseline="middle"
          class="planet-number-edge" style="font-size: {numberFont}px">
      {unit.displayName}
    </text>
    <text x="0" y={numberY} text-anchor="middle" dominant-baseline="middle"
          class="planet-number" fill="url(#num-grad-{index})" style="font-size: {numberFont}px; stroke-width: {numberStroke}px">
      {unit.displayName}
    </text>
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
  /* Navy outline behind the white fill (paint-order keeps the fill crisp on top instead of
     the stroke eating into the letterforms) — readability fix: the sphere's own colour
     varies by status, so a fixed dark edge keeps the glyphs legible against any of them. */
  .planet-number {
    font: 800 1em/1 'Rubik', system-ui, sans-serif;
    pointer-events: none;
    stroke: #001f3f;
    paint-order: stroke fill;
  }
  /* Solid navy duplicate sat behind .planet-number, offset down — same font metrics so it
     lines up exactly under the real glyphs, giving them a flat "extruded" edge with no blur. */
  .planet-number-edge {
    font: 800 1em/1 'Rubik', system-ui, sans-serif;
    pointer-events: none;
    fill: #001f3f;
  }
  /* Disabled (locked) look: flat, dimmed like the locked activity chips — stroke dims with
     the fill so the outline doesn't end up reading darker/heavier than the glyph itself. */
  .planet-number-disabled {
    fill-opacity: 0.45;
    stroke-opacity: 0.45;
  }
</style>
