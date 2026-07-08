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
       raised (2026-07-07, 2026-07-08 feedback) to read more clearly. -->
  {#if layout.orbitR > 0}
    <circle cx="0" cy="0" r={layout.orbitR} fill="none"
            stroke="rgba(0,180,255,0.9)" stroke-width="1"
            stroke-dasharray="1.5 5" stroke-linecap="round" />
  {/if}

  <!-- Connector lines — stroke-opacity at group level: inherited per-stroke, no compositing
       layer. Raised (2026-07-07, 2026-07-08 feedback) now that the background spiral dims while
       this is open, so the connectors read clearly against it. -->
  <g stroke-opacity="1">
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
        {@const isInProgress = act.status === 'in-progress'}
        {@const cr       = d.d / 2}
        {@const sw       = 3.5}
        {@const pr       = cr - sw / 2}
        {@const circ     = 2 * Math.PI * pr}
        {@const dashOff  = circ - (act.progress / 100) * circ}
        {@const bgR      = cr * 0.8}

        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <g
          class="chip"
          class:chip-active={isActive}
          class:chip-locked={!isActive}
          class:chip-inprogress={isInProgress}
          transform="translate({d.x},{d.y})"
          tabindex={isActive ? 0 : -1}
          role={isActive ? 'button' : undefined}
          onclick={(e: MouseEvent) => handleCard(e, act)}
          onkeydown={(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCard(e, act); }
          }}
        >
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
            <!-- Background disc: flat chalk-white, no gradient/shading/craters. Always fully
                 opaque (fill-opacity 1, overriding .chip-locked's dimming) so it stays a solid
                 shield over whatever's behind it (e.g. the spiral trace) — never see-through,
                 regardless of status. -->
            <circle class="chip-bg" r={bgR} fill="#F4F2EC" fill-opacity="1" />
            {#if isActive}
              <circle r={pr} fill="none" stroke={colors.ring} stroke-width={sw}
                      stroke-dasharray={circ} stroke-dashoffset={dashOff}
                      stroke-linecap="round" transform="rotate(-90)" />
            {:else}
              <!-- Locked: solid grey disabled border. stroke-opacity forced above .chip-locked's
                   0.45 dimming (2026-07-08 feedback: border wasn't visible enough) — only the
                   label/fill stay dimmed, the border itself reads clearly as "disabled". -->
              <circle r={cr} fill="none" stroke={colors.ring} stroke-width="2" stroke-opacity="0.9" />
            {/if}
            {#if isActive}
              <!-- Label — matches the reference .luna-numero spec: navy fill, single crisp
                   engraved edge (text-shadow, no blur). -->
              <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
                    class="chip-lbl chip-num" fill="#0F3A4E"
                    style="font-size: {layout.pillFont}px">
                {d.label}
              </text>
            {:else}
              <!-- Locked: same padlock icon used on the big UNIT spheres (UnitNode.svelte),
                   same viewBox/colors — instead of the number (2026-07-08 feedback). -->
              {@const lockSize = layout.pillFont * 1.3}
              <svg x={-lockSize / 2} y={-lockSize / 2} width={lockSize} height={lockSize} viewBox="0 0 24 24"
                   fill="none" stroke="#4b5563" stroke-opacity="0.6" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
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
  /* In-progress: the orange outer border shows from the start (2026-07-08 feedback) — it's
     the "this chip is active" indicator, always on; the inner ring (above) tracks % done.
     Hover still intensifies it further via the rule below. */
  .chip-inprogress .halo-ring {
    stroke-opacity: 0.7;
    stroke-width: 2;
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
  @media (hover: hover) {
    .chip-active:hover .chip-bg { fill: #ffffff; }
  }

  .chip-lbl { font-family: 'Rubik', system-ui, sans-serif; font-weight: 600; pointer-events: none; }

  /* Matches the reference .luna-numero spec: bold, single crisp engraved edge (no blur). */
  .chip-num {
    font-weight: 700;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
  }
</style>
