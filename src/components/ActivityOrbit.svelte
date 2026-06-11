<script lang="ts">
  import type { Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';

  interface Props {
    activities: Activity[];
    cx: number;
    cy: number;
    unitR: number;
    outwardAngle: number;
    onActivitySelected: (activity: Activity) => void;
  }

  let { activities, cx, cy, unitR, outwardAngle, onActivitySelected }: Props = $props();

  const t = $derived(getTheme());

  const CH         = 56;
  const DOT_R      = 16;
  const DOT_OFFSET = 13;
  const TEXT_OFF   = 9;
  const GAP        = 8;
  const CHAR_W     = 7.2;
  const PAD_H      = 20;
  const DOT_SW     = 2;   // progress ring stroke-width

  function chipWidth(label: string): number {
    return Math.max(70, PAD_H + label.length * CHAR_W);
  }

  function statusColors(s: Activity['status']) {
    if (s === 'completed')   return t.unit.completed;
    if (s === 'in-progress') return t.unit.inProgress;
    return t.unit.locked;
  }

  // Dot sits at chip center (= orbit point). Label is on the far side from the unit sphere.
  function dotCY(_a: number): number { return 0; }
  function textCY(a: number): number {
    // Far side: above chip for chips above sphere (sin<0), below for chips below sphere (sin>0).
    return Math.sin(a) < 0 ? -(DOT_R + 8) : (DOT_R + 8);
  }

  const n = $derived(activities.length);

  const chipData = $derived.by(() => {
    if (n === 0) return [];

    const widths = activities.map(a => chipWidth(a.label));
    const angles = Array.from({ length: n }, (_, j) => {
      const inward   = outwardAngle + Math.PI;
      const halfStep = Math.PI / n;
      return inward + halfStep + (2 * Math.PI * j) / n;
    });

    // Per-chip minimum radius: for horizontal chips the text width (not chip height)
    // is the binding constraint — ensure the inward text edge clears the unit sphere.
    const baseR = (unitR + GAP + CH / 2) * 1.2;
    const radii = angles.map((a, j) => {
      const cosA = Math.abs(Math.cos(a));
      const sinA = Math.abs(Math.sin(a));
      if (cosA > sinA && cosA > 0.1) {
        return Math.max(baseR, (unitR + GAP + widths[j] / 2) / cosA);
      }
      return baseR;
    });

    for (let iter = 0; iter < 120; iter++) {
      let changed = false;
      for (let j = 0; j < n; j++) {
        const j2 = (j + 1) % n;
        const dx = Math.abs(radii[j] * Math.cos(angles[j]) - radii[j2] * Math.cos(angles[j2]));
        const dy = Math.abs(radii[j] * Math.sin(angles[j]) - radii[j2] * Math.sin(angles[j2]));
        if (dx < (widths[j] + widths[j2]) / 2 + 6 && dy < CH + 6) {
          radii[j]  += 1;
          radii[j2] += 1;
          changed = true;
        }
      }
      if (!changed) break;
    }

    const uniformR = Math.max(...radii);
    return angles.map((a, j) => {
      const dcy = dotCY(a);
      return {
        a,
        x:  uniformR * Math.cos(a),
        y:  uniformR * Math.sin(a) - dcy,
        r:  uniformR,
        cw: widths[j],
      };
    });
  });

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
      {#if chipData[j]}
        {@const d      = chipData[j]}
        {@const colors = statusColors(act.status)}
        <line
          x1={unitR * Math.cos(d.a)} y1={unitR * Math.sin(d.a)}
          x2={d.x} y2={d.y + dotCY(d.a)}
          stroke={colors.ring} stroke-width="0.8" stroke-dasharray="3 4"
        />
      {/if}
    {/each}
  </g>

  <g class="list-inner">
    {#each activities as act, j (act.id)}
      {#if chipData[j]}
        {@const d           = chipData[j]}
        {@const colors      = statusColors(act.status)}
        {@const isActive    = act.status !== 'locked'}
        {@const isInProgress = act.status === 'in-progress'}
        {@const dcy         = dotCY(d.a)}
        {@const pr          = DOT_R - DOT_SW / 2}
        {@const circ        = 2 * Math.PI * pr}
        {@const dashOff     = circ - (act.progress / 100) * circ}

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
            <radialGradient id="dg{j}" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color={colors.g1} />
              <stop offset="100%" stop-color={colors.g2} />
            </radialGradient>
          </defs>

          <!-- Outer ambient ring (active) -->
          {#if isActive}
            <circle class:heartbeat={isInProgress}
                    cx="0" cy={dcy} r={DOT_R + 3}
                    fill="none" stroke={colors.glow} stroke-width="0.8" stroke-opacity="0.25" />
          {/if}

          <!-- Main sphere -->
          <circle class:heartbeat={isInProgress}
                  cx="0" cy={dcy} r={DOT_R}
                  fill="url(#dg{j})" />

          <!-- Progress ring (active) -->
          {#if isActive}
            <circle cx="0" cy={dcy} r={pr}
                    fill="none" stroke={t.progressRingBg} stroke-width={DOT_SW} />
            <circle cx="0" cy={dcy} r={pr}
                    fill="none" stroke={colors.ring} stroke-width={DOT_SW}
                    stroke-dasharray={circ} stroke-dashoffset={dashOff}
                    stroke-linecap="round"
                    transform="rotate(-90, 0, {dcy})"
                    class="progress-ring" />
          {/if}

          <!-- Locked: outer border ring + lock icon -->
          {#if !isActive}
            <circle cx="0" cy={dcy} r={DOT_R + 2}
                    fill="none" stroke={colors.ring} stroke-width="1.2" stroke-opacity="0.6" />
            <svg x="-5" y={dcy - 6} width="10" height="12" viewBox="0 0 24 24"
                 fill="none" stroke={colors.icon} stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          {/if}

          <!-- Label -->
          <text x="0" y={textCY(d.a)} text-anchor="middle" dominant-baseline="middle"
            class="chip-lbl" fill={isActive ? '#e2e8f0' : '#64748b'}>
            {act.label}
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
  .chip-locked { fill-opacity: 0.35; stroke-opacity: 0.35; }

  .chip-active:hover text { fill-opacity: 0.8; }

  .progress-ring { transition: stroke-dashoffset 1s ease; }

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

  .chip-lbl { font: 500 12px/1 'Rubik', system-ui, sans-serif; pointer-events: none; }
</style>
