<script lang="ts">
  import { onMount } from 'svelte';
  import type { AppState, ProgramUnit, Activity } from './lib/types';
  import { getAppConfig } from './lib/token'; // Actualizado: usamos el nuevo lector del DOM
  import { loadProgramFromMoodle } from './lib/program-loader';
  import { MOCK_PROGRAM } from './lib/mock-data'; // Usamos tu mock estabilizado
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

  // Reactively update body background when theme changes
  $effect(() => {
    const s = document.body.style;
    s.backgroundColor = theme.body;
    s.color = theme.text.primary;
    s.backgroundImage = `url('${import.meta.env.BASE_URL}background.png')`;
    s.backgroundPosition = 'bottom center';
    s.backgroundRepeat = 'no-repeat';
    // cover ensures it fills the viewport on all screen sizes
    s.backgroundSize = 'cover';
    // fixed doesn't work on iOS, use scroll as fallback handled via CSS
    s.backgroundAttachment = 'scroll';
  });

  onMount(async () => {
    try {
      // 1. Obtenemos la configuración inyectada en el nodo raíz por Moodle (PHP)
      const config = await getAppConfig();

      // 2. Evaluamos el entorno: Modo Ejemplo vs Producción
      if (config.isExampleMode || config.token === 'TOKEN_PROVISIONAL') {
        console.info('Espiral Dashboard: Ejecutando en Modo Ejemplo (Mock Data).');
        appState = { kind: 'ready', data: MOCK_PROGRAM };
      } else {
        console.info('Espiral Dashboard: Ejecutando en Modo Producción. Conectando a Moodle WS...');
        const data = await loadProgramFromMoodle(config as any); // Type assertion segura si getAppConfig mapea bien
        appState = { kind: 'ready', data };
      }
    } catch (err) {
      console.error('Error fatal al iniciar Espiral Dashboard:', err);
      appState = { 
        kind: 'error', 
        message: err instanceof Error ? err.message : 'Error desconocido al cargar el dashboard.' 
      };
    }

    // 3. Auto-start emulator si los datos están listos
    if (appState.kind === 'ready' && !isEmulatorActive()) {
      toggleEmulator(appState.data);
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
    {@const allCompleted = {
      ...appState.data,
      // TODO(moodle): `grade: 7` hardcodeado; reemplazar con el grade real de Moodle Workplace 4.5 cuando esté disponible.
      units: appState.data.units.map(u => ({ ...u, status: 'completed' as const, progress: 100, grade: 7 })),
    }}
    {#if currentView === 'home'}
      <TreeNavigator
        program={getEmulatedProgram() ?? allCompleted}
        onUnitSelected={(unit) => { selectedUnit = unit; currentView = 'unit-detail'; }}
        onActivitySelected={(activity) => {
          // Activity opened directly from the tree (in-progress unit inline).
          // selectedUnit stays null so the back button returns to home.
          selectedActivity = activity;
          currentView = 'activity-slide';
        }}
      />
      <EmulatorToggle program={appState.data} />
      <BadgePanel program={getEmulatedProgram() ?? allCompleted} />
    {:else if currentView === 'unit-detail' && selectedUnit}
      <UnitDetailView
        unit={selectedUnit}
        programShortname={appState.data.shortname}
        onBack={() => { selectedUnit = null; currentView = 'home'; }}
        onActivitySelected={(activity) => {
          // Activity opened from UnitDetailView — selectedUnit remains set
          // so the back button returns to unit-detail.
          selectedActivity = activity;
          currentView = 'activity-slide';
        }}
      />
    {:else if currentView === 'activity-slide' && selectedActivity}
      <ActivitySlideView
        activity={selectedActivity}
        onBack={() => {
          selectedActivity = null;
          // If we came from a unit-detail view, selectedUnit is still set → go back there.
          // If we came directly from the tree (in-progress unit), selectedUnit is null → go home.
          currentView = selectedUnit ? 'unit-detail' : 'home';
        }}
      />
    {/if}
  {/if}
</main>

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
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
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