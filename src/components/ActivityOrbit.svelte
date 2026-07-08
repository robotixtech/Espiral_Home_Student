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
  <!-- Orbit ring: dotted circle through every lesson chip's centre — all chips already share
       the same radius (layout.orbitR), so this is just that circle traced as dots. Opacity
       raised (2026-07-07 feedback) to read more clearly. -->
  {#if layout.orbitR > 0}
    <circle cx="0" cy="0" r={layout.orbitR} fill="none"
            stroke="rgba(0,180,255,0.65)" stroke-width="1"
            stroke-dasharray="1.5 5" stroke-linecap="round" />
  {/if}

  <!-- Connector lines — stroke-opacity at group level: inherited per-stroke, no compositing
       layer. Raised (2026-07-07 feedback) now that the background spiral dims while this is
       open, so the connectors read clearly against it. -->
  <g stroke-opacity="0.85">
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
        {@const sw       = 3.5}
        {@const pr       = cr - sw / 2}
        {@const circ     = 2 * Math.PI * pr}
        {@const dashOff  = circ - (act.progress / 100) * circ}
        {@const gradId   = `chip-grad-${act.id}`}
        {@const numGradId    = `chip-num-grad-${act.id}`}
        {@const numStroke    = layout.pillFont * 0.05}
        {@const numEdgeOffset = layout.pillFont * 0.06}

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
          <defs>
            <!-- Background: identical recipe to the unit sphere — full-saturation status
                 colour gradient (colors.g1 → colors.g2), not a pale tint. -->
            <radialGradient id={gradId} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color={colors.g1} />
              <stop offset="100%" stop-color={colors.g2} />
            </radialGradient>
            <!-- Label fill: identical recipe to the unit sphere's number text -->
            <linearGradient id={numGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#FFFFFF" />
              <stop offset="70%"  stop-color="#F4F2EC" />
              <stop offset="100%" stop-color="#E6E1D2" />
            </linearGradient>
            {#if act.status === 'completed'}
              <filter id="chip-glow-{act.id}" filterUnits="userSpaceOnUse"
                      x={-cr - 20} y={-cr - 20} width={(cr + 20) * 2} height={(cr + 20) * 2}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            {/if}
          </defs>
          {#if isActive}
            <!-- Hover glow border — same as the unit sphere: invisible at rest, pulses on hover -->
            <circle class="halo-ring" r={cr + 5} fill="none" stroke={colors.glow} stroke-width="0.8" />
          {/if}

          <!-- Beat group: breathes on hover, same as the unit sphere -->
          <g class="beat">
            <!-- Border: identical treatment to the unit sphere — ambient halo + progress ring
                 for active chips, no border at all for locked ones. -->
            {#if isActive}
              <circle r={cr + 3} fill="none" stroke={colors.glow} stroke-width="0.8" stroke-opacity="0.15" />
            {/if}
            <circle class="chip-bg" r={cr} fill="url(#{gradId})"
                    filter={act.status === 'completed' ? `url(#chip-glow-${act.id})` : undefined} />
            {#if isActive}
              <circle r={pr} fill="none" stroke={colors.ring} stroke-width={sw}
                      stroke-dasharray={circ} stroke-dashoffset={dashOff}
                      stroke-linecap="round" transform="rotate(-90)" />
            {/if}
            {#if isActive}
              <!-- Same treatment as the unit-sphere number: solid navy "extrusion" edge behind
                   (0-blur offset duplicate), gradient-filled + navy-outlined text on top. -->
              <text x="0" y={numEdgeOffset} text-anchor="middle" dominant-baseline="central"
                    class="chip-lbl chip-num-edge" style="font-size: {layout.pillFont}px">
                {d.label}
              </text>
              <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
                    class="chip-lbl chip-num" fill="url(#{numGradId})"
                    style="font-size: {layout.pillFont}px; stroke-width: {numStroke}px">
                {d.label}
              </text>
            {:else}
              <!-- Locked: flat, disabled look — same as the unit sphere's locked number. Dimming
                   comes from .chip-locked on the parent group (fill/stroke-opacity), same as the
                   rest of this chip, so no separate "disabled" class is needed here. -->
              <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
                    class="chip-lbl chip-num" fill="#F4F2EC"
                    style="font-size: {layout.pillFont}px; stroke-width: {numStroke}px">
                {d.label}
              </text>
            {/if}
          </g>
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

  /* Hover effect — identical to the unit sphere: a halo ring that pulses in, plus the whole
     chip "breathing" (heartbeat scale). stroke-opacity instead of opacity — no compositing
     layer on Mali-G52. Real-pointer only (hover: hover) — no stuck hover on Android touch. */
  .halo-ring {
    stroke-opacity: 0;
    transition: stroke-opacity 0.3s ease, stroke-width 0.3s ease;
    pointer-events: none;
  }
  @media (hover: hover) {
    .chip-active:hover .halo-ring {
      stroke-opacity: 0.85;
      stroke-width: 3;
      animation: border-pulse 1.2s ease-in-out infinite;
    }
  }
  @keyframes border-pulse {
    0%, 100% { stroke-opacity: 0.5; stroke-width: 1.5; }
    50%       { stroke-opacity: 1.0; stroke-width: 3; }
  }
  .beat { transform-origin: 0 0; }
  @media (hover: hover) {
    .chip-active:hover .beat { animation: heartbeat 2s ease-in-out infinite; }
    .chip-active:hover .chip-bg { fill: #eef4ff; }
  }
  @keyframes heartbeat {
    0%   { transform: scale(1); }
    10%  { transform: scale(1.06); }
    20%  { transform: scale(1); }
    30%  { transform: scale(1.04); }
    40%  { transform: scale(1); }
    100% { transform: scale(1); }
  }

  .chip-lbl { font-family: 'Rubik', system-ui, sans-serif; font-weight: 600; pointer-events: none; }

  /* Navy outline behind the white fill — identical recipe to the unit sphere's number text. */
  .chip-num {
    font-weight: 800;
    stroke: #001f3f;
    paint-order: stroke fill;
  }
  /* Solid navy duplicate sat behind .chip-num, offset down — same font metrics so it lines
     up exactly under the real glyphs, giving them a flat "extruded" edge with no blur. */
  .chip-num-edge {
    font-weight: 800;
    fill: #001f3f;
  }
</style>
