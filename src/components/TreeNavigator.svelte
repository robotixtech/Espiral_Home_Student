<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { ProgramData, ProgramUnit, Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import { PREV_PROGRAM_CONFIG, NEXT_PROGRAM_CONFIG, FUTURE_PROGRAM_CONFIG } from '../lib/program-config';
  import UnitNode from './UnitNode.svelte';
  import DistantGalaxy from './DistantGalaxy.svelte';
  import ActivityNode from './ActivityNode.svelte';
  import { getActivityOrbitPositions, getActivityOrbitPositionsFixed } from '../lib/tree-math';

  interface Props {
    program: ProgramData;
    onUnitSelected: (unit: ProgramUnit) => void;
    onActivitySelected: (activity: Activity) => void;
  }

  let { program, onUnitSelected, onActivitySelected }: Props = $props();

  // ── A: Canvas (reduced so content fills the viewport better) ─────────────
  const W  = 1150;
  const H  = 850;
  const cx = 575;   // horizontal centre
  const cy = 430;   // vertical centre (slight upward bias)

  // ── B: Node sizes (larger for legibility on 14" displays) ────────────────
  const UNIT_SIZE   = 85;    // planet diameter → r ≈ 42 (regular) / 49 (first)
  const ACT_ORBIT   = 65;    // distance from planet centre to moon centre
  const LABEL_GAP   = 80;    // from planet edge to label; clears moon ring (65+10=75)
  const ORBIT_STEP  = 68;    // px between consecutive orbit radii (+10%)
  const SUN_R       = 9;     // sun radius
  const ORBIT_START = 80;    // radius of innermost orbit

  // Golden angle (~137.5°): irrational step so no two adjacent-orbit planets
  // ever align radially → moon rings on neighbouring orbits never collide.
  const GOLDEN      = 137.508 * Math.PI / 180;
  const START_ANGLE = -Math.PI / 2;   // first planet at 12 o'clock

  const t = $derived(getTheme());

  const orbitRadii    = $derived(program.units.map((_, i) => ORBIT_START + i * ORBIT_STEP));
  const progLblR      = $derived(orbitRadii[orbitRadii.length - 1] + 160);

  // Outermost completed orbit radius — used for the sun pulse animation
  const lastCompletedIdx = $derived(
    effectiveStatuses.reduce((last, st, i) => st === 'completed' ? i : last, -1)
  );

  // Effective unit status: 'completed' as soon as DemoDay is done.
  // "Continuar" is optional and must not block the unit from turning green or unlocking the next one.
  const effectiveStatuses = $derived(
    program.units.map(unit => {
      if (unit.status === 'locked' || unit.status === 'completed') return unit.status;
      const all = unit.activities ?? [];
      if (all.length === 0) return unit.status;
      const demoDayIdx = all.findIndex(a => a.label === 'DemoDay');
      const threshold = demoDayIdx >= 0
        ? ((demoDayIdx + 1) / all.length) * 100
        : 100; // no DemoDay → require full completion
      return unit.progress >= threshold
        ? ('completed' as const)
        : ('in-progress' as const);
    }),
  );
  const unitPositions = $derived(
    program.units.map((_, i) => {
      const a = START_ANGLE + i * GOLDEN;
      const r = ORBIT_START + i * ORBIT_STEP;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }),
  );

  // ── Activity moons ───────────────────────────────────────────────────────

  function displayActivities(unit: ProgramUnit): Activity[] {
    const raw = unit.activities ?? [];
    if (raw.length === 0) return raw;
    if (unit.status === 'locked') return raw.map(a => ({ ...a, status: 'locked' as const, progress: 0 }));
    if (unit.status === 'completed') return raw.map(a => ({ ...a, status: 'completed' as const, progress: 100 }));
    const count = raw.length;
    const per   = 100 / count;
    return raw.map((act, i) => {
      const s = i * per, e = (i + 1) * per;
      if (unit.progress >= e) return { ...act, status: 'completed'   as const, progress: 100 };
      if (unit.progress >= s) return { ...act, status: 'in-progress' as const, progress: Math.min(((unit.progress - s) / per) * 100, 100) };
      return { ...act, status: 'locked' as const, progress: 0 };
    });
  }

  const activityPositions = $derived.by(() =>
    program.units.map((unit, i) => {
      if (!unit.activities?.length) return [] as { x: number; y: number }[];
      const uPos = unitPositions[i];
      // Pin "DemoDay" to 6 o'clock (π/2) so every unit has the same activity layout.
      const demoDayIdx = unit.activities.findIndex(a => a.label === 'DemoDay');
      if (demoDayIdx >= 0) {
        return getActivityOrbitPositionsFixed(uPos.x, uPos.y, unit.activities.length, ACT_ORBIT, demoDayIdx);
      }
      return getActivityOrbitPositions(uPos.x, uPos.y, cx, cy, unit.activities.length, ACT_ORBIT);
    }),
  );

  // ── Dynamic viewBox ───────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | undefined = $state();
  let svgEl: SVGSVGElement | undefined        = $state();
  let cW = $state(W);
  let cH = $state(H);

  const CONTENT = { w: W - 20, h: H };

  const vb = $derived.by(() => {
    const car = cW / cH, ctar = CONTENT.w / CONTENT.h;
    let vbW: number, vbH: number;
    if (car >= ctar) { vbH = CONTENT.h; vbW = vbH * car; }
    else             { vbW = CONTENT.w; vbH = vbW / car; }
    return { x: cx - vbW / 2, y: cy - vbH / 2, w: vbW, h: vbH };
  });

  const isPortrait = $derived(cW / cH < 1.0);

  const dgNext   = $derived({ cx: vb.x + vb.w * (isPortrait ? 0.22 : 0.06), cy: vb.y + vb.h * (isPortrait ? 0.07 : 0.08) });
  const dgFuture = $derived({ cx: vb.x + vb.w * (isPortrait ? 0.80 : 0.93), cy: vb.y + vb.h * (isPortrait ? 0.04 : 0.05) });
  const dgPrev   = $derived({ cx: vb.x + vb.w * (isPortrait ? 0.14 : 0.03), cy: vb.y + vb.h * (isPortrait ? 0.94 : 0.93) });

  // ── C: Zoom / Pan ─────────────────────────────────────────────────────────
  // State: translate(panX, panY) scale(zoomScale) applied to all content.
  // Zooming toward the mouse pointer keeps the hovered point fixed on screen.
  // Pan: left-click drag. Reset: double-click anywhere on the canvas.

  let zoomScale  = $state(1.0);
  let panX       = $state(0.0);
  let panY       = $state(0.0);
  let isDragging = $state(false);
  let lastMX = 0, lastMY = 0;
  let autoAnimFrame: number | null = null;

  const zoomPct       = $derived(Math.round(zoomScale * 100));
  const zoomTransform = $derived(`translate(${panX},${panY}) scale(${zoomScale})`);

  // ── Auto-center on the in-progress unit ──────────────────────────────────
  const inProgressIdx = $derived(effectiveStatuses.findIndex(s => s === 'in-progress'));

  $effect(() => {
    const idx = inProgressIdx;        // única dependencia reactiva
    if (idx < 0) return;

    const pos = untrack(() => unitPositions[idx]);  // sin suscripción
    const scale   = untrack(() => zoomScale);
    const startPX = untrack(() => panX);
    const startPY = untrack(() => panY);

    const targetPX = cx - pos.x * scale;
    const targetPY = cy - pos.y * scale;
    const dX = targetPX - startPX;
    const dY = targetPY - startPY;

    if (autoAnimFrame !== null) { cancelAnimationFrame(autoAnimFrame); autoAnimFrame = null; }

    const duration = 750;
    const t0 = performance.now();
    function step(now: number) {
      const p    = Math.min((now - t0) / duration, 1);
      const ease = 1 - (1 - p) ** 3; // cubic-out
      panX = startPX + dX * ease;
      panY = startPY + dY * ease;
      autoAnimFrame = p < 1 ? requestAnimationFrame(step) : null;
    }
    autoAnimFrame = requestAnimationFrame(step);
  });

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const mx   = vb.x + (e.clientX - rect.left) / rect.width  * vb.w;
    const my   = vb.y + (e.clientY - rect.top)  / rect.height * vb.h;
    const ns   = Math.max(0.35, Math.min(5, zoomScale * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    panX = mx - (mx - panX) * (ns / zoomScale);
    panY = my - (my - panY) * (ns / zoomScale);
    zoomScale = ns;
  }

  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    if (autoAnimFrame !== null) { cancelAnimationFrame(autoAnimFrame); autoAnimFrame = null; }
    isDragging = true; lastMX = e.clientX; lastMY = e.clientY;
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging || !svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    panX += (e.clientX - lastMX) * vb.w / rect.width;
    panY += (e.clientY - lastMY) * vb.h / rect.height;
    lastMX = e.clientX; lastMY = e.clientY;
  }

  function onMouseUp()    { isDragging = false; }
  function onMouseLeave() { isDragging = false; }
  function resetView() {
    if (autoAnimFrame !== null) { cancelAnimationFrame(autoAnimFrame); autoAnimFrame = null; }
    zoomScale = 1; panX = 0; panY = 0;
  }

  // ── Touch support (tablet / mobile) ──────────────────────────────────────
  let lastTouchDist = 0;  // distance between two fingers for pinch-zoom
  let lastTX = 0, lastTY = 0;

  function onTouchStart(e: TouchEvent) {
    if (autoAnimFrame !== null) { cancelAnimationFrame(autoAnimFrame); autoAnimFrame = null; }
    if (e.touches.length === 1) {
      isDragging = true;
      lastTX = e.touches[0].clientX;
      lastTY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      lastTouchDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
    }
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();

    if (e.touches.length === 1 && isDragging) {
      // Single finger: pan
      panX += (e.touches[0].clientX - lastTX) * vb.w / rect.width;
      panY += (e.touches[0].clientY - lastTY) * vb.h / rect.height;
      lastTX = e.touches[0].clientX;
      lastTY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Two fingers: pinch-zoom toward midpoint
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
      if (lastTouchDist > 0) {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const mx = vb.x + (midX - rect.left) / rect.width  * vb.w;
        const my = vb.y + (midY - rect.top)  / rect.height * vb.h;
        const ns = Math.max(0.35, Math.min(5, zoomScale * (dist / lastTouchDist)));
        panX = mx - (mx - panX) * (ns / zoomScale);
        panY = my - (my - panY) * (ns / zoomScale);
        zoomScale = ns;
      }
      lastTouchDist = dist;
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) isDragging = false;
    if (e.touches.length < 2)   lastTouchDist = 0;
    // Double-tap (two taps within 300ms) resets view
    if (e.changedTouches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime < 300) { e.preventDefault(); resetView(); }
      lastTapTime = now;
    }
  }
  let lastTapTime = 0;

  // ── Unit label helpers ───────────────────────────────────────────────────
  // Splits a label into lines of at most maxChars characters.
  function splitUnitLabel(text: string, maxChars = 15): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      if (current && (current + ' ' + word).length > maxChars) {
        lines.push(current);
        current = word;
      } else {
        current = current ? current + ' ' + word : word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  // ── Orbit arc label paths ─────────────────────────────────────────────────
  // Labels follow the curvature of each orbit ring, placed just inside the ring.
  // Top-half arcs (sin ≤ 0) are clockwise → text reads L-to-R.
  // Bottom-half arcs (sin > 0) are counter-clockwise → text reads L-to-R.
  const LABEL_CHAR_W = 9.0; // avg char width at 16px Rubik

  function orbitLabelPath(r: number, a: number, span: number): string {
    if (Math.sin(a) <= 0) {
      const sx = cx + r * Math.cos(a - span);
      const sy = cy + r * Math.sin(a - span);
      const ex = cx + r * Math.cos(a + span);
      const ey = cy + r * Math.sin(a + span);
      return `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
    } else {
      const sx = cx + r * Math.cos(a + span);
      const sy = cy + r * Math.sin(a + span);
      const ex = cx + r * Math.cos(a - span);
      const ey = cy + r * Math.sin(a - span);
      return `M ${sx} ${sy} A ${r} ${r} 0 0 0 ${ex} ${ey}`;
    }
  }

  // ── Interaction ──────────────────────────────────────────────────────────

  // True when ALL activities (including "Continuar") are completed for a unit.
  // This is the trigger for auto-hiding the moons.
  const allActivitiesCompleted = $derived(
    program.units.map(unit => {
      const acts = unit.activities ?? [];
      if (acts.length === 0) return false;
      return displayActivities(unit).every(a => a.status === 'completed');
    }),
  );

  // Tracks units whose moon visibility has been manually toggled by the user.
  // XOR with the default: toggled=false → show when not all completed, hide when all completed.
  //                       toggled=true  → reverse of above.
  let toggledUnits = $state(new Set<number>());

  function handleUnitClick(unit: ProgramUnit, i: number) {
    if (effectiveStatuses[i] === 'locked') return;
    if ((unit.activities?.length ?? 0) === 0) return;
    const next = new Set(toggledUnits);
    if (next.has(unit.id)) { next.delete(unit.id); } else { next.add(unit.id); }
    toggledUnits = next;
  }

  onMount(() => {
    if (!containerEl) return;
    const ro = new ResizeObserver(([entry]) => {
      cW = entry.contentRect.width;
      cH = entry.contentRect.height;
    });
    ro.observe(containerEl);
    // Wheel + touch must be non-passive to call preventDefault()
    svgEl?.addEventListener('wheel',      onWheel,      { passive: false });
    svgEl?.addEventListener('touchstart', onTouchStart, { passive: true });
    svgEl?.addEventListener('touchmove',  onTouchMove,  { passive: false });
    svgEl?.addEventListener('touchend',   onTouchEnd,   { passive: false });
    return () => {
      ro.disconnect();
      svgEl?.removeEventListener('wheel', onWheel);
    };
  });
</script>

<div class="galaxy-container" bind:this={containerEl}>
  <div class="galaxy-wrapper" style:box-shadow={t.wrapperShadow}>
    <svg
      bind:this={svgEl}
      viewBox="{vb.x} {vb.y} {vb.w} {vb.h}"
      class="galaxy-svg"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style:cursor={isDragging ? 'grabbing' : 'grab'}
      onmousedown={onMouseDown}
      onmousemove={onMouseMove}
      onmouseup={onMouseUp}
      onmouseleave={onMouseLeave}
      ondblclick={resetView}
    >
      <defs>
        <radialGradient id="ss-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%"   stop-color={t.bg.center} />
          <stop offset="60%"  stop-color={t.bg.mid} />
          <stop offset="100%" stop-color={t.bg.edge} />
        </radialGradient>
        <radialGradient id="ss-sun" cx="35%" cy="35%" r="65%">
          <stop offset="0%"   stop-color="#d4ffcc" />
          <stop offset="50%"  stop-color="#39ff14" />
          <stop offset="100%" stop-color="#006622" />
        </radialGradient>
        <filter id="ss-sun-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="8" in="SourceGraphic" result="blur" />
          <feFlood flood-color="#39ff14" flood-opacity="0.50" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="ss-orbit-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" in="SourceGraphic" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <!-- Subtle drop shadow for program title -->
        <filter id="text-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.55" />
        </filter>
        <!-- Program name label path — same double-loop pattern as DistantGalaxy, at outermost orbit -->
        <path id="c450-prog-lbl"
              d="M {cx - progLblR},{cy} a {progLblR},{progLblR} 0 1,1 {progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {-progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {-progLblR * 2},0"
              fill="none" />
      </defs>

      <!-- Static background (not affected by zoom) -->
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#ss-bg)" opacity="0.88" />

      <!-- ── Zoomable content ───────────────────────────────────────── -->
      <g transform={zoomTransform}>

        <!-- ── Outer HUD ring ────────────────────────────────────────────── -->
        {#if true}
          {@const outerR   = orbitRadii[orbitRadii.length - 1] + 120}
          {@const hud      = 'rgba(0,180,255,0.85)'}
          {@const hudFaint = 'rgba(0,180,255,0.4)'}
          {@const ticks    = 72}
          <!-- Outer border circle -->
          <circle cx={cx} cy={cy} r={outerR + 4} fill="none" stroke={hud} stroke-width="1" opacity="1" />
          <!-- Inner border circle -->
          <circle cx={cx} cy={cy} r={outerR - 14} fill="none" stroke={hud} stroke-width="0.7" opacity="0.75" />
          <!-- Travelling light: same size as tick marks, loops via SVG animate -->
          {@const sweepC = 2 * Math.PI * (outerR + 4)}
          <circle cx={cx} cy={cy} r={outerR + 4} fill="none"
                  stroke="rgba(0,190,255,0.95)" stroke-width="6"
                  stroke-dasharray="{sweepC / ticks / 2} {sweepC - sweepC / ticks / 2}" stroke-linecap="square"
                  transform="rotate(-90, {cx}, {cy})">
            <animate attributeName="stroke-dashoffset"
                     from="0" to="{sweepC}"
                     dur="8s" repeatCount="indefinite" />
          </circle>

          <!-- Tick marks -->
          {#each Array.from({length: ticks}, (_, k) => k) as k}
            {@const ang     = (k / ticks) * 2 * Math.PI - Math.PI / 2}
            {@const isMajor = k % 6 === 0}
            {@const r1 = outerR + 4}
            {@const r2 = isMajor ? outerR - 10 : outerR - 4}
            <line
              x1={cx + r1 * Math.cos(ang)} y1={cy + r1 * Math.sin(ang)}
              x2={cx + r2 * Math.cos(ang)} y2={cy + r2 * Math.sin(ang)}
              stroke={hud}
              stroke-width={isMajor ? 2.5 : 1.5}
              stroke-linecap="square"
              opacity={isMajor ? 1 : 0.65}
            />
          {/each}
        {/if}

        <!-- Distant galaxies -->
        <DistantGalaxy config={NEXT_PROGRAM_CONFIG}   cx={dgNext.cx}   cy={dgNext.cy}   scale={0.32} opacity={0.70} fontScale={0.7} />
        <DistantGalaxy config={FUTURE_PROGRAM_CONFIG} cx={dgFuture.cx} cy={dgFuture.cy} scale={0.20} opacity={0.62} fontScale={0.7} />
        <DistantGalaxy config={PREV_PROGRAM_CONFIG}   cx={dgPrev.cx}   cy={dgPrev.cy}   scale={0.30} opacity={0.75} fontScale={0.6} />

        <!-- Orbit rings -->
        {#each program.units as unit, i (unit.id)}
          {@const orbR = orbitRadii[i]}
          {@const orbC = 2 * Math.PI * orbR}
          {@const effSt = effectiveStatuses[i]}
          {@const unitAngleDeg = (START_ANGLE + i * GOLDEN) * 180 / Math.PI}
          {#if effSt === 'completed'}
            <circle cx={cx} cy={cy} r={orbR} fill="none"
                    stroke="rgba(0,180,255,0.85)" stroke-width="1" opacity="0.55" />
          {:else if effSt === 'in-progress'}
            <circle cx={cx} cy={cy} r={orbR} fill="none"
                    stroke="rgba(0,180,255,0.85)" stroke-width="1"
                    stroke-dasharray="5 8" opacity="0.25" />
            {@const dashLen = orbC * (unit.progress / 100)}
            <circle cx={cx} cy={cy} r={orbR} fill="none"
                    stroke="rgba(0,180,255,0.85)" stroke-width="1"
                    stroke-dasharray="{dashLen} {orbC}"
                    stroke-linecap="round"
                    transform="rotate({unitAngleDeg}, {cx}, {cy})"
                    opacity="0.55" />
          {:else}
            <circle cx={cx} cy={cy} r={orbR} fill="none"
                    stroke="rgba(0,180,255,0.85)" stroke-width="1"
                    stroke-dasharray="4 7" opacity="0.55" />
          {/if}
        {/each}

        <!-- Radar sweep — rotating lighthouse beam reaching completed orbits -->
        {#if lastCompletedIdx >= 0}
          {@const pulseR   = orbitRadii[lastCompletedIdx]}
          {@const beamDeg  = 30}
          {@const trailDeg = 110}
          {@const toRad    = (d: number) => d * Math.PI / 180}
          {@const sx  = cx + pulseR}
          {@const sy  = cy}
          {@const bx  = cx + pulseR * Math.cos(-toRad(beamDeg))}
          {@const by  = cy + pulseR * Math.sin(-toRad(beamDeg))}
          {@const tx  = cx + pulseR * Math.cos(-toRad(trailDeg))}
          {@const ty  = cy + pulseR * Math.sin(-toRad(trailDeg))}
          <defs>
            <!-- Main beam: bright near sun, fades radially outward -->
            <radialGradient id="sweep-beam-grad" cx={cx} cy={cy} r={pulseR}
                            gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#d4ffcc" stop-opacity="0.05" />
              <stop offset="10%"  stop-color="#39ff14" stop-opacity="0.72" />
              <stop offset="55%"  stop-color="#00cc44" stop-opacity="0.38" />
              <stop offset="100%" stop-color="#006622" stop-opacity="0" />
            </radialGradient>
            <!-- Trail: very faint fade-off behind the beam -->
            <radialGradient id="sweep-trail-grad" cx={cx} cy={cy} r={pulseR}
                            gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#39ff14" stop-opacity="0.04" />
              <stop offset="45%"  stop-color="#00cc44" stop-opacity="0.13" />
              <stop offset="100%" stop-color="#006622" stop-opacity="0" />
            </radialGradient>
            <clipPath id="sweep-clip">
              <circle cx={cx} cy={cy} r={pulseR} />
            </clipPath>
          </defs>

          <g clip-path="url(#sweep-clip)">
            <!-- Trailing glow (wide, faint) -->
            <path d="M {cx} {cy} L {sx} {sy} A {pulseR} {pulseR} 0 0 0 {tx} {ty} Z"
                  fill="url(#sweep-trail-grad)">
              <animateTransform attributeName="transform" type="rotate"
                                from="0 {cx} {cy}" to="360 {cx} {cy}"
                                dur="6s" repeatCount="indefinite" />
            </path>
            <!-- Leading beam (narrow, bright) -->
            <path d="M {cx} {cy} L {sx} {sy} A {pulseR} {pulseR} 0 0 0 {bx} {by} Z"
                  fill="url(#sweep-beam-grad)">
              <animateTransform attributeName="transform" type="rotate"
                                from="0 {cx} {cy}" to="360 {cx} {cy}"
                                dur="6s" repeatCount="indefinite" />
            </path>
          </g>
        {/if}

        <!-- Horizontal unit labels — above both the unit sphere and its activity moons -->
        {#each program.units as unit, i (unit.id)}
          {@const uPos = unitPositions[i]}
          {@const hasActs = (unit.activities?.length ?? 0) > 0}
          {@const moonsShown = hasActs && (allActivitiesCompleted[i] === toggledUnits.has(unit.id))}
          {@const topClear = moonsShown ? ACT_ORBIT + 20 : (((UNIT_SIZE / 2) * (i === 0 ? 1.15 : 1) + 12) * 1.05)}
          {@const lines = splitUnitLabel(unit.label)}
          {@const lineH = 19}
          {@const lblBaseY = uPos.y - topClear}
          <text
            x={uPos.x}
            y={lblBaseY - (lines.length - 1) * lineH}
            text-anchor="middle"
            class="unit-lbl"
            fill={effectiveStatuses[i] === 'locked' ? t.text.secondary : t.text.primary}
            opacity={effectiveStatuses[i] === 'locked' ? 0.45 : 1}
          >
            {#each lines as line, li (li)}
              <tspan x={uPos.x} dy={li === 0 ? 0 : lineH}>{line}</tspan>
            {/each}
          </text>
        {/each}

        <!-- Central Sun -->
        <circle cx={cx} cy={cy} r={SUN_R + 38} fill="#39ff14" opacity="0.03" />
        <circle cx={cx} cy={cy} r={SUN_R + 22} fill="#39ff14" opacity="0.05" />
        <circle cx={cx} cy={cy} r={SUN_R + 10} fill="#39ff14" opacity="0.10" />
        <circle cx={cx} cy={cy} r={SUN_R + 5}  fill="#d4ffcc" opacity="0.15" />
        <circle cx={cx} cy={cy} r={SUN_R}
                fill="url(#ss-sun)" filter="url(#ss-sun-glow)" />
        <!-- Program shortname curved outside the sun -->
        <text fill="#ffffff" opacity="0.92" class="prog-label" filter="url(#text-shadow)">
          <textPath href="#c450-prog-lbl" startOffset="54%" text-anchor="middle">
            {program.shortname}
          </textPath>
        </text>

        <!-- Activity moons: hidden when all activities green (incl. Continuar), toggleable by click -->
        {#each program.units as unit, i (unit.id)}
          {#if unit.activities && unit.activities.length > 0 && (allActivitiesCompleted[i] === toggledUnits.has(unit.id))}
            {@const uPos = unitPositions[i]}
            {@const acts = displayActivities(unit)}
            {@const aPos = activityPositions[i]}
            {#each acts as act, j (act.id)}
              {#if aPos[j]}
                <ActivityNode
                  activity={act}
                  x={aPos[j].x}
                  y={aPos[j].y}
                  index={i * 10 + j}
                  compact={act.status === 'in-progress'}
                  tiny={act.status !== 'in-progress'}
                  labelAngle={Math.atan2(aPos[j].y - uPos.y, aPos[j].x - uPos.x)}
                  {onActivitySelected}
                />
              {/if}
            {/each}
          {/if}
        {/each}

        <!-- Planet nodes (on top of moons) -->
        {#each program.units as unit, i (unit.id)}
          {@const uPos = unitPositions[i]}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <g
            onclick={() => handleUnitClick(unit, i)}
            onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' && effectiveStatuses[i] !== 'locked') handleUnitClick(unit, i); }}
          >
            <UnitNode
              unit={{ ...unit, status: effectiveStatuses[i] }}
              x={uPos.x}
              y={uPos.y}
              galacticCenterX={cx}
              galacticCenterY={cy}
              size={UNIT_SIZE}
              index={i}
              compact={true}
              labelOutward={true}
              labelGap={LABEL_GAP}
              showLabel={false}
            />
          </g>
        {/each}

      </g><!-- end zoomable -->
    </svg>

    <!-- Zoom HUD (fixed to screen, outside SVG zoom group) -->
    <div class="zoom-hud">
      <span class="zoom-pct">{zoomPct}%</span>
      <button class="zoom-reset" onclick={resetView} title="Doble clic en el canvas para resetear">↺</button>
    </div>
  </div>
</div>

<style>
  .galaxy-container {
    width: 100%; height: 100%;
    position: relative; overflow: hidden;
    margin: 0; padding: 0; box-sizing: border-box;
  }
  .galaxy-wrapper {
    width: 100%; height: 100%;
    border-radius: 0; overflow: hidden;
    position: relative;
    transition: box-shadow 0.4s;
  }
  .galaxy-svg { width: 100%; height: 100%; display: block; }


:global(.prog-label) {
    font: 800 32px/1 'Rubik', system-ui, sans-serif;
    letter-spacing: 8px;
    text-transform: uppercase;
  }
  :global(.unit-lbl) {
    font: 600 16px/1 'Rubik', system-ui, sans-serif;
    letter-spacing: 0.2px;
    pointer-events: none;
  }

  /* ── Zoom HUD ── */
  .zoom-hud {
    position: absolute;
    bottom: 14px; right: 14px;
    display: flex; align-items: center; gap: 8px;
    background: rgba(2, 10, 20, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 5px 10px;
    backdrop-filter: blur(6px);
    pointer-events: all;
  }
  .zoom-pct {
    color: #94a3b8;
    font: 500 12px/1 'Rubik', system-ui, sans-serif;
    min-width: 36px;
    text-align: right;
  }
  .zoom-reset {
    background: none; border: none;
    color: #64748b; cursor: pointer;
    font-size: 15px; padding: 0 2px;
    line-height: 1;
    transition: color 0.15s;
  }
  .zoom-reset:hover { color: #f1f5f9; }
</style>
