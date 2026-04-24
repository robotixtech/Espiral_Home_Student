import type { ProgramUnit } from './types';

// ─── URL ──────────────────────────────────────────────────────────────────────
//
//  Convention: public/badges/{programShortname}_{unitDisplayName}.png
//  Examples:   C450_U1.png  ·  C450_U6.png
//
//  To change the path, CDN base, or file extension → edit only here.

export function badgeUrl(programShortname: string, unitDisplayName: string): string {
  return `${import.meta.env.BASE_URL}badges/${programShortname}_${unitDisplayName}.png`;
}

// ─── Eligibility ──────────────────────────────────────────────────────────────
//
//  Only units with displayName U1–U9+ carry a badge.
//  MC, U0 and similar are excluded.

export function hasBadge(displayName: string): boolean {
  return /^U[1-9]\d*$/.test(displayName);
}

// ─── Earned status ────────────────────────────────────────────────────────────
//
//  A badge is earned when the unit is effectively completed AND grade >= 6.
//  "Effectively completed" means DemoDay is done — Continuar is optional.

export function isBadgeEarned(unit: ProgramUnit): boolean {
  return effectivelyCompleted(unit) && (unit.grade ?? 0) >= 6;
}

function effectivelyCompleted(unit: ProgramUnit): boolean {
  if (unit.status === 'completed') return true;
  if (unit.status === 'locked')    return false;

  const activities = unit.activities ?? [];
  if (activities.length === 0) return false;

  const demoDayIdx = activities.findIndex(a => a.label === 'DemoDay');
  const threshold = demoDayIdx >= 0
    ? ((demoDayIdx + 1) / activities.length) * 100
    : 100;

  return unit.progress >= threshold;
}
