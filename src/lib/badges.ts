import type { ProgramUnit } from './types';
import { BADGES } from './master-config';

// Values are defined in src/lib/master-config.ts → BADGES section.
const { minGrade: MIN_GRADE, unitPattern: BADGE_UNIT_PATTERN } = BADGES;

function resolveBadgeUrl(programShortname: string, unitDisplayName: string): string {
  return `${import.meta.env.BASE_URL}badges/${programShortname}_${unitDisplayName}.png`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  API PÚBLICA  —  consumida por Badges_panel.svelte
// ═══════════════════════════════════════════════════════════════════════════════

/** Devuelve true si la unidad tiene badge asociado. */
export function hasBadge(displayName: string): boolean {
  return BADGE_UNIT_PATTERN.test(displayName);
}

/** Devuelve la URL de la imagen del badge para la unidad dada. */
export function badgeUrl(programShortname: string, unitDisplayName: string): string {
  return resolveBadgeUrl(programShortname, unitDisplayName);
}

/** Devuelve la URL de la imagen a mostrar cuando un badge está en estado "blocked".
 *  Apunta al directorio del bloque de Moodle: /blocks/espiral_dashboard/visual/badges/badge_locked.webp */
export function badgeBlockedUrl(): string {
  const path = '/blocks/espiral_dashboard/visual/badges/badge_locked.webp';

  // Si se ejecuta en el navegador y Moodle define su URL base (wwwroot), la concatenamos
  if (typeof window !== 'undefined') {
    const wwwroot = (window as any).M?.cfg?.wwwroot || (window as any).CFG?.wwwroot;
    if (wwwroot) {
      return `${wwwroot.replace(/\/$/, '')}${path}`;
    }
  }

  return path;
}

/** Devuelve true si el alumno ha ganado el badge de la unidad — la unidad de referencia debe
 *  estar en status "completed" */
export function isBadgeEarned(unit: ProgramUnit): boolean {
  return unit.status === 'completed' && (unit.grade ?? 0) >= MIN_GRADE;
}