<script lang="ts">
  import type { ProgramData } from '../lib/types';

  interface Props {
    program: ProgramData;
  }

  let { program }: Props = $props();

  // Same effective-status logic as TreeNavigator — a unit is 'completed'
  // as soon as DemoDay is done (Continuar is optional).
  function effectiveStatus(unit: typeof program.units[0]): 'completed' | 'in-progress' | 'locked' {
    if (unit.status === 'locked' || unit.status === 'completed') return unit.status;
    const all = unit.activities ?? [];
    if (all.length === 0) return unit.status;
    const demoDayIdx = all.findIndex(a => a.label === 'DemoDay');
    const threshold = demoDayIdx >= 0 ? ((demoDayIdx + 1) / all.length) * 100 : 100;
    return unit.progress >= threshold ? 'completed' : 'in-progress';
  }

  // Only units U1–U6 have badge files (C450_U1.png … C450_U6.png).
  // displayName must match /^U[1-9]/ to qualify.
  const badgeUnits = $derived(
    program.units
      .filter(u => /^U[1-9]\d*$/.test(u.displayName))
      .sort((a, b) => parseInt(a.displayName.slice(1)) - parseInt(b.displayName.slice(1)))
      .map(u => ({
        unit: u,
        earned: effectiveStatus(u) === 'completed' && (u.grade ?? 0) >= 6,
        src: `${import.meta.env.BASE_URL}badges/${program.shortname}_${u.displayName}.png`,
      }))
  );
</script>

<div class="badge-panel" aria-label="Badges obtenidos">
  {#each badgeUnits as item (item.unit.id)}
    <div
      class="badge-slot"
      class:earned={item.earned}
      title={item.earned ? `${item.unit.label} — Badge obtenido` : `${item.unit.label} — Sin obtener`}
    >
      <img src={item.src} alt="Badge {item.unit.displayName}" class="badge-img" />
      {#if !item.earned}
        <div class="badge-lock">
          <!-- Lock icon SVG -->
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="lock-icon">
            <rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(0,10,30,0.72)" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="12" cy="16" r="1.5" fill="rgba(255,255,255,0.55)"/>
          </svg>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .badge-panel {
    position: fixed;
    right: 14px;
    top: calc(61px + (100vh - 61px) / 2);
    transform: translateY(-50%);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    z-index: 60;
    pointer-events: none;
  }

  .badge-slot {
    position: relative;
    width: 68px;
    height: 68px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Earned: full colour + glow + pop animation */
  .badge-slot.earned {
    filter: drop-shadow(0 0 8px rgba(57, 255, 20, 0.55))
            drop-shadow(0 0 18px rgba(57, 255, 20, 0.25));
    animation: badge-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes badge-pop {
    from { transform: scale(0.4); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  .badge-img {
    width: 68px;
    height: 68px;
    object-fit: contain;
    border-radius: 50%;
    display: block;
    /* Locked state: greyscale + dark overlay via sibling .badge-lock */
  }

  /* Dim + greyscale the image when not yet earned */
  .badge-slot:not(.earned) .badge-img {
    filter: grayscale(1) brightness(0.35);
  }

  /* Lock overlay */
  .badge-lock {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lock-icon {
    width: 28px;
    height: 28px;
  }

  /* Landscape phones — tighter layout */
  @media (max-height: 500px) {
    .badge-panel {
      right: 6px;
      gap: 5px;
      top: calc(36px + (100vh - 36px) / 2);
    }
    .badge-slot,
    .badge-img {
      width: 44px;
      height: 44px;
    }
    .lock-icon {
      width: 18px;
      height: 18px;
    }
  }
</style>
