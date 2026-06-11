# Espiral Home Student

Visor de progreso del programa Robotix embebido como iframe en Moodle Workplace. Construido con Svelte 5 + Vite + TypeScript y desplegado en GitHub Pages.

- **Repo:** https://github.com/robotixtech/Espiral_Home_Student
- **Live:** https://robotixtech.github.io/Espiral_Home_Student/

---

## Comandos rápidos

| Acción | Comando |
|---|---|
| Desarrollo local | `npx vite --host` |
| Build de producción | `npx vite build` |
| Deploy a GitHub Pages | `npx vite build && npx gh-pages -d dist` |

Requiere **Node >= 22.12**.

---

## Panel de control maestro

Todos los parámetros configurables del sistema se centralizan en un único fichero:

**`src/lib/master-config.ts`**

Cambiar un valor ahí lo propaga automáticamente a todos los componentes que lo consumen. No hay constantes dispersas en el código.

---

### CANVAS — Lienzo SVG

> Consumido por: `src/components/TreeNavigator.svelte`

| Parámetro | Valor | Qué controla |
|---|---|---|
| `width` | `1150` | Ancho del viewBox SVG base (px). Define el espacio de coordenadas horizontal de toda la galaxia. |
| `height` | `850` | Alto del viewBox SVG base (px). Define el espacio de coordenadas vertical. |
| `cx` | `575` | Centro horizontal de la espiral (px). Modifica aquí para desplazar toda la galaxia hacia izquierda/derecha. |
| `cy` | `430` | Centro vertical de la espiral (px). Valor menor que `height/2` para sesgar la galaxia ligeramente hacia arriba. |

---

### SPIRAL — Geometría de la espiral

> Consumido por: `src/components/TreeNavigator.svelte`, `src/components/QuantaCluster.svelte`

| Parámetro | Valor | Qué controla |
|---|---|---|
| `unitSize` | `100` | Diámetro de los nodos planeta (px). Afecta también al nodo QuantaCluster y a todos los cálculos de colisión entre órbitas. |
| `actOrbit` | `65` | Distancia del centro del planeta al centro de su luna de actividad (px). Aumentarlo separa más las actividades del planeta. |
| `labelGap` | `80` | Distancia del borde del planeta al borde de la píldora de etiqueta (px). Debe superar `actOrbit + radio luna` para no solapar. |
| `orbitStep` | `68` | Separación en px entre órbitas consecutivas. Aumentarlo expande la espiral; reducirlo la comprime. |
| `sunRadius` | `9` | Radio del sol central visible (px). Solo afecta al punto decorativo; el sol interactivo tiene su propio tamaño. |
| `orbitStart` | `80` | Radio de la órbita más interior (px). Es la distancia del centro al primer planeta. |
| `labelLineH` | `19` | Separación entre líneas de texto dentro de la etiqueta de unidad (px). |
| `labelPadX` | `10` | Padding horizontal dentro de la píldora de etiqueta (px). |
| `labelPadY` | `5` | Padding vertical dentro de la píldora de etiqueta (px). |
| `labelGapPx` | `14` | Separación del borde visual del nodo al borde más cercano de la píldora (px). |
| `goldenAngleDeg` | `137.508` | Ángulo áureo entre planetas consecutivos (°). Valor irracional que evita que dos planetas de órbitas adyacentes queden alineados radialmente, eliminando colisiones visuales entre lunas. No cambiar salvo experimento deliberado. |

---

### ZOOM — Control de zoom y pan

> Consumido por: `src/components/TreeNavigator.svelte`

| Parámetro | Valor | Qué controla |
|---|---|---|
| `min` | `0.20` | Zoom mínimo permitido (20 %). Por debajo la galaxia quedaría demasiado pequeña para ser útil. |
| `max` | `5.00` | Zoom máximo permitido (500 %). Por encima los nodos quedan pixelados sin aportar información. |
| `scrollStep` | `1.12` | Factor multiplicador aplicado por cada tick de scroll de ratón/trackpad. Valores más altos = zoom más agresivo. |
| `buttonStep` | `1.30` | Factor multiplicador aplicado por cada clic en los botones +/−. Valor mayor que `scrollStep` para saltos más notables con el botón. |

---

### RADAR — Animación del radar de fondo

> Consumido por: `src/components/TreeNavigator.svelte`

| Parámetro | Valor | Qué controla |
|---|---|---|
| `revolutionMs` | `5000` | Duración de una vuelta completa del haz radar (ms). Reducirlo acelera la rotación; aumentarlo la ralentiza. |
| `beamDeg` | `30` | Ángulo (°) donde comienza el haz luminoso respecto al eje de rotación. Controla el punto de "arranque" visual del cono. |
| `trailDeg` | `110` | Ángulo (°) que ocupa la estela difuminada que sigue al haz. Aumentarlo hace la estela más larga y suave. |

---

### EMULATOR — Demo de progreso animado

> Consumido por: `src/lib/emulator-config.ts` → `src/lib/emulator.svelte.ts`

| Parámetro | Valor | Qué controla |
|---|---|---|
| `tickMs` | `440` | Milisegundos entre cada tick de progreso. Reducirlo acelera la demo; aumentarlo la ralentiza. |
| `progressStep` | `5` | Puntos porcentuales que avanza el progreso por tick (0 %, 5 %, 10 %… 100 %). Valores más altos = saltos más grandes y demo más rápida. |
| `pauseBetweenUnitsMs` | `1200` | Pausa en ms que hace la demo al completar una unidad antes de pasar a la siguiente. Sirve para que el alumno vea el estado "completado". |
| `pauseBeforeRestartMs` | `12000` | Pausa en ms tras completar todas las unidades antes de reiniciar el ciclo. Da tiempo a contemplar el estado final antes de volver a empezar. |

---

### BADGES — Criterios de evaluación

> Consumido por: `src/lib/badges.ts` → `src/components/BadgePanel.svelte`

| Parámetro | Valor | Qué controla |
|---|---|---|
| `minGrade` | `6` | Nota mínima sobre 10 que debe tener el alumno para recibir el badge. Por debajo de este valor el badge aparece en silhouette. |
| `completionActivity` | `'DemoDay'` | Nombre de la actividad que marca una unidad como "completada" a efectos del badge. Las actividades opcionales posteriores (ej. "Continuar") no bloquean la entrega. Ponerlo a `null` exige el 100 % de progreso. |
| `unitPattern` | `/^U[1-9]\d*$/` | Expresión regular que decide qué unidades reciben badge. El patrón actual incluye U1, U2 … y excluye MC (Misión Control) y U0. |

---

### BADGE_PANEL — Panel lateral de badges

> Consumido por: `src/components/BadgePanel.svelte`

| Parámetro | Valor | Qué controla |
|---|---|---|
| `startCollapsed` | `true` | Estado inicial del panel de badges al cargar la app. `true` → arranca plegado (solo asoma el tirador); `false` → arranca expandido. |

---

### QUANTA — Nodo de plataforma externa

> Consumido por: `src/components/QuantaCluster.svelte`

| Parámetro | Valor | Qué controla |
|---|---|---|
| `nanoPrograms` | `['C350', 'C450']` | Lista de shortnames de programa que activan la variante "nano" del nodo. Añadir un shortname aquí para que use la etiqueta y URL nano. |
| `nanoLabel` | `'nanoQUANTA'` | Texto que muestra el nodo cuando el programa está en la lista `nanoPrograms`. |
| `label` | `'QUANTA'` | Texto que muestra el nodo para el resto de programas. |
| `nanoUrl` | `'https://www.robotix.es'` | URL que abre al hacer clic en el nodo nano (cuando está desbloqueado). |
| `url` | `'https://www.robotix.com'` | URL que abre al hacer clic en el nodo estándar (cuando está desbloqueado). |
| `fixedProgress` | `0.45` | Porcentaje de progreso visual fijo que muestra el anillo del nodo (0.45 = 45 %). Es puramente decorativo; no refleja progreso real. |

---

### PROGRAMS — Unidades y Lessons

> Fichero: **`src/lib/master-config.ts`** — sección inferior (a partir de `STATUS_LABELS`)
>
> Es la fuente de verdad para todos los textos, iconos, actividades y slides de cada programa. En producción, los campos marcados con ⚡ serán reemplazados por datos en tiempo real desde la API de Moodle Workplace; los campos marcados con ✏️ siempre requieren edición manual aquí.

#### Los 3 niveles editables

```
1. NOMBRE DEL PROGRAMA  →  shortname / fullname  en cada *_CONFIG
2. NOMBRE DE LA UNIDAD  →  label  de cada entrada en units[]
3. NOMBRE DE LA LESSON  →  label  de las activities que tienen slides[]
```

Cada unidad tiene dos tipos de activities — **solo las lessons son editables**:

| Tipo | Ejemplos | ¿Tiene slides? | ¿Editable? |
|---|---|---|---|
| **Lesson** | `'Señal de plataforma de lanzamiento'`, `'Enfriamiento'`, `'Entrega especial'` | ✅ Sí (o se añaden) | ✏️ Sí |
| **Sistema** | `'DemoDay'`, `'Continuar'` | ❌ No | 🔒 No — la lógica de compleción y badges depende del label exacto |

> `Misión Control` (MC) no tiene activities; no aplica para los niveles 2 ni 3.

---

#### 1. Nombre del programa

Campo `shortname` (y `fullname`) de cada objeto `*_CONFIG`. También se usa en las rutas de badges (`public/badges/C450_U1.png`) y en la lógica de QuantaCluster.

Para cambiar qué programa aparece en la galaxia principal, edita el puntero `PROGRAMS.active`:

```typescript
export const PROGRAMS = {
  active: C450_CONFIG,  // ← cambiar aquí
  prev:   C350_CONFIG,
  next:   C550_CONFIG,
  future: C650_CONFIG,
};
```

---

#### 2. Nombre de la unidad

Campo `label` de cada entrada en el array `units[]`. Es el texto largo que aparece en la píldora flotante junto al planeta.

```typescript
{
  label:       'Lanzamiento de señal',  // ← 2. NOMBRE DE LA UNIDAD
  displayName: 'U1',                    // identificador corto visible en el nodo
  icon:        'signal',                // icono del planeta
  ...
}
```

| Campo | Origen | Qué controla |
|---|---|---|
| `label` | ✏️ Manual | Texto visible en la píldora flotante del planeta. |
| `displayName` | ✏️ Manual | Texto corto dentro del nodo (`MC`, `U0`–`U6`). Determina si la unidad recibe badge (patrón `/^U[1-9]\d*$/`). |
| `fullname` | ✏️ Manual | Nombre completo tal como aparece en Moodle (referencia para el mapeo API). |
| `icon` | ✏️ Manual | Icono SVG del planeta. Ver tabla de iconos abajo. |
| `href` | ✏️ Manual | URL al hacer clic si la unidad no tiene activities. `null` = resuelto desde Moodle. |
| `status` | ⚡ Moodle | `'completed'` \| `'in-progress'` \| `'locked'` |
| `progress` | ⚡ Moodle | Porcentaje de progreso 0–100. |

---

#### 3. Nombre de la lesson y su contenido

Campo `label` de las activities que tienen `slides[]`. El array `slides` define las pantallas de contenido interactivo.

```typescript
{ label: 'Señal de plataforma de lanzamiento',  // ← 3. NOMBRE DE LA LESSON
  icon: 'rocket', href: null, status: 'locked', progress: 0,
  slides: [
    { title: 'Bienvenido a la misión',
      body:  'Texto de la slide...',
      video: 'https://player.vimeo.com/video/...' },  // slide con vídeo
    { title: 'Programa tu cohete',
      body:  'Instrucciones...',
      image: 'blockly_example.png' },                 // slide con imagen fullwidth
    { title: '¡Lanzamiento!',
      body:  'Texto final de la lesson.' },            // slide solo texto
  ],
},
```

**Campos de la lesson (activity con slides):**

| Campo | Origen | Qué controla |
|---|---|---|
| `label` | ✏️ Manual | Nombre de la lesson visible en la luna de actividad. |
| `icon` | ✏️ Manual | Icono de la luna. Ver tabla abajo. |
| `slides` | ✏️ Manual | Contenido interactivo. Sin este campo la activity no tiene vista de detalle. |
| `status` | ⚡ Moodle | Estado de la activity. |
| `progress` | ⚡ Moodle | Progreso 0–100. |

**Campos de cada slide:**

| Campo | Qué controla |
|---|---|
| `title` | Título de la slide. |
| `body` | Texto principal. Admite Markdown básico: `**negrita**`, `\n\n` para párrafos, `•` para listas. |
| `video` | URL de embed de Vimeo. Si se incluye, la slide muestra el reproductor. |
| `image` | Nombre de fichero en `public/`. Si se incluye, la slide muestra la imagen a pantalla completa. |

> `video` e `image` son opcionales y excluyentes: si ambos están presentes, `video` tiene prioridad.

---

#### Iconos disponibles

| Clave | Uso típico |
|---|---|
| `'flag'` | U0 — Plataforma de lanzamiento |
| `'gear'` | Misión Control / configuración |
| `'power'` | Activación / puesta en marcha |
| `'car'` | Movimiento / navegación |
| `'tunnel'` | Visión / navegación autónoma |
| `'search'` | Análisis / sensores |
| `'signal'` | Señales / comunicaciones |
| `'alert'` | Emergencias |
| `'trophy'` | Sistema: DemoDay / logro final |
| `'rocket'` | Lessons de lanzamiento |
| `'snowflake'` | Enfriamiento |
| `'binoculars'` | Sistema: Continuar / observación |
| `'sun'` | Sol central (reservado para `SunConfig`) |

---

## Integración Moodle Workplace 4.5

La app ya carga datos reales de Moodle (progreso y compleción de cursos) pero le faltan dos campos por unidad para que badges y actividades funcionen con datos reales. El checklist completo vive en **`src/lib/master-config.ts` → sección `MOODLE_INTEGRATION`**.

### Estado actual de la integración

| Campo | Estado | Fuente actual |
|---|---|---|
| `status` (locked / in-progress / completed) | ✅ Implementado | `core_enrol_get_users_courses` → `completed` + `progress` |
| `progress` (0–100) | ✅ Implementado | `core_enrol_get_users_courses` → `progress` |
| `grade` (0–10, para badges) | ⏳ Pendiente | Hardcodeado como `undefined` |
| `activities[]` (lessons con progreso real) | ⏳ Pendiente | Leído de `master-config.ts` (datos estáticos) |

### Pasos pendientes

**Paso 1 — `src/lib/moodle-api.ts`**

Implementar los dos stubs existentes:

| Método | Endpoint Moodle (orientativo) | Para qué sirve |
|---|---|---|
| `getUnitGrade(courseId, userId)` | `gradereport_overview_get_course_grades` | Nota 0–10 del alumno → decide si se otorga el badge |
| `getCourseActivities(courseId, userId)` | `core_course_get_contents` + `core_completion_get_activities_completion_status` | Lista de actividades con estado completado/no por alumno |

> Verificar nombre exacto de los endpoints y estructura de respuesta en la documentación oficial de Moodle Workplace 4.5 antes de implementar.

**Paso 2 — `src/lib/program-loader.ts`**

Dentro del `map` de `programCourses`, añadir los dos campos al `return`:

```typescript
grade:      await api.getUnitGrade(course.id, userId) ?? undefined,
activities: await api.getCourseActivities(course.id, userId),
```

El resultado de `getCourseActivities` debe mapearse al tipo `Activity[]` de `src/lib/types.ts`, cruzando los datos de Moodle con los `label` / `icon` / `slides` definidos en `master-config.ts`.

**Paso 3 — Validar criterios de badge**

Una vez lleguen datos reales, revisar en `master-config.ts`:

```typescript
BADGES.minGrade           = 6          // nota mínima para otorgar el badge
BADGES.completionActivity = 'DemoDay'  // actividad que marca la unidad como completada
```

**Paso 4 — Eliminar el fallback mock (cuando la API esté estable)**

`src/App.svelte` tiene un bloque `catch` que carga `MOCK_PROGRAM` como red de seguridad cuando Moodle no responde. En producción puede eliminarse o convertirse en error visible. Los datos mock están en `src/lib/mock-data.ts`.

---

## Arquitectura de ficheros

```
src/
├── lib/
│   ├── master-config.ts      ← PANEL DE CONTROL (editar aquí — todo)
│   │                             · Sección superior: CANVAS, SPIRAL, ZOOM, RADAR, EMULATOR,
│   │                               BADGES, BADGE_PANEL, QUANTA
│   │                             · Sección inferior: STATUS_LABELS + los 4 programas
│   │                               (C450, C550, C650, C350) con unidades, lessons y slides
│   ├── program-config.ts     ← Solo helpers: getConfigByShortname, getDistantConfigs
│   │                             Re-exporta todo desde master-config (no editar aquí)
│   ├── badges.ts             ← Lógica de badges (consume BADGES de master-config)
│   ├── emulator-config.ts    ← Re-exporta EMULATOR de master-config
│   ├── emulator.svelte.ts    ← Motor de la demo animada
│   ├── theme.svelte.ts       ← Colores (dark mode)
│   └── types.ts              ← Interfaces TypeScript (ProgramConfig, UnitConfig, etc.)
└── components/
    ├── TreeNavigator.svelte     ← Vista principal: galaxia espiral (consume CANVAS, SPIRAL, ZOOM, RADAR)
    ├── BadgePanel.svelte        ← Panel lateral de badges (consume BADGE_PANEL)
    ├── QuantaCluster.svelte     ← Nodo de plataforma externa (consume QUANTA, SPIRAL)
    ├── UnitNode.svelte          ← Nodo planeta individual
    ├── ActivityOrbit.svelte     ← Lunas de actividad orbitando el planeta
    ├── SunNode.svelte           ← Sol central (trofeo Open Scentia)
    ├── UnitDetailView.svelte    ← Vista de detalle de unidad
    └── ActivitySlideView.svelte ← Vista de slides de actividad
```
