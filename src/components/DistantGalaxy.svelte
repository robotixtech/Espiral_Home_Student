<script lang="ts">
  import type { ProgramConfig } from '../lib/program-config';
  import { getTheme } from '../lib/theme.svelte';
  import { getActivityOrbitPositions, getActivityOrbitPositionsFixed } from '../lib/tree-math';

  interface Props {
    config: ProgramConfig;
    cx: number;
    cy: number;
    scale?: number;
    /** Depth opacity — closer galaxies are more visible */
    opacity?: number;
    /** Font scale multiplier */
    fontScale?: number;
  }

  let { config, cx, cy, scale = 0.35, opacity = 0.45, fontScale = 1 }: Props = $props();

  const t = $derived(getTheme());

  // Same layout constants as TreeNavigator, scaled down
  const SUN_R       = $derived(9  * scale);
  const UNIT_R      = $derived(42 * scale);
  const ACT_ORBIT   = $derived(65 * scale);
  const ORBIT_STEP  = $derived(68 * scale);
  const ORBIT_START = $derived(80 * scale);
  const GOLDEN      = 137.508 * Math.PI / 180;
  const START_ANGLE = -Math.PI / 2;

  const unitPositions = $derived(
    config.units.map((_, i) => {
      const a = START_ANGLE + i * GOLDEN;
      const r = ORBIT_START + i * ORBIT_STEP;
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    }),
  );

  // Label outside the outermost orbit (no radar ring here)
  const lastOrbitR = $derived(ORBIT_START + (config.units.length - 1) * ORBIT_STEP);
  const progLblR   = $derived(lastOrbitR + 28 * scale);

  const activityPositions = $derived(
    config.units.map((unit, i) => {
      if (!unit.activities?.length) return [] as { x: number; y: number }[];
      const uPos = unitPositions[i];
      const demoDayIdx = unit.activities.findIndex(a => a.label === 'DemoDay');
      if (demoDayIdx >= 0) {
        return getActivityOrbitPositionsFixed(uPos.x, uPos.y, unit.activities.length, ACT_ORBIT, demoDayIdx);
      }
      return getActivityOrbitPositions(uPos.x, uPos.y, 0, 0, unit.activities.length, ACT_ORBIT);
    }),
  );

  // Distant galaxies always render as fully locked (not yet accessible)
  function unitColors(_status: string) {
    return t.unit.locked;
  }
</script>

<g transform="translate({cx}, {cy})" opacity={opacity}>
  <defs>
    {#each config.units as unit, i (unit.label)}
      <radialGradient id="dg-u-{config.shortname}-{i}" cx="35%" cy="35%" r="65%">
        <stop offset="0%"   stop-color={unitColors(unit.status).g1} />
        <stop offset="100%" stop-color={unitColors(unit.status).g2} />
      </radialGradient>
    {/each}
    <!-- Program label path — double-loop arc -->
    <path id="dg-lbl-{config.shortname}"
          d="M {-progLblR},0 a {progLblR},{progLblR} 0 1,1 {progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {-progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {-progLblR * 2},0"
          fill="none" />
  </defs>

  <!-- Orbit rings — same style as C450 (no radar border) -->
  {#each config.units as unit, i (unit.label)}
    {@const r    = ORBIT_START + i * ORBIT_STEP}
    {@const orbC = 2 * Math.PI * r}
    {@const unitAngleDeg = (START_ANGLE + i * GOLDEN) * 180 / Math.PI}
    <!-- All orbits locked style -->
    <circle cx="0" cy="0" r={r} fill="none"
            stroke="rgba(0,180,255,0.85)" stroke-width={scale}
            stroke-dasharray="{4 * scale} {7 * scale}" opacity="0.55" />
  {/each}


  <!-- Activity moons (tiny dots) — all locked -->
  {#each config.units as unit, i (unit.label)}
    {#if unit.activities?.length}
      {@const aPos = activityPositions[i]}
      {#each unit.activities as _act, j (j)}
        {#if aPos[j]}
          <circle cx={aPos[j].x} cy={aPos[j].y}
                  r={3.5 * scale}
                  fill={unitColors('locked').g2}
                  opacity="0.25" />
        {/if}
      {/each}
    {/if}
  {/each}

  <!-- Unit nodes -->
  {#each config.units as unit, i (unit.label)}
    {@const uPos = unitPositions[i]}
    {@const r = UNIT_R * (i === 0 ? 1.15 : 1)}
    <circle cx={uPos.x} cy={uPos.y} r={r}
            fill="url(#dg-u-{config.shortname}-{i})"
            opacity="0.80" />
    {#if true}
      <svg x={uPos.x - r * 0.45} y={uPos.y - r * 0.55}
           width={r * 0.9} height={r * 1.1}
           viewBox="0 0 24 24" fill="none"
           stroke={unitColors(unit.status).icon} stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" opacity="0.6">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    {/if}
  {/each}

  <!-- Program label curved just outside the outermost orbit -->
  <text fill="#ffffff" opacity="0.55"
        font-size={31.2 * fontScale * scale} font-weight="400" letter-spacing={6 * scale}
        font-family="Rubik, system-ui, sans-serif">
    <textPath href="#dg-lbl-{config.shortname}" startOffset="54%" text-anchor="middle">
      {config.fullname}
    </textPath>
  </text>
</g>

<style>
  g {
    transition: opacity 0.3s;
  }
</style>
