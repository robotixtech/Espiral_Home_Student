<script lang="ts">
  import { onMount } from 'svelte';
  import type { AppState, ProgramUnit, Activity } from './lib/types';
  import { getAppConfig } from './lib/token';
  import { loadProgramFromMoodle } from './lib/program-loader';
  import { MOCK_PROGRAM } from './lib/mock-data';
  import { getTheme } from './lib/theme.svelte';
  import { getEmulatedProgram, toggleEmulator, isEmulatorActive } from './lib/emulator.svelte';
  import TreeNavigator from './components/TreeNavigator.svelte';
  import UnitDetailView from './components/UnitDetailView.svelte';
  import ActivitySlideView from './components/ActivitySlideView.svelte';
  import EmulatorToggle from './components/EmulatorToggle.svelte';
  import BadgePanel from './components/BadgePanel.svelte';

  // Navigation state
  let currentView: 'home' | 'unit-detail' | 'activity-slide' = $state('home');
  let selectedUnit: ProgramUnit | null = $state(null);
  let selectedActivity: Activity | null = $state(null);
  let debugConfig = $state<any>(null);

  let appState = $state<AppState>({ kind: 'loading' });

  const theme = $derived(getTheme());

  $effect(() => {
    const s = document.body.style;
    s.backgroundColor = theme.body;
    s.color = theme.text.primary;
    s.backgroundImage = `url('${import.meta.env.BASE_URL}background.png')`;
    s.backgroundPosition = 'bottom center';
    s.backgroundRepeat = 'no-repeat';
    s.backgroundSize = 'cover';
    s.backgroundAttachment = 'scroll';
  });

  onMount(async () => {
    try {
      const config = await getAppConfig();
      debugConfig = config;

      if (config.programData) {
        console.info('Espiral Dashboard: Cargando Payload Inyectado desde PHP.');
        appState = { kind: 'ready', data: config.programData };
      } 
      else if (config.isExampleMode || config.token === 'TOKEN_PROVISIONAL') {
        console.info('Espiral Dashboard: Ejecutando en Modo Ejemplo (Mock local).');
        appState = { kind: 'ready', data: MOCK_PROGRAM };
      } 
      else {
        console.info('Espiral Dashboard: Ejecutando en Modo Producción. Fetch a Moodle...');
        const data = await loadProgramFromMoodle(config as any);
        appState = { kind: 'ready', data };
      }
    } catch (err) {
      console.error('Error al iniciar Espiral Dashboard:', err);
      appState = { 
        kind: 'error', 
        message: err instanceof Error ? err.message : 'Error desconocido al cargar.' 
      };
    }
  });
</script>

<main class="app-root">
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
    <!-- renderizado de estado conectado directamente al API -->
    {#if currentView === 'home'}
      <TreeNavigator
        program={getEmulatedProgram() ?? appState.data}
        onUnitSelected={(unit) => { selectedUnit = unit; currentView = 'unit-detail'; }}
        onActivitySelected={(activity) => {
          selectedActivity = activity;
          currentView = 'activity-slide';
        }}
      />
      <EmulatorToggle program={appState.data} />
      <BadgePanel program={getEmulatedProgram() ?? appState.data} />
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

<style>
  /* ... mantenemos tus estilos intactos ... */
  :global(*) { margin: 0; padding: 0; box-sizing: border-box; }
  :global(html) { height: 100%; overflow: hidden; }
  :global(body) {
    font-family: 'Rubik', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
    height: 100%;
    transition: background-color 0.4s, color 0.4s;
  }
  .app-root { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .state-container { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px; }
  .spinner { width: 40px; height: 40px; border: 4px solid rgba(128,128,128,0.2); border-top-color: #7c6cf7; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .state-text { font-size: 15px; }
  .state-text.error { color: #f87171; max-width: 320px; text-align: center; }
  .error-icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(248,113,113,0.15); color: #f87171; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; }
  .retry-btn { padding: 8px 20px; border: 1px solid rgba(128,128,128,0.3); border-radius: 8px; background: rgba(128,128,128,0.1); color: inherit; font-size: 14px; cursor: pointer; transition: background 0.15s; }
  .retry-btn:hover { background: rgba(128,128,128,0.2); }
  .debug-overlay { position: fixed; top: 20px; left: 20px; background: rgba(15, 23, 42, 0.9); border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; color: #10b981; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.5); pointer-events: none; max-width: 350px; overflow-x: auto; }
  .debug-overlay h4 { margin: 0 0 8px 0; color: #60a5fa; font-family: system-ui, sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
  .debug-overlay pre { margin: 0; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
</style>