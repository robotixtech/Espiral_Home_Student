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
      label: 'Misión Control',
      displayName: 'Onboarding',
      fullname: 'C450 – Misión control',
      icon: 'gear',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'U0',
      displayName: 'Plataforma de lanzamiento',
      fullname: 'C450 – Unidad 0. Plataforma de lanzamiento',
      icon: 'flag',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'U1',
      displayName: 'Lanzamiento de señal',
      fullname: 'C450 – Unidad 1. Lanzamiento de señal',
      icon: 'signal',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'U2',
      displayName: 'Preparado para mover',
      fullname: 'C450 – Unidad 2. Preparado para mover',
      icon: 'car',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'U3',
      displayName: 'Visión de túnel',
      fullname: 'C450 – Unidad 3. Visión de túnel',
      icon: 'tunnel',
      href: null,
      status: 'in-progress',
      progress: 45,
    },
    {
      label: 'U4',
      displayName: 'Análisis profundo',
      fullname: 'C450 – Unidad 4. Análisis profundo',
      icon: 'search',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U5',
      displayName: 'Señales inteligentes',
      fullname: 'C450 – Unidad 5. Señales inteligentes',
      icon: 'signal',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U6',
      displayName: 'Respuesta a emergencias',
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
      label: 'Misión Control',
      displayName: 'Onboarding',
      fullname: 'C550 – Misión control',
      icon: 'gear',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U0',
      displayName: 'Plataforma de lanzamiento',
      fullname: 'C550 – Unidad 0. Plataforma de lanzamiento',
      icon: 'flag',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U1',
      displayName: 'Puesta en marcha de la base Terra',
      fullname: 'C550 – Unidad 1. Puesta en marcha de la base Terra',
      icon: 'power',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U2',
      displayName: 'Entrenamiento de sensores',
      fullname: 'C550 – Unidad 2. Entrenamiento de sensores',
      icon: 'search',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U3',
      displayName: 'El tiempo lo es todo',
      fullname: 'C550 – Unidad 3. El tiempo lo es todo',
      icon: 'gear',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U4',
      displayName: 'Repetición desde la base Aqua',
      fullname: 'C550 – Unidad 4. Repetición desde la base Aqua',
      icon: 'signal',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U5',
      displayName: 'Respuesta inteligente al océano',
      fullname: 'C550 – Unidad 5. Respuesta inteligente al océano',
      icon: 'alert',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U6',
      displayName: 'Robots reactivos',
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
      label: 'Misión Control',
      displayName: 'Onboarding',
      fullname: 'C650 – Misión control',
      icon: 'gear',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U0',
      displayName: 'Plataforma de lanzamiento',
      fullname: 'C650 – Unidad 0. Plataforma de lanzamiento',
      icon: 'flag',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U1',
      displayName: 'Robots de alerta de emergencia',
      fullname: 'C650 – Unidad 1. Robots de alerta de emergencia',
      icon: 'alert',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U2',
      displayName: 'Sistemas de agricultura inteligente',
      fullname: 'C650 – Unidad 2. Sistemas de agricultura inteligente',
      icon: 'gear',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U3',
      displayName: 'Entrega inteligente',
      fullname: 'C650 – Unidad 3. Entrega inteligente',
      icon: 'car',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U4',
      displayName: 'Exploradores de sensores oceánicos',
      fullname: 'C650 – Unidad 4. Exploradores de sensores oceánicos',
      icon: 'search',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U5',
      displayName: 'Control de comunicaciones',
      fullname: 'C650 – Unidad 5. Control de comunicaciones',
      icon: 'signal',
      href: null,
      status: 'locked',
      progress: 0,
    },
    {
      label: 'U6',
      displayName: 'Clasificación inteligente',
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
      label: 'Misión Control',
      displayName: 'Onboarding',
      fullname: 'C350 – Misión control',
      icon: 'gear',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'U1',
      displayName: 'Puesta en marcha de la base Terra',
      fullname: 'C350 – Unidad 1. Puesta en marcha de la base Terra',
      icon: 'power',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'U2',
      displayName: 'Exploración',
      fullname: 'C350 – Unidad 2. Exploración',
      icon: 'search',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'U3',
      displayName: 'Buen momento',
      fullname: 'C350 – Unidad 3. Buen momento',
      icon: 'gear',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'U4',
      displayName: 'Alertas de la base acuática',
      fullname: 'C350 – Unidad 4. Alertas de la base acuática',
      icon: 'alert',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'U5',
      displayName: 'Responder y repetir',
      fullname: 'C350 – Unidad 5. Responder y repetir',
      icon: 'signal',
      href: null,
      status: 'completed',
      progress: 100,
    },
    {
      label: 'U6',
      displayName: 'Problemas de temblor',
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
