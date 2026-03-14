import { MoodleApi } from './moodle-api';
import type { ProgramData, ProgramUnit, UnitStatus, UnitIcon } from './types';
import type { IframeConfig } from './token';

/**
 * Load program data from the Moodle REST API.
 * Maps Moodle courses to our ProgramUnit model.
 */
export async function loadProgramFromMoodle(config: IframeConfig): Promise<ProgramData> {
  const api = new MoodleApi(config.baseUrl, config.token);

  // Step 1: Validate token and get user ID
  const siteInfo = await api.getSiteInfo();
  const userId = siteInfo.userid;

  // Step 2: Get all user courses
  const allCourses = await api.getUserCourses(userId);

  // Step 3: Filter courses belonging to this program (by shortname prefix)
  const programPrefix = config.programShortname;
  const programCourses = allCourses
    .filter((c) => c.fullname.startsWith(programPrefix))
    .sort((a, b) => {
      // Sort by the unit number extracted from fullname
      const numA = extractUnitNumber(a.fullname);
      const numB = extractUnitNumber(b.fullname);
      return numA - numB;
    });

  // Step 4: Map to ProgramUnit with status inference
  const units: ProgramUnit[] = programCourses.map((course, index) => {
    const isLast = isMisionControl(course.fullname);
    const unitNum = extractUnitNumber(course.fullname);
    const progress = course.progress ?? 0;
    const status = inferStatus(course.completed, progress, index, programCourses);

    return {
      id: course.id,
      shortname: course.shortname,
      label: isLast ? 'Misión Control' : `U${unitNum}`,
      fullname: course.fullname,
      status,
      progress: Math.round(progress),
      courseUrl: course.viewurl ?? `${config.baseUrl}/course/view.php?id=${course.id}`,
      icon: assignIcon(unitNum, isLast),
    };
  });

  // The "sun" node — Open Scentia — is a fixed entry point
  // In production, this could be fetched as a separate course or configured
  const sun: ProgramUnit = {
    id: 0,
    shortname: `${programPrefix}-OS`,
    label: 'Open Scentia',
    fullname: 'Open Scentia',
    status: 'completed',
    progress: 100,
    courseUrl: `${config.baseUrl}`,
    icon: 'sun',
  };

  return {
    id: 0,
    shortname: programPrefix,
    fullname: programPrefix,
    sun,
    units,
  };
}

/** Extract unit number from fullname like "C450 – Unidad 3. Visión de túnel" → 3 */
function extractUnitNumber(fullname: string): number {
  // "Misión control" gets a high number to sort last
  if (isMisionControl(fullname)) return 999;
  const match = fullname.match(/Unidad\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function isMisionControl(fullname: string): boolean {
  return /misi[oó]n\s+control/i.test(fullname);
}

/**
 * Infer unit status from Moodle completion data.
 * Logic: completed courses are 'completed', the first non-completed is 'in-progress',
 * everything after is 'locked'.
 */
function inferStatus(
  completed: boolean,
  progress: number,
  _index: number,
  _allCourses: Array<{ completed: boolean; progress: number | null }>,
): UnitStatus {
  if (completed || progress >= 100) return 'completed';
  if (progress > 0) return 'in-progress';
  return 'locked';
}

/** Assign an icon based on unit number and type */
function assignIcon(unitNum: number, isFinal: boolean): UnitIcon {
  if (isFinal) return 'trophy';
  const icons: UnitIcon[] = ['flag', 'signal', 'car', 'tunnel', 'search', 'signal', 'alert'];
  return icons[unitNum] ?? 'gear';
}
