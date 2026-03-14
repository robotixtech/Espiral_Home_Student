/** Status of a unit within the program */
export type UnitStatus = 'completed' | 'in-progress' | 'locked';

/** A single unit (course) in the program spiral */
export interface ProgramUnit {
  id: number;
  shortname: string;
  label: string;
  fullname: string;
  status: UnitStatus;
  progress: number; // 0–100
  courseUrl: string;
  icon: UnitIcon;
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
  | 'trophy';    // final project

/** The full program data */
export interface ProgramData {
  id: number;
  shortname: string;
  fullname: string;
  /** The central "sun" node — always rendered at the galaxy center */
  sun: ProgramUnit;
  /** Units that orbit the sun along the spiral */
  units: ProgramUnit[];
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
