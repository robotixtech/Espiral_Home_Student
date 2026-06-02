<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProgramData, ProgramUnit, Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import { PREV_PROGRAM_CONFIG, NEXT_PROGRAM_CONFIG, FUTURE_PROGRAM_CONFIG } from '../lib/program-config';
  import UnitNode from './UnitNode.svelte';
  import DistantGalaxy from './DistantGalaxy.svelte';
  import ActivityOrbit from './ActivityOrbit.svelte';
  import QuantaCluster from './QuantaCluster.svelte';

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
  const UNIT_SIZE   = 100;   // planet diameter → r ≈ 50 (regular) / 57.5 (first)
  const ACT_ORBIT   = 65;    // distance from planet centre to moon centre
  const LABEL_GAP   = 80;    // from planet edge to label; clears moon ring (65+10=75)
  const ORBIT_STEP  = 68;    // px between consecutive orbit radii (+10%)
  const SUN_R       = 9;     // sun radius
  const ORBIT_START = 80;    // radius of innermost orbit

  // ── Label pill constants ──────────────────────────────────────────────────
  const LABEL_LINE_H  = 19;  // px between line baselines
  const LABEL_PAD_X   = 10;  // horizontal padding inside pill
  const LABEL_PAD_Y   = 5;   // vertical padding inside pill
  const LABEL_GAP_PX  = 14;  // gap from node visual edge to pill near-edge

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
  // Actual visual radius of node i, accounting for isStart (×1.15 inside UnitNode)
  // and the in-progress scale-up (×1.35) applied via the size prop.
  function nodeVisualR(i: number): number {
    const isIP = effectiveStatuses[i] === 'in-progress';
    return UNIT_SIZE / 2 * (i === 0 ? 1.15 : 1.0) * (isIP ? 1.35 : 1.0);
  }

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

  let panelUnit = $state<ProgramUnit | null>(null);
  // Re-derive from live program.units so emulator progress updates animate in the orbit.
  const panelActivities = $derived.by(() => {
    if (!panelUnit) return [];
    const live = program.units.find(u => u.id === panelUnit!.id);
    return live ? displayActivities(live) : [];
  });
  const panelUnitIdx      = $derived(panelUnit ? program.units.findIndex(u => u.id === panelUnit!.id) : -1);
  const panelUnitPos      = $derived(panelUnitIdx >= 0 ? unitPositions[panelUnitIdx] : null);
  const panelUnitR        = $derived(panelUnitIdx >= 0 ? UNIT_SIZE / 2 * (panelUnitIdx === 0 ? 1.15 : 1.0) * 1.35 : UNIT_SIZE / 2);
  const panelOutwardAngle = $derived(
    panelUnitPos ? Math.atan2(panelUnitPos.y - cy, panelUnitPos.x - cx) : 0
  );

  // Auto-close if the emulator cycles the open unit back to 'locked'.
  $effect(() => {
    if (panelUnit && panelUnitIdx >= 0 && effectiveStatuses[panelUnitIdx] === 'locked') panelUnit = null;
  });

  // ── Dynamic viewBox ───────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | undefined = $state();
  let svgEl: SVGSVGElement | undefined        = $state();
  // Use actual window size as initial value so the first render is correct on any device/orientation.
  let cW = $state(window.innerWidth);
  let cH = $state(window.innerHeight);

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
  const dgQuanta = $derived({ cx: vb.x + vb.w * (isPortrait ? 0.78 : 0.86), cy: vb.y + vb.h * (isPortrait ? 0.15 : 0.15) });

  // ── C: Zoom / Pan ─────────────────────────────────────────────────────────
  // State: translate(panX, panY) scale(zoomScale) applied to all content.
  // Zooming toward the mouse pointer keeps the hovered point fixed on screen.
  // Pan: left-click drag. Reset: double-click anywhere on the canvas.

  let zoomScale  = $state(1.0);
  let panX       = $state(0.0);
  let panY       = $state(0.0);
  let isDragging = $state(false);
  let lastMX = 0, lastMY = 0;
  // Timestamp of last touchend — used to ignore synthesized mouse events on Android.
  let lastTouchEndAt = 0;

  const zoomPct       = $derived(Math.round(zoomScale * 100));
  const zoomTransform = $derived(`translate(${panX},${panY}) scale(${zoomScale})`);

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const mx   = vb.x + (e.clientX - rect.left) / rect.width  * vb.w;
    const my   = vb.y + (e.clientY - rect.top)  / rect.height * vb.h;
    const ns   = Math.max(0.20, Math.min(5, zoomScale * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    panX = mx - (mx - panX) * (ns / zoomScale);
    panY = my - (my - panY) * (ns / zoomScale);
    zoomScale = ns;
  }

  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    // Ignore synthesized mouse events that Android fires after touchend
    if (Date.now() - lastTouchEndAt < 500) return;
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
    zoomScale = 1; panX = 0; panY = 0;
  }

  function zoomInBtn() {
    // Center the in-progress unit in the viewport and zoom in.
    const ipIdx = effectiveStatuses.findIndex(s => s === 'in-progress');
    const fx = ipIdx >= 0 ? unitPositions[ipIdx].x : cx;
    const fy = ipIdx >= 0 ? unitPositions[ipIdx].y : cy;
    const ns = Math.min(5, zoomScale * 1.3);
    panX = cx - fx * ns;
    panY = cy - fy * ns;
    zoomScale = ns;
  }

  function zoomOutBtn() {
    const ns = Math.max(0.20, zoomScale / 1.3);
    panX = cx - (cx - panX) * (ns / zoomScale);
    panY = cy - (cy - panY) * (ns / zoomScale);
    zoomScale = ns;
  }

  // ── Touch support (tablet / mobile) ──────────────────────────────────────
  let lastTouchDist = 0;
  let lastTX = 0, lastTY = 0;
  // Prevents double-tap detector from firing when both pinch fingers lift
  // sequentially within 300ms, which would incorrectly call resetView().
  let gestureWasMultiTouch = false;

  // Cached at touchstart to avoid getBoundingClientRect() reflow on every move.
  let cachedRect: DOMRect | null = null;

  // rAF throttling: capture touch deltas each event, apply once per display frame.
  let rafId: number | null = null;
  let pendingPanDx = 0, pendingPanDy = 0;
  let pendingZoomRatio = 1;
  let pendingZoomMidX = 0, pendingZoomMidY = 0;
  let hasPendingZoom = false;

  function applyPendingTouch() {
    rafId = null;
    const rect = cachedRect;
    if (!rect) return;

    if (hasPendingZoom) {
      const mx = vb.x + (pendingZoomMidX - rect.left) / rect.width  * vb.w;
      const my = vb.y + (pendingZoomMidY - rect.top)  / rect.height * vb.h;
      const ns = Math.max(0.20, Math.min(5, zoomScale * pendingZoomRatio));
      panX = mx - (mx - panX) * (ns / zoomScale);
      panY = my - (my - panY) * (ns / zoomScale);
      zoomScale = ns;
      pendingZoomRatio = 1;
      hasPendingZoom = false;
    }

    if (pendingPanDx !== 0 || pendingPanDy !== 0) {
      panX += pendingPanDx * vb.w / rect.width;
      panY += pendingPanDy * vb.h / rect.height;
      pendingPanDx = 0;
      pendingPanDy = 0;
    }
  }

  function onTouchStart(e: TouchEvent) {
    if (svgEl) cachedRect = svgEl.getBoundingClientRect();
    if (e.touches.length === 1) {
      isDragging = true;
      lastTX = e.touches[0].clientX;
      lastTY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      gestureWasMultiTouch = true;
      lastTouchDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
    }
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (!cachedRect) return;

    if (e.touches.length === 1 && isDragging) {
      // Accumulate pixel deltas — applied in bulk on the next rAF tick.
      pendingPanDx += e.touches[0].clientX - lastTX;
      pendingPanDy += e.touches[0].clientY - lastTY;
      lastTX = e.touches[0].clientX;
      lastTY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
      if (lastTouchDist > 0) {
        // Accumulate zoom ratio product; use latest midpoint as focal point.
        pendingZoomMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        pendingZoomMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        pendingZoomRatio *= dist / lastTouchDist;
        hasPendingZoom = true;
      }
      lastTouchDist = dist;
    }

    if (rafId === null) {
      rafId = requestAnimationFrame(applyPendingTouch);
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length < 2) lastTouchDist = 0;
    if (e.touches.length === 0) {
      isDragging = false;
      lastTouchEndAt = Date.now();
      // Double-tap resets view — only for genuine single-finger taps.
      // Skip if the gesture involved 2 fingers: both pinch fingers lifting
      // sequentially would otherwise trigger resetView() within 300ms.
      if (!gestureWasMultiTouch && e.changedTouches.length === 1) {
        const now = lastTouchEndAt;
        if (now - lastTapTime < 300) { e.preventDefault(); resetView(); }
        lastTapTime = now;
      }
      gestureWasMultiTouch = false;
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

  function handleUnitClick(unit: ProgramUnit, i: number) {
    if (effectiveStatuses[i] === 'locked') return;
    if ((unit.activities?.length ?? 0) === 0) { onUnitSelected(unit); return; }
    panelUnit = panelUnit?.id === unit.id ? null : unit;
  }

  onMount(() => {
    // Wheel + touch must be non-passive to call preventDefault()
    svgEl?.addEventListener('wheel',      onWheel,      { passive: false });
    svgEl?.addEventListener('touchstart', onTouchStart, { passive: true });
    svgEl?.addEventListener('touchmove',  onTouchMove,  { passive: false });
    svgEl?.addEventListener('touchend',   onTouchEnd,   { passive: false });
    return () => {
      svgEl?.removeEventListener('wheel', onWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  });
</script>

<div class="galaxy-container" bind:this={containerEl} bind:clientWidth={cW} bind:clientHeight={cH}>
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
      <g transform={zoomTransform} style="will-change: transform">

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
                    stroke={t.unit.completed.ring} stroke-width="1" opacity="0.55" />
          {:else if effSt === 'in-progress'}
            <circle cx={cx} cy={cy} r={orbR} fill="none"
                    stroke={t.unit.completed.ring} stroke-width="1"
                    stroke-dasharray="5 8" opacity="0.20" />
            {@const dashLen = orbC * (unit.progress / 100)}
            <circle cx={cx} cy={cy} r={orbR} fill="none"
                    stroke={t.unit.completed.ring} stroke-width="1"
                    stroke-dasharray="{dashLen} {orbC}"
                    stroke-linecap="round"
                    transform="rotate({unitAngleDeg}, {cx}, {cy})"
                    opacity="0.55" />
          {:else}
            <circle cx={cx} cy={cy} r={orbR} fill="none"
                    stroke="rgba(0,180,255,0.85)" stroke-width="1"
                    stroke-dasharray="4 7" opacity="0.10" />
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

        <!-- Pass 1: Central Sun + non-selected nodes (dimmed by overlay below) -->
        <circle cx={cx} cy={cy} r={SUN_R + 38} fill="#39ff14" opacity="0.03" />
        <circle cx={cx} cy={cy} r={SUN_R + 22} fill="#39ff14" opacity="0.05" />
        <circle cx={cx} cy={cy} r={SUN_R + 10} fill="#39ff14" opacity="0.10" />
        <circle cx={cx} cy={cy} r={SUN_R + 5}  fill="#d4ffcc" opacity="0.15" />
        <circle cx={cx} cy={cy} r={SUN_R}
                fill="url(#ss-sun)" filter="url(#ss-sun-glow)" />
        <text fill="#ffffff" opacity="0.92" class="prog-label" filter="url(#text-shadow)">
          <textPath href="#c450-prog-lbl" startOffset="54%" text-anchor="middle">
            {program.shortname}
          </textPath>
        </text>

        {#each program.units as unit, i (unit.id)}
          {#if panelUnit?.id !== unit.id}
            {@const uPos  = unitPositions[i]}
            {@const isIP  = effectiveStatuses[i] === 'in-progress'}
            {@const isLkd = effectiveStatuses[i] === 'locked'}
            {@const nSize = isIP ? Math.round(UNIT_SIZE * 1.35) : UNIT_SIZE}
            {#if isIP}
              {@const vr = nodeVisualR(i)}
              <circle cx={uPos.x} cy={uPos.y} r={vr + 38} fill={t.unit.inProgress.glow} opacity="0.05" />
              <circle cx={uPos.x} cy={uPos.y} r={vr + 22} fill={t.unit.inProgress.glow} opacity="0.10" />
              <circle cx={uPos.x} cy={uPos.y} r={vr + 10} fill={t.unit.inProgress.glow} opacity="0.18" />
            {/if}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <g
              onclick={() => handleUnitClick(unit, i)}
              onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' && effectiveStatuses[i] !== 'locked') handleUnitClick(unit, i); }}
              opacity={isLkd ? 0.5 : 1}
            >
              <UnitNode
                unit={{ ...unit, status: effectiveStatuses[i] }}
                x={uPos.x}
                y={uPos.y}
                galacticCenterX={cx}
                galacticCenterY={cy}
                size={nSize}
                index={i}
                compact={true}
                labelOutward={true}
                labelGap={LABEL_GAP}
                showLabel={false}
              />
            </g>
          {/if}
        {/each}

      </g><!-- end zoomable -->

      <!-- Dimming overlay — outside zoom group so it always covers the full viewBox -->
      {#if panelUnit}
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h}
              fill="rgba(2,6,20,0.85)" pointer-events="none" />
      {/if}

      <!-- Pass 2: Selected node + activity orbit — same zoom transform, rendered above overlay -->
      {#if panelUnit && panelUnitPos}
        {@const si    = panelUnitIdx}
        {@const isIP  = effectiveStatuses[si] === 'in-progress'}
        {@const nSize = Math.round(UNIT_SIZE * 1.35)}
        {@const vr    = UNIT_SIZE / 2 * (si === 0 ? 1.15 : 1.0) * 1.35}
        <g transform={zoomTransform}>
          {#if isIP}
            <circle cx={panelUnitPos.x} cy={panelUnitPos.y} r={vr + 38} fill={t.unit.inProgress.glow} opacity="0.08" />
            <circle cx={panelUnitPos.x} cy={panelUnitPos.y} r={vr + 22} fill={t.unit.inProgress.glow} opacity="0.14" />
            <circle cx={panelUnitPos.x} cy={panelUnitPos.y} r={vr + 10} fill={t.unit.inProgress.glow} opacity="0.22" />
          {/if}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <g
            onclick={() => handleUnitClick(panelUnit, si)}
            onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') handleUnitClick(panelUnit, si); }}
          >
            <UnitNode
              unit={{ ...panelUnit, status: effectiveStatuses[si] }}
              x={panelUnitPos.x}
              y={panelUnitPos.y}
              galacticCenterX={cx}
              galacticCenterY={cy}
              size={nSize}
              index={si}
              compact={true}
              labelOutward={true}
              labelGap={LABEL_GAP}
              showLabel={false}
            />
          </g>
          <ActivityOrbit
            activities={panelActivities}
            cx={panelUnitPos.x}
            cy={panelUnitPos.y}
            unitR={panelUnitR}
            outwardAngle={panelOutwardAngle}
            {onActivitySelected}
          />
        </g>
      {/if}
      <!-- QUANTA cluster — fixed to screen, upper-right corner -->
      <QuantaCluster cx={dgQuanta.cx} cy={dgQuanta.cy} programShortname={program.shortname} />
    </svg>

    <!-- Zoom controls — bottom-left -->
    <div class="zoom-controls">
      <button class="zoom-btn" onclick={zoomInBtn} aria-label="Zoom in">+</button>
      <button class="zoom-btn" onclick={zoomOutBtn} aria-label="Zoom out">−</button>
    </div>

    <!-- Zoom HUD (fixed to screen, outside SVG zoom group) -->
    <div class="zoom-hud">
      <span class="zoom-pct">{zoomPct}%</span>
      <button class="zoom-reset" onclick={resetView} title="Doble clic en el canvas para resetear">↺</button>
    </div>
  </div>
</div>

<style>
  .galaxy-container {
    /* position: absolute; inset: 0 is more reliable than width/height 100%
       on iOS Safari flex children where percentage heights can mis-resolve */
    position: absolute;
    inset: 0;
    overflow: hidden;
    margin: 0; padding: 0; box-sizing: border-box;
  }
  .galaxy-wrapper {
    position: absolute;
    inset: 0;
    border-radius: 0; overflow: hidden;
    transition: box-shadow 0.4s;
  }
  /* position: absolute; inset: 0 is more reliable than width/height: 100%
     on iOS Safari inside absolutely-positioned containers */
  .galaxy-svg { position: absolute; inset: 0; display: block; }


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

  /* ── Zoom +/- buttons ── */
  .zoom-controls {
    position: absolute;
    bottom: 14px; left: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    pointer-events: all;
    z-index: 10;
  }
  .zoom-btn {
    width: 36px; height: 36px;
    border-radius: 9px;
    border: 1px solid rgba(148,163,184,0.22);
    background: rgba(10,15,35,0.72);
    color: #cbd5e1;
    font-size: 22px; line-height: 1;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    user-select: none;
  }
  .zoom-btn:hover {
    background: rgba(30,45,80,0.88);
    border-color: rgba(148,163,184,0.45);
    color: #f1f5f9;
  }
  .zoom-btn:active {
    background: rgba(50,70,120,0.9);
  }

  /* ── Portrait: move zoom controls above the badge-panel handle (36px) ── */
  @media (orientation: portrait) {
    .zoom-controls {
      bottom: 60px; /* clears the 36px badge panel handle + margin */
    }
    .zoom-hud {
      bottom: 60px;
    }
  }
</style>
