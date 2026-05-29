<script lang="ts">
  import type { Activity } from '../lib/types';

  interface Props {
    activities: Activity[];
    cx: number;
    cy: number;
    unitR: number;
    outwardAngle: number;
    onActivitySelected: (activity: Activity) => void;
  }

  let { activities, cx, cy, unitR, outwardAngle, onActivitySelected }: Props = $props();

  const CH       = 32;   // chip height
  const CHIP_GAP = 8;    // vertical gap between chips
  const GAP      = 18;   // gap from node visual edge to list nearest edge
  const CHAR_W   = 7.2;
  const PAD_L    = 28;   // left: margin + dot + gap
  const PAD_R    = 12;

  function chipWidth(label: string) {
    return Math.max(90, PAD_L + label.length * CHAR_W + PAD_R);
  }

  const nx   = $derived(Math.cos(outwardAngle));
  const n    = $derived(activities.length);
  // List always opens left or right — never above or below
  const sign = $derived(nx >= 0 ? 1 : -1);

  // Center (x, y) of chip j in node-local coordinates (node center = 0,0).
  // Chips stacked vertically, centered on the node's y, near-edge flush with outward side.
  function chipPos(j: number, cw: number): { x: number; y: number } {
    return {
      x: sign * (unitR + GAP + cw / 2),
      y: (j - (n - 1) / 2) * (CH + CHIP_GAP),
    };
  }

  function statusColor(s: Activity['status']) {
    if (s === 'completed')   return '#22c55e';
    if (s === 'in-progress') return '#3b82f6';
    return '#475569';
  }

  function handleCard(e: Event, act: Activity) {
    e.stopPropagation();
    if (act.status === 'locked') return;
    if (act.slides && act.slides.length > 0) onActivitySelected(act);
    else if (act.activityUrl && act.activityUrl !== '#') window.open(act.activityUrl, '_blank');
  }
</script>

<g transform="translate({cx},{cy})">
  <g class="list-inner">
    {#each activities as act, j (act.id)}
      {@const cw      = chipWidth(act.label)}
      {@const pos     = chipPos(j, cw)}
      {@const sc      = statusColor(act.status)}
      {@const isActive = act.status !== 'locked'}

      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <g
        class="chip"
        class:chip-active={isActive}
        class:chip-locked={!isActive}
        transform="translate({pos.x},{pos.y})"
        tabindex={isActive ? 0 : -1}
        role={isActive ? 'button' : undefined}
        onclick={(e: MouseEvent) => handleCard(e, act)}
        onkeydown={(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCard(e, act); }
        }}
      >
        <!-- Pill background -->
        <rect x={-cw / 2} y={-CH / 2} width={cw} height={CH} rx={CH / 2}
          fill="rgba(4,10,30,0.94)" stroke={sc} stroke-width="1.2" />

        <!-- Status dot -->
        <circle cx={-cw / 2 + 15} cy="0" r="7" fill={sc} />

        <!-- Icon -->
        {#if act.status === 'completed'}
          <svg x={-cw / 2 + 10} y="-5" width="10" height="10" viewBox="0 0 24 24"
            fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        {:else if act.status === 'in-progress'}
          <svg x={-cw / 2 + 11} y="-4" width="8" height="8" viewBox="0 0 24 24" fill="#fff">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        {:else}
          <svg x={-cw / 2 + 11} y="-5" width="8" height="10" viewBox="0 0 24 24"
            fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        {/if}

        <!-- Label -->
        <text x={-cw / 2 + 28} y="0" dominant-baseline="middle"
          class="chip-lbl" fill={isActive ? '#e2e8f0' : '#64748b'}>
          {act.label}
        </text>
      </g>
    {/each}
  </g>
</g>

<style>
  .list-inner {
    animation: list-in 0.28s cubic-bezier(0.34, 1.4, 0.64, 1) both;
    transform-origin: 0 0;
  }
  @keyframes list-in {
    from { transform: scale(0.75); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }

  .chip        { cursor: default; outline: none; }
  .chip-active { cursor: pointer; }
  .chip-locked { opacity: 0.35; }

  .chip-active:hover rect:first-child {
    stroke-width: 2;
    filter: brightness(1.2);
  }

  .chip-lbl { font: 500 12px/1 'Rubik', system-ui, sans-serif; pointer-events: none; }
</style>
