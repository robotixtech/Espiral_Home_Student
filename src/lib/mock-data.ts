import type { ProgramData, UnitStatus } from './types';
import { DEFAULT_CONFIG } from './program-config';

/**
 * Generates mock program data from the config file.
 * Simulates a student who has completed U0–U2, is in-progress on U3,
 * and has U4–U6 + Misión Control locked.
 */

/** Mock progress/status per unit index */
const MOCK_STATUS: Array<{ status: UnitStatus; progress: number }> = [
  { status: 'completed',   progress: 100 },  // U0
  { status: 'completed',   progress: 100 },  // U1
  { status: 'completed',   progress: 100 },  // U2
  { status: 'in-progress', progress: 45 },   // U3
  { status: 'locked',      progress: 0 },    // U4
  { status: 'locked',      progress: 0 },    // U5
  { status: 'locked',      progress: 0 },    // U6
  { status: 'locked',      progress: 0 },    // Misión Control
];

export const MOCK_PROGRAM: ProgramData = {
  id: 1,
  shortname: DEFAULT_CONFIG.shortname,
  fullname: DEFAULT_CONFIG.fullname,
  sun: {
    id: 99,
    shortname: `${DEFAULT_CONFIG.shortname}-OS`,
    label: DEFAULT_CONFIG.sun.label,
    fullname: DEFAULT_CONFIG.sun.label,
    status: 'completed',
    progress: 100,
    courseUrl: DEFAULT_CONFIG.sun.href ?? '#',
    icon: DEFAULT_CONFIG.sun.icon,
  },
  units: DEFAULT_CONFIG.units.map((cfg, i) => ({
    id: 100 + i,
    shortname: `${DEFAULT_CONFIG.shortname}-${cfg.label}`,
    label: cfg.label,
    fullname: cfg.fullname,
    status: MOCK_STATUS[i]?.status ?? 'locked',
    progress: MOCK_STATUS[i]?.progress ?? 0,
    courseUrl: cfg.href ?? '#',
    icon: cfg.icon,
  })),
};
