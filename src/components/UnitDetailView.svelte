<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProgramUnit, Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import UnitCenterNode from './UnitCenterNode.svelte';
  import ActivityNode from './ActivityNode.svelte';
  import UnitIcon from './UnitIcon.svelte';

  interface Props {
    unit: ProgramUnit;
    programShortname: string;
    onBack: () => void;
    onActivitySelected: (activity: Activity) => void;
  }

  let { unit, programShortname, onBack, onActivitySelected }: Props = $props();

  const theme = $derived(getTheme());

  const activities = $derived<Activity[]>(unit.activities ?? []);

  // "Continuar" unlocks when the first activity is completed
  const continuarUnlocked = $derived(
    activities.length > 0 && activities[0].status === 'completed'
  );

  // Unit center turns green only when the last mandatory activity is completed
  const allMandatoryDone = $derived(
    activities.length > 0 && activities.every(a => a.status === 'completed')
  );

  // Collapse/expand activity spheres
  let activitiesCollapsed = $state(false);
  const activitiesVisible = $derived(!activitiesCollapsed);

  function toggleCollapse() {
    if (allMandatoryDone) activitiesCollapsed = !activitiesCollapsed;
  }

  const centerUnit = $derived<ProgramUnit>(
    allMandatoryDone
      ? { ...unit, status: 'completed', progress: 100 }
      : { ...unit, status: 'in-progress' }
  );

  // --- Layout constants ---
  const W = 1200;
  const H = 750;
  const centerX = W / 2;
  const centerY = H * 0.46;
  const orbitRadius = 280;

  // "Continuar" fixed at bottom (6 o'clock)
  const continuarPos = { x: centerX, y: centerY + orbitRadius };

  // --- Dynamic viewBox ---
  let containerEl: HTMLDivElement | undefined = $state();
  let cW = $state(1200);
  let cH = $state(750);

  onMount(() => {
    if (!containerEl) return;
    const ro = new ResizeObserver(([entry]) => {
      cW = entry.contentRect.width;
      cH = entry.contentRect.height;
    });
    ro.observe(containerEl);
    return () => ro.disconnect();
  });

  const vb = $derived.by(() => {
    const containerAR = cW / cH;
    const contentAR = W / H;
    let vbW: number, vbH: number;
    if (containerAR >= contentAR) {
      vbH = H;
      vbW = vbH * containerAR;
    } else {
      vbW = W;
      vbH = vbW / containerAR;
    }
    return {
      x: centerX - vbW / 2,
      y: centerY - vbH / 2,
      w: vbW,
      h: vbH,
    };
  });

  // --- Activity positioning ---
  const activityPositions = $derived.by(() => {
    const count = activities.length;
    if (count === 0) return [];

    const positions: Array<{ x: number; y: number; angle: number }> = [];
    const startAngle = Math.PI;
    const arcSpan = Math.PI;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + (arcSpan * i) / (count - 1 || 1);
      positions.push({
        x: centerX + orbitRadius * Math.cos(angle),
        y: centerY + orbitRadius * Math.sin(angle),
        angle,
      });
    }
    return positions;
  });

  // Connection line style
  function lineStyleFor(status: string): { dasharray: string; width: number; opacity: number } {
    if (status === 'locked') return { dasharray: '10 7', width: 2, opacity: 0.4 };
    return { dasharray: 'none', width: 2.5, opacity: 0.6 };
  }

  function lineColorFor(status: string): string {
    if (status === 'completed') return theme.unit.completed.glow;
    if (status === 'in-progress') return theme.unit.inProgress.glow;
    return theme.spiral;
  }

  function lineGlowFilter(status: string): string | undefined {
    if (status === 'completed') return 'url(#line-glow-green)';
    if (status === 'in-progress') return 'url(#line-glow-blue)';
    return undefined;
  }

  // "Continuar" colors — purple (finalProject) when unlocked to signal optional action
  const continuarColors = $derived(
    continuarUnlocked ? theme.unit.finalProject : theme.unit.locked
  );
  const continuarLineStyle = $derived(
    lineStyleFor(continuarUnlocked ? 'in-progress' : 'locked')
  );

  // Back button position
  const backX = $derived(vb.x + 30);
  const backY = $derived(vb.y + 30);

  function handleContinuar() {
    if (!continuarUnlocked) return;
    onBack();
  }
</script>

<div class="detail-container" bind:this={containerEl}>
  <svg
    viewBox="{vb.x} {vb.y} {vb.w} {vb.h}"
    class="detail-svg"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="detail-bg-grad" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color={theme.bg.center} />
        <stop offset="60%" stop-color={theme.bg.mid} />
        <stop offset="100%" stop-color={theme.bg.edge} />
      </radialGradient>
      <linearGradient id="cont-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color={continuarColors.g1} />
        <stop offset="100%" stop-color={continuarColors.g2} />
      </linearGradient>
      {#if continuarUnlocked}
        <filter id="cont-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feFlood flood-color={continuarColors.glow} flood-opacity="0.3" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      {/if}

      <filter id="line-glow-blue" filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
        <feGaussianBlur stdDeviation="6" in="SourceGraphic" result="blur-o" />
        <feFlood flood-color={theme.unit.inProgress.glow} flood-opacity="0.35" result="color-o" />
        <feComposite in="color-o" in2="blur-o" operator="in" result="glow-o" />
        <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="blur-i" />
        <feFlood flood-color="#ffffff" flood-opacity="0.15" result="color-i" />
        <feComposite in="color-i" in2="blur-i" operator="in" result="glow-i" />
        <feMerge><feMergeNode in="glow-o" /><feMergeNode in="glow-i" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="line-glow-green" filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
        <feGaussianBlur stdDeviation="6" in="SourceGraphic" result="blur-o" />
        <feFlood flood-color={theme.unit.completed.glow} flood-opacity="0.35" result="color-o" />
        <feComposite in="color-o" in2="blur-o" operator="in" result="glow-o" />
        <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="blur-i" />
        <feFlood flood-color="#ffffff" flood-opacity="0.15" result="color-i" />
        <feComposite in="color-i" in2="blur-i" operator="in" result="glow-i" />
        <feMerge><feMergeNode in="glow-o" /><feMergeNode in="glow-i" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="line-glow-purple" filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
        <feGaussianBlur stdDeviation="6" in="SourceGraphic" result="blur-o" />
        <feFlood flood-color={theme.unit.finalProject.glow} flood-opacity="0.35" result="color-o" />
        <feComposite in="color-o" in2="blur-o" operator="in" result="glow-o" />
        <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="blur-i" />
        <feFlood flood-color="#ffffff" flood-opacity="0.15" result="color-i" />
        <feComposite in="color-i" in2="blur-i" operator="in" result="glow-i" />
        <feMerge><feMergeNode in="glow-o" /><feMergeNode in="glow-i" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#detail-bg-grad)" opacity="0.85" />

    <g
      class="back-btn"
      transform="translate({backX}, {backY})"
      role="button"
      tabindex="0"
      onclick={() => onBack()}
      onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBack(); } }}
    >
      <rect x="-8" y="-16" width="110" height="32" rx="12" fill={theme.bg.center} opacity="0.6" />
      <svg x="0" y="-8" width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke={theme.text.primary} stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      <text x="22" y="5" fill={theme.text.primary} class="back-text">Volver</text>
    </g>

    <circle
      cx={centerX} cy={centerY} r={orbitRadius}
      fill="none" stroke={theme.spiral} stroke-width="1.5"
      stroke-dasharray="10 7" opacity="0.55"
    />

    {#if activitiesVisible}
      {#each activities as act, i (act.id)}
        {@const pos = activityPositions[i]}
        {#if pos}
          {@const ls = lineStyleFor(act.status)}
          <line
            x1={centerX} y1={centerY}
            x2={pos.x} y2={pos.y}
            stroke={lineColorFor(act.status)}
            stroke-width={ls.width}
            stroke-dasharray={ls.dasharray}
            opacity={ls.opacity}
            stroke-linecap="round"
            filter={lineGlowFilter(act.status)}
          />
        {/if}
      {/each}

      <line
        x1={centerX} y1={centerY}
        x2={continuarPos.x} y2={continuarPos.y}
        stroke={continuarColors.glow || lineColorFor('locked')}
        stroke-width={continuarLineStyle.width}
        stroke-dasharray={continuarLineStyle.dasharray}
        opacity={continuarLineStyle.opacity}
        stroke-linecap="round"
        filter={continuarUnlocked ? 'url(#line-glow-purple)' : undefined}
      />
    {/if}

    <g
      class:center-toggle={allMandatoryDone}
      role={allMandatoryDone ? 'button' : undefined}
      tabindex={allMandatoryDone ? 0 : undefined}
      onclick={allMandatoryDone ? toggleCollapse : undefined}
      onkeydown={allMandatoryDone ? (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapse(); } } : undefined}
    >
      <UnitCenterNode unit={centerUnit} {programShortname} cx={centerX} cy={centerY} />
    </g>
    {#if allMandatoryDone}
      <text
        x={centerX} y={centerY + 102}
        text-anchor="middle"
        class="collapse-hint"
        fill={theme.text.secondary}
      >{activitiesCollapsed ? '▼ ver actividades' : '▲ ocultar'}</text>
    {/if}

    {#if activitiesVisible}
      {#each activities as act, i (act.id)}
        {@const pos = activityPositions[i]}
        {#if pos}
          <ActivityNode activity={act} x={pos.x} y={pos.y} index={i} isFirst={i === 0} labelAngle={pos.angle} {onActivitySelected} />
        {/if}
      {/each}
    {/if}

    {#if activitiesVisible}
    <g
      class="continuar-node"
      class:unlocked={continuarUnlocked}
      class:locked={!continuarUnlocked}
      transform="translate({continuarPos.x}, {continuarPos.y})"
      tabindex={continuarUnlocked ? 0 : -1}
      role={continuarUnlocked ? 'button' : undefined}
      onclick={handleContinuar}
      onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleContinuar(); } }}
    >
      <rect class="cont-bg"
            x="-41" y="-13" width="82" height="26" rx="5"
            fill="url(#cont-grad)" />

      <text x="0" y="1" text-anchor="middle" dominant-baseline="middle"
            class="cont-label" fill={continuarColors.icon}>
        Continuar
      </text>
    </g>
    {/if}
  </svg>
</div>

<style>
  .detail-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .detail-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .back-btn {
    cursor: pointer;
    outline: none;
  }

  .back-btn:hover rect {
    opacity: 0.8;
  }

  .back-text {
    font: 500 14px/1 'Rubik', system-ui, sans-serif;
  }

  .continuar-node {
    cursor: default;
    outline: none;
  }

  .continuar-node.unlocked {
    cursor: pointer;
  }

  .continuar-node.locked {
    opacity: 0.45;
  }

  .continuar-node.unlocked:hover .cont-bg {
    filter: brightness(1.15);
  }

  @keyframes cont-pulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.8; }
  }

  .cont-label {
    font: 600 13px/1 'Rubik', system-ui, sans-serif;
  }

  .center-toggle {
    cursor: pointer;
    outline: none;
  }

  .collapse-hint {
    font: 400 11px/1 'Rubik', system-ui, sans-serif;
    pointer-events: none;
    opacity: 0.6;
  }
</style>