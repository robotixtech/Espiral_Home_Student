<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProgramData, ProgramUnit, Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import { getDistantConfigs } from '../lib/program-config';
  import UnitNode from './UnitNode.svelte';
  import DistantGalaxy from './DistantGalaxy.svelte';
  import ActivityOrbit from './ActivityOrbit.svelte';
  import QuantaCluster from './QuantaCluster.svelte';
  import { CANVAS, SPIRAL, ZOOM, RADAR } from '../lib/master-config';

  interface Props {
    program: ProgramData;
    onUnitSelected: (unit: ProgramUnit) => void;
    onActivitySelected: (activity: Activity) => void;
  }

  let { program, onUnitSelected, onActivitySelected }: Props = $props();


  // ── Layout constants — all values live in src/lib/master-config.ts ────────
  const { width: W, height: H, cx, cy } = CANVAS;
  const { unitSize: UNIT_SIZE, actOrbit: ACT_ORBIT, labelGap: LABEL_GAP,
          orbitStep: ORBIT_STEP, sunRadius: SUN_R, orbitStart: ORBIT_START,
          labelLineH: LABEL_LINE_H, labelPadX: LABEL_PAD_X, labelPadY: LABEL_PAD_Y,
          labelGapPx: LABEL_GAP_PX } = SPIRAL;
  const GOLDEN      = SPIRAL.goldenAngleDeg * Math.PI / 180;
  const START_ANGLE = -Math.PI / 2;

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

  // Distant galaxies sit OUTSIDE the initial viewport on all sides.
  // Each position is the old position vector from the radar center (cx,cy) scaled by 1.3
  // (i.e. 30% further away), so they enter view progressively as the user zooms out.
  const dgPrev   = $derived({ cx: cx + 1.3 * (vb.x - 725),        cy: 66 });
  const dgNext   = $derived({ cx: cx,                               cy: cy + 1.3 * (vb.y - 980) });
  const dgFuture = $derived({ cx: cx + 1.3 * (vb.x + vb.w - 475), cy: 66 });
  // nanoQUANTA: off-screen upper-left, symmetric mirror of the right-side reference
  // Same vertical as before, x negated to place it left of the radar center
  const dgQuanta = $derived({
    cx: cx - 1.3 * (vb.x + vb.w - 620),
    cy: cy + 1.3 * (vb.y - 550),
  });
  // Distant galaxy configs derived from main program — [0]=prev, [1]=next, [2]=future
  const distantConfigs = $derived(getDistantConfigs(program.shortname));

  // ── C: Zoom / Pan ─────────────────────────────────────────────────────────
  // State: translate(panX, panY) scale(zoomScale) applied to all content.
  // Zooming toward the mouse pointer keeps the hovered point fixed on screen.
  // Pan: left-click drag. Reset: double-click anywhere on the canvas.

  let zoomScale    = $state(1.0);
  let panX         = $state(0.0);
  let zoomInActive = $state(false);
  let zoomOutActive = $state(false);
  let panY       = $state(0.0);
  let isDragging = $state(false);
  let radarDeg   = $state(0);
  let lastMX = 0, lastMY = 0;
  // Timestamp of last touchend — used to ignore synthesized mouse events on Android.
  let lastTouchEndAt = 0;

  const zoomTransform = $derived(`translate(${panX},${panY}) scale(${zoomScale})`);

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const mx   = vb.x + (e.clientX - rect.left) / rect.width  * vb.w;
    const my   = vb.y + (e.clientY - rect.top)  / rect.height * vb.h;
    const ns   = Math.max(ZOOM.min, Math.min(ZOOM.max, zoomScale * (e.deltaY < 0 ? ZOOM.scrollStep : 1 / ZOOM.scrollStep)));
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
    const ns = Math.min(ZOOM.max, zoomScale * ZOOM.buttonStep);
    panX = cx - fx * ns;
    panY = cy - fy * ns;
    zoomScale = ns;
  }

  function zoomOutBtn() {
    const ns = Math.max(ZOOM.min, zoomScale / ZOOM.buttonStep);
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
      const ns = Math.max(ZOOM.min, Math.min(ZOOM.max, zoomScale * pendingZoomRatio));
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
    // If another unit is already open, ignore — user must collapse it first.
    if (panelUnit && panelUnit.id !== unit.id) return;
    if ((unit.activities?.length ?? 0) === 0) { onUnitSelected(unit); return; }
    panelUnit = panelUnit?.id === unit.id ? null : unit;
  }

  onMount(() => {
    // Wheel + touch must be non-passive to call preventDefault()
    svgEl?.addEventListener('wheel',      onWheel,      { passive: false });
    svgEl?.addEventListener('touchstart', onTouchStart, { passive: true });
    svgEl?.addEventListener('touchmove',  onTouchMove,  { passive: false });
    svgEl?.addEventListener('touchend',   onTouchEnd,   { passive: false });

    // Radar rotation — rAF loop, 5 s per revolution
    let radarRafId: number;
    let radarT0: number | null = null;
    function radarTick(ts: number) {
      if (radarT0 === null) radarT0 = ts;
      radarDeg = ((ts - radarT0) / RADAR.revolutionMs * 360) % 360;
      radarRafId = requestAnimationFrame(radarTick);
    }
    radarRafId = requestAnimationFrame(radarTick);

    return () => {
      svgEl?.removeEventListener('wheel', onWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
      cancelAnimationFrame(radarRafId);
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
          <stop offset="0%"   stop-color={t.bg.center} stop-opacity="0.88" />
          <stop offset="60%"  stop-color={t.bg.mid}    stop-opacity="0.88" />
          <stop offset="100%" stop-color={t.bg.edge}   stop-opacity="0.88" />
        </radialGradient>
        <radialGradient id="ss-sun" cx="35%" cy="35%" r="65%">
          <stop offset="0%"   stop-color="#d4ffcc" />
          <stop offset="50%"  stop-color="#39ff14" />
          <stop offset="100%" stop-color="#006622" />
        </radialGradient>
        <!-- Program name label path — same double-loop pattern as DistantGalaxy, at outermost orbit -->
        <path id="c450-prog-lbl"
              d="M {cx - progLblR},{cy} a {progLblR},{progLblR} 0 1,1 {progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {-progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {progLblR * 2},0 a {progLblR},{progLblR} 0 1,1 {-progLblR * 2},0"
              fill="none" />
      </defs>

      <!-- Static background (not affected by zoom) -->
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#ss-bg)" />

      <!-- ── Zoomable content ───────────────────────────────────────── -->
      <g transform={zoomTransform}>

        <!-- Orbit rings — 0 compositing ops: all opacity baked into rgba stroke colors -->
        <g fill="none" stroke="rgba(52,211,153,0.55)" stroke-width="1">
          {#each program.units as _, i}
            {#if effectiveStatuses[i] === 'completed'}
              <circle cx={cx} cy={cy} r={orbitRadii[i]} />
            {/if}
          {/each}
        </g>
        <g fill="none" stroke="rgba(0,180,255,0.09)" stroke-width="1" stroke-dasharray="4 7">
          {#each program.units as _, i}
            {#if effectiveStatuses[i] === 'locked'}
              <circle cx={cx} cy={cy} r={orbitRadii[i]} />
            {/if}
          {/each}
        </g>
        {#each program.units as unit, i (unit.id)}
          {#if effectiveStatuses[i] === 'in-progress'}
            {@const r = orbitRadii[i]}
            {@const orbC = 2 * Math.PI * r}
            {@const dashLen = orbC * (unit.progress / 100)}
            {@const unitAngleDeg = (START_ANGLE + i * GOLDEN) * 180 / Math.PI}
            <circle cx={cx} cy={cy} r={r} fill="none"
                    stroke="rgba(52,211,153,0.20)" stroke-width="1"
                    stroke-dasharray="5 8" />
            <circle cx={cx} cy={cy} r={r} fill="none"
                    stroke="rgba(52,211,153,0.55)" stroke-width="1"
                    stroke-dasharray="{dashLen} {orbC}"
                    stroke-linecap="round"
                    transform="rotate({unitAngleDeg}, {cx}, {cy})" />
          {/if}
        {/each}

        <!-- Distant galaxies -->
        <DistantGalaxy config={distantConfigs[1].config} isCompleted={distantConfigs[1].isCompleted} cx={dgNext.cx}   cy={dgNext.cy}   scale={0.32} opacity={0.70} fontScale={0.7} />
        <DistantGalaxy config={distantConfigs[2].config} isCompleted={distantConfigs[2].isCompleted} cx={dgFuture.cx} cy={dgFuture.cy} scale={0.20} opacity={0.62} fontScale={0.7} />
        <DistantGalaxy config={distantConfigs[0].config} isCompleted={distantConfigs[0].isCompleted} cx={dgPrev.cx}   cy={dgPrev.cy}   scale={0.30} opacity={0.75} fontScale={0.6} />
        <!-- nanoQUANTA — unlocks when U1 (index 1) is completed; never counted as completed -->
        <QuantaCluster cx={dgQuanta.cx} cy={dgQuanta.cy} programShortname={program.shortname}
          isUnlocked={effectiveStatuses[1] === 'completed'} />

        <!-- Central Sun — 0 compositing ops: rgba baked, filters removed -->
        <circle cx={cx} cy={cy} r={SUN_R + 38} fill="rgba(57,255,20,0.03)"  />
        <circle cx={cx} cy={cy} r={SUN_R + 22} fill="rgba(57,255,20,0.05)"  />
        <circle cx={cx} cy={cy} r={SUN_R + 10} fill="rgba(57,255,20,0.10)"  />
        <circle cx={cx} cy={cy} r={SUN_R + 5}  fill="rgba(212,255,204,0.15)" />
        <circle cx={cx} cy={cy} r={SUN_R} fill="url(#ss-sun)" />
        <text fill="rgba(255,255,255,0.92)" class="prog-label">
          <textPath href="#c450-prog-lbl" startOffset="54%" text-anchor="middle">
            {program.shortname}
          </textPath>
        </text>

        <!-- HUD ring — 0 compositing ops: all opacity baked into rgba stroke colors -->
        {#if true}
          {@const outerR = orbitRadii[orbitRadii.length - 1] + 120}
          {@const ticks  = 72}
          <circle cx={cx} cy={cy} r={outerR + 4}  fill="none" stroke="rgba(0,180,255,0.85)" stroke-width="1"   />
          <circle cx={cx} cy={cy} r={outerR - 14} fill="none" stroke="rgba(0,180,255,0.64)" stroke-width="0.7" />
          <g stroke="rgba(0,180,255,0.85)" stroke-width="2.5" stroke-linecap="square">
            {#each Array.from({length: ticks}, (_, k) => k).filter(k => k % 6 === 0) as k}
              {@const ang = (k / ticks) * 2 * Math.PI - Math.PI / 2}
              <line
                x1={cx + (outerR + 4)  * Math.cos(ang)} y1={cy + (outerR + 4)  * Math.sin(ang)}
                x2={cx + (outerR - 10) * Math.cos(ang)} y2={cy + (outerR - 10) * Math.sin(ang)}
              />
            {/each}
          </g>
          <g stroke="rgba(0,180,255,0.55)" stroke-width="1.5" stroke-linecap="square">
            {#each Array.from({length: ticks}, (_, k) => k).filter(k => k % 6 !== 0) as k}
              {@const ang = (k / ticks) * 2 * Math.PI - Math.PI / 2}
              <line
                x1={cx + (outerR + 4) * Math.cos(ang)} y1={cy + (outerR + 4) * Math.sin(ang)}
                x2={cx + (outerR - 4) * Math.cos(ang)} y2={cy + (outerR - 4) * Math.sin(ang)}
              />
            {/each}
          </g>
        {/if}

        <!-- Pass 1: non-selected unit nodes -->
        {#each program.units as unit, i (unit.id)}
          {#if panelUnit?.id !== unit.id}
            {@const uPos  = unitPositions[i]}
            {@const isIP  = effectiveStatuses[i] === 'in-progress'}
            {@const nSize = isIP ? Math.round(UNIT_SIZE * 1.35) : UNIT_SIZE}
            {#if isIP}
              {@const vr = nodeVisualR(i)}
              <circle cx={uPos.x} cy={uPos.y} r={vr + 38} fill="rgba(245,158,11,0.05)" />
              <circle cx={uPos.x} cy={uPos.y} r={vr + 22} fill="rgba(245,158,11,0.10)" />
              <circle cx={uPos.x} cy={uPos.y} r={vr + 10} fill="rgba(245,158,11,0.18)" />
            {/if}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <g
              onclick={() => handleUnitClick(unit, i)}
              onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' && effectiveStatuses[i] !== 'locked') handleUnitClick(unit, i); }}
            >
              <UnitNode
                unit={{ ...unit, status: effectiveStatuses[i] }}
                x={uPos.x} y={uPos.y}
                galacticCenterX={cx} galacticCenterY={cy}
                size={nSize} index={i}
                compact={true} labelOutward={true}
                labelGap={LABEL_GAP} showLabel={false}
              />
            </g>
          {/if}
        {/each}

        <!-- Radar sweep: rotating lighthouse — last-completed orbit ring -->
        {#if lastCompletedIdx >= 0}
          {@const pulseR   = orbitRadii[lastCompletedIdx]}
          {@const beamDeg  = RADAR.beamDeg}
          {@const trailDeg = RADAR.trailDeg}
          {@const toRad    = (d: number) => d * Math.PI / 180}
          {@const sx  = cx + pulseR}
          {@const sy  = cy}
          {@const bx  = cx + pulseR * Math.cos(-toRad(beamDeg))}
          {@const by  = cy + pulseR * Math.sin(-toRad(beamDeg))}
          {@const tx  = cx + pulseR * Math.cos(-toRad(trailDeg))}
          {@const ty  = cy + pulseR * Math.sin(-toRad(trailDeg))}
          <defs>
            <radialGradient id="sweep-beam-grad" cx={cx} cy={cy} r={pulseR} gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#d4ffcc" stop-opacity="0.05" />
              <stop offset="10%"  stop-color="#39ff14" stop-opacity="0.72" />
              <stop offset="55%"  stop-color="#00cc44" stop-opacity="0.38" />
              <stop offset="100%" stop-color="#006622" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="sweep-trail-grad" cx={cx} cy={cy} r={pulseR} gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#39ff14" stop-opacity="0.04" />
              <stop offset="45%"  stop-color="#00cc44" stop-opacity="0.13" />
              <stop offset="100%" stop-color="#006622" stop-opacity="0" />
            </radialGradient>
            <clipPath id="sweep-clip">
              <circle cx={cx} cy={cy} r={pulseR} />
            </clipPath>
          </defs>
          <!-- SVG rotate(angle,cx,cy) pivots explicitly at galaxy center — no CSS transform-origin needed -->
          <g clip-path="url(#sweep-clip)" pointer-events="none">
            <g transform="rotate({radarDeg}, {cx}, {cy})">
              <path d="M {cx} {cy} L {sx} {sy} A {pulseR} {pulseR} 0 0 0 {tx} {ty} Z"
                    fill="url(#sweep-trail-grad)" />
              <path d="M {cx} {cy} L {sx} {sy} A {pulseR} {pulseR} 0 0 0 {bx} {by} Z"
                    fill="url(#sweep-beam-grad)" />
            </g>
          </g>
        {/if}

      </g><!-- end zoomable -->

      <!-- Dimming overlay — outside zoom group so it always covers the full viewBox -->
      {#if panelUnit}
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h}
              fill="rgba(2,6,20,0.93)" pointer-events="none" />
      {/if}

      <!-- Pass 2: Selected node + activity orbit — same zoom transform, rendered above overlay -->
      {#if panelUnit && panelUnitPos}
        {@const si    = panelUnitIdx}
        {@const isIP  = effectiveStatuses[si] === 'in-progress'}
        {@const nSize = Math.round(UNIT_SIZE * 1.35)}
        {@const vr    = UNIT_SIZE / 2 * (si === 0 ? 1.15 : 1.0) * 1.35}
        <g transform={zoomTransform}>
          {#if isIP}
            <circle cx={panelUnitPos.x} cy={panelUnitPos.y} r={vr + 38} fill="rgba(245,158,11,0.08)" />
            <circle cx={panelUnitPos.x} cy={panelUnitPos.y} r={vr + 22} fill="rgba(245,158,11,0.14)" />
            <circle cx={panelUnitPos.x} cy={panelUnitPos.y} r={vr + 10} fill="rgba(245,158,11,0.22)" />
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


    </svg>

    <!-- Zoom controls — bottom-left -->
    <div class="zoom-controls">
      <button class="zoom-btn" class:is-active={zoomInActive}
              onclick={zoomInBtn}
              onpointerdown={() => zoomInActive = true}
              onpointerup={() => zoomInActive = false}
              onpointercancel={() => zoomInActive = false}
              onpointerleave={() => zoomInActive = false}
              aria-label="Zoom in">+</button>
      <button class="zoom-btn" class:is-active={zoomOutActive}
              onclick={zoomOutBtn}
              onpointerdown={() => zoomOutActive = true}
              onpointerup={() => zoomOutActive = false}
              onpointercancel={() => zoomOutActive = false}
              onpointerleave={() => zoomOutActive = false}
              aria-label="Zoom out">−</button>
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
    border-radius: 0;
    transition: box-shadow 0.4s;
    /* Force the entire SVG into a single GPU compositing layer.
       On Android Chrome, individual SVG filters/SMIL animations promote
       sub-elements to separate GPU layers that flicker against each other.
       translateZ(0) collapses everything into one texture and also creates
       the stacking context previously provided by isolation:isolate.
       NOTE: overflow:hidden removed — on Mali-G52 (Samsung Tab A8 SM-X200,
       Unisoc T618), overflow:hidden + translateZ(0) on the same element
       corrupts the stencil buffer, producing erratic colored lines. The
       SVG fills the element exactly so nothing can overflow anyway. */
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
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
    width: 72px; height: 72px;
    border-radius: 14px;
    border: 1px solid rgba(148,163,184,0.22);
    background: rgba(10,15,35,0.88);
    color: #cbd5e1;
    font-size: 44px; line-height: 1;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    user-select: none;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-appearance: none;
    appearance: none;
  }
  .zoom-btn:focus { outline: none; }
  /* hover: hover — prevents stuck hover state on Android touch after tap */
  @media (hover: hover) {
    .zoom-btn:hover {
      background: rgba(30,45,80,0.88);
      border-color: rgba(148,163,184,0.45);
      color: #f1f5f9;
    }
  }
  .zoom-btn.is-active {
    background: rgba(50,70,120,0.9);
    transition: none;
  }

  /* ── Portrait: move zoom controls above the badge-panel handle (36px) ── */
  @media (orientation: portrait) {
    .zoom-controls {
      bottom: 60px; /* clears the 36px badge panel handle + margin */
    }
  }
</style>
