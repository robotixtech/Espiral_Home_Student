<script lang="ts">
  import type { ProgramConfig } from '../lib/program-config';
  import { getTheme } from '../lib/theme.svelte';
  import {
    type SpiralConfig,
    getSpiralNodePositions,
    getSpiralSvgPath,
  } from '../lib/spiral-math';

  interface Props {
    config: ProgramConfig;
    cx: number;
    cy: number;
    scale?: number;
    /** Depth opacity — closer galaxies are more visible */
    opacity?: number;
  }

  let { config, cx, cy, scale = 0.35, opacity = 0.45 }: Props = $props();

  const theme = $derived(getTheme());

  const miniSpiral: SpiralConfig = {
    cx: 0, cy: 0,
    r0x: 145 * scale,
    r0y: 125 * scale,
    r1x: 355 * scale,
    r1y: 315 * scale,
    startAngle: -Math.PI / 2,
    turns: 1.3,
  };

  const nodePositions = $derived(getSpiralNodePositions(miniSpiral, config.units.length));
  const spiralPath = $derived(getSpiralSvgPath(miniSpiral, 200));

  const orbitRx = $derived(250 * scale);
  const orbitRy = $derived(220 * scale);
  const labelRx = $derived(390 * scale);
  const labelRy = $derived(350 * scale);

  const nodeR = 5;
  const sunR = 8;

  // Determine label position: push outward from galaxy center
  function labelY(pos: { x: number; y: number }): number {
    return pos.y >= 0 ? nodeR + 12 : -(nodeR + 5);
  }
  function labelAnchor(_pos: { x: number; y: number }): string {
    return 'middle';
  }
</script>

<g transform="translate({cx}, {cy})" class="distant-galaxy" opacity={opacity}>
  <defs>
    <radialGradient id="dg-core-{config.shortname}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color={theme.sun.g2} stop-opacity="0.15" />
      <stop offset="100%" stop-color={theme.sun.g2} stop-opacity="0" />
    </radialGradient>

    <!-- Double-loop for label textPath -->
    <path id="dg-label-{config.shortname}"
          d="M {-labelRx},0 a {labelRx},{labelRy} 0 1,1 {labelRx * 2},0 a {labelRx},{labelRy} 0 1,1 {-labelRx * 2},0 a {labelRx},{labelRy} 0 1,1 {labelRx * 2},0 a {labelRx},{labelRy} 0 1,1 {-labelRx * 2},0"
          fill="none" />
  </defs>

  <!-- Core glow -->
  <ellipse cx="0" cy="0" rx={orbitRx * 1.3} ry={orbitRy * 1.3}
           fill="url(#dg-core-{config.shortname})" />

  <!-- Orbit ring -->
  <ellipse cx="0" cy="0" rx={orbitRx} ry={orbitRy}
           fill="none" stroke={theme.orbit} stroke-width="0.6" />

  <!-- Mini spiral path -->
  <path d={spiralPath} fill="none"
        stroke={theme.spiral} stroke-width="1.2"
        stroke-dasharray="5 5" stroke-linecap="round" />

  <!-- Sun -->
  <circle cx="0" cy="0" r={sunR} fill={theme.sun.g2} opacity="0.6" />
  <circle cx="0" cy="0" r={sunR * 1.8} fill="none"
          stroke={theme.sun.g2} stroke-width="0.4" opacity="0.25" />

  <!-- Unit nodes with labels -->
  {#each nodePositions as pos, i}
    {@const cfg = config.units[i]}
    <g transform="translate({pos.x}, {pos.y})">
      <!-- Node dot -->
      <circle cx="0" cy="0" r={nodeR}
              fill={theme.text.secondary} opacity="0.5" />

      <!-- Unit label -->
      <text
        y={labelY(pos)}
        text-anchor={labelAnchor(pos)}
        class="dg-node-label"
        fill={theme.text.secondary}
        opacity="0.8"
      >
        {cfg?.label ?? ''}
      </text>

      <!-- Display name -->
      <text
        y={labelY(pos) + (pos.y >= 0 ? 11 : -11)}
        text-anchor={labelAnchor(pos)}
        class="dg-node-name"
        fill={theme.text.secondary}
        opacity="0.55"
      >
        {cfg?.displayName ?? ''}
      </text>
    </g>
  {/each}

  <!-- Program name curved along outer orbit -->
  <text class="dg-label" fill="#ffffff" opacity="0.6">
    <textPath href="#dg-label-{config.shortname}" startOffset="54%" text-anchor="middle">
      {config.fullname}
    </textPath>
  </text>
</g>

<style>
  .distant-galaxy {
    transition: opacity 0.3s;
  }
  :global(.dg-label) {
    font: 700 16px/1 'Inter', system-ui, sans-serif;
    letter-spacing: 6px;
    text-transform: uppercase;
  }
  :global(.dg-node-label) {
    font: 700 9.5px/1 'Inter', system-ui, sans-serif;
  }
  :global(.dg-node-name) {
    font: 400 9px/1 'Inter', system-ui, sans-serif;
  }
</style>
