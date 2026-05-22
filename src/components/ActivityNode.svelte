<script lang="ts">
  import type { Activity } from '../lib/types';
  import UnitIcon from './UnitIcon.svelte';
  import { getTheme } from '../lib/theme.svelte';
  const theme = $derived(getTheme());

  interface Props {
    activity: Activity;
    x: number;
    y: number;
    index: number;
    isFirst?: boolean;
    /** Compact mode: small sphere for TreeNavigator */
    compact?: boolean;
    /** Angle (radians) outward from unit center — label placement in compact/tiny */
    labelAngle?: number;
    /** Tiny mode: small coloured dot for TreeNavigator */
    tiny?: boolean;
    onActivitySelected: (activity: Activity) => void;
  }

  let { activity, x, y, index, isFirst = false, compact = false, tiny = false, labelAngle = 0, onActivitySelected }: Props = $props();

  const r = $derived(tiny ? 10 : compact ? 22 : 38);
  const isActive     = $derived(activity.status !== 'locked');
  const isInProgress = $derived(activity.status === 'in-progress');
  const isCompleted  = $derived(activity.status === 'completed');

  const gradId = $derived(`act-g${index}`);
  const glowId = $derived(`act-w${index}`);

  const colors = $derived.by(() => {
    switch (activity.status) {
      case 'completed':   return theme.unit.completed;
      case 'in-progress': return theme.unit.inProgress;
      default:            return theme.unit.locked;
    }
  });

  const iconSize = $derived(compact ? 14 : 22);
  const iconOff  = $derived(iconSize / 2);

  // Outward label positioning for tiny / compact modes
  const lblCos   = $derived(Math.cos(labelAngle));
  const lblSin   = $derived(Math.sin(labelAngle));
  const tinyLblX = $derived((r + 11) * lblCos);
  const tinyLblY = $derived((r + 11) * lblSin);
  const compLblX = $derived((r + 14) * lblCos);
  const compLblY = $derived((r + 14) * lblSin);

  // Text-fitted background dimensions for normal mode
  const bgH = 26;
  const bgW = $derived(activity.label.length * 7 + 20);

  // Progress ring for compact mode
  const sw      = 3;
  const pr      = $derived(r - sw / 2);
  const circ    = $derived(2 * Math.PI * pr);
  const dashOff = $derived(circ - (activity.progress / 100) * circ);

  function handleClick(e: Event) {
    e.stopPropagation();
    if (!isActive) return;
    if (activity.slides && activity.slides.length > 0) {
      onActivitySelected(activity);
    } else if (activity.activityUrl && activity.activityUrl !== '#') {
      window.open(activity.activityUrl, '_blank');
    }
  }

  let selected = $state(false);
  function onSelect(e: Event) {
    if (!isActive) return;
    selected = true;
    handleClick(e);
    setTimeout(() => { selected = false; }, 500);
  }
</script>

<!-- ── Tiny mode: coloured dot + label ───────────────────────────── -->
{#if tiny}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <g
    class="activity-node"
    class:clickable={isActive}
    class:locked={!isActive}
    transform="translate({x}, {y})"
    tabindex={isActive ? 0 : -1}
    role={isActive ? 'button' : undefined}
    onclick={(e: MouseEvent) => onSelect(e)}
    onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(e); } }}
  >
    <defs>
      <radialGradient id={gradId} cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color={colors.g1} />
        <stop offset="100%" stop-color={colors.g2} />
      </radialGradient>
    </defs>
    <circle cx="0" cy="0" r={r} fill="url(#{gradId})" opacity={isActive ? 0.90 : 0.35} />
    {#if !isActive}
      <svg x="-5" y="-6" width="10" height="12" viewBox="0 0 24 24"
           fill="none" stroke={colors.icon} stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" opacity="0.7">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    {:else}
      <text x={tinyLblX} y={tinyLblY} text-anchor="middle" dominant-baseline="middle"
            class="act-tiny-label" fill={theme.text.primary}>
        {activity.label}
      </text>
    {/if}
  </g>

<!-- ── Compact mode: sphere + outward label (TreeNavigator) ──────── -->
{:else if compact}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <g
    class="activity-node"
    class:clickable={isActive}
    class:locked={!isActive}
    class:selected={selected}
    transform="translate({x}, {y})"
    tabindex={isActive ? 0 : -1}
    role={isActive ? 'button' : undefined}
    onclick={(e: MouseEvent) => onSelect(e)}
    onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(e); } }}
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
      <circle class:heartbeat={isInProgress} cx="0" cy="0" r={r + 3}
              fill="none" stroke={colors.glow} stroke-width="0.8" opacity="0.25" />
      <circle class="halo-ring" cx="0" cy="0" r={r + 5}
              fill="none" stroke={colors.glow} stroke-width="0.8" opacity="0" />
    {/if}

    <circle class:heartbeat={isInProgress} cx="0" cy="0" r={r}
            fill="url(#{gradId})" filter={isActive ? `url(#${glowId})` : undefined} />

    {#if isActive}
      <circle cx="0" cy="0" r={pr} fill="none" stroke={theme.progressRingBg} stroke-width={sw} />
      <circle cx="0" cy="0" r={pr} fill="none" stroke={colors.ring} stroke-width={sw}
              stroke-dasharray={circ} stroke-dashoffset={dashOff}
              stroke-linecap="round" transform="rotate(-90)" class="progress-ring" />
      {#if isCompleted}
        <g transform="translate({r * 0.62}, {-r * 0.62})">
          <circle cx="0" cy="0" r="8" fill={theme.badge.fill} stroke={theme.badge.stroke} stroke-width="1.5" />
          <svg x="-4.5" y="-4.5" width="9" height="9" viewBox="0 0 24 24" fill="none"
               stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </g>
      {/if}
    {/if}

    {#if !isActive}
      <circle cx="0" cy="0" r={r + 3} fill="none" stroke={colors.ring} stroke-width="1.2" opacity="0.6" />
      <svg x="-7" y="-8" width="14" height="16" viewBox="0 0 24 24"
           fill="none" stroke={colors.icon} stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    {:else}
      <g transform="translate({-iconOff}, {-iconOff})">
        <UnitIcon icon={activity.icon} size={iconSize} color={colors.icon} />
      </g>
    {/if}

    <text x={compLblX} y={compLblY} text-anchor="middle" dominant-baseline="middle"
          class="act-name-compact" fill={theme.text.primary}>
      {activity.label}
    </text>
  </g>

<!-- ── Normal mode: text label with fitted background (UnitDetailView) -->
{:else}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <g
    class="activity-node"
    class:clickable={isActive}
    class:locked={!isActive}
    class:selected={selected}
    transform="translate({x}, {y})"
    tabindex={isActive ? 0 : -1}
    role={isActive ? 'button' : undefined}
    onclick={(e: MouseEvent) => onSelect(e)}
    onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(e); } }}
  >
    <defs>
      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color={colors.g1} />
        <stop offset="100%" stop-color={colors.g2} />
      </linearGradient>
    </defs>

    <rect class="label-bg" class:heartbeat={isInProgress}
          x={-bgW / 2} y={-bgH / 2} width={bgW} height={bgH} rx="5"
          fill="url(#{gradId})" />

    <text x="0" y="1" text-anchor="middle" dominant-baseline="middle"
          class="act-name" fill={colors.icon}>
      {activity.label}
    </text>
  </g>
{/if}

<style>
  .activity-node { cursor: default; outline: none; }
  .activity-node.clickable { cursor: pointer; }
  .activity-node.locked { opacity: 0.45; }

  .activity-node.clickable:hover .label-bg {
    filter: brightness(1.15);
  }

  .activity-node.clickable:hover .halo-ring {
    animation: act-pulse 1.2s ease-in-out infinite;
  }

  .halo-ring {
    transition: opacity 0.3s ease, stroke-width 0.3s ease;
    pointer-events: none;
  }

  .activity-node.selected .halo-ring {
    animation: none !important;
    opacity: 0.9;
    stroke-width: 1.5;
  }

  @keyframes act-pulse {
    0%, 100% { opacity: 0.4; stroke-width: 0.5; }
    50%       { opacity: 0.8; stroke-width: 1.5; }
  }

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
  .act-name         { font: 600 13px/1 'Rubik', system-ui, sans-serif; pointer-events: none; }
  .act-name-compact { font: 500 13px/1 'Rubik', system-ui, sans-serif; }
  .act-tiny-label   { font: 400 11px/1 'Rubik', system-ui, sans-serif; pointer-events: none; }
</style>
