<script lang="ts">
  import type { ProgramData } from '../lib/types';
  import { badgeUrl, badgeBlockedUrl, hasBadge, isBadgeEarned } from '../lib/badges';
  import { t } from '../lib/i18n';
  import { getConfigByShortname } from '../lib/program-config';

  interface Props {
    program: ProgramData;
  }

  let { program }: Props = $props();

  const bgImage = $derived(getConfigByShortname(program.shortname)?.bgImage ?? 'background_light.png');

  const badgeUnits = $derived.by(() => {
    const sorted = program.units
      .filter(u => hasBadge(u.displayName))
      .sort((a, b) => parseInt(a.displayName.slice(1)) - parseInt(b.displayName.slice(1)));
    return sorted.map(u => ({
      // Badge 'UN' is earned when unit UN itself is completed (2026-07-10 feedback) — used to
      // be tied to the PREVIOUS unit, one step behind the badge label, which unlocked the
      // badge while the unit it's named after was still in-progress.
      unit: u,
      earned: isBadgeEarned(u),
      src: badgeUrl(program.shortname, u.displayName),
    }));
  });

  type BadgeItem = (typeof badgeUnits)[number];
  let selectedBadge = $state<BadgeItem | null>(null);
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') selectedBadge = null; }} />

<!-- Badges float directly over the background, no panel/container (2026-07-10 feedback). -->
<div class="badge-float" aria-label={t('badgesPanelAriaLabel')}>
  <div class="badge-grid">
    {#each badgeUnits as item (item.unit.id)}
      <div class="badge-cell" title={item.earned ? `${item.unit.label} — ${t('badgeEarnedSuffix')}` : `${item.unit.label} — ${t('badgeLockedSuffix')}`}>
        {#if item.earned}
          <button
            class="badge-slot earned"
            onclick={() => selectedBadge = item}
            aria-label="{item.unit.label} — {t('badgeEarnedSuffix')}"
          >
            <img src={item.src} alt="{t('badgesPanelLabel')} {item.unit.displayName}" class="badge-img" />
          </button>
        {:else}
          <div class="badge-slot">
            <!-- Blocked badge: shows the dedicated "blocked" artwork (configurable via
                 master-config.ts → BADGES.blockedImageUrl) instead of a greyed-out treatment
                 of the earned badge image. -->
            <img src={badgeBlockedUrl()} alt="{t('badgesPanelLabel')} {item.unit.displayName} — {t('badgeLockedSuffix')}" class="badge-img" />
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<!-- ── Badge modal: shown when an earned badge is clicked ── -->
{#if selectedBadge}
  <div
    class="modal-backdrop"
    style:background-image={`url('${import.meta.env.BASE_URL}${bgImage}')`}
    role="button"
    tabindex="-1"
    aria-label="Cerrar"
    onclick={(e) => { if (e.target === e.currentTarget) selectedBadge = null; }}
    onkeydown={(e) => { if (e.key === 'Escape') selectedBadge = null; }}
  >
    <div class="modal-card" role="dialog" aria-modal="true" tabindex="-1">

      <!-- Corner brackets -->
      <span class="modal-bracket tl"></span>
      <span class="modal-bracket tr"></span>
      <span class="modal-bracket bl"></span>
      <span class="modal-bracket br"></span>

      <!-- Close button: floats outside the card (top-right) -->
      <button class="modal-close" onclick={() => selectedBadge = null} aria-label="Cerrar">
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- Badge image -->
      <div class="modal-badge-wrap">
        <img
          src={selectedBadge.src}
          alt="{t('badgesPanelLabel')} {selectedBadge.unit.displayName}"
          class="modal-badge-img"
        />
      </div>

      <!-- Unit code -->
      <p class="modal-unit-code">{selectedBadge.unit.displayName}</p>


    </div>
  </div>
{/if}

<style>
  /* ── Floating badge stack — no background, no border, no box: just the badges (each
       already carries its own glow via drop-shadow) floating over the page background. ── */
  .badge-float {
    position: fixed;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 60;
    pointer-events: none;
    /* The whole 6-badge column should fill 90% of the viewport height. Column height =
       6×badge-size + 5×8px grid gaps = 90vh, so badge-size = (90vh − 40px) / 6. Gap tightened
       from 14px to 8px (2026-07-10 feedback: make badges a bit bigger without exceeding the
       90% column limit — shrinking the gaps reallocates that space to the badges themselves,
       total column height unchanged). Loose upper clamp (250px) so it keeps scaling up on
       large screens instead of capping out. */
    --badge-size: clamp(40px, calc((90vh - 40px) / 6), 250px);
  }

  /* ── Visual viewport sync (Chrome iOS, Safari iOS) ────────────────────
     --vvh is set by App.svelte's visualViewport listener. */
  @supports (height: 100dvh) {
    .badge-float {
      --badge-size: clamp(40px, calc((var(--vvh, 100dvh) * 0.9 - 40px) / 6), 250px);
    }
  }

  .badge-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .badge-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .badge-slot {
    position: relative;
    width: var(--badge-size);
    height: var(--badge-size);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .badge-slot.earned {
    filter: drop-shadow(0 0 7px rgba(0,117,191,0.6))
            drop-shadow(0 0 20px rgba(0,117,191,0.22));
    animation: badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    pointer-events: auto;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    /* Reset <button> browser defaults */
    background: none;
    border: none;
    padding: 0;
  }

  @media (hover: hover) {
    .badge-slot.earned:hover .badge-img {
      transform: scale(1.08);
      transition: transform 0.18s ease;
    }
  }

  @keyframes badge-pop {
    from { transform: scale(0.35); }
    to   { transform: scale(1); }
  }

  .badge-img {
    width: var(--badge-size);
    height: var(--badge-size);
    object-fit: contain;
    display: block;
    position: relative;
    z-index: 1;
  }

  /* ── Portrait: single row of 6 badges, centred above the bottom edge
       (2026-07-17 feedback: functional portrait layout instead of a rotate-lock). ── */
  @media (orientation: portrait) {
    .badge-float {
      right: auto;
      top: auto;
      /* Sits above the (now half-size, ~36px) zoom-controls row at the true bottom edge
         (2026-07-17 feedback). */
      bottom: 64px;
      left: 50%;
      transform: translateX(-50%);
      max-width: calc(100vw - 24px);
      /* Row width budget mirrors the landscape column's 90%-of-viewport target, just
         along the other axis: 6×badge-size + 5×8px gaps = 90vw. */
      --badge-size: clamp(28px, calc((90vw - 40px) / 6), 120px);
    }
    .badge-grid {
      flex-direction: row;
      flex-wrap: nowrap;
      justify-content: center;
      gap: 8px;
    }
  }

  /* ── Landscape phones ─────────────────────────── */
  @media (max-height: 500px) and (orientation: landscape) {
    .badge-float {
      right: 8px;
      /* Same 90%-of-viewport column target as the main rule, tighter gaps (5×6px = 30px). */
      --badge-size: clamp(28px, calc((90vh - 30px) / 6), 140px);
    }
    .badge-grid { gap: 6px; }
  }

  @supports (height: 100dvh) {
    @media (max-height: 500px) and (orientation: landscape) {
      .badge-float {
        --badge-size: clamp(28px, calc((var(--vvh, 100dvh) * 0.9 - 30px) / 6), 140px);
      }
    }
  }

  /* ── Badge modal ──────────────────────────────── */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    /* background-image set via inline style (BASE_URL + config.bgImage + dark overlay) */
    background-size: cover;
    background-position: bottom center;
    background-repeat: no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: backdrop-in 0.22s ease both;
  }

  @keyframes backdrop-in {
    from { transform: scale(1.04); }
    to   { transform: scale(1); }
  }

  .modal-card {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 52px 52px 44px;

    background: linear-gradient(160deg, rgba(0,12,34,0.98) 0%, rgba(0,22,60,0.96) 100%);
    border: 1px solid rgba(70,150,255,0.35);
    border-radius: 16px;

    box-shadow:
      0 0 0 1px rgba(0,0,0,0.9),
      inset 0 1px 0 rgba(255,255,255,0.06),
      0 24px 80px rgba(0,0,0,0.8),
      0 0 60px rgba(40,100,220,0.18);

    animation: card-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: 0.05s;
  }

  @keyframes card-in {
    from { transform: scale(0.55); }
    to   { transform: scale(1); }
  }

  /* Corner brackets */
  .modal-bracket {
    position: absolute;
    width: 16px;
    height: 16px;
    border-color: rgba(80,160,255,0.5);
    border-style: solid;
    pointer-events: none;
  }
  .modal-bracket.tl { top: 8px;  left: 8px;  border-width: 2px 0 0 2px; border-radius: 3px 0 0 0; }
  .modal-bracket.tr { top: 8px;  right: 8px; border-width: 2px 2px 0 0; border-radius: 0 3px 0 0; }
  .modal-bracket.bl { bottom: 8px; left: 8px;  border-width: 0 0 2px 2px; border-radius: 0 0 0 3px; }
  .modal-bracket.br { bottom: 8px; right: 8px; border-width: 0 2px 2px 0; border-radius: 0 0 3px 0; }

  /* Close button: floats outside the top-right corner of the card */
  .modal-close {
    position: absolute;
    top: -52px;
    right: -8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 20, 55, 0.95);
    border: 1px solid rgba(80,140,255,0.35);
    border-radius: 50%;
    color: rgba(140,185,255,0.8);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 0 14px rgba(40,90,220,0.3);
    transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  }

  @media (hover: hover) {
    .modal-close:hover {
      background: rgba(30, 50, 120, 0.98);
      color: rgba(200,220,255,1);
      box-shadow: 0 0 20px rgba(80,140,255,0.5);
    }
  }

  .modal-close svg {
    width: 14px;
    height: 14px;
  }

  /* Unit code badge (e.g. "U1") */
  /* Same pill style as .unit-chip (the badge overlay) — chalk-white background, navy text
     (2026-07-10 feedback). */
  .modal-unit-code {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Rubik', system-ui, -apple-system, sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #0F3A4E;
    background: #F4F2EC;
    text-transform: uppercase;
    padding: 6px 18px;
    border-radius: 999px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.45);
    margin-top: 16px;
  }

  /* Badge image */
  .modal-badge-wrap {
    filter: drop-shadow(0 0 18px rgba(0,117,191,0.55))
            drop-shadow(0 0 50px rgba(0,117,191,0.2));
  }

  .modal-badge-img {
    width: 320px;
    height: 320px;
    object-fit: contain;
    display: block;
  }

  /* Smaller image on landscape phones */
  @media (max-height: 500px) {
    .modal-badge-img { width: 160px; height: 160px; }
    .modal-card { padding: 28px 24px 22px; gap: 10px; }
  }
</style>
