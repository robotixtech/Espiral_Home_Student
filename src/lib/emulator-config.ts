import { EMULATOR } from './master-config';

export interface EmulatorConfig {
  tickMs: number;
  progressStep: number;
  pauseBetweenUnitsMs: number;
  pauseBeforeRestartMs: number;
}

// Values are defined in src/lib/master-config.ts → EMULATOR section.
export const EMULATOR_CONFIG: EmulatorConfig = { ...EMULATOR };
