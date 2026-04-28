<script lang="ts">
  import type { ProgramData } from '../lib/types';
  import { badgeUrl, hasBadge, isBadgeEarned } from '../lib/badges';
  import { getEmulatedProgram } from '../lib/emulator.svelte';

  interface Props {
    program: ProgramData;
  }

  let { program }: Props = $props();

  // $derived.by() reads snapshot directly from the emulator, establishing a
  // reactive dependency on it. This avoids relying solely on prop propagation
  // (which can silently drop updates in Svelte 5 when the value comes from an
  // external $state via a function call).
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
</script>

<div class="badge-panel" aria-label="Panel de insignias">

  <!-- Corner bracket accents -->
  <span class="bracket tl"></span>
  <span class="bracket tr"></span>
  <span class="bracket bl"></span>
  <span class="bracket br"></span>

  <!-- Scan line sweep -->
  <div class="scanline" aria-hidden="true"></div>

  <!-- Header -->
  <header class="panel-header">
    <svg class="header-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="8,1 10.5,6 16,6.9 12,10.8 12.9,16 8,13.4 3.1,16 4,10.8 0,6.9 5.5,6" fill="rgba(80,180,255,0.7)" stroke="rgba(80,180,255,0.4)" stroke-width="0.5"/>
    </svg>
    <span class="panel-label">INSIGNIAS</span>
    <svg class="header-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="8,1 10.5,6 16,6.9 12,10.8 12.9,16 8,13.4 3.1,16 4,10.8 0,6.9 5.5,6" fill="rgba(80,180,255,0.7)" stroke="rgba(80,180,255,0.4)" stroke-width="0.5"/>
    </svg>
  </header>

  <!-- Badge grid -->
  <div class="badge-grid">
    {#each badgeUnits as item (item.unit.id)}
      <div class="badge-cell" title={item.earned ? `${item.unit.label} — Insignia obtenida` : `${item.unit.label} — Sin obtener`}>
        <div class="badge-slot" class:earned={item.earned}>
          {#if item.earned}
            <img src={item.src} alt="Insignia {item.unit.displayName}" class="badge-img" />
          {:else}
            <!-- Silhouette: same image, greyscale darkened -->
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

  <!-- Footer counter -->
  <footer class="panel-footer">
    <span class="counter">{earnedCount}<span class="counter-sep">/</span>{badgeUnits.length}</span>
    <span class="counter-label">OBTENIDAS</span>
  </footer>

</div>

<style>
  /* ── Panel container ──────────────────────────────── */
  .badge-panel {
    position: fixed;
    right: 16px;
    top: calc(61px + (100vh - 61px) / 2);
    transform: translateY(-50%);
    z-index: 60;
    pointer-events: none;

    width: 258px;
    padding: 14px 14px 12px;

    background:
      linear-gradient(160deg, rgba(0,12,34,0.97) 0%, rgba(0,22,56,0.94) 100%);

    border: 1px solid rgba(70,150,255,0.28);
    border-radius: 10px;

    box-shadow:
      0 0 0 1px rgba(0,0,0,0.9),
      inset 0 1px 0 rgba(255,255,255,0.05),
      inset 0 -1px 0 rgba(0,0,0,0.4),
      0 8px 40px rgba(0,0,0,0.7),
      0 0 28px rgba(40,100,220,0.12);

    overflow: hidden;
  }

  /* ── Corner bracket accents ───────────────────────── */
  .bracket {
    position: absolute;
    width: 12px;
    height: 12px;
    border-color: rgba(80,160,255,0.55);
    border-style: solid;
    pointer-events: none;
  }
  .bracket.tl { top: 5px; left: 5px;  border-width: 1.5px 0 0 1.5px; border-radius: 2px 0 0 0; }
  .bracket.tr { top: 5px; right: 5px; border-width: 1.5px 1.5px 0 0; border-radius: 0 2px 0 0; }
  .bracket.bl { bottom: 5px; left: 5px;  border-width: 0 0 1.5px 1.5px; border-radius: 0 0 0 2px; }
  .bracket.br { bottom: 5px; right: 5px; border-width: 0 1.5px 1.5px 0; border-radius: 0 0 2px 0; }

  /* ── Scan line sweep ──────────────────────────────── */
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

  /* ── Header ───────────────────────────────────────── */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-bottom: 12px;
    padding-bottom: 9px;
    border-bottom: 1px solid rgba(70,140,255,0.18);
    position: relative;
    z-index: 2;
  }

  .panel-label {
    font-family: 'Rubik', system-ui, -apple-system, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    color: rgba(110,180,255,0.8);
    text-shadow: 0 0 8px rgba(80,160,255,0.5);
  }

  .header-icon {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
  }

  /* ── Badge grid ───────────────────────────────────── */
  .badge-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    position: relative;
    z-index: 2;
  }

  /* ── Badge cell (circle + label) ─────────────────── */
  .badge-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  /* ── Badge slot (the circle) ──────────────────────── */
  .badge-slot {
    position: relative;
    width: 110px;
    height: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Blocked: subtle indigo drop-shadow following the shield shape */
  .badge-slot:not(.earned) {
    filter: drop-shadow(0 3px 8px rgba(60, 80, 200, 0.45))
            drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6));
  }

  /* Earned: colour + glow + pop-in */
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

  /* Locked silhouette — blue-indigo tinted flat shape, no internal detail */
  .badge-silhouette {
    filter: grayscale(100%) sepia(1) hue-rotate(195deg) saturate(2.5) brightness(0.38) contrast(0.2);
    opacity: 0.7;
    animation: badge-shimmer 4s ease-in-out infinite;
  }

  @keyframes badge-shimmer {
    0%,  100% { opacity: 0.7; filter: grayscale(100%) sepia(1) hue-rotate(195deg) saturate(2.5) brightness(0.38) contrast(0.2); }
    50%        { opacity: 0.55; filter: grayscale(100%) sepia(1) hue-rotate(210deg) saturate(2) brightness(0.30) contrast(0.2); }
  }

  /* Unit label */
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

  /* Lock overlay */
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

  /* ── Footer counter ───────────────────────────────── */
  .panel-footer {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 10px;
    margin-top: 11px;
    padding-top: 9px;
    border-top: 1px solid rgba(70,140,255,0.18);
    position: relative;
    z-index: 2;
  }

  .counter {
    font-family: 'Rubik', system-ui, -apple-system, sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: rgba(140,200,255,0.9);
    text-shadow: 0 0 10px rgba(80,160,255,0.6);
    line-height: 1;
  }

  .counter-sep {
    color: rgba(80,140,220,0.55);
    margin: 0 1px;
  }

  .counter-label {
    font-family: 'Rubik', system-ui, -apple-system, sans-serif;
    font-size: 8px;
    letter-spacing: 0.18em;
    color: rgba(80,140,220,0.6);
    line-height: 1;
  }

  /* ── Tablets en landscape: sube 5 % para evitar que la barra nativa de Android lo tape */
  @media (min-width: 601px) and (min-height: 501px) and (orientation: landscape) {
    .badge-panel {
      top: calc(61px + (100vh - 61px) / 2 - 5vh);
    }
  }

  /* ── Landscape phones ─────────────────────────────── */
  @media (max-height: 500px) {
    .badge-panel {
      right: 8px;
      width: 192px;
      padding: 9px 9px 8px;
      top: calc(36px + (100vh - 36px) / 2);
    }
    .badge-slot,
    .badge-img {
      width: 78px;
      height: 78px;
    }
    .badge-grid { gap: 8px; }
    .lock-icon  { width: 22px; height: 22px; }
    .panel-label { font-size: 8px; }
    .counter { font-size: 13px; }
    .unit-label { font-size: 8px; }
  }

  /* ── Portrait phones ──────────────────────────────── */
  @media (max-width: 600px) and (orientation: portrait) {
    .badge-panel {
      right: 8px;
      width: 216px;
      padding: 10px 10px 9px;
      top: calc(40px + (100vh - 40px) / 2);
    }
    .badge-slot,
    .badge-img {
      width: 88px;
      height: 88px;
    }
    .badge-grid { gap: 10px; }
  }

  /* ── Tablets / iPads en portrait ─────────────────── */
  @media (min-width: 601px) and (orientation: portrait) {
    .badge-panel {
      top: auto;
      right: auto;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);

      width: auto;
      max-width: calc(100vw - 32px);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
    }

    /* Header encima de los badges, con separador inferior */
    .panel-header {
      margin-bottom: 0;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(70,140,255,0.18);
      align-self: stretch;
    }

    /* Grid: fila única horizontal */
    .badge-grid {
      grid-template-columns: unset;
      grid-auto-flow: column;
      grid-auto-columns: auto;
      gap: 10px;
    }

    .badge-slot,
    .badge-img {
      width: 82px;
      height: 82px;
    }

    /* Footer debajo de los badges, con separador superior */
    .panel-footer {
      margin-top: 0;
      padding-top: 8px;
      border-top: 1px solid rgba(70,140,255,0.18);
      align-self: stretch;
    }
  }
</style>
