<script lang="ts">
  import type { Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import { activityOrbitLayout } from '../lib/activity-orbit';

  interface Props {
    activities: Activity[];
    cx: number;
    cy: number;
    unitR: number;
    onActivitySelected: (activity: Activity) => void;
    /** The unit's title font size — activity pills render 20% smaller than this. */
    titleFontSize?: number;
  }

  let { activities, cx, cy, unitR, onActivitySelected, titleFontSize = 20 }: Props = $props();

  const t = $derived(getTheme());

  // Shared layout — fixed clock-face positions, same for every sphere.
  const layout = $derived(activityOrbitLayout(activities, unitR, titleFontSize));

  function statusColors(s: Activity['status']) {
    if (s === 'completed')   return t.unit.completed;
    if (s === 'in-progress') return t.unit.inProgress;
    return t.unit.locked;
  }

  function handleCard(e: Event, act: Activity) {
    e.stopPropagation();
    if (act.status === 'locked') return;
    if (act.slides && act.slides.length > 0) onActivitySelected(act);
    else if (act.activityUrl && act.activityUrl !== '#') window.open(act.activityUrl, '_blank');
  }
</script>

<g transform="translate({cx},{cy})">
  <!-- Connector lines — stroke-opacity at group level: inherited per-stroke, no compositing layer -->
  <g stroke-opacity="0.42">
    {#each activities as act, j (act.id)}
      {#if layout.chips[j]}
        {@const d      = layout.chips[j]}
        {@const colors = statusColors(act.status)}
        <line
          x1={unitR * Math.cos(d.a)} y1={unitR * Math.sin(d.a)}
          x2={d.x} y2={d.y}
          stroke={colors.ring} stroke-width="0.8" stroke-dasharray="3 4"
        />
      {/if}
    {/each}
  </g>

  <g class="list-inner">
    {#each activities as act, j (act.id)}
      {#if layout.chips[j]}
        {@const d        = layout.chips[j]}
        {@const colors   = statusColors(act.status)}
        {@const isActive = act.status !== 'locked'}
        {@const cr       = d.d / 2}
        {@const sw       = 2}
        {@const pr       = cr - sw / 2}
        {@const circ     = 2 * Math.PI * pr}
        {@const dashOff  = circ - (act.progress / 100) * circ}

        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <g
          class="chip"
          class:chip-active={isActive}
          class:chip-locked={!isActive}
          transform="translate({d.x},{d.y})"
          tabindex={isActive ? 0 : -1}
          role={isActive ? 'button' : undefined}
          onclick={(e: MouseEvent) => handleCard(e, act)}
          onkeydown={(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCard(e, act); }
          }}
        >
          <!-- Thin outer halo + chalk-white disc + thicker inset progress ring — same
               two-tier border treatment as the unit sphere, scaled down. -->
          {#if isActive}
            <circle r={cr + 2} fill="none" stroke={colors.glow} stroke-width="0.8" stroke-opacity="0.25" />
          {/if}
          <circle class="chip-bg" r={cr} fill="#F4F2EC" />
          {#if isActive}
            <circle r={pr} fill="none" stroke={colors.ring} stroke-width={sw}
                    stroke-dasharray={circ} stroke-dashoffset={dashOff}
                    stroke-linecap="round" transform="rotate(-90)" />
          {:else}
            <circle r={cr} fill="none" stroke={colors.ring} stroke-width="1.5" />
          {/if}
          <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
                class="chip-lbl" fill="#001f3f" style="font-size: {layout.pillFont}px">
            {d.label}
          </text>
        </g>
      {/if}
    {/each}
  </g>
</g>

<style>
  .list-inner {
    animation: list-in 0.28s cubic-bezier(0.34, 1.4, 0.64, 1) both;
    transform-origin: 0 0;
  }
  @keyframes list-in {
    from { transform: scale(0.75); }
    to   { transform: scale(1); }
  }

  .chip        { cursor: default; outline: none; }
  .chip-active { cursor: pointer; }
  /* fill-opacity + stroke-opacity inherited per-element — no compositing layer vs opacity */
  .chip-locked { fill-opacity: 0.45; stroke-opacity: 0.45; }

  @media (hover: hover) {
    .chip-active:hover .chip-bg { fill: #eef4ff; }
  }

  .chip-lbl { font-family: 'Rubik', system-ui, sans-serif; font-weight: 600; pointer-events: none; }
</style>
