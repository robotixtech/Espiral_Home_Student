<script lang="ts">
  import type { ProgramUnit } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import UnitIcon from './UnitIcon.svelte';

  interface Props {
    unit: ProgramUnit;
    programShortname: string;
    cx: number;
    cy: number;
  }

  let { unit, programShortname, cx, cy }: Props = $props();

  const r = 80;
  const theme = $derived(getTheme());

  const colors = $derived.by(() => {
    switch (unit.status) {
      case 'completed': return theme.unit.completed;
      case 'in-progress': return theme.unit.inProgress;
      default: return theme.unit.locked;
    }
  });

  const isCompleted = $derived(unit.status === 'completed');
  const gradId = 'center-grad';
  const glowId = 'center-glow';
</script>

<g transform="translate({cx}, {cy})">
  <defs>
    <radialGradient id={gradId} cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color={colors.g1} />
      <stop offset="100%" stop-color={colors.g2} />
    </radialGradient>
    <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feFlood flood-color={colors.glow} flood-opacity="0.25" result="color" />
      <feComposite in="color" in2="blur" operator="in" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Completion orbit rings (static, no animation) -->
  {#if isCompleted}
    <circle cx="0" cy="0" r={r + 16} fill="none" stroke={colors.glow} stroke-width="0.7" opacity="0.2" />
    <circle cx="0" cy="0" r={r + 28} fill="none" stroke={colors.glow} stroke-width="0.5" opacity="0.12" />
  {/if}

  <!-- Outer ambient ring -->
  <circle cx="0" cy="0" r={r + 4} fill="none" stroke={colors.glow} stroke-width="0.8" opacity="0.2" />

  <!-- Main circle -->
  <circle cx="0" cy="0" r={r} fill="url(#{gradId})" filter="url(#{glowId})" />

  <!-- Icon -->
  <g transform="translate(-16, -56)" opacity="0.7">
    <UnitIcon icon={unit.icon} size={32} color={colors.icon} />
  </g>

  <!-- Program shortname -->
  <text y="-4" text-anchor="middle" class="center-program" fill={colors.icon} opacity="0.8">
    {programShortname}
  </text>
  <!-- Unit display name -->
  <text y="16" text-anchor="middle" class="center-display" fill={colors.icon}>
    {unit.displayName}
  </text>
  <!-- Unit label -->
  <text y="34" text-anchor="middle" class="center-label" fill={colors.icon} opacity="0.85">
    {unit.label}
  </text>
</g>

<style>
  .center-program { font: 600 13px/1 'Rubik', system-ui, sans-serif; letter-spacing: 1px; }
  .center-display { font: 700 18px/1 'Rubik', system-ui, sans-serif; }
  .center-label { font: 400 12.5px/1 'Rubik', system-ui, sans-serif; }
</style>
