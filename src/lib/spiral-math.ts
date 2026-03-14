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

/** Calculate what fraction of the spiral should be filled based on unit statuses */
export function getProgressFraction(
  units: { status: string; progress: number }[],
): number {
  const total = units.length;
  if (total === 0) return 0;

  let filled = 0;
  for (const unit of units) {
    if (unit.status === 'completed') {
      filled += 1;
    } else if (unit.status === 'in-progress') {
      filled += unit.progress / 100;
      break;
    } else {
      break;
    }
  }
  return filled / total;
}
