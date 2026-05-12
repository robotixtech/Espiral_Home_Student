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
    .filter((c) => c.fullname.startsWith(programPrefix));

  // Step 4: Map over the CONFIGURATION (Single Source of Truth)
  const units: ProgramUnit[] = programConfig.units.map((cfg, index) => {
    // Buscar si Moodle devolvió este curso específico comparando el índice
    const course = programCourses.find(c => extractUnitNumber(c.fullname) === index);

    if (course) {
      // El curso existe en el profile del usuario en Moodle
      const progress = course.progress ?? 0;
      const status = inferStatus(course.completed, progress);

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
    }

    // Fallback: El curso no está en el payload de Moodle (Unidad futura / Bloqueada)
    return {
      // Usamos un ID negativo predecible para evitar problemas de colisión en el {#each} de Svelte
      id: -(index + 1), 
      shortname: `${programPrefix}-LOCKED-${index}`,
      label: cfg?.label ?? `U${index}`,
      displayName: cfg?.displayName ?? `Unidad ${index}`,
      fullname: cfg?.fullname ?? `Unidad ${index} (Bloqueada)`,
      status: 'locked',
      progress: 0,
      courseUrl: cfg?.href ?? '#',
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