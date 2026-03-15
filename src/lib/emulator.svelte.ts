/**
 * Emulator — progressively advances unit statuses and progress
 * to demo the full lifecycle of a student's journey.
 */

import type { ProgramData, ProgramUnit } from './types';
import { EMULATOR_CONFIG } from './emulator-config';

let active = $state(false);
let timer: ReturnType<typeof setTimeout> | null = null;

/** The emulated snapshot — null when emulator is off */
let snapshot = $state<ProgramData | null>(null);

// Internal mutable state for the simulation
let unitIndex = 0;
let currentProgress = 0;

export function isEmulatorActive(): boolean {
  return active;
}

export function getEmulatedProgram(): ProgramData | null {
  return snapshot;
}

export function toggleEmulator(baseProgram: ProgramData): void {
  if (active) {
    stopEmulator();
  } else {
    startEmulator(baseProgram);
  }
}

function startEmulator(baseProgram: ProgramData): void {
  active = true;
  unitIndex = 0;
  currentProgress = 0;

  // Build initial snapshot: all units locked, first unit in-progress at 0%
  snapshot = buildSnapshot(baseProgram, 0, 0);
  scheduleTick(baseProgram);
}

function stopEmulator(): void {
  active = false;
  snapshot = null;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function scheduleTick(baseProgram: ProgramData): void {
  if (!active) return;
  timer = setTimeout(() => tick(baseProgram), EMULATOR_CONFIG.tickMs);
}

function tick(baseProgram: ProgramData): void {
  if (!active) return;

  const totalUnits = baseProgram.units.length;
  currentProgress += EMULATOR_CONFIG.progressStep;

  if (currentProgress > 100) {
    // Current unit completed — move to next
    currentProgress = 0;
    unitIndex++;

    if (unitIndex >= totalUnits) {
      // All units done — pause, then restart
      snapshot = buildSnapshot(baseProgram, totalUnits - 1, 100);
      timer = setTimeout(() => {
        if (!active) return;
        unitIndex = 0;
        currentProgress = 0;
        snapshot = buildSnapshot(baseProgram, 0, 0);
        scheduleTick(baseProgram);
      }, EMULATOR_CONFIG.pauseBeforeRestartMs);
      return;
    }

    // Pause between units
    snapshot = buildSnapshot(baseProgram, unitIndex, 0);
    timer = setTimeout(() => scheduleTick(baseProgram), EMULATOR_CONFIG.pauseBetweenUnitsMs);
    return;
  }

  snapshot = buildSnapshot(baseProgram, unitIndex, currentProgress);
  scheduleTick(baseProgram);
}

/**
 * Build a ProgramData snapshot where:
 * - Units before activeIdx → completed (100%)
 * - Unit at activeIdx → in-progress (progress%)
 * - Units after activeIdx → locked (0%)
 */
function buildSnapshot(
  base: ProgramData,
  activeIdx: number,
  progress: number,
): ProgramData {
  const units: ProgramUnit[] = base.units.map((u, i) => {
    if (i < activeIdx) {
      return { ...u, status: 'completed', progress: 100 };
    }
    if (i === activeIdx) {
      return {
        ...u,
        status: progress >= 100 ? 'completed' : 'in-progress',
        progress: Math.min(progress, 100),
      };
    }
    return { ...u, status: 'locked', progress: 0 };
  });

  return { ...base, units };
}
