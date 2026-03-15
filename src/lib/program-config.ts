import type { UnitIcon } from './types';

/**
 * Program configuration — single source of truth for texts, icons, and labels.
 *
 * This file is the ONLY place to edit unit display names, icons, and labels.
 * In production, this config will be replaced by dynamic data from the Moodle API.
 */

// ─────────────────────────────────────────────
// Status labels (shared across all programs)
// ─────────────────────────────────────────────

export const STATUS_LABELS = {
  completed: 'Completado',
  inProgress: 'En curso',
  locked: '',
} as const;

/** Configuration for the central "sun" node */
export interface SunConfig {
  label: string;
  icon: UnitIcon;
  /** URL the sun node links to (null = no link) */
  href: string | null;
}

/** Configuration for each orbital unit */
export interface UnitConfig {
  /** Short label shown on the node (e.g. "U0", "Misión Control") */
  label: string;
  /** Display name shown below the node */
  displayName: string;
  /** Full course name as it appears in Moodle */
  fullname: string;
  /** Icon key for UnitIcon component */
  icon: UnitIcon;
  /** URL the unit links to when clicked (null = resolved from Moodle at runtime) */
  href: string | null;
  /** Unit status: 'completed' | 'in-progress' | 'locked' */
  status: 'completed' | 'in-progress' | 'locked';
  /** Progress percentage 0–100 */
  progress: number;
}

/** Full program configuration */
export interface ProgramConfig {
  /** Program short code (e.g. "C450") */
  shortname: string;
  /** Program display name */
  fullname: string;
  /** Central sun node config */
  sun: SunConfig;
  /** Ordered list of unit configs (first = innermost orbit, last = outermost) */
  units: UnitConfig[];
}

// ─────────────────────────────────────────────
// C450 Program Configuration
// ─────────────────────────────────────────────

export const C450_CONFIG: ProgramConfig = {
  shortname: 'C450',
  fullname: 'C450',

  sun: {
    label: 'Open Scentia',
    icon: 'sun',
    href: null,
  },

  units: [
    {
      label: 'Onboarding',
      displayName: 'Misión Control',
      fullname: 'C450 – Misión control',
      icon: 'gear',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Plataforma de lanzamiento',
      displayName: 'U0',
      fullname: 'C450 – Unidad 0. Plataforma de lanzamiento',
      icon: 'flag',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Lanzamiento de señal',
      displayName: 'U1',
      fullname: 'C450 – Unidad 1. Lanzamiento de señal',
      icon: 'signal',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Preparado para mover',
      displayName: 'U2',
      fullname: 'C450 – Unidad 2. Preparado para mover',
      icon: 'car',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Visión de túnel',
      displayName: 'U3',
      fullname: 'C450 – Unidad 3. Visión de túnel',
      icon: 'tunnel',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Análisis profundo',
      displayName: 'U4',
      fullname: 'C450 – Unidad 4. Análisis profundo',
      icon: 'search',
      href: null,
      status: 'in-progress',
      progress: 30,
    },
    {
      label: 'Señales inteligentes',
      displayName: 'U5',
      fullname: 'C450 – Unidad 5. Señales inteligentes',
      icon: 'signal',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Respuesta a emergencias',
      displayName: 'U6',
      fullname: 'C450 – Unidad 6. Respuesta a emergencias',
      icon: 'alert',
      href: null,
      status: 'locked',
      progress: 0,
    },
  ],
};

// ─────────────────────────────────────────────
// C550 Program Configuration (next program)
// ─────────────────────────────────────────────

export const C550_CONFIG: ProgramConfig = {
  shortname: 'C550',
  fullname: 'C550',

  sun: {
    label: 'Open Scentia',
    icon: 'sun',
    href: null,
  },

  units: [
    {
      label: 'Onboarding',
      displayName: 'Misión Control',
      fullname: 'C550 – Misión control',
      icon: 'gear',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Plataforma de lanzamiento',
      displayName: 'U0',
      fullname: 'C550 – Unidad 0. Plataforma de lanzamiento',
      icon: 'flag',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Puesta en marcha de la base Terra',
      displayName: 'U1',
      fullname: 'C550 – Unidad 1. Puesta en marcha de la base Terra',
      icon: 'power',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Entrenamiento de sensores',
      displayName: 'U2',
      fullname: 'C550 – Unidad 2. Entrenamiento de sensores',
      icon: 'search',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'El tiempo lo es todo',
      displayName: 'U3',
      fullname: 'C550 – Unidad 3. El tiempo lo es todo',
      icon: 'gear',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Repetición desde la base Aqua',
      displayName: 'U4',
      fullname: 'C550 – Unidad 4. Repetición desde la base Aqua',
      icon: 'signal',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Respuesta inteligente al océano',
      displayName: 'U5',
      fullname: 'C550 – Unidad 5. Respuesta inteligente al océano',
      icon: 'alert',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Robots reactivos',
      displayName: 'U6',
      fullname: 'C550 – Unidad 6. Robots reactivos',
      icon: 'car',
      href: null,
      status: 'locked',
      progress: 0,
    },
  ],
};

// ─────────────────────────────────────────────
// C650 Program Configuration (future program)
// ─────────────────────────────────────────────

export const C650_CONFIG: ProgramConfig = {
  shortname: 'C650',
  fullname: 'C650',

  sun: {
    label: 'Open Scentia',
    icon: 'sun',
    href: null,
  },

  units: [
    {
      label: 'Onboarding',
      displayName: 'Misión Control',
      fullname: 'C650 – Misión control',
      icon: 'gear',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Plataforma de lanzamiento',
      displayName: 'U0',
      fullname: 'C650 – Unidad 0. Plataforma de lanzamiento',
      icon: 'flag',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Robots de alerta de emergencia',
      displayName: 'U1',
      fullname: 'C650 – Unidad 1. Robots de alerta de emergencia',
      icon: 'alert',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Sistemas de agricultura inteligente',
      displayName: 'U2',
      fullname: 'C650 – Unidad 2. Sistemas de agricultura inteligente',
      icon: 'gear',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Entrega inteligente',
      displayName: 'U3',
      fullname: 'C650 – Unidad 3. Entrega inteligente',
      icon: 'car',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Exploradores de sensores oceánicos',
      displayName: 'U4',
      fullname: 'C650 – Unidad 4. Exploradores de sensores oceánicos',
      icon: 'search',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Control de comunicaciones',
      displayName: 'U5',
      fullname: 'C650 – Unidad 5. Control de comunicaciones',
      icon: 'signal',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'Clasificación inteligente',
      displayName: 'U6',
      fullname: 'C650 – Unidad 6. Clasificación inteligente',
      icon: 'tunnel',
      href: null,
      status: 'locked',
      progress: 0,
    },
  ],
};

// ─────────────────────────────────────────────
// C350 Program Configuration (completed program)
// ─────────────────────────────────────────────

export const C350_CONFIG: ProgramConfig = {
  shortname: 'C350',
  fullname: 'C350',

  sun: {
    label: 'Open Scentia',
    icon: 'sun',
    href: null,
  },

  units: [
    {
      label: 'Onboarding',
      displayName: 'Misión Control',
      fullname: 'C350 – Misión control',
      icon: 'gear',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Puesta en marcha de la base Terra',
      displayName: 'U1',
      fullname: 'C350 – Unidad 1. Puesta en marcha de la base Terra',
      icon: 'power',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Exploración',
      displayName: 'U2',
      fullname: 'C350 – Unidad 2. Exploración',
      icon: 'search',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Buen momento',
      displayName: 'U3',
      fullname: 'C350 – Unidad 3. Buen momento',
      icon: 'gear',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Alertas de la base acuática',
      displayName: 'U4',
      fullname: 'C350 – Unidad 4. Alertas de la base acuática',
      icon: 'alert',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Responder y repetir',
      displayName: 'U5',
      fullname: 'C350 – Unidad 5. Responder y repetir',
      icon: 'signal',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'Problemas de temblor',
      displayName: 'U6',
      fullname: 'C350 – Unidad 6. Problemas de temblor',
      icon: 'tunnel',
      href: null,
      status: 'completed',
      progress: 100,
    },
  ],
};

/** Default program configs */
export const DEFAULT_CONFIG = C450_CONFIG;
export const PREV_PROGRAM_CONFIG = C350_CONFIG;
export const NEXT_PROGRAM_CONFIG = C550_CONFIG;
export const FUTURE_PROGRAM_CONFIG = C650_CONFIG;
