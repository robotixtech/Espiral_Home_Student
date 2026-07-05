// Shared layout for the activity orbit: pill positions/sizes around a unit, plus the overall
// bounding half-extents so the detail-view container can size itself to fit every pill.

export interface OrbitChip {
  a: number;   // angle
  x: number;   // pill centre x (relative to unit centre)
  y: number;   // pill centre y
  cw: number;  // pill width
}

export interface OrbitLayout {
  chips: OrbitChip[];
  pillH: number;
  pillFont: number;
  hw: number;  // bounding half-width  (unit + pills)
  hh: number;  // bounding half-height (unit + pills)
}

/** Compute the pill layout around a unit. `titleFontSize` is the unit's title size;
 *  pills render 20% smaller. Returns positions + the bounding half-extents. */
export function activityOrbitLayout(
  activities: { label: string }[],
  unitR: number,
  outwardAngle: number,
  titleFontSize: number,
): OrbitLayout {
  const pillFont = titleFontSize * 0.8;
  const pillH    = pillFont * 1.9;
  const padX     = pillFont * 0.8;
  const gap      = 10;
  const n        = activities.length;

  const chipWidth = (label: string) => Math.max(60, label.length * pillFont * 0.56 + 2 * padX);

  // Start the bounding box at the unit's full visual extent (sphere + band + halo overhang).
  let hw = unitR + 42;
  let hh = unitR + 42;

  if (n === 0) return { chips: [], pillH, pillFont, hw, hh };

  const widths = activities.map(a => chipWidth(a.label));
  const angles = Array.from({ length: n }, (_, j) => {
    const inward   = outwardAngle + Math.PI;
    const halfStep = Math.PI / n;
    return inward + halfStep + (2 * Math.PI * j) / n;
  });

  // Start from each pill's minimum radius (so its inward edge clears the sphere), then grow
  // the SINGLE shared radius until no two angularly-adjacent pills overlap. All pills sit at
  // the same radius, so the check must run at that shared radius (not per-pill).
  const baseR = (unitR + gap + pillH / 2) * 1.2;
  const minRadii = angles.map((a, j) => {
    const cosA = Math.abs(Math.cos(a));
    const sinA = Math.abs(Math.sin(a));
    if (cosA > sinA && cosA > 0.1) return Math.max(baseR, (unitR + gap + widths[j] / 2) / cosA);
    return baseR;
  });

  const GAP_XY = 12; // clear space kept between neighbouring pills
  let uniformR = Math.max(...minRadii);
  for (let iter = 0; iter < 400; iter++) {
    let ok = true;
    for (let j = 0; j < n && ok; j++) {
      const j2 = (j + 1) % n;
      if (j2 === j) continue;
      const dx = Math.abs(uniformR * Math.cos(angles[j]) - uniformR * Math.cos(angles[j2]));
      const dy = Math.abs(uniformR * Math.sin(angles[j]) - uniformR * Math.sin(angles[j2]));
      if (dx < (widths[j] + widths[j2]) / 2 + GAP_XY && dy < pillH + GAP_XY) ok = false;
    }
    if (ok) break;
    uniformR += 8;
  }
  const chips = angles.map((a, j) => ({
    a,
    x:  uniformR * Math.cos(a),
    y:  uniformR * Math.sin(a),
    cw: widths[j],
  }));

  for (const c of chips) {
    hw = Math.max(hw, Math.abs(c.x) + c.cw / 2);
    hh = Math.max(hh, Math.abs(c.y) + pillH / 2);
  }

  return { chips, pillH, pillFont, hw, hh };
}
