<script lang="ts">
  import { onMount } from 'svelte';
  import type { AppState, ProgramUnit, Activity } from './lib/types';
  import { getIframeConfig } from './lib/token';
  import { loadProgramFromMoodle } from './lib/program-loader';
  import { MOCK_PROGRAM } from './lib/mock-data';
  import { getTheme } from './lib/theme.svelte';
  import { getEmulatedProgram, toggleEmulator, isEmulatorActive } from './lib/emulator.svelte';
  import TreeNavigator from './components/TreeNavigator.svelte';
  import UnitDetailView from './components/UnitDetailView.svelte';
  import ActivitySlideView from './components/ActivitySlideView.svelte';
  import EmulatorToggle from './components/EmulatorToggle.svelte';
  import BadgePanel from './components/BadgePanel.svelte';

  // Navigation state — owned here, passed down as callback props
  let currentView: 'home' | 'unit-detail' | 'activity-slide' = $state('home');
  let selectedUnit: ProgramUnit | null = $state(null);
  let selectedActivity: Activity | null = $state(null);

  let appState = $state<AppState>({ kind: 'loading' });

  const theme = $derived(getTheme());

  const allCompleted = $derived.by(() => {
    if (appState.kind !== 'ready') return null;
    return {
      ...appState.data,
      // TODO(moodle): `grade: 7` hardcodeado; reemplazar con el grade real de Moodle Workplace 4.5 cuando esté disponible.
      units: appState.data.units.map(u => ({ ...u, status: 'completed' as const, progress: 100, grade: 7 })),
    };
  });

  const homeProgram = $derived(allCompleted ? (getEmulatedProgram() ?? allCompleted) : null);

  // Reactively update body background when theme changes
  $effect(() => {
    const s = document.body.style;
    const h = theme.body.slice(1);
    const [br, bg, bb] = [0,2,4].map(i => parseInt(h.slice(i,i+2),16));
    s.backgroundColor = `rgba(${br},${bg},${bb},0.8)`;
    s.color = theme.text.primary;
    s.backgroundImage = `url('${import.meta.env.BASE_URL}background_2.png')`;
    s.backgroundPosition = 'bottom center';
    s.backgroundRepeat = 'no-repeat';
    s.backgroundSize = 'cover';
    s.backgroundAttachment = 'scroll';
  });

  // ── Visual Viewport sync ──────────────────────────────────────────────────
  // Chrome on iOS keeps position:fixed relative to the LAYOUT viewport, not the
  // visual viewport.  When the browser applies any page zoom the layout viewport
  // and the visible area diverge, so .app-root drifts off-screen.
  // We compensate by pinning .app-root exactly to the visual viewport dimensions
  // using the VisualViewport API (available Chrome 61+, Safari 13+).
  let appEl: HTMLElement | undefined = $state();

  onMount(() => {
    const vvp = window.visualViewport;

    function syncToVisualViewport() {
      if (!appEl) return;
      if (vvp) {
        appEl.style.left   = `${vvp.offsetLeft}px`;
        appEl.style.top    = `${vvp.offsetTop}px`;
        appEl.style.width  = `${vvp.width}px`;
        appEl.style.height = `${vvp.height}px`;
      }
    }

    syncToVisualViewport();
    vvp?.addEventListener('resize', syncToVisualViewport);
    vvp?.addEventListener('scroll', syncToVisualViewport);

    return () => {
      vvp?.removeEventListener('resize', syncToVisualViewport);
      vvp?.removeEventListener('scroll', syncToVisualViewport);
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
    if (appState.kind === 'ready' && !isEmulatorActive()) {
      toggleEmulator(appState.data);
    }
  });
</script>

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

<!-- EmulatorToggle and BadgePanel outside .app-root so they are also
     zoom-independent — positioned in the body stacking context directly. -->
{#if appState.kind === 'ready' && currentView === 'home' && homeProgram}
  <EmulatorToggle program={appState.data} />
  <BadgePanel program={homeProgram} />
{/if}

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
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
