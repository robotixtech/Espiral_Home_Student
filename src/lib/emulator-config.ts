/**
 * Emulator configuration — controls the speed and granularity
 * of the progress simulation demo.
 */

export interface EmulatorConfig {
  /** Milliseconds between each progress tick */
  tickMs: number;
  /** Percentage points added per tick (e.g. 5 → 0%, 5%, 10%, …, 100%) */
  progressStep: number;
  /** Pause in ms after a unit reaches 100% before moving to the next */
  pauseBetweenUnitsMs: number;
  /** Pause in ms after all units complete before restarting the loop */
  pauseBeforeRestartMs: number;
}

export const EMULATOR_CONFIG: EmulatorConfig = {
  tickMs: 150,
  progressStep: 5,
  pauseBetweenUnitsMs: 800,
  pauseBeforeRestartMs: 8000,
};
