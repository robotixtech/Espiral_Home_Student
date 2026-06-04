import type { ProgramUnit } from './types';
import { BADGES } from './master-config';

// Values are defined in src/lib/master-config.ts → BADGES section.
const { minGrade: MIN_GRADE, completionActivity: COMPLETION_ACTIVITY, unitPattern: BADGE_UNIT_PATTERN } = BADGES;

function resolveBadgeUrl(programShortname: string, unitDisplayName: string): string {
  return `${import.meta.env.BASE_URL}badges/${programShortname}_${unitDisplayName}.png`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  API PÚBLICA  —  consumida por BadgePanel.svelte
// ═══════════════════════════════════════════════════════════════════════════════

/** Devuelve true si la unidad tiene badge asociado. */
export function hasBadge(displayName: string): boolean {
  return BADGE_UNIT_PATTERN.test(displayName);
}

/** Devuelve la URL de la imagen del badge para la unidad dada. */
export function badgeUrl(programShortname: string, unitDisplayName: string): string {
  return resolveBadgeUrl(programShortname, unitDisplayName);
}

/** Devuelve true si el alumno ha ganado el badge de la unidad. */
export function isBadgeEarned(unit: ProgramUnit): boolean {
  return effectivelyCompleted(unit) && (unit.grade ?? 0) >= MIN_GRADE;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LÓGICA INTERNA
// ═══════════════════════════════════════════════════════════════════════════════

function effectivelyCompleted(unit: ProgramUnit): boolean {
  if (unit.status === 'completed') return true;
  if (unit.status === 'locked')    return false;

  const activities = unit.activities ?? [];
  if (activities.length === 0) return false;

  const milestoneIdx = activities.findIndex(a => a.label === COMPLETION_ACTIVITY);
  const threshold = milestoneIdx >= 0
    ? ((milestoneIdx + 1) / activities.length) * 100
    : 100;

  return unit.progress >= threshold;
}
