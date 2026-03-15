<script lang="ts">
  import type { Activity } from '../lib/types';
  import UnitIcon from './UnitIcon.svelte';
  import { getTheme } from '../lib/theme.svelte';
  import { STATUS_LABELS } from '../lib/program-config';

  const theme = $derived(getTheme());

  interface Props {
    activity: Activity;
    x: number;
    y: number;
    index: number;
    isFirst?: boolean;
  }

  let { activity, x, y, index, isFirst = false }: Props = $props();

  const r = $derived(isFirst ? 44 : 38);
  const isActive = $derived(activity.status !== 'locked');
  const isInProgress = $derived(activity.status === 'in-progress');
  const isCompleted = $derived(activity.status === 'completed');

  const gradId = $derived(`act-g${index}`);
  const glowId = $derived(`act-w${index}`);

  const colors = $derived.by(() => {
    switch (activity.status) {
      case 'completed': return theme.unit.completed;
      case 'in-progress': return theme.unit.inProgress;
      default: return theme.unit.locked;
    }
  });

  const statusText = $derived.by(() => {
    if (activity.status === 'completed') return STATUS_LABELS.completed;
    if (activity.status === 'in-progress') return `${STATUS_LABELS.inProgress} · ${activity.progress}%`;
    return STATUS_LABELS.locked;
  });

  const iconSize = $derived(isFirst ? 26 : 22);
  const iconOff = $derived(iconSize / 2);
  const sw = 3;
  const pr = $derived(r - sw / 2);
  const circ = $derived(2 * Math.PI * pr);
  const dashOff = $derived(circ - (activity.progress / 100) * circ);

  function handleClick() {
    if (!isActive) return;
    if (activity.activityUrl && activity.activityUrl !== '#') {
      window.open(activity.activityUrl, '_blank');
    }
  }

  // Split long labels into lines of ~18 chars
  function splitLabel(text: string): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      if (current && (current + ' ' + word).length > 18) {
        lines.push(current);
        current = word;
      } else {
        current = current ? current + ' ' + word : word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  const labelLines = $derived(splitLabel(activity.label));

  let selected = $state(false);
  function onSelect() {
    if (!isActive) return;
    selected = true;
    handleClick();
    setTimeout(() => { selected = false; }, 500);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<g
  class="activity-node"
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
    <circle class="halo-ring" cx="0" cy="0" r={r + 5} fill="none"
            stroke={colors.glow} stroke-width="0.8" opacity="0" />
    <circle class="selected-glow" cx="0" cy="0" r={r + 12} fill="none"
            stroke={colors.glow} stroke-width="0" opacity="0" />
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
    <svg x="-9" y="-11" width="18" height="22" viewBox="0 0 24 24"
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

  <!-- Labels below -->
  <g transform="translate(0, {r + 12})">
    {#each labelLines as line, li (li)}
      <text y={li * 15 + 2} text-anchor="middle" class="act-name" fill={theme.text.primary}>
        {line}
      </text>
    {/each}
    {#if statusText}
      {@const labelOffset = labelLines.length * 15 + 6}
      <rect x="-42" y={labelOffset} width="84" height="18" rx="9"
            fill={colors.lBg} stroke={colors.lBorder} stroke-width="0.5" />
      <text y={labelOffset + 13} text-anchor="middle" class="act-status" fill={colors.lText}>
        {statusText}
      </text>
    {/if}
  </g>
</g>

<style>
  .activity-node { cursor: default; outline: none; }
  .activity-node.clickable { cursor: pointer; }
  .activity-node.locked { opacity: 0.45; }

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
    transition: opacity 0.3s ease, stroke-width 0.3s ease;
  }
  .activity-node.selected .selected-ring {
    opacity: 0.6;
    stroke-width: 1;
    transition: opacity 0.4s ease;
  }
  .activity-node.selected .selected-glow {
    opacity: 0.25;
    stroke-width: 6;
    transition: opacity 0.5s ease, stroke-width 0.5s ease;
  }

  .selected-glow, .selected-ring {
    pointer-events: none;
    transition: opacity 0.3s ease, stroke-width 0.3s ease;
  }

  @keyframes act-pulse {
    0%, 100% { opacity: 0.4; stroke-width: 0.5; }
    50% { opacity: 0.8; stroke-width: 1.5; }
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
  .act-name { font: 600 13px/1 'Rubik', system-ui, sans-serif; }
  .act-status { font: 600 11px/1 'Rubik', system-ui, sans-serif; }
</style>
