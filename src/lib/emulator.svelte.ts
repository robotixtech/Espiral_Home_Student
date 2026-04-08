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
let nextUnlocked = false; // true once mandatory threshold crossed — next unit is in-progress

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
  nextUnlocked = false;

  // Build initial snapshot: all units locked, first unit in-progress at 0%
  snapshot = buildSnapshot(baseProgram, 0, 0, false);
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

/** Progress threshold at which a unit is considered complete for unlock purposes.
 *  "Continuar" is optional — only mandatory activities count toward unlocking. */
function mandatoryThreshold(unit: ProgramUnit): number {
  const acts = unit.activities ?? [];
  if (acts.length === 0) return 100;
  const mandatory = acts.filter(a => a.label !== 'Continuar');
  if (mandatory.length === 0) return 100;
  return (mandatory.length / acts.length) * 100;
}

function tick(baseProgram: ProgramData): void {
  if (!active) return;

  const totalUnits = baseProgram.units.length;
  currentProgress += EMULATOR_CONFIG.progressStep;

  // Unlock next unit as soon as mandatory activities are done
  const threshold = mandatoryThreshold(baseProgram.units[unitIndex]);
  if (!nextUnlocked && currentProgress > threshold) {
    nextUnlocked = true;
  }

  if (currentProgress > 100) {
    // Current unit fully complete (incl. Continuar) — move to next
    currentProgress = 0;
    nextUnlocked = false;
    unitIndex++;

    if (unitIndex >= totalUnits) {
      // All units done — pause, then restart
      snapshot = buildSnapshot(baseProgram, totalUnits - 1, 100, false);
      timer = setTimeout(() => {
        if (!active) return;
        unitIndex = 0;
        currentProgress = 0;
        nextUnlocked = false;
        snapshot = buildSnapshot(baseProgram, 0, 0, false);
        scheduleTick(baseProgram);
      }, EMULATOR_CONFIG.pauseBeforeRestartMs);
      return;
    }

    // Pause between units
    snapshot = buildSnapshot(baseProgram, unitIndex, 0, false);
    timer = setTimeout(() => scheduleTick(baseProgram), EMULATOR_CONFIG.pauseBetweenUnitsMs);
    return;
  }

  snapshot = buildSnapshot(baseProgram, unitIndex, currentProgress, nextUnlocked);
  scheduleTick(baseProgram);
}

/**
 * Build a ProgramData snapshot where:
 * - Units before activeIdx → completed (100%)
 * - Unit at activeIdx → in-progress (progress%)
 * - Unit at activeIdx+1 → in-progress (0%) if nextUnlocked (mandatory threshold crossed)
 * - Remaining units → locked (0%)
 */
function buildSnapshot(
  base: ProgramData,
  activeIdx: number,
  progress: number,
  nextUnlocked: boolean,
): ProgramData {
  const units: ProgramUnit[] = base.units.map((u, i) => {
    if (i < activeIdx) {
      return { ...u, status: 'completed', progress: 100 };
    }
    if (i === activeIdx) {
      return { ...u, status: 'in-progress', progress: Math.min(progress, 100) };
    }
    if (i === activeIdx + 1 && nextUnlocked) {
      return { ...u, status: 'in-progress', progress: 0 };
    }
    return { ...u, status: 'locked', progress: 0 };
  });

  return { ...base, units };
}
