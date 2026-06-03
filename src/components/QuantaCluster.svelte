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

  // Stars split into 3 opacity bands so each band can be rendered as a single
  // <g opacity> group — reduces 38 individual compositing ops to 3 on Mali-G52.
  // Dense core (~0.85-0.95 → group at 0.90)
  const STARS_CORE: [number, number, number][] = [
    [  1.5, -2.0, 2.2 ], [ -2.5,  0.8, 2.0 ],
    [  3.5,  2.5, 2.1 ], [ -1.0,  3.8, 2.0 ],
    [  4.0, -3.5, 1.9 ], [ -3.5, -2.8, 2.0 ],
    [  0.5,  5.0, 1.8 ], [ -3.0,  4.5, 1.9 ],
  ];
  // Mid ring (~0.56-0.72 → group at 0.65)
  const STARS_MID: [number, number, number][] = [
    [ 10.0,  3.5, 1.8 ], [ -9.0,  5.0, 1.6 ],
    [  7.5, -9.0, 1.7 ], [-10.0, -7.0, 1.6 ],
    [ 12.5, -5.0, 1.5 ], [  2.0, 12.5, 1.8 ],
    [-11.5,  2.0, 1.6 ], [ 12.0,  8.5, 1.4 ],
    [ -6.0,-12.5, 1.7 ], [  9.0, 11.5, 1.5 ],
    [-13.5,  7.5, 1.4 ], [ 14.0, -2.0, 1.6 ],
    [  5.0,-15.0, 1.3 ], [-14.0, -4.5, 1.5 ],
  ];
  // Outer sparse halo (~0.26-0.42 → group at 0.35)
  const STARS_HALO: [number, number, number][] = [
    [ 20.0,  5.0, 1.1 ], [-19.0, 10.0, 1.0 ],
    [ 17.0,-13.5, 1.2 ], [-17.5,-12.0, 1.0 ],
    [ 12.0, 20.0, 1.0 ], [-10.0,-21.0, 1.1 ],
    [ 22.5, -6.0, 0.9 ], [-22.0,  3.5, 1.0 ],
    [  7.5,-22.0, 1.1 ], [ -8.0, 21.5, 0.9 ],
    [ 19.5, 14.5, 1.0 ], [-20.5,-15.0, 0.9 ],
    [ 24.0,  2.5, 0.8 ], [-24.5, -7.0, 0.8 ],
    [ 15.0,-20.0, 0.9 ], [-14.5, 21.5, 0.8 ],
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

  <!-- Star field — 3 fill-opacity bands, 3 draw calls instead of 38 individual.
       fill-opacity is inherited per-element (no compositing layer vs group opacity) -->
  <g fill="white" fill-opacity="0.90">
    {#each STARS_CORE as [sx, sy, sr]}
      <circle cx={sx} cy={sy} r={sr} />
    {/each}
  </g>
  <g fill="white" fill-opacity="0.65">
    {#each STARS_MID as [sx, sy, sr]}
      <circle cx={sx} cy={sy} r={sr} />
    {/each}
  </g>
  <g fill="white" fill-opacity="0.35">
    {#each STARS_HALO as [sx, sy, sr]}
      <circle cx={sx} cy={sy} r={sr} />
    {/each}
  </g>

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

  /* Hover ring — stroke-opacity avoids compositing layer vs opacity */
  .halo-ring {
    stroke-opacity: 0;
    stroke-width: 0.8;
    transition: stroke-opacity 0.3s ease, stroke-width 0.3s ease;
    pointer-events: none;
  }

  @media (hover: hover) {
    .quanta:hover .halo-ring {
      stroke-opacity: 0.7;
      stroke-width: 2;
      animation: border-pulse 1.2s ease-in-out infinite;
    }

    .quanta:hover .quanta-lbl {
      fill: rgba(255,228,130,1);
    }
  }

  @keyframes border-pulse {
    0%, 100% { stroke-opacity: 0.4; stroke-width: 0.5; }
    50%       { stroke-opacity: 0.8; stroke-width: 1.5; }
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
