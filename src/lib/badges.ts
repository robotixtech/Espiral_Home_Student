import type { ProgramUnit } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN DE BADGES
//  Edita este bloque para cambiar el comportamiento. No toques la lógica debajo.
// ═══════════════════════════════════════════════════════════════════════════════

/** Nota mínima (sobre 10) que debe tener el alumno para recibir el badge. */
const MIN_GRADE = 6;

/**
 * Actividad que marca una unidad como "completada" a efectos del badge.
 * Las actividades opcionales posteriores (p.ej. "Continuar") no bloquean la entrega.
 * Ponlo a null para exigir el 100 % de progreso en su lugar.
 */
const COMPLETION_ACTIVITY = 'DemoDay';

/**
 * Qué unidades reciben badge. Actualmente: U1, U2 … U9, U10, etc.
 * Excluye MC (Misión Control), U0 y otros identificadores no estándar.
 *
 * Para usar una lista explícita en lugar de la expresión regular:
 *   const BADGE_UNITS = new Set(['U1', 'U2', 'U3', 'U4', 'U5', 'U6']);
 *   return BADGE_UNITS.has(displayName);
 */
const BADGE_UNIT_PATTERN = /^U[1-9]\d*$/;

/**
 * URL de la imagen del badge.
 * Edita aquí para cambiar la carpeta, la CDN o la convención de nombre.
 *
 * Convención actual: public/badges/{shortname}_{displayName}.png → C450_U1.png
 *
 * Para usar URLs fijas por unidad:
 *   const BADGE_URLS: Record<string, string> = { U1: 'https://...', U2: '...' };
 *   return BADGE_URLS[unitDisplayName] ?? '';
 */
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
