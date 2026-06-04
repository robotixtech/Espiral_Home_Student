/**
 * program-config.ts — helper functions y re-exports.
 * Los datos de los programas (unidades, lessons, slides) viven en master-config.ts.
 * Los interfaces viven en types.ts.
 */

import type { ProgramConfig } from './types';
import {
  C350_CONFIG, C450_CONFIG, C550_CONFIG, C650_CONFIG,
  STATUS_LABELS, PROGRAMS,
} from './master-config';

// Re-exports para mantener compatibilidad con todos los importadores existentes
export type { ProgramConfig, UnitConfig, ActivityConfig, SlideConfig, SunConfig } from './types';
export { STATUS_LABELS };
export const DEFAULT_CONFIG       = PROGRAMS.active;
export const PREV_PROGRAM_CONFIG  = PROGRAMS.prev;
export const NEXT_PROGRAM_CONFIG  = PROGRAMS.next;
export const FUTURE_PROGRAM_CONFIG = PROGRAMS.future;
export const ALL_PROGRAM_CONFIGS  = [C350_CONFIG, C450_CONFIG, C550_CONFIG, C650_CONFIG];

// ── Helper functions ──────────────────────────────────────────────────────

/** Devuelve la config del programa por su shortname, o undefined si no existe. */
export function getConfigByShortname(shortname: string): ProgramConfig | undefined {
  return ALL_PROGRAM_CONFIGS.find(c => c.shortname === shortname);
}

/**
 * Dado el shortname del programa principal, devuelve los otros 3 en orden
 * con un flag `isCompleted` (true si su índice en la secuencia es inferior al principal).
 */
export function getDistantConfigs(mainShortname: string) {
  const mainIdx = ALL_PROGRAM_CONFIGS.findIndex(c => c.shortname === mainShortname);
  const others  = ALL_PROGRAM_CONFIGS.filter((_, i) => i !== mainIdx);
  return others.map(c => ({
    config:      c,
    isCompleted: ALL_PROGRAM_CONFIGS.indexOf(c) < mainIdx,
  }));
}
