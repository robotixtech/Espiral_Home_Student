<script lang="ts">
  import { onMount } from 'svelte';
  import type { AppState, ProgramUnit, Activity } from './lib/types';
  import { getIframeConfig } from './lib/token';
  import { loadProgramFromMoodle } from './lib/program-loader';
  import { MOCK_PROGRAM } from './lib/mock-data';
  import { getTheme } from './lib/theme.svelte';
  import { getConfigByShortname } from './lib/program-config';
  import { isIOSDevice } from './lib/device';
  import TreeNavigator from './components/TreeNavigator.svelte';
  import UnitDetailView from './components/UnitDetailView.svelte';
  import ActivitySlideView from './components/ActivitySlideView.svelte';
  import BadgePanel from './components/BadgePanel.svelte';

  // Navigation state — owned here, passed down as callback props
  let currentView: 'home' | 'unit-detail' | 'activity-slide' = $state('home');
  let selectedUnit: ProgramUnit | null = $state(null);
  let selectedActivity: Activity | null = $state(null);

  let appState = $state<AppState>({ kind: 'loading' });

  const theme = $derived(getTheme());

  const homeProgram = $derived(appState.kind === 'ready' ? appState.data : null);

  const bgImage = $derived(
    appState.kind === 'ready'
      ? (getConfigByShortname(appState.data.shortname)?.bgImage ?? 'background_lola.png')
      : 'background_lola.png'
  );

  // Reactively update body background when theme changes
  $effect(() => {
    const s = document.body.style;
    const h = theme.body.slice(1);
    const [br, bg, bb] = [0,2,4].map(i => parseInt(h.slice(i,i+2),16));
    s.backgroundColor = `rgba(${br},${bg},${bb},0.8)`;
    s.color = theme.text.primary;
  });

  // ── Visual Viewport sync ──────────────────────────────────────────────────
  // Chrome on iOS keeps position:fixed relative to the LAYOUT viewport, not the
  // visual viewport.  When the browser applies any page zoom the layout viewport
  // and the visible area diverge, so .app-root drifts off-screen.
  // We compensate by pinning .app-root exactly to the visual viewport dimensions
  // using the VisualViewport API (available Chrome 61+, Safari 13+).
  let appEl: HTMLElement | undefined = $state();

  onMount(() => {
    // Android detection — robust against Chrome "Request Desktop Site" which
    // rewrites both the UA string and userAgentData to look like a desktop.
    // maxTouchPoints > 0 is hardware-reported and cannot be spoofed.
    // Excludes: iOS (Apple vendor), ChromeOS (CrOS in UA), true desktops (no touch).
    const isIOS = isIOSDevice();
    const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
    const uaPlatform = (uaData?.platform ?? '').toLowerCase();
    const isAndroidDevice = !isIOS && (
      /Android/i.test(navigator.userAgent) ||
      uaPlatform === 'android' ||
      (!(/CrOS/.test(navigator.userAgent)) && navigator.maxTouchPoints > 0 && /Chrome\//.test(navigator.userAgent))
    );
    if (isAndroidDevice) {
      document.documentElement.classList.add('android');
    }
    if (isIOS) {
      document.documentElement.classList.add('ios');
    }

    const vvp = window.visualViewport;

    // This sync is only needed on iOS Chrome where position:fixed is anchored to
    // the layout viewport (not the visual viewport), causing zoom-drift.
    // On Android, position:fixed already tracks the visual viewport correctly —
    // applying the sync there causes the flickering/moiré by forcing continuous
    // app-root resizes as the Android address bar animates in/out.
    if (!isIOS || !vvp) return;
    // Re-bind to a variable with an explicit non-null type: TS does not retain the
    // above null-check's narrowing of `vvp` inside the nested functions below.
    const viewport: VisualViewport = vvp;

    function syncToVisualViewport() {
      if (!appEl) return;
      appEl.style.left   = `${viewport.offsetLeft}px`;
      appEl.style.top    = `${viewport.offsetTop}px`;
      appEl.style.width  = `${viewport.width}px`;
      appEl.style.height = `${viewport.height}px`;
      document.documentElement.style.setProperty('--vvh', `${viewport.height}px`);
    }

    syncToVisualViewport();
    viewport.addEventListener('resize', syncToVisualViewport);
    viewport.addEventListener('scroll', syncToVisualViewport);

    return () => {
      viewport.removeEventListener('resize', syncToVisualViewport);
      viewport.removeEventListener('scroll', syncToVisualViewport);
    };
  });

  onMount(async () => {
    try {
      const config = getIframeConfig();
      const data = await loadProgramFromMoodle(config);
      appState = { kind: 'ready', data };
    } catch (err) {
      console.warn('Using mock data:', err);
      appState = { kind: 'ready', data: MOCK_PROGRAM };
    }
  });
</script>

<!-- Background image on a fixed layer, not on <body> (scroll layer).
     Keeps all compositing in the fixed-layer domain — avoids Mali-G52/Chrome
     scroll-vs-fixed compositing artifacts on Samsung Tab A8 (SM-X200). -->
<div class="app-bg" style:background-image="url('{import.meta.env.BASE_URL}{bgImage}')"></div>

<main class="app-root" bind:this={appEl}>
  {#if appState.kind === 'loading'}
    <div class="state-container">
      <div class="spinner"></div>
      <p class="state-text" style:color={theme.text.secondary}>Cargando programa...</p>
    </div>
  {:else if appState.kind === 'error'}
    <div class="state-container">
      <div class="error-icon">!</div>
      <p class="state-text error">{appState.message}</p>
      <button class="retry-btn" onclick={() => window.location.reload()}>
        Reintentar
      </button>
    </div>
  {:else}
    {#if currentView === 'home' && homeProgram}
      <TreeNavigator
        program={homeProgram}
        onUnitSelected={(unit) => { selectedUnit = unit; currentView = 'unit-detail'; }}
        onActivitySelected={(activity) => {
          selectedActivity = activity;
          currentView = 'activity-slide';
        }}
      />
    {:else if currentView === 'unit-detail' && selectedUnit}
      <UnitDetailView
        unit={selectedUnit}
        programShortname={appState.data.shortname}
        onBack={() => { selectedUnit = null; currentView = 'home'; }}
        onActivitySelected={(activity) => {
          selectedActivity = activity;
          currentView = 'activity-slide';
        }}
      />
    {:else if currentView === 'activity-slide' && selectedActivity}
      <ActivitySlideView
        activity={selectedActivity}
        onBack={() => {
          selectedActivity = null;
          currentView = selectedUnit ? 'unit-detail' : 'home';
        }}
      />
    {/if}
  {/if}
</main>

<!-- BadgePanel outside .app-root so it's also zoom-independent — positioned in the body
     stacking context directly. -->
{#if appState.kind === 'ready' && currentView === 'home' && homeProgram}
  <BadgePanel program={homeProgram} />
{/if}

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* ── Android rendering optimisations ─────────────────────────────────────
     Root cause of moiré: CSS `heartbeat` (transform:scale) runs at 60fps on
     the same SVG circle that has feGaussianBlur applied. Android Chrome cannot
     GPU-composite a CSS transform independently when an SVG filter is present
     on the element → full layer re-rasterisation every frame → visible moiré.
     Disabling the animation and the SVG filters eliminates the per-frame cost. */
  :global(.android .heartbeat) {
    animation: none;
  }
  :global(.android .galaxy-wrapper [filter]) {
    filter: none;
  }
  /* ── Samsung Tab A8 (SM-X200, Mali-G52 / Unisoc T618) — comprehensive GPU fix
     .galaxy-wrapper's translateZ(0) is now removed at the source (TreeNavigator.svelte) for
     every platform, not just Android — this override is redundant, kept removed rather than
     left as dead no-op CSS. */
  /* BadgePanel: blocked badges now show a plain <img> (badgeBlocked.webp) instead of the old
     mask-image silhouette, so there's no longer a shimmer animation or per-element drop-shadow
     filter on that child to neutralise here. .badge-slot.earned still gets a blue glow filter +
     pop-in animation, disabled below for the same Mali-G52 compositing-layer reason. */
  :global(.android .badge-slot) {
    filter: none !important;
    animation: none !important;
  }
  /* Scanline: continuous background-position animation inside a compositing layer */
  :global(.android .scanline) {
    animation: none !important;
  }
  /* ActivityOrbit: scale-in entry animation on the whole satellite group, fired the instant a
     unit sphere opens — same transient-scale-animation GPU-layer-promotion cost as badge-pop/
     card-in below, isolated as the actual trigger for the background-image corruption on
     Samsung Tab A8 (2026-07-13 incremental test: broke specifically at "unit opens, satellites
     appear", not on plain page load — this animation is the one thing in that flow the earlier
     Mali-G52 pass had missed). */
  :global(.android .list-inner) {
    animation: none !important;
  }
  /* Badge modal: opacity-based entry animations → GPU compositing layer during animation */
  :global(.android .modal-backdrop) {
    animation: none !important;
  }
  :global(.android .modal-card) {
    animation: none !important;
  }
  /* Modal badge drop-shadow filter → compositing layer on Mali-G52 */
  :global(.android .modal-badge-wrap) {
    filter: none !important;
  }
  /* Progress ring: stroke-dashoffset transition → GPU compositing layer on Mali-G52 */
  :global(.android .progress-ring) {
    transition: none !important;
  }

  :global(html) {
    height: 100%;
    overflow: hidden;
  }

  :global(body) {
    font-family: 'Rubik', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
    height: 100%;
    transition: background-color 0.4s, color 0.4s;
  }

  .app-bg {
    position: fixed;
    inset: 0;
    background-size: cover;
    background-position: bottom center;
    background-repeat: no-repeat;
    pointer-events: none;
    /* Sits behind .app-root — DOM order determines stacking (no z-index needed) */
  }

  .app-root {
    position: fixed;
    /* CSS fallback before JS kicks in — fills the layout viewport */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    /* JS (syncToVisualViewport) overrides top/left/width/height with the
       actual visualViewport dimensions so the app always fills the visible
       area regardless of browser-level zoom on Chrome/iOS. */
  }

  .state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 40px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(128,128,128,0.2);
    border-top-color: #7c6cf7;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .state-text {
    font-size: 15px;
  }

  .state-text.error {
    color: #f87171;
    max-width: 320px;
    text-align: center;
  }

  .error-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(248,113,113,0.15);
    color: #f87171;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
  }

  .retry-btn {
    padding: 8px 20px;
    border: 1px solid rgba(128,128,128,0.3);
    border-radius: 8px;
    background: rgba(128,128,128,0.1);
    color: inherit;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .retry-btn:hover {
    background: rgba(128,128,128,0.2);
  }
</style>
