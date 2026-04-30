<script lang="ts">
  import type { ProgramData } from '../lib/types';
  import { badgeUrl, hasBadge, isBadgeEarned } from '../lib/badges';
  import { getEmulatedProgram } from '../lib/emulator.svelte';
  import { t } from '../lib/i18n';

  interface Props {
    program: ProgramData;
  }

  let { program }: Props = $props();

  const badgeUnits = $derived.by(() => {
    const prog = getEmulatedProgram() ?? program;
    return prog.units
      .filter(u => hasBadge(u.displayName))
      .sort((a, b) => parseInt(a.displayName.slice(1)) - parseInt(b.displayName.slice(1)))
      .map(u => ({
        unit: u,
        earned: isBadgeEarned(u),
        src: badgeUrl(prog.shortname, u.displayName),
      }));
  });

  const earnedCount = $derived(badgeUnits.filter(b => b.earned).length);

  let collapsed = $state(false);
</script>

<div class="badge-panel" class:collapsed aria-label={t('badgesPanelAriaLabel')}>

  <!-- Handle: organic left edge of the panel, always peeking out -->
  <button
    class="panel-handle"
    onclick={() => collapsed = !collapsed}
    aria-expanded={!collapsed}
    aria-label={t('badgesPanelAriaLabel')}
  >
    <svg class="handle-chevron" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polyline points="6,4 10,8 6,12" stroke="rgba(120,180,255,0.7)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="handle-title">{t('badgesPanelTitle')}</span>
  </button>

  <!-- Content: the badge showcase -->
  <div class="panel-content">

    <!-- Corner bracket accents -->
    <span class="bracket tl"></span>
    <span class="bracket tr"></span>
    <span class="bracket bl"></span>
    <span class="bracket br"></span>

    <!-- Scan line sweep -->
    <div class="scanline" aria-hidden="true"></div>

    <!-- Badge grid -->
    <div class="badge-grid">
      {#each badgeUnits as item (item.unit.id)}
        <div class="badge-cell" title={item.earned ? `${item.unit.label} — ${t('badgeEarnedSuffix')}` : `${item.unit.label} — ${t('badgeLockedSuffix')}`}>
          <div class="badge-slot" class:earned={item.earned}>
            {#if item.earned}
              <img src={item.src} alt="{t('badgesPanelLabel')} {item.unit.displayName}" class="badge-img" />
            {:else}
              <img src={item.src} alt="" class="badge-img badge-silhouette" aria-hidden="true" />
              <div class="badge-lock">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="lock-icon"
                   stroke="rgba(255,255,255,0.7)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            {/if}
          </div>
          <span class="unit-label">{item.unit.displayName}</span>
        </div>
      {/each}
    </div>

  </div>
</div>

<style>
  /* ── Panel: the whole unit slides as one piece ─── */
  .badge-panel {
    position: fixed;
    right: 0;
    top: 50%;
    /* flex row: [handle | content] */
    display: flex;
    flex-direction: row;
    align-items: stretch;

    /* Expanded: fully visible */
    transform: translateY(-50%) translateX(0);
    transition: transform 0.38s cubic-bezier(0.4, 0, 0.2, 1);

    z-index: 60;
    pointer-events: none;

    background: linear-gradient(160deg, rgba(0,12,34,0.97) 0%, rgba(0,22,56,0.94) 100%);
    border: 1px solid rgba(70,150,255,0.28);
    border-right: none;
    border-radius: 12px 0 0 12px;

    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.05),
      inset 0 -1px 0 rgba(0,0,0,0.4),
      0 8px 40px rgba(0,0,0,0.7),
      0 0 28px rgba(40,100,220,0.12);

    overflow: hidden;
  }

  /* Collapsed: only the handle (32px) remains visible at screen edge */
  .badge-panel.collapsed {
    transform: translateY(-50%) translateX(258px);
  }

  /* ── Handle: the organic "ear" of the panel ──── */
  .panel-handle {
    width: 32px;
    flex-shrink: 0;
    align-self: stretch;

    /* Landscape: chevron on top, title below (both centered in the narrow strip) */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;

    background: transparent;
    border: none;
    border-right: 1px solid rgba(70,140,255,0.15);
    border-radius: 0; /* inherits from parent panel */
    cursor: pointer;
    pointer-events: auto;

    transition: background 0.2s ease;
  }

  .panel-handle:hover {
    background: rgba(80,140,255,0.07);
  }

  .handle-chevron {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    /* Default: > (right-pointing) — panel is open, click to close */
    transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Collapsed: rotate 180° → < (left-pointing, click to open) */
  .badge-panel.collapsed .handle-chevron {
    transform: rotate(180deg);
  }

  /* Landscape: title rotated vertically, reads upward */
  .handle-title {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-family: 'Rubik', system-ui, -apple-system, sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: rgba(110,180,255,0.75);
    text-shadow: 0 0 8px rgba(80,160,255,0.4);
    user-select: none;
    white-space: nowrap;
  }

  /* ── Panel content ────────────────────────────── */
  .panel-content {
    flex: 1;
    min-width: 0;
    position: relative;
    padding: 14px 14px 14px 10px;
    overflow: hidden;
    pointer-events: none;
  }

  /* ── Corner brackets ──────────────────────────── */
  .bracket {
    position: absolute;
    width: 10px;
    height: 10px;
    border-color: rgba(80,160,255,0.45);
    border-style: solid;
    pointer-events: none;
  }
  .bracket.tl { top: 5px; left: 5px;  border-width: 1.5px 0 0 1.5px; border-radius: 2px 0 0 0; }
  .bracket.tr { top: 5px; right: 5px; border-width: 1.5px 1.5px 0 0; border-radius: 0 2px 0 0; }
  .bracket.bl { bottom: 5px; left: 5px;  border-width: 0 0 1.5px 1.5px; border-radius: 0 0 0 2px; }
  .bracket.br { bottom: 5px; right: 5px; border-width: 0 1.5px 1.5px 0; border-radius: 0 0 2px 0; }

  /* ── Scan line ────────────────────────────────── */
  .scanline {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(80,160,255,0.04) 45%,
      rgba(80,160,255,0.07) 50%,
      rgba(80,160,255,0.04) 55%,
      transparent 100%
    );
    background-size: 100% 200%;
    animation: scanline-sweep 6s linear infinite;
    z-index: 1;
  }

  @keyframes scanline-sweep {
    0%   { background-position: 0% -100%; }
    100% { background-position: 0% 200%; }
  }

  /* ── Badge grid ───────────────────────────────── */
  .badge-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    position: relative;
    z-index: 2;
  }

  .badge-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .badge-slot {
    position: relative;
    width: 110px;
    height: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .badge-slot:not(.earned) {
    filter: drop-shadow(0 3px 8px rgba(60, 80, 200, 0.45))
            drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6));
  }

  .badge-slot.earned {
    filter: drop-shadow(0 0 7px rgba(57,255,20,0.6))
            drop-shadow(0 0 20px rgba(57,255,20,0.22));
    animation: badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes badge-pop {
    from { transform: scale(0.35); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  .badge-img {
    width: 110px;
    height: 110px;
    object-fit: contain;
    display: block;
    position: relative;
    z-index: 1;
  }

  .badge-silhouette {
    filter: grayscale(100%) sepia(1) hue-rotate(195deg) saturate(2.5) brightness(0.38) contrast(0.2);
    opacity: 0.7;
    animation: badge-shimmer 4s ease-in-out infinite;
  }

  @keyframes badge-shimmer {
    0%,  100% { opacity: 0.7; filter: grayscale(100%) sepia(1) hue-rotate(195deg) saturate(2.5) brightness(0.38) contrast(0.2); }
    50%        { opacity: 0.55; filter: grayscale(100%) sepia(1) hue-rotate(210deg) saturate(2) brightness(0.30) contrast(0.2); }
  }

  .unit-label {
    font-family: 'Rubik', system-ui, -apple-system, sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: rgba(100,155,230,0.6);
    text-align: center;
    line-height: 1;
    user-select: none;
  }

  .badge-slot.earned + .unit-label,
  .badge-cell:has(.earned) .unit-label {
    color: rgba(130,220,110,0.75);
    text-shadow: 0 0 6px rgba(57,255,20,0.3);
  }

  .badge-lock {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  .lock-icon {
    width: 30px;
    height: 30px;
  }

  /* ── Landscape phones ─────────────────────────── */
  @media (max-height: 500px) and (orientation: landscape) {
    .badge-panel.collapsed { transform: translateY(-50%) translateX(192px); }
    .panel-content { padding: 9px 9px 9px 8px; }
    .badge-slot, .badge-img { width: 78px; height: 78px; }
    .badge-grid { gap: 8px; }
    .lock-icon { width: 22px; height: 22px; }
    .unit-label { font-size: 8px; }
  }

  /* ── Portrait (phones + tablets): panel slides up from bottom center ── */
  @media (orientation: portrait) {
    .badge-panel {
      right: auto;
      top: auto;
      bottom: 0;
      left: 50%;
      /* Expanded: centered horizontally, flush with bottom */
      transform: translateX(-50%) translateY(0);
      /* Vertical stacking: handle on top, content below */
      flex-direction: column;
      border-radius: 12px 12px 0 0;
      border-right: 1px solid rgba(70,150,255,0.28);
      border-bottom: none;
    }

    /* Collapsed: slide down until only the 36px handle peeks at the bottom */
    .badge-panel.collapsed {
      transform: translateX(-50%) translateY(calc(100% - 36px));
    }

    /* Handle becomes a horizontal bar at the top of the panel */
    .panel-handle {
      width: 100%;
      height: 36px;
      align-self: stretch;
      /* Portrait: chevron left, title right */
      flex-direction: row;
      gap: 10px;
      border-right: none;
      border-bottom: 1px solid rgba(70,140,255,0.15);
    }

    /* Expanded: chevron ↓ = "click to collapse downward" */
    .handle-chevron {
      transform: rotate(90deg);
    }

    /* Collapsed: chevron ↑ = "click to expand upward" */
    .badge-panel.collapsed .handle-chevron {
      transform: rotate(-90deg);
    }

    /* Portrait: title reads horizontally */
    .handle-title {
      writing-mode: horizontal-tb;
      transform: none;
      font-size: 11px;
      letter-spacing: 0.15em;
    }
  }

  /* ── Portrait phones ──────────────────────────── */
  @media (max-width: 600px) and (orientation: portrait) {
    .badge-panel { width: 220px; }
    .panel-content { padding: 10px; }
    .badge-slot, .badge-img { width: 88px; height: 88px; }
    .badge-grid { gap: 10px; }
  }

  /* ── Portrait tablets (iPad, Android) ────────── */
  @media (min-width: 601px) and (orientation: portrait) {
    .badge-panel { width: auto; max-width: calc(100vw - 32px); }
    .panel-content { padding: 12px 16px; }
    /* Badges in a single horizontal row */
    .badge-grid {
      grid-template-columns: unset;
      grid-auto-flow: column;
      grid-auto-columns: auto;
      gap: 12px;
    }
    .badge-slot, .badge-img { width: 90px; height: 90px; }
  }
</style>
