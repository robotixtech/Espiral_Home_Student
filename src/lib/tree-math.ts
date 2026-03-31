export interface Point {
  x: number;
  y: number;
}

/**
 * Place `count` units evenly around a circle.
 * First unit starts at the top (−90°), going clockwise.
 */
export function getUnitCirclePositions(
  cx: number,
  cy: number,
  radius: number,
  count: number,
): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

/**
 * Place `count` activity nodes in a full 360° ring around a unit.
 *
 * Activities are evenly spaced in a complete circle at `orbit` distance
 * from the unit center. The ring is rotated so no activity lands directly
 * in the unit's inward label zone (the side facing the galaxy center).
 *
 * @param unitX, unitY  — position of the parent unit node
 * @param cx, cy        — galaxy center (used to offset start angle)
 * @param count         — number of activities
 * @param orbit         — distance from unit center to each activity center
 */
export function getActivityOrbitPositions(
  unitX: number,
  unitY: number,
  cx: number,
  cy: number,
  count: number,
  orbit: number,
): Point[] {
  if (count === 0) return [];
  if (count === 1) {
    const outAngle = Math.atan2(unitY - cy, unitX - cx);
    return [{ x: unitX + orbit * Math.cos(outAngle), y: unitY + orbit * Math.sin(outAngle) }];
  }

  // Evenly distribute in 360°, offset by half-step from the inward direction
  // so no activity sits directly where the unit label is placed.
  const inwardAngle = Math.atan2(cy - unitY, cx - unitX);
  const step = (2 * Math.PI) / count;
  const startAngle = inwardAngle + step / 2;

  return Array.from({ length: count }, (_, i) => {
    const a = startAngle + step * i;
    return { x: unitX + orbit * Math.cos(a), y: unitY + orbit * Math.sin(a) };
  });
}

/**
 * Generate an SVG path string for a decorative circle (using arc commands
 * so the path is a proper closed loop, not a single-point degenerate shape).
 */
export function circlePath(cx: number, cy: number, r: number): string {
  return [
    `M ${cx - r} ${cy}`,
    `a ${r} ${r} 0 1 0 ${2 * r} 0`,
    `a ${r} ${r} 0 1 0 ${-(2 * r)} 0`,
    'Z',
  ].join(' ');
}
