<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProgramUnit, Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import { EMULATOR_CONFIG } from '../lib/emulator-config';
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

  // --- Activity emulator state ---
  let emuActive = $state(true);
  let emuActivityIdx = $state(0);
  let emuProgress = $state(0);
  let emuTimer: ReturnType<typeof setTimeout> | null = null;

  // Base activities (first promoted to in-progress)
  const baseActivities = $derived.by((): Activity[] => {
    const raw = unit.activities ?? [];
    if (raw.length === 0) return raw;
    const first = raw[0];
    if (first.status === 'locked') {
      return [{ ...first, status: 'in-progress' as const, progress: 0 }, ...raw.slice(1)];
    }
    return raw;
  });

  // Emulated activities: overlay emulator state on base
  function buildEmuActivities(base: Activity[], activeIdx: number, progress: number): Activity[] {
    return base.map((a, i) => {
      if (i < activeIdx) return { ...a, status: 'completed' as const, progress: 100 };
      if (i === activeIdx) return {
        ...a,
        status: progress >= 100 ? 'completed' as const : 'in-progress' as const,
        progress: Math.min(progress, 100),
      };
      return { ...a, status: 'locked' as const, progress: 0 };
    });
  }

  const activities = $derived<Activity[]>(
    emuActive
      ? buildEmuActivities(baseActivities, emuActivityIdx, emuProgress)
      : baseActivities.map(a => ({ ...a, status: 'completed' as const, progress: 100 }))
  );

  // Emulator tick logic
  function emuTick() {
    if (!emuActive) return;
    emuProgress += EMULATOR_CONFIG.progressStep;

    if (emuProgress > 100) {
      emuProgress = 0;
      emuActivityIdx++;

      if (emuActivityIdx >= baseActivities.length) {
        // All done — pause then restart
        emuTimer = setTimeout(() => {
          if (!emuActive) return;
          emuActivityIdx = 0;
          emuProgress = 0;
          scheduleEmuTick();
        }, EMULATOR_CONFIG.pauseBeforeRestartMs);
        return;
      }

      // Pause between activities
      emuTimer = setTimeout(() => scheduleEmuTick(), EMULATOR_CONFIG.pauseBetweenUnitsMs);
      return;
    }

    scheduleEmuTick();
  }

  function scheduleEmuTick() {
    if (!emuActive) return;
    emuTimer = setTimeout(emuTick, EMULATOR_CONFIG.tickMs);
  }

  function toggleActivityEmu() {
    if (emuActive) {
      emuActive = false;
      if (emuTimer) { clearTimeout(emuTimer); emuTimer = null; }
    } else {
      emuActive = true;
      emuActivityIdx = 0;
      emuProgress = 0;
      scheduleEmuTick();
    }
  }

  // "Continuar" unlocks when the first activity is completed
  const continuarUnlocked = $derived(
    activities.length > 0 && activities[0].status === 'completed'
  );

  // Unit center turns green only when the last mandatory activity is completed
  const allMandatoryDone = $derived(
    activities.length > 0 && activities.every(a => a.status === 'completed')
  );

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

    // Auto-start activity emulator
    scheduleEmuTick();

    return () => {
      ro.disconnect();
      if (emuTimer) clearTimeout(emuTimer);
    };
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

    const positions: Array<{ x: number; y: number }> = [];
    const startAngle = Math.PI;
    const arcSpan = Math.PI;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + (arcSpan * i) / (count - 1 || 1);
      positions.push({
        x: centerX + orbitRadius * Math.cos(angle),
        y: centerY + orbitRadius * Math.sin(angle),
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

  // Emulator toggle position
  const emuBtnX = $derived(vb.x + vb.w - 80);
  const emuBtnY = $derived(vb.y + vb.h - 40);

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
      <radialGradient id="cont-grad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color={continuarColors.g1} />
        <stop offset="100%" stop-color={continuarColors.g2} />
      </radialGradient>
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

      <!-- Line glow filters — userSpaceOnUse to handle thin/degenerate bbox on lines -->
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

    <!-- Background -->
    <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#detail-bg-grad)" opacity="0.85" />

    <!-- Back button -->
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

    <!-- Orbit ring (dashed) -->
    <circle
      cx={centerX} cy={centerY} r={orbitRadius}
      fill="none" stroke={theme.spiral} stroke-width="1.5"
      stroke-dasharray="10 7" opacity="0.55"
    />

    <!-- Connection lines: activities -->
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

    <!-- Connection line: Continuar -->
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

    <!-- Center node -->
    <UnitCenterNode unit={centerUnit} {programShortname} cx={centerX} cy={centerY} />

    <!-- Activity nodes -->
    {#each activities as act, i (act.id)}
      {@const pos = activityPositions[i]}
      {#if pos}
        <ActivityNode activity={act} x={pos.x} y={pos.y} index={i} isFirst={i === 0} {onActivitySelected} />
      {/if}
    {/each}

    <!-- Continuar node -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
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
      {#if continuarUnlocked}
        <circle class="cont-halo" cx="0" cy="0" r="43" fill="none"
                stroke={continuarColors.glow} stroke-width="0.8" opacity="0" />
      {/if}

      <circle
        cx="0" cy="0" r="38"
        fill="url(#cont-grad)"
        filter={continuarUnlocked ? 'url(#cont-glow)' : undefined}
      />

      {#if !continuarUnlocked}
        <circle cx="0" cy="0" r="41" fill="none" stroke={continuarColors.ring} stroke-width="1.2" opacity="0.6" />
        <svg x="-9" y="-11" width="18" height="22" viewBox="0 0 24 24"
             fill="none" stroke={continuarColors.icon} stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      {:else}
        <g transform="translate(-12, -12)">
          <UnitIcon icon="binoculars" size={24} color={continuarColors.icon} />
        </g>
      {/if}

      <text y="56" text-anchor="middle" class="cont-label" fill={theme.text.primary}>
        Continuar
      </text>
    </g>
    <!-- Activity emulator toggle -->
    <g
      class="emu-btn"
      transform="translate({emuBtnX}, {emuBtnY})"
      role="button"
      tabindex="0"
      onclick={() => toggleActivityEmu()}
      onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleActivityEmu(); } }}
    >
      <rect x="-50" y="-14" width="100" height="28" rx="14"
            fill={emuActive ? 'rgba(59,130,246,0.2)' : 'rgba(128,128,128,0.12)'}
            stroke={emuActive ? 'rgba(96,165,250,0.5)' : 'rgba(128,128,128,0.2)'}
            stroke-width="1" />
      <text x="-30" y="5" class="emu-text" fill={theme.text.secondary}>EMU</text>
      <rect x="10" y="-6" width="28" height="12" rx="6"
            fill={emuActive ? 'rgba(59,130,246,0.3)' : 'rgba(128,128,128,0.2)'} />
      <circle cx={emuActive ? 32 : 16} cy="0" r="5"
              fill={emuActive ? '#3b82f6' : '#6b7280'} />
    </g>
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

  .continuar-node.unlocked:hover .cont-halo {
    opacity: 0.7;
    stroke-width: 2;
    animation: cont-pulse 1.2s ease-in-out infinite;
  }

  .cont-halo {
    transition: opacity 0.3s ease, stroke-width 0.3s ease;
    pointer-events: none;
  }

  @keyframes cont-pulse {
    0%, 100% { opacity: 0.4; stroke-width: 0.5; }
    50% { opacity: 0.8; stroke-width: 1.5; }
  }

  .cont-label {
    font: 500 13px/1 'Rubik', system-ui, sans-serif;
  }

  .emu-btn {
    cursor: pointer;
    outline: none;
  }

  .emu-btn:hover rect:first-child {
    opacity: 0.9;
  }

  .emu-text {
    font: 600 10px/1 'Rubik', system-ui, sans-serif;
    letter-spacing: 0.5px;
  }
</style>
