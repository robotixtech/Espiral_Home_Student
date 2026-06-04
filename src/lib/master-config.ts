import type { ProgramConfig } from './types';

// ═══════════════════════════════════════════════════════════════════════════
//  PANEL DE CONTROL MAESTRO — Espiral Home Student
//  Todos los parámetros configurables del sistema en un único fichero.
//  Cambia un valor aquí y se propaga automáticamente a todos los componentes.
// ═══════════════════════════════════════════════════════════════════════════

// ── CANVAS ────────────────────────────────────────────────────────────────
// Dimensiones del lienzo SVG interno y punto de origen de la espiral.
export const CANVAS = {
  width:  1150,   // ancho del viewBox base (px)
  height:  850,   // alto del viewBox base (px)
  cx:      575,   // centro horizontal (px)
  cy:      430,   // centro vertical — ligero sesgo hacia arriba (px)
} as const;

// ── SPIRAL ────────────────────────────────────────────────────────────────
// Geometría de la espiral: tamaños de nodos, órbitas y etiquetas.
export const SPIRAL = {
  unitSize:       100,      // diámetro de los nodos planeta (px)
  actOrbit:        65,      // distancia del centro del planeta al centro de su luna (px)
  labelGap:        80,      // distancia del borde del planeta al borde de la etiqueta (px)
  orbitStep:       68,      // separación entre órbitas consecutivas (px)
  sunRadius:        9,      // radio del sol central (px)
  orbitStart:      80,      // radio de la órbita más interior (px)
  labelLineH:      19,      // separación entre líneas de la etiqueta (px)
  labelPadX:       10,      // padding horizontal dentro de la píldora de etiqueta (px)
  labelPadY:        5,      // padding vertical dentro de la píldora de etiqueta (px)
  labelGapPx:      14,      // separación del borde visual del nodo al borde de la píldora (px)
  goldenAngleDeg: 137.508,  // ángulo áureo — evita alineaciones radiales entre órbitas (°)
} as const;

// ── ZOOM ──────────────────────────────────────────────────────────────────
// Límites y velocidades del zoom (scroll y botones +/−).
export const ZOOM = {
  min:        0.20,  // zoom mínimo permitido (20 %)
  max:        5.00,  // zoom máximo permitido (500 %)
  scrollStep: 1.12,  // factor multiplicador por cada tick de scroll
  buttonStep: 1.30,  // factor multiplicador por cada clic en los botones +/−
} as const;

// ── RADAR ─────────────────────────────────────────────────────────────────
// Parámetros de la animación del radar de fondo.
export const RADAR = {
  revolutionMs: 5000,  // duración de una vuelta completa del radar (ms)
  beamDeg:        30,  // ángulo de inicio del haz luminoso (°)
  trailDeg:      110,  // ángulo de la estela difuminada detrás del haz (°)
} as const;

// ── BADGES ────────────────────────────────────────────────────────────────
// Criterios de evaluación y reconocimiento de badges.
export const BADGES = {
  minGrade:           6,             // nota mínima (sobre 10) para recibir el badge
  completionActivity: 'DemoDay',     // actividad que marca la unidad como "completada"
  unitPattern:        /^U[1-9]\d*$/, // qué unidades reciben badge (U1, U2 … excluye MC, U0)
} as const;

// ── BADGE_PANEL ───────────────────────────────────────────────────────────
// Estado inicial y comportamiento del panel lateral de badges.
export const BADGE_PANEL = {
  startCollapsed: true,  // true → el panel arranca plegado; false → expandido
} as const;

// ── QUANTA ────────────────────────────────────────────────────────────────
// Configuración del nodo QuantaCluster (plataforma de programas externos).
export const QUANTA = {
  nanoPrograms:  ['C350', 'C450'] as string[], // shortnames que usan nanoQUANTA
  nanoLabel:     'nanoQUANTA',
  label:         'QUANTA',
  nanoUrl:       'https://www.robotix.es',
  url:           'https://www.robotix.com',
  fixedProgress: 0.45,  // progreso visual fijo del anillo (45 %)
} as const;

// ═══════════════════════════════════════════════════════════════════════════
//  PROGRAMAS — Unidades y Lessons
//
//  GUÍA DE EDICIÓN — 3 niveles:
//
//  1. NOMBRE DEL PROGRAMA  →  campo `shortname` (y `fullname`) de cada *_CONFIG
//  2. NOMBRE DE LA UNIDAD  →  campo `label` de cada entrada en `units[]`
//  3. NOMBRE DE LA LESSON  →  campo `label` de las activities que tienen `slides`
//
//  Dentro de cada unidad las activities se dividen en dos grupos:
//    · lessons          — tienen `slides`, son el contenido interactivo de la unidad.
//                         Edita `label` y el array `slides` para cambiar título y contenido.
//    · sistema (固定)    — `DemoDay` y `Continuar` son hitos fijos sin slides.
//                         NO cambies su `label`; la lógica de compleción y badges depende de él.
//
//  Misión Control (MC) no tiene activities; no aplica para los niveles 2 ni 3.
//  ⚡ = vendrá de la API de Moodle en producción; ✏️ = siempre edición manual.
// ═══════════════════════════════════════════════════════════════════════════

export const STATUS_LABELS = {
  completed:  'Completado',
  inProgress: 'En curso',
  locked:     '',
} as const;

// ── C450 — Programa activo (galaxia principal) ────────────────────────────

export const C450_CONFIG: ProgramConfig = {
  shortname: 'C450',    // ← 1. NOMBRE DEL PROGRAMA
  fullname:  'C450',
  bgImage:   'background_2.png',

  sun: {
    label: 'Open Scentia',
    icon:  'trophy',
    href:  'https://www.openscientia.com/quanta',
  },

  units: [

    // ── Misión Control — acceso externo directo, sin activities ──────────
    {
      label:       'Misión Control',
      displayName: 'MC',
      fullname:    'C450 – Misión control',
      icon:        'gear',
      href:        'https://www.robotix.com',
      status:      'in-progress',  // ⚡ Moodle
      progress:    0,              // ⚡ Moodle
    },

    // ── U0 — sus activities aún no tienen slides ─────────────────────────
    {
      label:       'Plataforma de lanzamiento',  // ← 2. NOMBRE DE LA UNIDAD
      displayName: 'U0',
      fullname:    'C450 – Unidad 0. Plataforma de lanzamiento',
      icon:        'flag',
      href:        null,
      status:      'locked',   // ⚡ Moodle
      progress:    0,          // ⚡ Moodle
      activities: [
        // lessons (✏️ editar label y añadir slides para activar la vista de detalle)
        { label: 'Preparación de la base', icon: 'gear',  href: null, status: 'locked', progress: 0 },
        { label: 'Protocolo de ignición',  icon: 'power', href: null, status: 'locked', progress: 0 },
        { label: 'Entrega especial',       icon: 'car',   href: null, status: 'locked', progress: 0 },
        // sistema — NO editar el label
        { label: 'DemoDay',   icon: 'trophy',     href: null, status: 'locked', progress: 0 },
        { label: 'Continuar', icon: 'binoculars', href: null, status: 'locked', progress: 0 },
      ],
    },

    // ── U1 ───────────────────────────────────────────────────────────────
    {
      label:       'Lanzamiento de señal',  // ← 2. NOMBRE DE LA UNIDAD
      displayName: 'U1',
      fullname:    'C450 – Unidad 1. Lanzamiento de señal',
      icon:        'signal',
      href:        null,
      status:      'locked',
      progress:    0,
      activities: [
        // lessons
        { label: 'Señal de plataforma de lanzamiento',  // ← 3. NOMBRE DE LA LESSON
          icon: 'rocket', href: null, status: 'locked', progress: 0,
          slides: [
            { title: 'Bienvenido a la misión',
              body:  'En esta actividad aprenderás a configurar y lanzar la señal desde la plataforma de lanzamiento. Prepárate para una experiencia única en el espacio.',
              video: 'https://player.vimeo.com/video/1114029375?h=9c59e1a281&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479' },
            { title: 'Programa tu cohete',
              body:  'Tu robot necesita mostrar a los otros equipos que es seguro aterrizar.\n\nEsta señal le dice a la Base NOVA y a otros equipos que la zona de aterrizaje está despejada. ¡La X marca el lugar!\n\n**Programa tu robot para:**\n\n• Mostrar en la matriz de luces una X roja durante 5 segundos.',
              image: 'blockly_example.png' },
            { title: '¡Lanzamiento!',
              body:  'Todo listo. Inicia la secuencia de lanzamiento presionando el botón de ignición. Recuerda: una vez iniciada la secuencia, no hay vuelta atrás. ¡Buena suerte, astronauta!' },
          ],
        },
        { label: 'Enfriamiento',   icon: 'snowflake', href: null, status: 'locked', progress: 0 },
        { label: 'Entrega especial', icon: 'car',     href: null, status: 'locked', progress: 0 },
        // sistema — NO editar el label
        { label: 'DemoDay',   icon: 'trophy',     href: null, status: 'locked', progress: 0 },
        { label: 'Continuar', icon: 'binoculars', href: null, status: 'locked', progress: 0 },
      ],
    },

    // ── U2 ───────────────────────────────────────────────────────────────
    {
      label:       'Preparado para mover',  // ← 2. NOMBRE DE LA UNIDAD
      displayName: 'U2',
      fullname:    'C450 – Unidad 2. Preparado para mover',
      icon:        'car',
      href:        null,
      status:      'locked',
      progress:    0,
      activities: [
        // lessons
        { label: 'Activación de motores', icon: 'power',  href: null, status: 'locked', progress: 0 },
        { label: 'Navegación básica',     icon: 'tunnel', href: null, status: 'locked', progress: 0 },
        { label: 'Recorrido de prueba',   icon: 'car',    href: null, status: 'locked', progress: 0 },
        // sistema — NO editar el label
        { label: 'DemoDay',   icon: 'trophy',     href: null, status: 'locked', progress: 0 },
        { label: 'Continuar', icon: 'binoculars', href: null, status: 'locked', progress: 0 },
      ],
    },

    // ── U3 ───────────────────────────────────────────────────────────────
    {
      label:       'Visión de túnel',  // ← 2. NOMBRE DE LA UNIDAD
      displayName: 'U3',
      fullname:    'C450 – Unidad 3. Visión de túnel',
      icon:        'tunnel',
      href:        null,
      status:      'locked',
      progress:    0,
      activities: [
        // lessons
        { label: 'Calibración de sensores', icon: 'search', href: null, status: 'locked', progress: 0 },
        { label: 'Detección de obstáculos', icon: 'alert',  href: null, status: 'locked', progress: 0 },
        { label: 'Navegación autónoma',     icon: 'tunnel', href: null, status: 'locked', progress: 0 },
        // sistema — NO editar el label
        { label: 'DemoDay',   icon: 'trophy',     href: null, status: 'locked', progress: 0 },
        { label: 'Continuar', icon: 'binoculars', href: null, status: 'locked', progress: 0 },
      ],
    },

    // ── U4 ───────────────────────────────────────────────────────────────
    {
      label:       'Análisis profundo',  // ← 2. NOMBRE DE LA UNIDAD
      displayName: 'U4',
      fullname:    'C450 – Unidad 4. Análisis profundo',
      icon:        'search',
      href:        null,
      status:      'locked',
      progress:    0,
      activities: [
        // lessons
        { label: 'Recolección de datos',         icon: 'signal', href: null, status: 'locked', progress: 0 },
        { label: 'Procesamiento de señales',     icon: 'gear',   href: null, status: 'locked', progress: 0 },
        { label: 'Interpretación de resultados', icon: 'search', href: null, status: 'locked', progress: 0 },
        // sistema — NO editar el label
        { label: 'DemoDay',   icon: 'trophy',     href: null, status: 'locked', progress: 0 },
        { label: 'Continuar', icon: 'binoculars', href: null, status: 'locked', progress: 0 },
      ],
    },

    // ── U5 ───────────────────────────────────────────────────────────────
    {
      label:       'Señales inteligentes',  // ← 2. NOMBRE DE LA UNIDAD
      displayName: 'U5',
      fullname:    'C450 – Unidad 5. Señales inteligentes',
      icon:        'signal',
      href:        null,
      status:      'locked',
      progress:    0,
      activities: [
        // lessons
        { label: 'Emisión de señales',       icon: 'signal', href: null, status: 'locked', progress: 0 },
        { label: 'Recepción y filtrado',     icon: 'search', href: null, status: 'locked', progress: 0 },
        { label: 'Comunicación inteligente', icon: 'power',  href: null, status: 'locked', progress: 0 },
        // sistema — NO editar el label
        { label: 'DemoDay',   icon: 'trophy',     href: null, status: 'locked', progress: 0 },
        { label: 'Continuar', icon: 'binoculars', href: null, status: 'locked', progress: 0 },
      ],
    },

    // ── U6 ───────────────────────────────────────────────────────────────
    {
      label:       'Respuesta a emergencias',  // ← 2. NOMBRE DE LA UNIDAD
      displayName: 'U6',
      fullname:    'C450 – Unidad 6. Respuesta a emergencias',
      icon:        'alert',
      href:        null,
      status:      'locked',
      progress:    0,
      activities: [
        // lessons
        { label: 'Detección de emergencia', icon: 'alert', href: null, status: 'locked', progress: 0 },
        { label: 'Protocolo de respuesta',  icon: 'gear',  href: null, status: 'locked', progress: 0 },
        { label: 'Evacuación segura',       icon: 'car',   href: null, status: 'locked', progress: 0 },
        // sistema — NO editar el label
        { label: 'DemoDay',   icon: 'trophy',     href: null, status: 'locked', progress: 0 },
        { label: 'Continuar', icon: 'binoculars', href: null, status: 'locked', progress: 0 },
      ],
    },

  ],
};

// ── C550 — Programa siguiente (galaxia distante superior izquierda) ────────

export const C550_CONFIG: ProgramConfig = {
  shortname: 'C550',
  fullname:  'C550',
  bgImage:   'background_2.png',
  sun: { label: 'Open Scentia', icon: 'sun', href: null },
  units: [
    { label: 'Onboarding',                       displayName: 'Misión Control', fullname: 'C550 – Misión control',                              icon: 'gear',   href: null, status: 'locked', progress: 0 },
    { label: 'Plataforma de lanzamiento',         displayName: 'U0',            fullname: 'C550 – Unidad 0. Plataforma de lanzamiento',          icon: 'flag',   href: null, status: 'locked', progress: 0 },
    { label: 'Puesta en marcha de la base Terra', displayName: 'U1',            fullname: 'C550 – Unidad 1. Puesta en marcha de la base Terra',  icon: 'power',  href: null, status: 'locked', progress: 0 },
    { label: 'Entrenamiento de sensores',         displayName: 'U2',            fullname: 'C550 – Unidad 2. Entrenamiento de sensores',          icon: 'search', href: null, status: 'locked', progress: 0 },
    { label: 'El tiempo lo es todo',              displayName: 'U3',            fullname: 'C550 – Unidad 3. El tiempo lo es todo',               icon: 'gear',   href: null, status: 'locked', progress: 0 },
    { label: 'Repetición desde la base Aqua',     displayName: 'U4',            fullname: 'C550 – Unidad 4. Repetición desde la base Aqua',      icon: 'signal', href: null, status: 'locked', progress: 0 },
    { label: 'Respuesta inteligente al océano',   displayName: 'U5',            fullname: 'C550 – Unidad 5. Respuesta inteligente al océano',    icon: 'alert',  href: null, status: 'locked', progress: 0 },
    { label: 'Robots reactivos',                  displayName: 'U6',            fullname: 'C550 – Unidad 6. Robots reactivos',                   icon: 'car',    href: null, status: 'locked', progress: 0 },
  ],
};

// ── C650 — Programa futuro (galaxia distante superior derecha) ────────────

export const C650_CONFIG: ProgramConfig = {
  shortname: 'C650',
  fullname:  'C650',
  bgImage:   'background_2.png',
  sun: { label: 'Open Scentia', icon: 'sun', href: null },
  units: [
    { label: 'Onboarding',                         displayName: 'Misión Control', fullname: 'C650 – Misión control',                                icon: 'gear',   href: null, status: 'locked', progress: 0 },
    { label: 'Plataforma de lanzamiento',           displayName: 'U0',            fullname: 'C650 – Unidad 0. Plataforma de lanzamiento',            icon: 'flag',   href: null, status: 'locked', progress: 0 },
    { label: 'Robots de alerta de emergencia',      displayName: 'U1',            fullname: 'C650 – Unidad 1. Robots de alerta de emergencia',       icon: 'alert',  href: null, status: 'locked', progress: 0 },
    { label: 'Sistemas de agricultura inteligente', displayName: 'U2',            fullname: 'C650 – Unidad 2. Sistemas de agricultura inteligente',  icon: 'gear',   href: null, status: 'locked', progress: 0 },
    { label: 'Entrega inteligente',                 displayName: 'U3',            fullname: 'C650 – Unidad 3. Entrega inteligente',                  icon: 'car',    href: null, status: 'locked', progress: 0 },
    { label: 'Exploradores de sensores oceánicos',  displayName: 'U4',            fullname: 'C650 – Unidad 4. Exploradores de sensores oceánicos',   icon: 'search', href: null, status: 'locked', progress: 0 },
    { label: 'Control de comunicaciones',           displayName: 'U5',            fullname: 'C650 – Unidad 5. Control de comunicaciones',            icon: 'signal', href: null, status: 'locked', progress: 0 },
    { label: 'Clasificación inteligente',           displayName: 'U6',            fullname: 'C650 – Unidad 6. Clasificación inteligente',            icon: 'tunnel', href: null, status: 'locked', progress: 0 },
  ],
};

// ── C350 — Programa completado (galaxia distante inferior izquierda) ──────

export const C350_CONFIG: ProgramConfig = {
  shortname: 'C350',
  fullname:  'C350',
  bgImage:   'background_2.png',
  sun: { label: 'Open Scentia', icon: 'sun', href: null },
  units: [
    { label: 'Onboarding',                      displayName: 'Misión Control', fullname: 'C350 – Misión control',                             icon: 'gear',   href: null, status: 'completed', progress: 100 },
    { label: 'Puesta en marcha de la base Terra', displayName: 'U1',           fullname: 'C350 – Unidad 1. Puesta en marcha de la base Terra', icon: 'power',  href: null, status: 'completed', progress: 100 },
    { label: 'Exploración',                      displayName: 'U2',            fullname: 'C350 – Unidad 2. Exploración',                      icon: 'search', href: null, status: 'completed', progress: 100 },
    { label: 'Buen momento',                     displayName: 'U3',            fullname: 'C350 – Unidad 3. Buen momento',                     icon: 'gear',   href: null, status: 'completed', progress: 100 },
    { label: 'Alertas de la base acuática',      displayName: 'U4',            fullname: 'C350 – Unidad 4. Alertas de la base acuática',      icon: 'alert',  href: null, status: 'completed', progress: 100 },
    { label: 'Responder y repetir',              displayName: 'U5',            fullname: 'C350 – Unidad 5. Responder y repetir',              icon: 'signal', href: null, status: 'completed', progress: 100 },
    { label: 'Problemas de temblor',             displayName: 'U6',            fullname: 'C350 – Unidad 6. Problemas de temblor',             icon: 'tunnel', href: null, status: 'completed', progress: 100 },
  ],
};

// ── PROGRAMS — Punteros a los programas activos ───────────────────────────
// Cambia `active` para activar otro programa en la galaxia principal.
export const PROGRAMS = {
  active: C450_CONFIG,  // ← programa de la galaxia principal
  prev:   C350_CONFIG,  // galaxia completada (inferior izquierda)
  next:   C550_CONFIG,  // galaxia siguiente  (superior izquierda)
  future: C650_CONFIG,  // galaxia futura     (superior derecha)
} as const;
