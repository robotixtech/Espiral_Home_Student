<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProgramData, ProgramUnit, Activity, UnitStatus, UnitIcon } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import { getDistantConfigs } from '../lib/program-config';
  import UnitNode from './UnitNode.svelte';
  import DistantGalaxy from './DistantGalaxy.svelte';
  import ActivityOrbit from './ActivityOrbit.svelte';
  import QuantaCluster from './QuantaCluster.svelte';
  import IANode from './IANode.svelte';
  import { CANVAS, SPIRAL, ZOOM, IA_UNIT_CONFIG } from '../lib/master-config';
  import { activityOrbitLayout } from '../lib/activity-orbit';

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

  const orbitRadii    = $derived(program.units.map((_, i) => i === 0 ? 0 : ORBIT_START + (i - 1) * ORBIT_STEP));

  // ── Galaxy spiral path ──────────────────────────────────────────────────
  // Archimedean spiral: r(θ) = a + b·θ, fitted so it passes through each unit orbit.
  const SPIRAL_B = ORBIT_STEP / GOLDEN;
  const SPIRAL_A = ORBIT_START - SPIRAL_B * START_ANGLE;
  const SPIRAL_SAMPLES = 200; // points for smooth curve

  /** Generate SVG path for a spiral arc between unit indices.
   *  Unit 0 is at center; the spiral grows from r=0 at θ₀ using the Archimedean equation.
   *  θ₀ is the angle where r=0: θ₀ = -SPIRAL_A / SPIRAL_B. */
  const THETA_ZERO = -SPIRAL_A / SPIRAL_B; // angle where spiral radius = 0 (origin)

  function spiralPathD(from: number, to: number): string {
    // Map unit indices to spiral angles (unit 0 = center = THETA_ZERO, unit i≥1 shifted)
    const thetaFrom = from === 0 ? THETA_ZERO : START_ANGLE + (from - 1) * GOLDEN;
    const thetaTo   = to   === 0 ? THETA_ZERO : START_ANGLE + (to   - 1) * GOLDEN;
    const steps     = Math.max(Math.round(SPIRAL_SAMPLES * Math.abs(thetaTo - thetaFrom) / (2 * Math.PI)), 80);
    const parts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const theta = thetaFrom + (thetaTo - thetaFrom) * (i / steps);
      const r     = Math.max(0, SPIRAL_A + SPIRAL_B * theta);
      const px    = cx + r * Math.cos(theta);
      const py    = cy + r * Math.sin(theta);
      parts.push(i === 0 ? `M ${px.toFixed(1)} ${py.toFixed(1)}` : `L ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return parts.join(' ');
  }

  // Full spiral path (center → last unit)
  const spiralFullPath = $derived(program.units.length > 1 ? spiralPathD(0, program.units.length - 1) : '');

  // Progress spiral: completed portion + partial in-progress (starts from center)
  const spiralProgressIdx = $derived.by(() => {
    let last = -1;
    for (let i = 0; i < effectiveStatuses.length; i++) {
      if (effectiveStatuses[i] === 'completed') last = i;
      else if (effectiveStatuses[i] === 'in-progress') {
        const unit = program.units[i];
        return i + (unit.progress / 100);
      } else break;
    }
    return last >= 0 ? last + 0.001 : -1;
  });
  const spiralProgressPath = $derived(
    spiralProgressIdx >= 1 ? spiralPathD(0, Math.min(spiralProgressIdx, program.units.length - 1)) : ''
  );

  // ── Learning route "beam of light" ────────────────────────────────────────
  // The travelled route is a filled ribbon that starts as a thin stroke at the centre and
  // widens toward the leading edge (the child's current position), like a beam of light —
  // conveying the "next step" flow through thickness alone, no reading required.
  const RIBBON_W_MIN = 1.5;   // width at the centre / start
  const RIBBON_W_MAX = 13.2;  // width at the leading edge — +20% to emphasise the widening

  function learnRibbonPath(toIdx: number): string {
    const thetaTo = toIdx <= 0 ? THETA_ZERO : START_ANGLE + (toIdx - 1) * GOLDEN;
    const steps = Math.max(Math.round(SPIRAL_SAMPLES * Math.abs(thetaTo - THETA_ZERO) / (2 * Math.PI)), 40);
    const pts: { x: number; y: number }[] = [];
    const hw: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const theta = THETA_ZERO + (thetaTo - THETA_ZERO) * f;
      const r = Math.max(0, SPIRAL_A + SPIRAL_B * theta);
      pts.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
      hw.push((RIBBON_W_MIN + f * (RIBBON_W_MAX - RIBBON_W_MIN)) / 2);
    }
    const left: string[] = [];
    const right: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(steps, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y;
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len, ny = tx / len; // unit normal
      left.push(`${i === 0 ? 'M' : 'L'} ${(pts[i].x + nx * hw[i]).toFixed(1)} ${(pts[i].y + ny * hw[i]).toFixed(1)}`);
      right.push(`L ${(pts[i].x - nx * hw[i]).toFixed(1)} ${(pts[i].y - ny * hw[i]).toFixed(1)}`);
    }
    return left.join(' ') + ' ' + right.reverse().join(' ') + ' Z';
  }

  const learnRibbon = $derived(
    spiralProgressIdx >= 1 ? learnRibbonPath(Math.min(spiralProgressIdx, program.units.length - 1)) : ''
  );

  // Completed spiral segment: up to the last completed unit
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

  // Unit 0 sits at the center (telescope focal point); remaining units spiral outward.
  const unitPositions = $derived(
    program.units.map((_, i) => {
      if (i === 0) return { x: cx, y: cy };
      const a = START_ANGLE + (i - 1) * GOLDEN;
      const r = ORBIT_START + (i - 1) * ORBIT_STEP;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }),
  );

  // Dynamic telescope radius: max distance from center to any unit edge (incl. in-progress scale)
  const telescopeR = $derived.by(() => {
    let maxR = 0;
    for (let i = 0; i < unitPositions.length; i++) {
      const dist = Math.hypot(unitPositions[i].x - cx, unitPositions[i].y - cy);
      const visualR = nodeVisualR(i);
      maxR = Math.max(maxR, dist + visualR);
    }
    return maxR + 30; // 30px padding inside the lens edge
  });

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

  // When a unit is selected, focus it: centre the sphere + its activity orbit on screen and
  // scale up 20%. The container is capped at 80% of the viewBox (≈ viewport); if the orbit is
  // too big, the sphere + pills are scaled DOWN so everything fits inside with padding.
  const PANEL_SCALE = 1.2;
  const CARD_PAD    = 30;   // content-space margin between the pills and the container border
  const CARD_MAX    = 0.8;  // container never exceeds 80% of the viewBox width/height

  // Content scale bounded so (orbit + padding) fits within the max container half-size.
  function fitScale(hw: number, hh: number): number {
    return Math.max(0.3, Math.min(
      PANEL_SCALE,
      (CARD_MAX * vb.w / 2 - CARD_PAD) / hw,
      (CARD_MAX * vb.h / 2 - CARD_PAD) / hh,
    ));
  }

  // Unit title font in the detail view — activity pills render 20% smaller than this.
  const panelTitleFont = $derived(
    panelUnitIdx >= 0 && effectiveStatuses[panelUnitIdx] === 'in-progress' ? 27.6 : 20
  );
  const panelOrbit  = $derived(activityOrbitLayout(panelActivities, panelUnitR, panelOutwardAngle, panelTitleFont));
  const panelScale  = $derived(fitScale(panelOrbit.hw, panelOrbit.hh));
  const panelCardHW = $derived((panelOrbit.hw * panelScale + CARD_PAD) * panelZoom);
  const panelCardHH = $derived((panelOrbit.hh * panelScale + CARD_PAD) * panelZoom);
  // Close cross: at the card's top-right corner, but clamped to stay inside the viewport
  // even when the user zooms the card past the screen edges. The right margin also clears
  // the "Mis insignias" badge-panel strip that sits over the right edge.
  const CLOSE_MARGIN   = 28;
  const CLOSE_MARGIN_R = 60;
  const panelCloseX  = $derived(Math.min(cx + panelCardHW, vb.x + vb.w - CLOSE_MARGIN_R));
  const panelCloseY  = $derived(Math.max(cy - panelCardHH, vb.y + CLOSE_MARGIN));
  const panelTransform = $derived(
    panelUnitPos
      ? `translate(${cx},${cy}) scale(${panelScale * panelZoom}) translate(${-panelUnitPos.x},${-panelUnitPos.y})`
      : ''
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
  // nanoQUANTA: upper-left area, visible on load
  const dgQuanta = $derived({
    cx: vb.x + 130,
    cy: vb.y + 130,
  });
  // Distant galaxy configs derived from main program — [0]=prev, [1]=next, [2]=future
  const distantConfigs = $derived(getDistantConfigs(program.shortname));

  // ── IA Unit (off-radar, never locked) ─────────────────────────────────────
  let iaProgress = $state(0);

  const iaUnit = $derived.by(() => ({
    id: 9999,
    shortname: 'IA',
    label: 'Inteligencia Artificial',
    displayName: 'IA',
    fullname: 'Inteligencia Artificial',
    status: 'in-progress' as UnitStatus,
    progress: iaProgress,
    courseUrl: IA_UNIT_CONFIG.href ?? '#',
    icon: 'signal' as UnitIcon,
    activities: IA_UNIT_CONFIG.activities.map((a, i) => ({
      id: 9000 + i,
      label: a.label,
      status: 'locked' as UnitStatus,
      progress: 0,
      icon: a.icon,
      activityUrl: a.href ?? '#',
      slides: a.slides,
    })),
  }));

  const iaEffectiveStatus = $derived(
    iaProgress >= 100 ? ('completed' as const) : ('in-progress' as const)
  );

  let panelIA = $state(false);

  // IA: centered between left viewport edge and radar left edge
  const iaNodePos           = $derived({
    cx: (vb.x + (cx - (orbitRadii[orbitRadii.length - 1] + 100))) / 2,
    cy: cy,
  });
  const iaUnitR             = $derived(Math.round(SPIRAL.unitSize / 2 * 1.35));
  const iaOutwardAngle      = $derived(Math.atan2(iaNodePos.cy - cy, iaNodePos.cx - cx));
  const iaDisplayActivities = $derived(displayActivities(iaUnit as ProgramUnit));
  // IA panel: centre on screen, scale to fit within the 80% cap (same rules as units).
  const IA_TITLE_FONT = 19;
  const iaOrbit    = $derived(activityOrbitLayout(iaDisplayActivities, iaUnitR, iaOutwardAngle, IA_TITLE_FONT));
  const iaScale    = $derived(fitScale(iaOrbit.hw, iaOrbit.hh));
  const iaCardHW   = $derived((iaOrbit.hw * iaScale + CARD_PAD) * panelZoom);
  const iaCardHH   = $derived((iaOrbit.hh * iaScale + CARD_PAD) * panelZoom);
  const iaCloseX   = $derived(Math.min(cx + iaCardHW, vb.x + vb.w - CLOSE_MARGIN_R));
  const iaCloseY   = $derived(Math.max(cy - iaCardHH, vb.y + CLOSE_MARGIN));
  const iaPanelTransform = $derived(
    `translate(${cx},${cy}) scale(${iaScale * panelZoom}) translate(${-iaNodePos.cx},${-iaNodePos.cy})`
  );

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
  let lastMX = 0, lastMY = 0;
  // Timestamp of last touchend — used to ignore synthesized mouse events on Android.
  let lastTouchEndAt = 0;

  // Detail-view (panel) zoom, driven by the +/- buttons. Separate from the galaxy zoom.
  let panelZoom = $state(1);
  const panelOpen = $derived(!!panelUnit || panelIA);

  const zoomTransform = $derived(`translate(${panX},${panY}) scale(${zoomScale})`);

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    // Detail view open → background is static (no galaxy zoom/pan).
    if (panelOpen) return;
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
    if (panelOpen) return; // no dragging while the detail view is open
    // Ignore synthesized mouse events that Android fires after touchend
    if (Date.now() - lastTouchEndAt < 500) return;
    isDragging = true; lastMX = e.clientX; lastMY = e.clientY;
  }

  function onMouseMove(e: MouseEvent) {
    if (panelOpen || !isDragging || !svgEl) return;
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
    // Detail view open → zoom the focused unit + its lessons, not the galaxy.
    if (panelOpen) { panelZoom = Math.min(2.4, panelZoom * ZOOM.buttonStep); return; }
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
    if (panelOpen) { panelZoom = Math.max(0.5, panelZoom / ZOOM.buttonStep); return; }
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
    if (panelOpen) return; // static background while the detail view is open
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
    if (panelOpen || !cachedRect) return;

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
    if (panelUnit && panelUnit.id !== unit.id) return;
    if (panelIA) panelIA = false;
    if ((unit.activities?.length ?? 0) === 0) { onUnitSelected(unit); return; }
    panelUnit = panelUnit?.id === unit.id ? null : unit;
    panelZoom = 1; // reset detail zoom each time the panel opens/closes
  }

  function handleIAClick() {
    if (panelUnit) panelUnit = null;
    panelIA = !panelIA;
    panelZoom = 1;
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
      style:cursor={panelOpen ? 'default' : (isDragging ? 'grabbing' : 'grab')}
      onmousedown={onMouseDown}
      onmousemove={onMouseMove}
      onmouseup={onMouseUp}
      onmouseleave={onMouseLeave}
      ondblclick={resetView}
    >
      <defs>
        <!-- Learning-path gradient: intensifies outward (dim at the centre/start → bright at
             the leading edge) so the travelled route reads as "you are here → next step". -->
        <radialGradient id="learn-path-grad" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={telescopeR}>
          <stop offset="0%"   stop-color="#34d399" stop-opacity="0.3" />
          <stop offset="55%"  stop-color="#34d399" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#c6fff0" stop-opacity="1" />
        </radialGradient>
      </defs>

      <!-- ── Zoomable content ───────────────────────────────────────── -->
      <g transform={zoomTransform}>

        <!-- Radar glass background -->
        {#if true}
          {@const radarR = telescopeR + 4}
          <foreignObject x={cx - radarR} y={cy - radarR} width={radarR * 2} height={radarR * 2}>
            <div class="radar-glass"></div>
          </foreignObject>
        {/if}

        <!-- Learning route — path ahead (not yet reached): faint, thin, dashed -->
        <path d={spiralFullPath} fill="none"
              stroke="rgba(0,180,255,0.12)" stroke-width="1.5"
              stroke-dasharray="6 10" stroke-linecap="round" />
        <!-- Learning route — travelled so far: a "beam of light" ribbon, thin at the start
             and widening toward the leading edge (current position → next step). -->
        {#if learnRibbon}
          <path d={learnRibbon} fill="url(#learn-path-grad)" stroke="none" />
        {/if}

        <!-- Distant galaxies -->
        <DistantGalaxy config={distantConfigs[1].config} isCompleted={distantConfigs[1].isCompleted} cx={dgNext.cx}   cy={dgNext.cy}   scale={0.32} opacity={0.70} fontScale={0.7} />
        <DistantGalaxy config={distantConfigs[2].config} isCompleted={distantConfigs[2].isCompleted} cx={dgFuture.cx} cy={dgFuture.cy} scale={0.20} opacity={0.62} fontScale={0.7} />
        <DistantGalaxy config={distantConfigs[0].config} isCompleted={distantConfigs[0].isCompleted} cx={dgPrev.cx}   cy={dgPrev.cy}   scale={0.30} opacity={0.75} fontScale={0.6} />
        <!-- nanoQUANTA — unlocks when U1 (index 1) is completed; never counted as completed -->
        <QuantaCluster cx={dgQuanta.cx} cy={dgQuanta.cy} programShortname={program.shortname}
          isUnlocked={effectiveStatuses[1] === 'completed'} />

        <!-- IA Unit — off-radar, always unlocked, shown in pass-1 when panel is closed -->
        {#if !panelIA}
          <IANode cx={iaNodePos.cx} cy={iaNodePos.cy}
                  status={iaEffectiveStatus} progress={iaProgress}
                  onSelect={handleIAClick} />
        {/if}

        <!-- HUD ring — 0 compositing ops: all opacity baked into rgba stroke colors -->
        {#if true}
          {@const outerR = telescopeR}
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


      </g><!-- end zoomable -->

      <!-- Dimming overlay — outside zoom group so it always covers the full viewBox -->
      {#if panelUnit || panelIA}
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h}
              fill="rgba(2,6,20,0.93)" pointer-events="none" />
      {/if}

      <!-- Pass 2: Selected node + activity orbit — centred on screen and scaled up 20% -->
      {#if panelUnit && panelUnitPos}
        {@const si    = panelUnitIdx}
        {@const isIP  = effectiveStatuses[si] === 'in-progress'}
        {@const nSize = Math.round(UNIT_SIZE * 1.35)}
        {@const vr    = UNIT_SIZE / 2 * (si === 0 ? 1.15 : 1.0) * 1.35}
        <!-- Modal card frame (thin border, rounded corners) — analogous to the badge modal -->
        <rect x={cx - panelCardHW} y={cy - panelCardHH} width={panelCardHW * 2} height={panelCardHH * 2}
              rx="20" fill="rgba(6,16,40,0.7)" stroke="rgba(70,150,255,0.35)" stroke-width="1.5" />
        <g transform={panelTransform}>
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
            titleFontSize={panelTitleFont}
            {onActivitySelected}
          />
        </g>
        <!-- Close cross (floats top-right of the card, like the badge modal) -->
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <g class="detail-close" role="button" tabindex="0" aria-label="Cerrar"
           transform="translate({panelCloseX},{panelCloseY})"
           onclick={() => (panelUnit = null)}
           onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); panelUnit = null; } }}>
          <circle r="16" fill="rgba(10,20,55,0.97)" stroke="rgba(80,140,255,0.4)" stroke-width="1" />
          <line x1="-5" y1="-5" x2="5" y2="5" stroke="rgba(150,190,255,0.9)" stroke-width="1.8" stroke-linecap="round" />
          <line x1="5" y1="-5" x2="-5" y2="5" stroke="rgba(150,190,255,0.9)" stroke-width="1.8" stroke-linecap="round" />
        </g>
      {/if}


      <!-- Pass 2: IA node + activity orbit — centred on screen and scaled up 20% -->
      {#if panelIA}
        <!-- Modal card frame (thin border, rounded corners) — analogous to the badge modal -->
        <rect x={cx - iaCardHW} y={cy - iaCardHH} width={iaCardHW * 2} height={iaCardHH * 2}
              rx="20" fill="rgba(6,16,40,0.7)" stroke="rgba(70,150,255,0.35)" stroke-width="1.5" />
        <g transform={iaPanelTransform}>
          <IANode cx={iaNodePos.cx} cy={iaNodePos.cy}
                  status={iaEffectiveStatus} progress={iaProgress}
                  onSelect={handleIAClick} />
          <ActivityOrbit
            activities={iaDisplayActivities}
            cx={iaNodePos.cx}
            cy={iaNodePos.cy}
            unitR={iaUnitR}
            outwardAngle={iaOutwardAngle}
            titleFontSize={19}
            {onActivitySelected}
          />
        </g>
        <!-- Close cross (floats top-right of the card, like the badge modal) -->
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <g class="detail-close" role="button" tabindex="0" aria-label="Cerrar"
           transform="translate({iaCloseX},{iaCloseY})"
           onclick={() => (panelIA = false)}
           onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); panelIA = false; } }}>
          <circle r="16" fill="rgba(10,20,55,0.97)" stroke="rgba(80,140,255,0.4)" stroke-width="1" />
          <line x1="-5" y1="-5" x2="5" y2="5" stroke="rgba(150,190,255,0.9)" stroke-width="1.8" stroke-linecap="round" />
          <line x1="5" y1="-5" x2="-5" y2="5" stroke="rgba(150,190,255,0.9)" stroke-width="1.8" stroke-linecap="round" />
        </g>
      {/if}

    </svg>

    <!-- Zoom controls — bottom-left -->
    <div class="zoom-controls">
      <div class="prog-name-label">{program.shortname}</div>
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
  .radar-glass {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(31, 51, 71, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.2);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    will-change: transform, opacity;
    transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    pointer-events: none;
  }

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


  /* Detail-view close cross */
  .detail-close { cursor: pointer; outline: none; }
  .detail-close circle { transition: fill 0.15s ease; }
  @media (hover: hover) {
    .detail-close:hover circle { fill: rgba(30,50,120,0.98); }
  }

  .prog-name-label {
    font: 800 18px/1 'Rubik', system-ui, sans-serif;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.85);
    pointer-events: none;
    user-select: none;
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
