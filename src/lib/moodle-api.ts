import type {
  MoodleSiteInfo,
  MoodleCourse,
  MoodleCompletionStatus,
} from './types';

/**
 * Typed wrapper around Moodle REST API calls.
 * All requests go through the standard webservice endpoint.
 */
export class MoodleApi {
  private readonly endpoint: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    // Normalize: remove trailing slash
    const base = baseUrl.replace(/\/+$/, '');
    this.endpoint = `${base}/webservice/rest/server.php`;
    this.token = token;
  }

  /** Generic call to a Moodle webservice function */
  private async call<T>(wsfunction: string, params: Record<string, string | number> = {}): Promise<T> {
    const body = new URLSearchParams({
      wstoken: this.token,
      wsfunction,
      moodlewsrestformat: 'json',
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
    });

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Moodle API HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Moodle returns errors as { exception, errorcode, message }
    if (data?.exception) {
      throw new Error(`Moodle API error [${data.errorcode}]: ${data.message}`);
    }

    return data as T;
  }

  /** Validate token and get current user info */
  async getSiteInfo(): Promise<MoodleSiteInfo> {
    return this.call<MoodleSiteInfo>('core_webservice_get_site_info');
  }

  /** Get all courses the current user is enrolled in */
  async getUserCourses(userId: number): Promise<MoodleCourse[]> {
    return this.call<MoodleCourse[]>('core_enrol_get_users_courses', {
      userid: userId,
    });
  }

  /** Get completion status for a specific course */
  async getCourseCompletion(courseId: number, userId: number): Promise<MoodleCompletionStatus> {
    return this.call<MoodleCompletionStatus>(
      'core_completion_get_course_completion_status',
      { courseid: courseId, userid: userId }
    );
  }


  // ── PENDIENTE DE IMPLEMENTAR ────────────────────────────────────────────
  // Los dos métodos siguientes son stubs. El equipo de integración debe
  // implementarlos y conectarlos en program-loader.ts → loadProgramFromMoodle().
  // Verificar la firma exacta de cada endpoint en la doc de Moodle Workplace 4.5
  // antes de implementar — los nombres son orientativos.

  /**
   * Devuelve la nota media del alumno en un curso (0–10).
   * Endpoint orientativo: `gradereport_overview_get_course_grades`
   * Se usa en ProgramUnit.grade para decidir si se otorga el badge (nota >= BADGES.minGrade).
   */
  async getUnitGrade(_courseId: number, _userId: number): Promise<number | null> {
    throw new Error(
      'MoodleApi.getUnitGrade() no implementado. ' +
      'Ver src/lib/master-config.ts → MOODLE_INTEGRATION para el punto de integración exacto.'
    );
  }

  /**
   * Devuelve las actividades de un curso y su estado de compleción por alumno.
   * Endpoints orientativos:
   *   · core_course_get_contents                        → lista de módulos/actividades
   *   · core_completion_get_activities_completion_status → estado completado/no por actividad
   * El resultado debe mapearse a Activity[] en program-loader.ts.
   */
  async getCourseActivities(_courseId: number, _userId: number): Promise<unknown> {
    throw new Error(
      'MoodleApi.getCourseActivities() no implementado. ' +
      'Ver src/lib/master-config.ts → MOODLE_INTEGRATION para el punto de integración exacto.'
    );
  }
}
