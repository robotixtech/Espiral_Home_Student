<script lang="ts">
  interface Props {
    cx: number;
    cy: number;
    programShortname: string;
    opacity?: number;
  }

  let { cx, cy, programShortname, opacity = 0.78 }: Props = $props();

  const isNano = $derived(/C[34]50/i.test(programShortname));
  const label  = $derived(isNano ? 'nanoQUANTA' : 'QUANTA');
  const url    = $derived(isNano ? 'https://www.robotix.es' : 'https://www.robotix.com');

  // [x, y, radius, opacity] — globular cluster star distribution
  const STARS: [number, number, number, number][] = [
    // Dense core
    [  1.5, -2.0, 2.2, 0.95 ], [ -2.5,  0.8, 2.0, 0.90 ],
    [  3.5,  2.5, 2.1, 0.88 ], [ -1.0,  3.8, 2.0, 0.92 ],
    [  4.0, -3.5, 1.9, 0.85 ], [ -3.5, -2.8, 2.0, 0.90 ],
    [  0.5,  5.0, 1.8, 0.86 ], [ -3.0,  4.5, 1.9, 0.88 ],
    // Mid ring
    [ 10.0,  3.5, 1.8, 0.72 ], [ -9.0,  5.0, 1.6, 0.68 ],
    [  7.5, -9.0, 1.7, 0.70 ], [-10.0, -7.0, 1.6, 0.66 ],
    [ 12.5, -5.0, 1.5, 0.63 ], [  2.0, 12.5, 1.8, 0.71 ],
    [-11.5,  2.0, 1.6, 0.67 ], [ 12.0,  8.5, 1.4, 0.60 ],
    [ -6.0,-12.5, 1.7, 0.69 ], [  9.0, 11.5, 1.5, 0.62 ],
    [-13.5,  7.5, 1.4, 0.58 ], [ 14.0, -2.0, 1.6, 0.65 ],
    [  5.0,-15.0, 1.3, 0.56 ], [-14.0, -4.5, 1.5, 0.63 ],
    // Outer sparse halo
    [ 20.0,  5.0, 1.1, 0.40 ], [-19.0, 10.0, 1.0, 0.36 ],
    [ 17.0,-13.5, 1.2, 0.42 ], [-17.5,-12.0, 1.0, 0.38 ],
    [ 12.0, 20.0, 1.0, 0.34 ], [-10.0,-21.0, 1.1, 0.40 ],
    [ 22.5, -6.0, 0.9, 0.31 ], [-22.0,  3.5, 1.0, 0.34 ],
    [  7.5,-22.0, 1.1, 0.38 ], [ -8.0, 21.5, 0.9, 0.32 ],
    [ 19.5, 14.5, 1.0, 0.34 ], [-20.5,-15.0, 0.9, 0.30 ],
    [ 24.0,  2.5, 0.8, 0.26 ], [-24.5, -7.0, 0.8, 0.26 ],
    [ 15.0,-20.0, 0.9, 0.30 ], [-14.5, 21.5, 0.8, 0.28 ],
  ];
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<g
  class="quanta"
  transform="translate({cx},{cy}) scale(1.3)"
  opacity={opacity}
  onclick={() => window.open(url, '_blank')}
  onkeydown={(e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.open(url, '_blank'); }
  }}
  tabindex="0"
  role="link"
  aria-label="{label}"
>
  <defs>
    <radialGradient id="qc-core" cx="35%" cy="30%" r="65%">
      <stop offset="0%"   stop-color="#fff8d0" />
      <stop offset="40%"  stop-color="#ffcc44" />
      <stop offset="100%" stop-color="#c85000" />
    </radialGradient>
    <radialGradient id="qc-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#ffcc44" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#ff8800" stop-opacity="0" />
    </radialGradient>
    <filter id="qc-bloom" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>

  <!-- Ambient outer halo -->
  <circle cx="0" cy="0" r="44" fill="url(#qc-halo)" />

  <!-- Star field -->
  {#each STARS as [sx, sy, sr, so]}
    <circle cx={sx} cy={sy} r={sr} fill="white" opacity={so} />
  {/each}

  <!-- Bright core -->
  <circle cx="0" cy="0" r="7" fill="url(#qc-core)" filter="url(#qc-bloom)" class="core-pulse" />

  <!-- Hover ring — matches unit node halo-ring style -->
  <circle cx="0" cy="0" r="32" fill="none"
          stroke="rgba(255,200,80,0.65)" stroke-width="0.8"
          class="halo-ring" />

  <!-- Label -->
  <text x="0" y="46" text-anchor="middle" class="quanta-lbl">{label}</text>
</g>

<style>
  .quanta { cursor: pointer; outline: none; }

  /* Hover ring */
  .halo-ring {
    opacity: 0;
    stroke-width: 0.8;
    transition: opacity 0.3s ease, stroke-width 0.3s ease;
    pointer-events: none;
  }

  @media (hover: hover) {
    .quanta:hover { opacity: 1 !important; }

    .quanta:hover .halo-ring {
      opacity: 0.7;
      stroke-width: 2;
      animation: border-pulse 1.2s ease-in-out infinite;
    }

    .quanta:hover .quanta-lbl {
      fill: rgba(255,228,130,1);
    }
  }

  @keyframes border-pulse {
    0%, 100% { opacity: 0.4; stroke-width: 0.5; }
    50%       { opacity: 0.8; stroke-width: 1.5; }
  }

  .quanta-lbl {
    font: 700 11px/1 'Rubik', system-ui, sans-serif;
    letter-spacing: 0.22em;
    fill: rgba(255,210,100,0.72);
    pointer-events: none;
    transition: fill 0.2s;
  }

  .core-pulse {
    animation: qc-pulse 3.5s ease-in-out infinite;
    transform-origin: 0 0;
  }
  @keyframes qc-pulse {
    0%, 100% { opacity: 0.82; }
    50%       { opacity: 1.00; }
  }
</style>
