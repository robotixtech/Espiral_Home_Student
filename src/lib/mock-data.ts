import type { ProgramData } from './types';
import { DEFAULT_CONFIG } from './program-config';

/**
 * Generates mock program data from the config file.
 * Status and progress are read directly from program-config.ts.
 */

export const MOCK_PROGRAM: ProgramData = {
  id: 1,
  shortname: DEFAULT_CONFIG.shortname,
  fullname: DEFAULT_CONFIG.fullname,
  sun: {
    id: 99,
    shortname: `${DEFAULT_CONFIG.shortname}-OS`,
    label: DEFAULT_CONFIG.sun.label,
    displayName: DEFAULT_CONFIG.sun.label,
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
    displayName: cfg.displayName,
    fullname: cfg.fullname,
    status: cfg.status,
    progress: cfg.progress,
    courseUrl: cfg.href ?? '#',
    icon: cfg.icon,
    activities: cfg.activities?.map((act, j) => ({
      id: 1000 + i * 10 + j,
      label: act.label,
      status: act.status,
      progress: act.progress,
      icon: act.icon,
      activityUrl: act.href ?? '#',
    })),
  })),
};
