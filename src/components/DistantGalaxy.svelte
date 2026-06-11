<script lang="ts">
  import type { ProgramConfig } from '../lib/program-config';
  import { getActivityOrbitPositions, getActivityOrbitPositionsFixed } from '../lib/tree-math';

  // ── Colour tokens for completed galaxies — edit here to adjust ─────────────
  const COMPLETED_SPHERE_RGB   = '52,211,153';  // green tint
  const COMPLETED_SPHERE_ALPHA = 0.25;           // base alpha before depth bake
  const COMPLETED_ORBIT_ALPHA  = 0.35;           // orbit ring alpha (continuous, green)

  interface Props {
    config: ProgramConfig;
    cx: number;
    cy: number;
    scale?: number;
    /** Depth opacity — baked into all rgba colors, no compositing layer created */
    opacity?: number;
    /** Font scale multiplier */
    fontScale?: number;
    /** True when the student has already completed this galaxy */
    isCompleted?: boolean;
  }

  let { config, cx, cy, scale = 0.35, opacity = 0.45, fontScale = 1, isCompleted = false }: Props = $props();

  // All colours have depth opacity baked in → 0 compositing ops for this component
  const cOrbit   = $derived(
    isCompleted
      ? `rgba(${COMPLETED_SPHERE_RGB},${(COMPLETED_ORBIT_ALPHA * opacity).toFixed(3)})`
      : `rgba(0,180,255,${(0.47 * opacity).toFixed(3)})`
  );
  const cMoon    = $derived(`rgba(31,41,55,${(0.25   * opacity).toFixed(3)})`);
  const cSphere  = $derived(
    isCompleted
      ? `rgba(${COMPLETED_SPHERE_RGB},${(COMPLETED_SPHERE_ALPHA * opacity).toFixed(3)})`
      : `rgba(55,65,81,${opacity.toFixed(3)})`
  );
  const cIcon    = $derived(`rgba(107,114,128,${(0.6  * opacity).toFixed(3)})`);
  const cLabel   = $derived(`rgba(255,255,255,${(0.55 * opacity).toFixed(3)})`);

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
</script>

<!-- No opacity attribute anywhere — 0 compositing ops total -->
<g transform="translate({cx}, {cy})">
  <defs>
    <path id="dg-lbl-{config.shortname}"
          d="M {-progLblR},0 a {progLblR},{progLblR} 0 1,1 {progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {-progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {-progLblR * 2},0"
          fill="none" />
  </defs>

  <!-- Orbit rings — continuous green for completed, dashed blue for upcoming -->
  <g fill="none" stroke={cOrbit} stroke-width={scale}>
    {#each config.units as _unit, i (i)}
      {@const r = ORBIT_START + i * ORBIT_STEP}
      <circle cx="0" cy="0" r={r} stroke-dasharray={isCompleted ? undefined : `${4 * scale} ${7 * scale}`} />
    {/each}
  </g>

  <!-- Activity moons -->
  <g fill={cMoon}>
    {#each config.units as unit, i (unit.label)}
      {#if unit.activities?.length}
        {@const aPos = activityPositions[i]}
        {#each unit.activities as _act, j (j)}
          {#if aPos[j]}
            <circle cx={aPos[j].x} cy={aPos[j].y} r={3.5 * scale} />
          {/if}
        {/each}
      {/if}
    {/each}
  </g>

  <!-- Unit spheres -->
  <g fill={cSphere}>
    {#each config.units as _unit, i (i)}
      {@const uPos = unitPositions[i]}
      {@const r = UNIT_R * (i === 0 ? 1.15 : 1)}
      <circle cx={uPos.x} cy={uPos.y} r={r} />
    {/each}
  </g>

  <!-- Lock icons — only for galaxies not yet completed -->
  {#if !isCompleted}
    <g>
      {#each config.units as _unit, i (i)}
        {@const uPos = unitPositions[i]}
        {@const r = UNIT_R * (i === 0 ? 1.15 : 1)}
        <svg x={uPos.x - r * 0.45} y={uPos.y - r * 0.55}
             width={r * 0.9} height={r * 1.1}
             viewBox="0 0 24 24" fill="none"
             stroke={cIcon} stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      {/each}
    </g>
  {/if}

  <!-- Program name -->
  <text fill={cLabel}
        font-size={31.2 * fontScale * scale} font-weight="400" letter-spacing={6 * scale}
        font-family="Rubik, system-ui, sans-serif">
    <textPath href="#dg-lbl-{config.shortname}" startOffset="54%" text-anchor="middle">
      {config.fullname}
    </textPath>
  </text>
</g>
