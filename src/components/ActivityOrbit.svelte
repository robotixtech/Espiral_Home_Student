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

  /** Mix a hex colour toward white by `weight` (0..1 = how much of the status colour shows). */
  function mixWithWhite(hex: string, weight: number): string {
    const n = parseInt(hex.replace('#', ''), 16);
    const m = (c: number) => Math.round(c * weight + 255 * (1 - weight));
    return `rgb(${m((n >> 16) & 255)} ${m((n >> 8) & 255)} ${m(n & 255)})`;
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
        {@const sw       = 2}
        {@const pr       = cr - sw / 2}
        {@const circ     = 2 * Math.PI * pr}
        {@const dashOff  = circ - (act.progress / 100) * circ}
        {@const gradId   = `chip-grad-${act.id}`}

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
            <!-- 3D sphere look, same recipe as the unit sphere: highlight offset to 35%/35%,
                 fading to the base tone. Base/highlight are the status colour mixed toward
                 white — strengthened 2026-07-07 (was 10%/4%, read as near-white). -->
            <radialGradient id={gradId} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color={mixWithWhite(colors.ring, 0.15)} />
              <stop offset="100%" stop-color={mixWithWhite(colors.ring, 0.35)} />
            </radialGradient>
          </defs>
          <!-- Thin outer halo + 3D-shaded disc + thicker inset progress ring — same
               two-tier border treatment as the unit sphere, scaled down. -->
          {#if isActive}
            <circle r={cr + 2} fill="none" stroke={colors.glow} stroke-width="0.8" stroke-opacity="0.25" />
          {/if}
          <circle class="chip-bg" r={cr} fill="url(#{gradId})" />
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
