<script lang="ts">
  import { onMount } from 'svelte';
  import type { AppState, ProgramUnit, Activity } from './lib/types';
  import { getAppConfig } from './lib/token'; 
  import { loadProgramFromMoodle } from './lib/program-loader';
  import { MOCK_PROGRAM } from './lib/mock-data';
  import { getTheme } from './lib/theme.svelte';
  import { getConfigByShortname } from './lib/program-config';
  import { isIOSDevice } from './lib/device';
  import TreeNavigator from './components/TreeNavigator.svelte';
  import UnitDetailView from './components/UnitDetailView.svelte';
  import ActivitySlideView from './components/ActivitySlideView.svelte';
  import BadgePanel from './components/BadgePanel.svelte';

  // Navigation state
  let currentView: 'home' | 'unit-detail' | 'activity-slide' = $state('home');
  let selectedUnit: ProgramUnit | null = $state(null);
  let selectedActivity: Activity | null = $state(null);

  let appState = $state<AppState>({ kind: 'loading' });
  let isEmpty = $state(false);

  const theme = $derived(getTheme());
  const homeProgram = $derived(appState.kind === 'ready' ? appState.data : null);

  const bgImage = $derived(
    appState.kind === 'ready'
      ? (getConfigByShortname(appState.data.shortname)?.bgImage ?? 'background_light.png')
      : 'background_light.png'
  );

  // Helper de la rama Base: Resuelve las rutas reales dentro de la estructura de plugins de Moodle
  function getPluginAssetUrl(filename: string): string {
    if (typeof window !== 'undefined' && (window as any).moodleConfig?.baseUrl) {
      const baseUrl = (window as any).moodleConfig.baseUrl.replace(/\/$/, '');
      return `${baseUrl}/blocks/espiral_dashboard/visual/${filename}`;
    }
    return `/blocks/espiral_dashboard/visual/${filename}`;
  }

  const bgImageUrl = $derived(`url('${getPluginAssetUrl(bgImage)}')`);

  onMount(async () => {
    // Detección robusta de Android para optimizaciones de rendimiento gráfico (Mali-G52)
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

    // Carga de datos empaquetada segura para producción Moodle
    try {
      const config = await getAppConfig();
      if (config.programData) {
        console.info('Espiral Dashboard: Cargando datos inyectados.');
        appState = { kind: 'ready', data: config.programData };
      } else if (import.meta.env.DEV || config.isExampleMode) {
        console.info('Espiral Dashboard: Modo desarrollo / Ejemplo.');
        appState = { kind: 'ready', data: MOCK_PROGRAM };
      } else {
        isEmpty = true;
      }
    } catch (err) {
      console.warn('Error en conexión Moodle — usando fallback seguro a Mock:', err);
      appState = { kind: 'ready', data: MOCK_PROGRAM };
    }
  });
</script>

<div class="app-bg" style:background-image={bgImageUrl}></div>

<main 
  class="app-root"
  style:background-color={theme.body}
  style:color={theme.text.primary}
  style:background-image={bgImageUrl}
  style:background-position="bottom"
  style:background-repeat="no-repeat"
  style:background-size="cover"
>
  {#if isEmpty}
    <div class="state-container empty-state">
      <div class="info-icon">i</div>
      <p class="state-text" style:color={theme.text.secondary}>
        No tienes programas matriculados en este momento.
      </p>
    </div>
  {:else if appState.kind === 'loading'}
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
      <BadgePanel program={homeProgram} />
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
  /* Reseteos locales e independientes para proteger el entorno Moodle */
  .app-root *, .app-bg * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* El fondo se acota de forma absoluta al contenedor del bloque */
  .app-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: bottom center;
    background-repeat: no-repeat;
    pointer-events: none;
    z-index: 0;
  }

  /* Volvemos al aislamiento de bloque nativo con contención elástica */
  .app-root {
    z-index: 1;
    width: 100% !important;
    min-height: 700px;
    height: 100% !important;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-family: 'Rubik', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    transition: background-color 0.4s, color 0.4s;
  }

  /* ── Optimizaciones Android (Mali-G52 / Tab A8) heredadas de iThink ── */
  :global(.android .heartbeat) { animation: none !important; }
  :global(.android .galaxy-wrapper [filter]) { filter: none !important; }
 :global(.android .list-inner) {
    animation: none !important;
  }
  :global(.android .badge-silhouette) { animation: none !important; }
  :global(.android .badge-slot) { filter: none !important; animation: none !important; }
  :global(.android .scanline) { animation: none !important; }
  :global(.android .modal-backdrop) { animation: none !important; }
  :global(.android .modal-card) { animation: none !important; }
  :global(.android .modal-badge-wrap) { filter: none !important; }
  :global(.android .progress-ring) { transition: none !important; }

  /* ── Estados y feedback visual ── */
  .state-container { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px; }
  .state-container.empty-state { padding: 24px; text-align: center; }
  .spinner { width: 40px; height: 40px; border: 4px solid rgba(128,128,128,0.2); border-top-color: #7c6cf7; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .state-text { font-size: 15px; }
  .state-text.error { color: #f87171; max-width: 320px; text-align: center; }
  .error-icon, .info-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; }
  .error-icon { background: rgba(248,113,113,0.15); color: #f87171; }
  .info-icon { background: rgba(124, 108, 247, 0.15); color: #7c6cf7; font-style: italic; font-family: serif; }
  .retry-btn { padding: 8px 20px; border: 1px solid rgba(128,128,128,0.3); border-radius: 8px; background: rgba(128,128,128,0.1); color: inherit; font-size: 14px; cursor: pointer; transition: background 0.15s; }
  .retry-btn:hover { background: rgba(128,128,128,0.2); }
</style>