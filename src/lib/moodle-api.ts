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

  // TODO(moodle): añadir método para obtener la nota de la unidad (orientativo: `gradereport_overview_get_course_grades`).
  // TODO(moodle): añadir métodos para obtener actividades y su progreso (orientativo: `core_course_get_contents` + `core_completion_get_activities_completion_status`).
  // Verificar disponibilidad y firma exacta en la documentación oficial de Moodle Workplace 4.5.
}
