import type { ProgramUnit } from './types';
import { BADGES } from './master-config';

// Values are defined in src/lib/master-config.ts → BADGES section.
const { minGrade: MIN_GRADE, unitPattern: BADGE_UNIT_PATTERN, blockedImageUrl: BLOCKED_IMAGE_URL } = BADGES;

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

/** Devuelve la URL de la imagen a mostrar cuando un badge está en estado "blocked"
 *  (configurable en master-config.ts → BADGES.blockedImageUrl). */
export function badgeBlockedUrl(): string {
  return `${import.meta.env.BASE_URL}${BLOCKED_IMAGE_URL}`;
}

/** Devuelve true si el alumno ha ganado el badge de la unidad — la unidad de referencia debe
 *  estar en status "completed" (2026-07-10 feedback: antes se otorgaba antes de tiempo, en
 *  cuanto el progreso cruzaba el umbral de DemoDay aunque el status siguiera "in-progress"). */
export function isBadgeEarned(unit: ProgramUnit): boolean {
  return unit.status === 'completed' && (unit.grade ?? 0) >= MIN_GRADE;
}
