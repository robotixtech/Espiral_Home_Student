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
  const UNIT_R      = $derived(42 * scale);   // half of UNIT_SIZE=85, roughly
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

  const progLblR = $derived(ORBIT_START + (config.units.length - 1) * ORBIT_STEP + 20 * scale);

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

  function unitColors(status: string) {
    switch (status) {
      case 'completed':  return t.unit.completed;
      case 'in-progress': return t.unit.inProgress;
      default:           return t.unit.locked;
    }
  }
</script>

<g transform="translate({cx}, {cy})" opacity={opacity}>
  <defs>
    <radialGradient id="dg-sun-{config.shortname}" cx="35%" cy="35%" r="65%">
      <stop offset="0%"   stop-color="#fff9c4" />
      <stop offset="50%"  stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#b45309" />
    </radialGradient>
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

  <!-- Orbit rings -->
  {#each config.units as _unit, i (_unit.label)}
    {@const r = ORBIT_START + i * ORBIT_STEP}
    <circle cx="0" cy="0" r={r} fill="none"
            stroke="rgba(255,255,255,0.05)" stroke-width="0.5"
            stroke-dasharray="3 6" />
  {/each}

  <!-- Sun -->
  <circle cx="0" cy="0" r={SUN_R * 1.8} fill="#f59e0b" opacity="0.05" />
  <circle cx="0" cy="0" r={SUN_R}       fill="url(#dg-sun-{config.shortname})" opacity="0.8" />

  <!-- Activity moons (tiny dots) — hidden when unit completed -->
  {#each config.units as unit, i (unit.label)}
    {#if unit.activities?.length && unit.status !== 'completed'}
      {@const aPos = activityPositions[i]}
      {#each unit.activities as act, j (j)}
        {#if aPos[j]}
          <circle cx={aPos[j].x} cy={aPos[j].y}
                  r={3.5 * scale}
                  fill={unitColors(act.status).g2}
                  opacity={act.status === 'locked' ? 0.25 : 0.70} />
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
            opacity={unit.status === 'locked' ? 0.40 : 0.85} />
    {#if unit.status === 'locked'}
      <!-- Lock icon scaled for tiny node -->
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

  <!-- Program label curved at outermost orbit -->
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
