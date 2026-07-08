<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { ProgramData, ProgramUnit, Activity, UnitStatus, UnitIcon } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import { getDistantConfigs } from '../lib/program-config';
  import UnitNode from './UnitNode.svelte';
  import DistantGalaxy from './DistantGalaxy.svelte';
  import ActivityOrbit from './ActivityOrbit.svelte';
  import QuantaCluster from './QuantaCluster.svelte';
  import IANode from './IANode.svelte';
  import { activityOrbitLayout } from '../lib/activity-orbit';
  import { CANVAS, SPIRAL, ZOOM, IA_UNIT_CONFIG } from '../lib/master-config';

  interface Props {
    program: ProgramData;
    /** IA node progress (0-100), driven by the emulator — see App.svelte. */
    iaProgress?: number;
    onUnitSelected: (unit: ProgramUnit) => void;
    onActivitySelected: (activity: Activity) => void;
  }

  let { program, iaProgress = 0, onUnitSelected, onActivitySelected }: Props = $props();


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
  // Actual visual radius of node i, accounting for isStart (×1.15 inside UnitNode).
  // Status never changes sphere size — only colour does.
  function nodeVisualR(i: number): number {
    return UNIT_SIZE / 2 * (i === 0 ? 1.15 : 1.0);
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
      // "Continuar" unlocks as soon as the first regular activity finishes (2026-07-08
      // feedback) — it doesn't wait for its own sequential slot, which would otherwise
      // require DemoDay to finish first. It's an optional early-access step, so it's just
      // on/off (no partial progress).
      if (act.label === 'Continuar') {
        return unit.progress >= per
          ? { ...act, status: 'in-progress' as const, progress: 100 }
          : { ...act, status: 'locked' as const, progress: 0 };
      }
      const s = i * per, e = (i + 1) * per;
      if (unit.progress >= e) return { ...act, status: 'completed'   as const, progress: 100 };
      if (unit.progress >= s) return { ...act, status: 'in-progress' as const, progress: Math.min(((unit.progress - s) / per) * 100, 100) };
      return { ...act, status: 'locked' as const, progress: 0 };
    });
  }

  // The open unit's activities render as satellites around its real position in the
  // spiral — no modal, no re-centring, no re-scaling.
  let panelUnit = $state<ProgramUnit | null>(null);
  // Re-derive from live program.units so emulator progress updates animate in the orbit.
  const panelActivities = $derived.by(() => {
    if (!panelUnit) return [];
    const live = program.units.find(u => u.id === panelUnit!.id);
    return live ? displayActivities(live) : [];
  });
  const panelUnitIdx      = $derived(panelUnit ? program.units.findIndex(u => u.id === panelUnit!.id) : -1);
  const panelUnitPos      = $derived(panelUnitIdx >= 0 ? unitPositions[panelUnitIdx] : null);
  const panelUnitR        = $derived(panelUnitIdx >= 0 ? nodeVisualR(panelUnitIdx) : UNIT_SIZE / 2);

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
  // iaProgress comes in as a prop, driven by the emulator (App.svelte / emulator.svelte.ts).

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
  // Any unit/IA currently showing its lesson satellites — dims the background spiral so the
  // connector lines to the satellites read more clearly against it.
  const anyPanelOpen = $derived(!!panelUnit || panelIA);

  // IA: centered between left viewport edge and radar left edge
  const iaNodePos           = $derived({
    cx: (vb.x + (cx - (orbitRadii[orbitRadii.length - 1] + 100))) / 2,
    cy: cy,
  });
  const iaUnitR             = $derived(SPIRAL.unitSize / 2);
  const iaDisplayActivities = $derived(displayActivities(iaUnit as ProgramUnit));
  const IA_TITLE_FONT = 19;

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
    if (!svgEl || !isDragging) return;
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

  // ── Auto-fit satellites on open ──────────────────────────────────────────
  // When a unit/IA panel opens, its lesson satellites must always be fully visible
  // without the user having to zoom out manually — but WITHOUT re-centring the
  // view on the clicked sphere (2026-07-08 feedback: the "jump to centre" read as
  // jarring). Instead, zoom out only as much as needed, anchored on the CURRENT
  // viewport centre (same pivot math as the scroll-wheel zoom), so the camera
  // never jumps — it just pulls back in place until the cluster fits.
  // The view the user had before opening is restored once the panel closes.

  function fitViewToBox(centerX: number, centerY: number, halfW: number, halfH: number, pad = 24) {
    const bw = halfW + pad, bh = halfH + pad;
    const vx = vb.x + vb.w / 2, vy = vb.y + vb.h / 2;

    // How far (in current screen space) the box's farthest corners already sit
    // from the viewport centre — zooming out shrinks these offsets proportionally,
    // so solve for the scale factor that pulls them back inside the viewBox.
    let offX = 0, offY = 0;
    for (const wx of [centerX - bw, centerX + bw]) offX = Math.max(offX, Math.abs(panX + zoomScale * wx - vx));
    for (const wy of [centerY - bh, centerY + bh]) offY = Math.max(offY, Math.abs(panY + zoomScale * wy - vy));

    const k  = Math.min(1, (vb.w / 2) / (offX || 1), (vb.h / 2) / (offY || 1));
    const ns = Math.max(ZOOM.min, zoomScale * k);
    if (ns === zoomScale) return;

    panX = vx - (vx - panX) * (ns / zoomScale);
    panY = vy - (vy - panY) * (ns / zoomScale);
    zoomScale = ns;
  }

  let savedView: { zoomScale: number; panX: number; panY: number } | null = null;

  $effect(() => {
    // Tracked deps: only the panel identity + viewport size (so a resize/rotation
    // while a panel is open re-fits it). Everything else is read untracked below
    // so manual zoom/pan while a panel is open isn't fought on every re-render.
    const key = panelUnit ? `unit:${panelUnit.id}` : panelIA ? 'ia' : null;
    void cW; void cH;

    untrack(() => {
      if (key === null) {
        if (savedView) {
          zoomScale = savedView.zoomScale;
          panX = savedView.panX;
          panY = savedView.panY;
          savedView = null;
        }
        return;
      }
      if (!savedView) savedView = { zoomScale, panX, panY };

      let centerX: number, centerY: number, layout: ReturnType<typeof activityOrbitLayout>;
      if (panelUnit && panelUnitPos) {
        layout  = activityOrbitLayout(panelActivities, panelUnitR, 20);
        centerX = panelUnitPos.x;
        centerY = panelUnitPos.y;
      } else {
        layout  = activityOrbitLayout(iaDisplayActivities, iaUnitR, IA_TITLE_FONT);
        centerX = iaNodePos.cx;
        centerY = iaNodePos.cy;
      }
      fitViewToBox(centerX, centerY, layout.hw, layout.hh);
    });
  });

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
    if (panelIA) panelIA = false;
    if ((unit.activities?.length ?? 0) === 0) { onUnitSelected(unit); return; }
    // Toggle this unit's satellites; clicking a different unit switches directly.
    panelUnit = panelUnit?.id === unit.id ? null : unit;
  }

  function handleIAClick() {
    if (panelUnit) panelUnit = null;
    panelIA = !panelIA;
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
        <!-- Learning-path gradient: intensifies outward (dim at the centre/start → bright at
             the leading edge) so the travelled route reads as "you are here → next step". -->
        <radialGradient id="learn-path-grad" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={telescopeR}>
          <stop offset="0%"   stop-color="#34d399" stop-opacity="0.3" />
          <stop offset="55%"  stop-color="#34d399" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#c6fff0" stop-opacity="1" />
        </radialGradient>
        <!-- Circular clip for the radar glass panel: CSS border-radius alone doesn't reliably
             clip a backdrop-filter blur once the element is GPU-layer-promoted (translateZ(0),
             needed for the Mali-G52 fix) — Chromium can let the blur bleed past the rounded
             corners into a square. Clipping at the SVG level guarantees it never pokes outside
             the radar's curved edge (2026-07-08 feedback). -->
        <clipPath id="radar-clip" clipPathUnits="userSpaceOnUse">
          <circle cx={cx} cy={cy} r={telescopeR + 4} />
        </clipPath>
      </defs>

      <!-- ── Zoomable content ───────────────────────────────────────── -->
      <g transform={zoomTransform}>

        <!-- Radar glass background -->
        {#if true}
          {@const radarR = telescopeR + 4}
          <foreignObject x={cx - radarR} y={cy - radarR} width={radarR * 2} height={radarR * 2}
                         clip-path="url(#radar-clip)">
            <div class="radar-glass"></div>
          </foreignObject>
        {/if}

        <!-- Learning route — path ahead (not yet reached): faint, thin, dashed. Dimmed further
             while a unit's lesson satellites are open, so their connector lines stand out. -->
        <path d={spiralFullPath} fill="none"
              stroke="rgba(0,180,255,0.12)" stroke-width="1"
              stroke-dasharray="6 10" stroke-linecap="round"
              stroke-opacity={anyPanelOpen ? 0.35 : 1} />
        <!-- Learning route — travelled so far: uniform-width dashed stroke (current position → next step). -->
        {#if spiralProgressPath}
          <path d={spiralProgressPath} fill="none"
                stroke="url(#learn-path-grad)" stroke-width="2.5"
                stroke-dasharray="14 8" stroke-linecap="round"
                stroke-opacity={anyPanelOpen ? 0.35 : 1} />
        {/if}

        <!-- Distant galaxies -->
        <DistantGalaxy config={distantConfigs[1].config} isCompleted={distantConfigs[1].isCompleted} cx={dgNext.cx}   cy={dgNext.cy}   scale={0.32} opacity={0.70} fontScale={0.7} />
        <DistantGalaxy config={distantConfigs[2].config} isCompleted={distantConfigs[2].isCompleted} cx={dgFuture.cx} cy={dgFuture.cy} scale={0.20} opacity={0.62} fontScale={0.7} />
        <DistantGalaxy config={distantConfigs[0].config} isCompleted={distantConfigs[0].isCompleted} cx={dgPrev.cx}   cy={dgPrev.cy}   scale={0.30} opacity={0.75} fontScale={0.6} />
        <!-- nanoQUANTA — unlocks when U1 (index 1) is completed; never counted as completed -->
        <QuantaCluster cx={dgQuanta.cx} cy={dgQuanta.cy} programShortname={program.shortname}
          isUnlocked={effectiveStatuses[1] === 'completed'} />

        <!-- IA Unit — off-radar, always unlocked -->
        <IANode cx={iaNodePos.cx} cy={iaNodePos.cy}
                status={iaEffectiveStatus} progress={iaProgress}
                onSelect={handleIAClick} />

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

        <!-- Pass 1: all unit nodes, always at their real spiral position/size -->
        {#each program.units as unit, i (unit.id)}
          {@const uPos  = unitPositions[i]}
          {@const isIP  = effectiveStatuses[i] === 'in-progress'}
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
              size={UNIT_SIZE} index={i}
              compact={true} labelOutward={true}
              labelGap={LABEL_GAP} showLabel={false}
            />
          </g>
        {/each}

        <!-- Open unit's activities: satellites orbiting its real position, drawn last so
             they always sit on top of every sphere (no modal, no re-centring). -->
        {#if panelUnit && panelUnitPos}
          <ActivityOrbit
            activities={panelActivities}
            cx={panelUnitPos.x}
            cy={panelUnitPos.y}
            unitR={panelUnitR}
            titleFontSize={20}
            {onActivitySelected}
          />
        {/if}

        <!-- Open IA node's activities: same "satellites in place" treatment -->
        {#if panelIA}
          <ActivityOrbit
            activities={iaDisplayActivities}
            cx={iaNodePos.cx}
            cy={iaNodePos.cy}
            unitR={iaUnitR}
            titleFontSize={IA_TITLE_FONT}
            {onActivitySelected}
          />
        {/if}

      </g><!-- end zoomable -->

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
    background: rgba(31, 51, 71, 0.25);
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
