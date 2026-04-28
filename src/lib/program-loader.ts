import { MoodleApi } from './moodle-api';
import type { ProgramData, ProgramUnit, UnitStatus } from './types';
import type { IframeConfig } from './token';
import { DEFAULT_CONFIG, type ProgramConfig } from './program-config';

/**
 * Load program data from the Moodle REST API.
 * Uses program-config.ts for labels, icons, and display names.
 * Moodle provides: course IDs, progress, completion status, URLs.
 */
export async function loadProgramFromMoodle(
  config: IframeConfig,
  programConfig: ProgramConfig = DEFAULT_CONFIG,
): Promise<ProgramData> {
  const api = new MoodleApi(config.baseUrl, config.token);

  // Step 1: Validate token and get user ID
  const siteInfo = await api.getSiteInfo();
  const userId = siteInfo.userid;

  // Step 2: Get all user courses
  const allCourses = await api.getUserCourses(userId);

  // Step 3: Filter courses belonging to this program (by shortname prefix)
  const programPrefix = programConfig.shortname;
  const programCourses = allCourses
    .filter((c) => c.fullname.startsWith(programPrefix))
    .sort((a, b) => extractUnitNumber(a.fullname) - extractUnitNumber(b.fullname));

  // Step 4: Map to ProgramUnit, merging Moodle data with config
  const units: ProgramUnit[] = programCourses.map((course, index) => {
    const progress = course.progress ?? 0;
    const status = inferStatus(course.completed, progress);

    // Match to config entry by index (courses are sorted to match config order)
    const cfg = programConfig.units[index];

    // TODO(moodle): falta fetchear `grade` y `activities` desde Moodle Workplace 4.5 y añadirlos aquí.
    // Los nombres de función y parámetros son orientativos — verificar en la documentación oficial de Moodle Workplace 4.5.
    return {
      id: course.id,
      shortname: course.shortname,
      label: cfg?.label ?? `U${index}`,
      displayName: cfg?.displayName ?? course.fullname,
      fullname: course.fullname,
      status,
      progress: Math.round(progress),
      courseUrl: cfg?.href ?? course.viewurl ?? `${config.baseUrl}/course/view.php?id=${course.id}`,
      icon: cfg?.icon ?? 'gear',
    };
  });

  // Sun node from config
  const sun: ProgramUnit = {
    id: 0,
    shortname: `${programPrefix}-OS`,
    label: programConfig.sun.label,
    displayName: programConfig.sun.label,
    fullname: programConfig.sun.label,
    status: 'completed',
    progress: 100,
    courseUrl: programConfig.sun.href ?? config.baseUrl,
    icon: programConfig.sun.icon,
  };

  return {
    id: 0,
    shortname: programPrefix,
    fullname: programConfig.fullname,
    sun,
    units,
  };
}

/** Extract unit number from fullname like "C450 – Unidad 3. Visión de túnel" → 3 */
function extractUnitNumber(fullname: string): number {
  if (/misi[oó]n\s+control/i.test(fullname)) return 999;
  const match = fullname.match(/Unidad\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

/** Infer unit status from Moodle completion data */
function inferStatus(completed: boolean, progress: number): UnitStatus {
  if (completed || progress >= 100) return 'completed';
  if (progress > 0) return 'in-progress';
  return 'locked';
}
