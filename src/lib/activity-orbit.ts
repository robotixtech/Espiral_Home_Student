// Shared layout for the activity orbit: pill positions/sizes around a unit, plus the overall
// bounding half-extents so the detail-view container can size itself to fit every pill.

export interface OrbitChip {
  a: number;      // angle
  x: number;      // chip centre x (relative to unit centre)
  y: number;      // chip centre y
  d: number;      // chip diameter (all chips are circles, same size)
  label: string;  // short display text (1, 2, 3, DD, C)
}

/** Activities always follow the same fixed pattern: N regular activities, then the system
 *  "DemoDay" and "Continuar" steps. Regular ones show their 1-based position; the system
 *  steps show a fixed short code — never the full label. */
function shortLabels(activities: { label: string }[]): string[] {
  let regularCount = 0;
  return activities.map(a => {
    if (a.label === 'DemoDay')   return 'DD';
    if (a.label === 'Continuar') return 'C';
    return String(++regularCount);
  });
}

// Fixed clock-face position for each slot — same for every sphere, regardless of where it
// sits in the spiral (no longer derived from the unit's outward direction).
const CLOCK_HOUR: Record<string, number> = { '1': 10, '2': 12, '3': 14, 'DD': 17, 'C': 19 };

/** Angle for a 24h clock hour in this (y-down) coordinate system: 3 o'clock = 0°, and
 *  increasing angle rotates clockwise — matching real clock hands. */
function clockAngle(hour24: number): number {
  const hour12 = hour24 % 12;
  return (hour12 - 3) * (Math.PI / 6); // 30° per hour
}

export interface OrbitLayout {
  chips: OrbitChip[];
  chipD: number;    // shared chip diameter
  pillFont: number;
  hw: number;  // bounding half-width  (unit + chips)
  hh: number;  // bounding half-height (unit + chips)
}

/** Compute the chip layout around a unit. `titleFontSize` is the unit's title size;
 *  chip labels render 20% smaller. Returns positions + the bounding half-extents.
 *  All chips are same-size circles — short codes (1, 2, 3, DD, C) don't need variable width. */
export function activityOrbitLayout(
  activities: { label: string }[],
  unitR: number,
  titleFontSize: number,
): OrbitLayout {
  const pillFont = titleFontSize * 0.8;
  const chipD    = Math.max(pillFont * 1.9, 34); // comfortably fits the 2-char "DD" code
  const gap      = 10;
  const n        = activities.length;

  // Start the bounding box at the unit's full visual extent (sphere + band + halo overhang).
  let hw = unitR + 42;
  let hh = unitR + 42;

  if (n === 0) return { chips: [], chipD, pillFont, hw, hh };

  const labels = shortLabels(activities);
  const angles = labels.map(l => clockAngle(CLOCK_HOUR[l] ?? 12));

  // Start from each chip's minimum radius (so its inward edge clears the sphere), then grow
  // the SINGLE shared radius until no two chips overlap. All chips sit at the same radius, so
  // the check must run at that shared radius (not per-chip).
  const baseR = (unitR + gap + chipD / 2) * 1.2;
  const GAP_XY = 12; // clear space kept between neighbouring chips
  let uniformR = baseR;
  for (let iter = 0; iter < 400; iter++) {
    let ok = true;
    for (let j = 0; j < n && ok; j++) {
      for (let k = j + 1; k < n && ok; k++) {
        const dx = Math.abs(uniformR * Math.cos(angles[j]) - uniformR * Math.cos(angles[k]));
        const dy = Math.abs(uniformR * Math.sin(angles[j]) - uniformR * Math.sin(angles[k]));
        if (dx < chipD + GAP_XY && dy < chipD + GAP_XY) ok = false;
      }
    }
    if (ok) break;
    uniformR += 8;
  }
  const chips = angles.map((a, j) => ({
    a,
    x: uniformR * Math.cos(a),
    y: uniformR * Math.sin(a),
    d: chipD,
    label: labels[j],
  }));

  for (const c of chips) {
    hw = Math.max(hw, Math.abs(c.x) + c.d / 2);
    hh = Math.max(hh, Math.abs(c.y) + c.d / 2);
  }

  return { chips, chipD, pillFont, hw, hh };
}
