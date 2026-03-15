export interface Point {
  x: number;
  y: number;
}

/**
 * Archimedean spiral: r(θ) = a + b·θ
 * We use an elliptical variant where rx and ry grow independently.
 *
 * The spiral makes `turns` full revolutions.
 * Node 0 sits at the innermost point, node N-1 at the outermost.
 */

const TWO_PI = 2 * Math.PI;

export interface SpiralConfig {
  cx: number;
  cy: number;
  /** Inner ellipse semi-axis X */
  r0x: number;
  /** Inner ellipse semi-axis Y */
  r0y: number;
  /** Outer ellipse semi-axis X */
  r1x: number;
  /** Outer ellipse semi-axis Y */
  r1y: number;
  /** Starting angle in radians (0 = 3 o'clock) */
  startAngle: number;
  /** Total number of turns (e.g. 1.35) */
  turns: number;
}

/** Get (x, y) on the spiral at parameter t ∈ [0, 1] */
function spiralPoint(cfg: SpiralConfig, t: number): Point {
  const angle = cfg.startAngle + cfg.turns * TWO_PI * t;
  const rx = cfg.r0x + (cfg.r1x - cfg.r0x) * t;
  const ry = cfg.r0y + (cfg.r1y - cfg.r0y) * t;
  return {
    x: cfg.cx + rx * Math.cos(angle),
    y: cfg.cy + ry * Math.sin(angle),
  };
}

/** Place `count` nodes evenly along the spiral (by parameter t) */
export function getSpiralNodePositions(cfg: SpiralConfig, count: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : i / (count - 1);
    pts.push(spiralPoint(cfg, t));
  }
  return pts;
}

/** Generate a dense SVG path string for the full spiral */
export function getSpiralSvgPath(cfg: SpiralConfig, steps: number = 500): string {
  if (steps < 2) return '';
  const segs: string[] = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const p = spiralPoint(cfg, t);
    segs.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return `M ${segs[0]} ` + segs.slice(1).map(s => `L ${s}`).join(' ');
}

/** Generate the progress (filled) portion of the spiral, up to fraction ∈ [0,1] */
export function getProgressSvgPath(cfg: SpiralConfig, fraction: number, steps: number = 500): string {
  if (fraction <= 0) return '';
  const actualSteps = Math.max(10, Math.round(steps * fraction));
  const segs: string[] = [];
  for (let s = 0; s <= actualSteps; s++) {
    const t = (s / actualSteps) * fraction;
    const p = spiralPoint(cfg, t);
    segs.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return `M ${segs[0]} ` + segs.slice(1).map(s => `L ${s}`).join(' ');
}

/** Generate decorative orbit rings that follow the spiral's curvature.
 *  Returns paths at several fixed t-values (inner, mid, outer). */
export function getOrbitPaths(cfg: SpiralConfig): string[] {
  // Generate 3 full-turn ellipses at different radii along the spiral
  const orbits: string[] = [];
  const tValues = [0.2, 0.55, 0.9]; // inner, mid, outer ring

  for (const tBase of tValues) {
    const rx = cfg.r0x + (cfg.r1x - cfg.r0x) * tBase;
    const ry = cfg.r0y + (cfg.r1y - cfg.r0y) * tBase;
    const segs: string[] = [];
    const orbitSteps = 200;
    for (let s = 0; s <= orbitSteps; s++) {
      const angle = (s / orbitSteps) * TWO_PI;
      const x = cfg.cx + rx * Math.cos(angle);
      const y = cfg.cy + ry * Math.sin(angle);
      segs.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    orbits.push(`M ${segs[0]} ` + segs.slice(1).map(s => `L ${s}`).join(' ') + ' Z');
  }
  return orbits;
}

/**
 * Calculate what fraction of the spiral path should be filled.
 *
 * Nodes sit at t = i / (count - 1), so the line must reach each node's
 * exact position. For an in-progress unit, the line extends from that
 * node's position toward the next node proportionally to its progress.
 */
export function getProgressFraction(
  units: { status: string; progress: number }[],
): number {
  const count = units.length;
  if (count <= 1) return 0;

  const segments = count - 1; // divisor matching getSpiralNodePositions

  for (let i = 0; i < count; i++) {
    const unit = units[i];

    if (unit.status === 'completed') {
      // If this is the last unit and it's completed, fill the entire path
      if (i === count - 1) return 1;
      continue;
    }

    if (unit.status === 'in-progress') {
      // Line reaches this node's position, then extends toward the next
      const nodeT = i / segments;
      const nextT = Math.min((i + 1) / segments, 1);
      const segmentLength = nextT - nodeT;
      return nodeT + segmentLength * (unit.progress / 100);
    }

    // locked — line stops at the last completed node (i-1)
    // which means the line reaches up to that node's position
    if (i === 0) return 0;
    return Math.max(0, (i - 1) / segments);
  }

  return 1; // all completed
}
