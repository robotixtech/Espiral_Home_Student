/** Status of a unit within the program */
export type UnitStatus = 'completed' | 'in-progress' | 'locked';

/** A single unit (course) in the program spiral */
export interface ProgramUnit {
  id: number;
  shortname: string;
  label: string;
  displayName: string;
  fullname: string;
  status: UnitStatus;
  progress: number; // 0–100
  grade?: number;   // average grade 0–10; badge awarded when >= 6
  courseUrl: string;
  icon: UnitIcon;
  activities?: Activity[];
  // Conservamos la inyección de insignias enviada desde Moodle (de cambios_block)
  badge?: {
    earned: boolean;
    badgeUrl: string;
  };
}

/** Icon identifiers for each unit type */
export type UnitIcon =
  | 'sun'        // Open Scentia - center star
  | 'flag'       // U0 - start
  | 'gear'       // settings/config
  | 'power'      // activation
  | 'car'        // movement
  | 'tunnel'     // vision
  | 'search'     // analysis
  | 'signal'     // signals
  | 'alert'      // emergency
  | 'trophy'     // final project
  | 'rocket'     // launch/platform
  | 'snowflake'  // cooling
  | 'binoculars' // observation
  | 'u0'         // Unidad 0 (custom design asset)
  | 'terra'      // U1-U2 (custom design asset)
  | 'aqua'       // U3-U4 (custom design asset)
  | 'aire'       // U5-U6 (custom design asset)
  | 'candado'    // locked unit/badge (custom design asset)
  | 'ia'         // IA sphere (custom design asset)
  | 'quanta';    // Quanta/nanoQuanta sphere (custom design asset)

/** A single content slide within an activity */
export interface ActivitySlide {
  title: string;
  body: string;
  /** Vimeo/YouTube embed URL */
  video?: string;
  /** Full-width image path (relative to BASE_URL) */
  image?: string;
}

/** A single activity inside a unit */
export interface Activity {
  id: number;
  label: string;
  status: UnitStatus;
  progress: number;
  icon: UnitIcon;
  activityUrl: string;
  slides?: ActivitySlide[];
}

/** The full program data */
export interface ProgramData {
  id: number;
  shortname: string;
  fullname: string;
  quantaUrl?: string;
  /** The central "sun" node — always rendered at the galaxy center */
  sun: ProgramUnit;
  /** Units that orbit the sun along the spiral */
  units: ProgramUnit[];
  /** IA Unit (off-radar, controlada por el campo personalizado ia_course del programa) */
  iaUnit?: ProgramUnit | null;
}

/** Moodle REST API response types (snake_case as returned) */
export interface MoodleSiteInfo {
  userid: number;
  username: string;
  fullname: string;
  sitename: string;
}

export interface MoodleCourse {
  id: number;
  shortname: string;
  fullname: string;
  progress: number | null;
  completed: boolean;
  hidden: boolean;
  viewurl?: string;
}

export interface MoodleCompletionStatus {
  completionstatus: {
    completed: boolean;
    aggregation: number;
    completions: Array<{
      type: number;
      title: string;
      status: string;
      complete: boolean;
      timecompleted: number;
    }>;
  };
}

/** App-level state */
export type AppState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: ProgramData };

// ── Interfaces de configuración estática (Traídas de iThink) ───────────
// Usadas en master-config.ts para definir los datos de cada programa.
// Distintas de ProgramUnit/Activity (que son datos en tiempo real de Moodle).

export interface SunConfig {
  label: string;
  icon: UnitIcon;
  href: string | null;
}

export interface SlideConfig {
  title: string;
  body: string;
  video?: string;
  image?: string;
}

export interface ActivityConfig {
  label: string;
  icon: UnitIcon;
  href: string | null;
  status: 'completed' | 'in-progress' | 'locked';
  progress: number;
  slides?: SlideConfig[];
}

export interface UnitConfig {
  label: string;
  displayName: string;
  fullname: string;
  icon: UnitIcon;
  href: string | null;
  status: 'completed' | 'in-progress' | 'locked';
  progress: number;
  activities?: ActivityConfig[];
}

export interface ProgramConfig {
  shortname: string;
  fullname: string;
  bgImage: string;
  sun: SunConfig;
  units: UnitConfig[];
}