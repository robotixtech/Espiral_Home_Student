<script lang="ts">
  import type { Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  interface Props {
    activity: Activity;
    onBack: () => void;
  }

  let { activity, onBack }: Props = $props();

  const theme = $derived(getTheme());
  const slides = $derived(activity.slides ?? []);
  const totalSlides = $derived(slides.length);

  let currentSlide = $state(0);

  const slide = $derived(slides[currentSlide]);
  const isLast = $derived(currentSlide >= totalSlides - 1);
  const hasVideo = $derived(!!slide?.video);
  const hasImage = $derived(!!slide?.image);
  const isFullwidth = $derived(hasImage);

  function next() {
    if (isLast) {
      onBack();
    } else {
      currentSlide++;
    }
  }
</script>

<div class="slide-page" class:fullwidth={isFullwidth}>
  <div class="overlay" class:light={isFullwidth}></div>

  <!-- Back -->
  <button class="back-btn" class:dark-text={isFullwidth} onclick={() => onBack()}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
    Volver
  </button>

  {#if isFullwidth && slide}
    <!-- Fullwidth image slide — text + image inside one container -->
    <div class="image-card">
      {#if slide.body}
        <div class="image-text">
          {#each slide.body.split('\n') as line, li (li)}
            {#if line.startsWith('**') && line.endsWith('**')}
              <p class="image-text-bold">{line.slice(2, -2)}</p>
            {:else if line.startsWith('• ')}
              <p class="image-text-bullet">{line}</p>
            {:else if line.trim() === ''}
              <br />
            {:else}
              <p class="image-text-line">{line}</p>
            {/if}
          {/each}
        </div>
      {/if}
      <div class="image-wrap">
        <img
          src="{import.meta.env.BASE_URL}{slide.image}"
          alt={slide.title}
          class="slide-image"
        />
      </div>

      <button class="next-btn" onclick={next}>
        {isLast ? 'Finalizar' : '>>'}
      </button>
    </div>
  {:else}
    <!-- Text/video content card -->
    <div class="content" class:has-video={hasVideo}>
      {#if slide}
        {#if slide.video}
          <div class="video-wrap">
            <iframe
              src={slide.video}
              title={slide.title}
              frameborder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        {/if}

        <div class="text-area">
          <h1 class="title">{slide.title}</h1>
          <p class="body">{slide.body}</p>
        </div>
      {:else}
        <div class="text-area">
          <p class="body">Esta actividad no tiene contenido disponible.</p>
        </div>
      {/if}

      <button class="next-btn" onclick={next}>
        {isLast ? 'Finalizar' : '>>'}
      </button>
    </div>
  {/if}

  <!-- Page indicator -->
  {#if totalSlides > 1}
    <span class="page-indicator" class:dark-text={isFullwidth}>{currentSlide + 1} / {totalSlides}</span>
  {/if}
</div>

<style>
  .slide-page {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 48px 32px 24px;
    overflow: hidden;
  }

  .slide-page.fullwidth {
    padding: 0;
  }

  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(5, 8, 18, 0.75);
    pointer-events: none;
  }

  .overlay.light {
    background: rgba(5, 8, 18, 0.75);
  }

  /* --- Back button --- */
  .back-btn {
    position: absolute;
    top: 12px;
    left: 20px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    color: rgba(255,255,255,0.5);
    font: 500 13px/1 'Rubik', system-ui, sans-serif;
    cursor: pointer;
    padding: 6px 4px;
    transition: color 0.15s;
  }

  .back-btn:hover { color: rgba(255,255,255,0.85); }

  .back-btn.dark-text {
    color: rgba(255,255,255,0.7);
    background: rgba(0,0,0,0.4);
    border-radius: 10px;
    padding: 8px 14px 8px 10px;
  }
  .back-btn.dark-text:hover { color: #ffffff; }

  /* --- Image slide card (text + image inside) --- */
  .image-card {
    position: relative;
    z-index: 1;
    width: 100vw;
    max-width: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    padding: 28px 44px 24px;
    margin: 0 20px;
    background: rgba(10, 14, 30, 0.55);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    overflow: hidden;
  }

  .image-card .next-btn {
    align-self: flex-end;
  }

  .image-text {
    flex-shrink: 0;
    padding: 0 12px 16px 15%;
  }

  .image-text-line {
    font: 400 16px/1.6 'Rubik', system-ui, sans-serif;
    color: rgba(255,255,255,0.8);
  }

  .image-text-bold {
    font: 700 16px/1.6 'Rubik', system-ui, sans-serif;
    color: #ffffff;
    margin-top: 6px;
  }

  .image-text-bullet {
    font: 600 16px/1.6 'Rubik', system-ui, sans-serif;
    color: rgba(255,255,255,0.9);
    padding-left: 12px;
  }

  .image-wrap {
    flex: 1;
    min-height: 0;
    border-radius: 12px;
    overflow: hidden;
  }

  .slide-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center top;
  }

  /* --- Text/video content card --- */
  .content {
    position: relative;
    z-index: 1;
    max-width: 720px;
    width: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    padding: 36px 44px;
    background: rgba(10, 14, 30, 0.55);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    overflow: hidden;
  }

  .content.has-video {
    max-width: 960px;
    padding: 28px 36px;
  }

  .video-wrap {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
    margin-bottom: 20px;
  }

  .video-wrap iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
  }

  .text-area {
    flex: 1;
    min-height: 0;
  }

  .title {
    font: 700 28px/1.25 'Rubik', system-ui, sans-serif;
    color: #ffffff;
    margin-bottom: 14px;
  }

  .body {
    font: 400 17px/1.7 'Rubik', system-ui, sans-serif;
    color: rgba(255,255,255,0.75);
  }

  /* --- Next button --- */
  .next-btn {
    margin-top: 24px;
    align-self: flex-start;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    color: #ffffff;
    font: 700 18px/1 'Rubik', system-ui, sans-serif;
    padding: 14px 40px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    letter-spacing: 2px;
    flex-shrink: 0;
  }

  .next-btn:hover { background: rgba(255,255,255,0.15); }
  .next-btn:active { transform: scale(0.97); }


  /* --- Page indicator --- */
  .page-indicator {
    position: absolute;
    bottom: 10px;
    right: 24px;
    z-index: 2;
    font: 500 12px/1 'Rubik', system-ui, sans-serif;
    color: rgba(255,255,255,0.3);
  }

  .page-indicator.dark-text {
    color: rgba(0,0,0,0.35);
    bottom: 28px;
    right: auto;
    left: 24px;
  }

  /* --- Responsive --- */
  @media (max-height: 700px) {
    .content { padding: 20px 28px; }
    .content.has-video { padding: 16px 24px; }
    .title { font-size: 22px; margin-bottom: 10px; }
    .body { font-size: 15px; }
    .video-wrap { margin-bottom: 14px; }
    .next-btn { margin-top: 16px; padding: 10px 32px; font-size: 16px; }
  }

  @media (max-height: 550px) {
    .slide-page:not(.fullwidth) { padding: 36px 20px 16px; }
    .content { padding: 14px 20px; }
    .title { font-size: 18px; margin-bottom: 8px; }
    .body { font-size: 14px; line-height: 1.5; }
    .video-wrap { padding-bottom: 45%; margin-bottom: 10px; }
    .next-btn { margin-top: 10px; padding: 8px 28px; font-size: 15px; }
  }
</style>
