# Integración Moodle — Espiral Home Student (C450)

Este documento describe el estado actual de la integración con la API REST de **Moodle Workplace 4.5**,
qué datos siguen hardcodeados y los pasos para completar cada parte. Está orientado a un desarrollador
que llega al proyecto por primera vez.

> **Aviso importante:** Los nombres de funciones de la API, los parámetros y los snippets de código
> de este documento son **orientativos**. Moodle Workplace 4.5 puede exponer estas funciones con
> nombres, parámetros o estructuras de respuesta distintos a los aquí indicados. Verifica siempre
> contra la documentación oficial de Moodle Workplace 4.5 y prueba cada llamada en tu instancia
> antes de implementarla.

---

## Estado de la integración

| Dato | Estado | API Moodle | Dónde implementar |
|---|---|---|---|
| `progress` de unidad | Integrado | `core_enrol_get_users_courses` | `program-loader.ts` |
| `status` de unidad | Integrado | inferido de `progress` + `completed` | `program-loader.ts` |
| `courseUrl` | Integrado | `course.viewurl` | `program-loader.ts` |
| `grade` (nota promedio) | **Pendiente** | `gradereport_overview_get_course_grades` | `moodle-api.ts` + `program-loader.ts` |
| Lista de actividades + progreso | **Pendiente** | `core_course_get_contents` + `core_completion_get_activities_completion_status` | `moodle-api.ts` + `program-loader.ts` |
| Contenido de slides | **Pendiente** | `core_course_get_contents` (campo `intro`) | `program-loader.ts` + `program-config.ts` |
| Programas vecinos (C350/C550/C650) | **Pendiente** | `core_enrol_get_users_courses` (ya disponible) | `program-loader.ts` |
| `label` / `displayName` de unidad | Parcial (manual) | `course.fullname` (nombre completo) | `program-config.ts` (mapeo de iconos manual) |

---

## 1. `grade` — nota promedio de la unidad

**Descripción:** Nota numérica del alumno en cada curso. Se usa en `badges.ts` para decidir si
se entrega el badge de la unidad. Hoy vale `undefined` en producción y `7` hardcodeado en el
emulador y en `App.svelte`.

**API:** `gradereport_overview_get_course_grades`
- Parámetros: `userid` (número), `courseid` (número, opcional — si se omite devuelve todos)
- Respuesta: `{ grades: [{ courseid, grade }] }`

**Pasos de implementación:**

1. **`src/lib/moodle-api.ts`** — añadir el método en la clase `MoodleApi`:

```typescript
async getCourseGrade(userId: number, courseId: number): Promise<number | undefined> {
  const result = await this.call<{ grades: { courseid: number; grade: string }[] }>(
    'gradereport_overview_get_course_grades',
    { userid: userId, courseid: courseId },
  );
  const entry = result.grades.find((g) => g.courseid === courseId);
  return entry ? parseFloat(entry.grade) : undefined;
}
```

2. **`src/lib/program-loader.ts`** — dentro del `.map()` que construye cada `ProgramUnit`, llamar
al método anterior y añadir `grade` al objeto retornado:

```typescript
const grade = await api.getCourseGrade(userId, course.id);
return {
  // ...resto de campos...
  grade,
};
```

> Nota: el `.map()` deberá convertirse en `Promise.all(programCourses.map(async ...))` para
> permitir `await` dentro.

3. Eliminar los `grade: 7` hardcodeados en `emulator.svelte.ts` (líneas 129 y 132) y
   `App.svelte` (línea 77) una vez que el dato real llegue del loader.

---

## 2. Lista de actividades + progreso por actividad

**Descripción:** Cada unidad tiene entre 4 y 5 actividades (incluyendo "Continuar"). Hoy están
hardcodeadas en `program-config.ts` con `status` y `progress` fijos a `locked`/`0`.

**APIs:**
- `core_course_get_contents` — devuelve las secciones del curso, cada una con sus módulos.
- `core_completion_get_activities_completion_status` — devuelve el estado de finalización de
  cada módulo para un usuario.

**Pasos de implementación:**

1. **`src/lib/moodle-api.ts`** — añadir dos métodos:

```typescript
async getCourseContents(courseId: number): Promise<MoodleSection[]> {
  return this.call<MoodleSection[]>('core_course_get_contents', { courseid: courseId });
}

async getActivitiesCompletion(courseId: number, userId: number): Promise<MoodleActivityCompletion[]> {
  const result = await this.call<{ statuses: MoodleActivityCompletion[] }>(
    'core_completion_get_activities_completion_status',
    { courseid: courseId, userid: userId },
  );
  return result.statuses;
}
```

2. **`src/lib/types.ts`** — añadir los tipos `MoodleSection`, `MoodleModule` y
   `MoodleActivityCompletion` según la respuesta real de la API.

3. **`src/lib/program-loader.ts`** — dentro del `.map()` de unidades, llamar a ambas APIs y
   construir el array `activities`:

```typescript
const [sections, completions] = await Promise.all([
  api.getCourseContents(course.id),
  api.getActivitiesCompletion(course.id, userId),
]);

const activities = sections
  .flatMap((s) => s.modules)
  .map((mod) => {
    const completion = completions.find((c) => c.cmid === mod.id);
    const done = completion?.state === 1;
    const cfgActivity = cfg?.activities?.find((a) => a.label === mod.name);
    return {
      id: mod.id,
      label: mod.name,
      icon: cfgActivity?.icon ?? 'gear',       // icono del config (no viene de Moodle)
      status: done ? 'completed' : 'locked',
      progress: done ? 100 : 0,
      slides: cfgActivity?.slides,             // slides del config hasta que se parsee Moodle
    };
  });
```

---

## 3. Contenido de slides de actividades

**Descripción:** Los slides muestran texto, vídeo (Vimeo) e imágenes. Hoy están completamente
hardcodeados en `program-config.ts` bajo el campo `slides` de cada actividad.

**API:** `core_course_get_contents` ya devuelve el campo `intro` (HTML) de cada módulo.

**Pasos de implementación:**

1. Extraer el campo `mod.intro` (HTML de Moodle) de la respuesta de `getCourseContents`.
2. Parsear el HTML con `DOMParser` para extraer texto limpio, iframes de Vimeo e imágenes.
3. Construir el array `slides` dinámicamente en lugar de leerlo de `program-config.ts`.

> Nota: el HTML de Moodle puede contener estructura variable; se recomienda definir convenciones
> de formato en Moodle (por ejemplo, usar el primer iframe como vídeo y el primer párrafo como
> texto) para que el parseo sea predecible.

---

## 4. Programas vecinos (C350, C550, C650)

**Descripción:** La vista Home muestra "galaxias lejanas" para los programas anterior y siguiente
del alumno. Hoy usan configs estáticos en `program-config.ts`.

**API:** `core_enrol_get_users_courses` ya se llama en el paso 2 de `loadProgramFromMoodle` y
devuelve todos los cursos del usuario. Solo hay que filtrar por prefijo de shortname.

**Pasos de implementación:**

1. **`src/lib/program-loader.ts`** — después de obtener `allCourses`, filtrar por cada prefijo
   de programa vecino y construir un `ProgramData` simplificado para cada uno:

```typescript
function buildNeighborProgram(
  courses: MoodleCourse[],
  prefix: string,
  neighborConfig: ProgramConfig,
): ProgramData {
  const filtered = courses
    .filter((c) => c.shortname.startsWith(prefix))
    .sort((a, b) => extractUnitNumber(a.fullname) - extractUnitNumber(b.fullname));

  return {
    id: 0,
    shortname: prefix,
    fullname: neighborConfig.fullname,
    sun: neighborConfig.sun,
    units: filtered.map((c, i) => ({
      id: c.id,
      shortname: c.shortname,
      label: neighborConfig.units[i]?.label ?? `U${i}`,
      displayName: neighborConfig.units[i]?.displayName ?? `U${i}`,
      fullname: c.fullname,
      status: inferStatus(c.completed, c.progress ?? 0),
      progress: Math.round(c.progress ?? 0),
      courseUrl: c.viewurl,
      icon: neighborConfig.units[i]?.icon ?? 'gear',
    })),
  };
}
```

2. Devolver los programas vecinos como parte del tipo de retorno de `loadProgramFromMoodle` o
   en un campo `neighbors` de `ProgramData`.

---

## 5. Etiquetas visuales de unidades (`label`, `displayName`)

**Descripción:** `label` (p.ej. "Visión de túnel") y `displayName` (p.ej. "U3") se muestran en
los nodos del espiral. Pueden extraerse parcialmente de `course.fullname`, pero el `icon` requiere
mapeo manual.

**Estrategia recomendada:**
- `displayName` (U0, U1…): extraer el número de `fullname` con la función `extractUnitNumber`
  ya existente en `program-loader.ts`.
- `label` (nombre corto): usar la segunda parte de `fullname` tras el guión (p.ej. `"Visión de túnel"`).
- `icon`: mantener el mapeo manual en `program-config.ts` — Moodle no tiene este dato.

---

## 6. Internacionalización (i18n)

**Descripción:** Los textos visibles de la interfaz (etiquetas del panel de insignias y similares)
deben mostrarse en el idioma que el usuario tiene configurado en Moodle. La aplicación resuelve
el idioma en el siguiente orden de preferencia:

1. Parámetro URL `?lang=XX` — establecido por Moodle al incrustar el iframe **(recomendado)**.
2. Idioma del navegador (`navigator.language`) — como fallback.
3. Español (`es`) — como idioma por defecto.

**Implementación actual:** `src/lib/i18n.ts` — módulo central de traducciones.

- La función `t(key)` devuelve la cadena traducida para el locale resuelto.
- Los idiomas disponibles hoy son: `es`, `en`, `ca`, `fr`, `de`, `pt`, `eu`.
- Para añadir un nuevo idioma: añadir una entrada en el objeto `translations` de `i18n.ts`.
- Para añadir un nuevo texto traducible: añadir la clave en **todos** los locales existentes.

**Cómo pasar el idioma desde Moodle al iframe:**

> **Aviso:** Los mecanismos descritos a continuación son orientativos para Moodle Workplace 4.5.
> Verifica contra la documentación oficial y tu configuración antes de implementarlos.

### Opción A — Recurso URL con sustitución de variables (recomendado para pruebas rápidas)

En Moodle, al crear un **Recurso URL** que apunta al iframe, se puede usar la sustitución de
variables de URL del plugin `filter_urls`. Añadir el parámetro `lang` a la URL del recurso:

```
https://robotixtech.github.io/Espiral_Home_Student/?lang={userlang}
```

La variable `{userlang}` (o `{lang}` según la versión del filtro) es reemplazada por Moodle con
el código de idioma del usuario antes de servir la página. Verificar en **Administración del
sitio → Filtros → Gestionar filtros** que el filtro de variables de URL esté activo.

### Opción B — Herramienta externa LTI

Si el componente se publica como **Herramienta externa LTI**, Moodle incluye automáticamente el
parámetro `launch_presentation_locale` en el payload de lanzamiento. En ese flujo, el backend
LTI deberá reenviar el locale al iframe como parámetro `?lang=` en la URL de redirección.

### Opción C — `postMessage` (integración avanzada)

Si hay código JavaScript en la página Moodle que envuelve el iframe, puede enviarse el idioma
del usuario mediante `postMessage` inmediatamente después de la carga:

```javascript
// En la página Moodle (mismo origen o con targetOrigin correcto)
document.querySelector('iframe#espiral').contentWindow.postMessage(
  { type: 'moodle:lang', lang: M.str.langconfig?.thislanguage ?? 'es' },
  'https://robotixtech.github.io'
);
```

Para soportar esta opción en la app, añadir un listener en `src/lib/i18n.ts` y actualizar el
locale reactivamente; requiere convertir `_locale` a un `$state` de Svelte 5.

---

## Orden de implementación recomendado

| Prioridad | Tarea | Impacto | Complejidad |
|---|---|---|---|
| 1 | `grade` por unidad | Desbloquea badges reales | Baja |
| 2 | Lista de actividades + progreso | Elimina el bloque más grande de datos estáticos | Media |
| 3 | Programas vecinos dinámicos | Reduce configs manuales; datos ya disponibles | Baja |
| 4 | Etiquetas desde `fullname` | Pequeña mejora; los iconos siguen siendo manuales | Baja |
| 5 | Contenido de slides desde Moodle | Requiere convención de formato en Moodle | Alta |
