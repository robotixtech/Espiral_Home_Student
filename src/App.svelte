<script lang="ts">
  import { onMount } from 'svelte';
  import type { AppState } from './lib/types';
  import { getIframeConfig } from './lib/token';
  import { loadProgramFromMoodle } from './lib/program-loader';
  import { MOCK_PROGRAM } from './lib/mock-data';
  import { getTheme } from './lib/theme.svelte';
  import SpiralNavigator from './components/SpiralNavigator.svelte';

  let state = $state<AppState>({ kind: 'loading' });

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
      const config = getIframeConfig();
      const data = await loadProgramFromMoodle(config);
      state = { kind: 'ready', data };
    } catch (err) {
      // Fall back to mock data when no Moodle token is available
      console.warn('Using mock data:', err);
      state = { kind: 'ready', data: MOCK_PROGRAM };
    }
  });
</script>

<header class="site-header">
  <img src="{import.meta.env.BASE_URL}robotix_logo.png" alt="Robotix" class="header-logo" />
</header>

<main class="app-root">
  {#if state.kind === 'loading'}
    <div class="state-container">
      <div class="spinner"></div>
      <p class="state-text" style:color={theme.text.secondary}>Cargando programa...</p>
    </div>
  {:else if state.kind === 'error'}
    <div class="state-container">
      <div class="error-icon">!</div>
      <p class="state-text error">{state.message}</p>
      <button class="retry-btn" onclick={() => window.location.reload()}>
        Reintentar
      </button>
    </div>
  {:else}
    <SpiralNavigator program={state.data} />
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

  .site-header {
    width: 100%;
    height: 48px;
    min-height: 48px;
    background: #0075BF;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    padding: 0 16px;
  }

  .header-logo {
    height: 28px;
    width: auto;
  }

  .app-root {
    position: fixed;
    top: 48px;
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

  /* Landscape phones — compact header */
  @media (max-height: 500px) {
    .site-header { height: 36px; min-height: 36px; }
    .header-logo { height: 20px; }
    .app-root { top: 36px; }
  }

  /* Portrait phones — slightly smaller header to maximize galaxy space */
  @media (max-width: 600px) and (orientation: portrait) {
    .site-header { height: 40px; min-height: 40px; }
    .header-logo { height: 24px; }
    .app-root { top: 40px; }
  }
</style>
