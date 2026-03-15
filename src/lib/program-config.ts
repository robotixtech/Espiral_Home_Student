import type { UnitIcon } from './types';

/**
 * Program configuration — single source of truth for texts, icons, and labels.
 *
 * This file is the ONLY place to edit unit display names, icons, and labels.
 * In production, this config will be replaced by dynamic data from the Moodle API.
 */

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
      label: 'U0',
      displayName: 'Plataforma de lanzamiento',
      fullname: 'C450 – Unidad 0. Plataforma de lanzamiento',
      icon: 'flag',
      href: null,
    },
    {
      label: 'U1',
      displayName: 'Lanzamiento de señal',
      fullname: 'C450 – Unidad 1. Lanzamiento de señal',
      icon: 'signal',
      href: null,
    },
    {
      label: 'U2',
      displayName: 'Preparado para mover',
      fullname: 'C450 – Unidad 2. Preparado para mover',
      icon: 'car',
      href: null,
    },
    {
      label: 'U3',
      displayName: 'Visión de túnel',
      fullname: 'C450 – Unidad 3. Visión de túnel',
      icon: 'tunnel',
      href: null,
    },
    {
      label: 'U4',
      displayName: 'Análisis profundo',
      fullname: 'C450 – Unidad 4. Análisis profundo',
      icon: 'search',
      href: null,
    },
    {
      label: 'U5',
      displayName: 'Señales inteligentes',
      fullname: 'C450 – Unidad 5. Señales inteligentes',
      icon: 'signal',
      href: null,
    },
    {
      label: 'U6',
      displayName: 'Respuesta a emergencias',
      fullname: 'C450 – Unidad 6. Respuesta a emergencias',
      icon: 'alert',
      href: null,
    },
    {
      label: 'Misión Control',
      displayName: 'Misión Control',
      fullname: 'C450 – Misión control',
      icon: 'trophy',
      href: null,
    },
  ],
};

/** Default program config used in development */
export const DEFAULT_CONFIG = C450_CONFIG;
