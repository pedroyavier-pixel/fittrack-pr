/**
 * Opciones de acondicionamiento y orientación, verificadas el 12-11-2026.
 * No importa training.ts: estas interfaces también se usan en sus planes.
 * Los estilos y las bandas de impacto son etiquetas de planificación de la app;
 * las fuentes respaldan los principios generales, no una prescripción individual.
 */
export interface CardioActivity {
  id: string;
  label: string;
  needsEquipment?: string;
  /** Impacto mecánico orientativo, distinto de la intensidad cardiovascular. */
  impact: "low" | "moderate" | "high";
  supportsDistance: boolean;
  supportsSteps?: boolean;
  supervision?: string;
}

export interface CardioPrescription {
  kind: string;
  minutes: number;
  rounds?: number;
  workSeconds?: number;
  restSeconds?: number;
  intensity: string;
}

export interface ConditioningPrescription {
  format: "circuit" | "emom";
  /** Circuito: vueltas al grupo de ejercicios. EMOM: vueltas a la secuencia. */
  rounds: number;
  /** Límite de trabajo por estación; en EMOM debe dejar descanso dentro del minuto. */
  workSeconds: number;
  restSeconds: number;
  durationMinutes: number;
  exerciseIds: string[];
  /** Objetivo editable, sujeto a conservar la técnica y descansar lo necesario. */
  targetReps: number;
  intensity: string;
  instruction: string;
}

export interface SessionPhase {
  kind: "warmup" | "strength" | "conditioning" | "cardio" | "cooldown";
  minutes: number;
  label: string;
}

export const cardioActivities: CardioActivity[] = [
  { id: "walk", label: "Caminata", impact: "low", supportsDistance: true, supportsSteps: true },
  { id: "run", label: "Correr / trotar", impact: "high", supportsDistance: true, supportsSteps: true },
  { id: "walk_run", label: "Alternar caminar y trotar", impact: "high", supportsDistance: true, supportsSteps: true },
  {
    id: "cycle", label: "Bicicleta", needsEquipment: "Bicicleta estática o bicicleta y entorno seguro",
    impact: "low", supportsDistance: true,
  },
  {
    id: "elliptical", label: "Elíptica", needsEquipment: "Máquina elíptica",
    impact: "low", supportsDistance: true,
  },
  {
    id: "row", label: "Remo en máquina", needsEquipment: "Ergómetro de remo",
    impact: "low", supportsDistance: true,
    supervision: "Pide orientación de técnica si estás aprendiendo; ajusta la resistencia a tu control.",
  },
  {
    id: "swim", label: "Natación", needsEquipment: "Piscina o instalación acuática adecuada",
    impact: "low", supportsDistance: true,
    supervision: "Requiere saber nadar y un entorno acuático seguro. Si estás aprendiendo, trabaja con un instructor.",
  },
  {
    id: "stairs", label: "Escaleras / escaladora", needsEquipment: "Escaleras firmes con pasamanos o escaladora",
    impact: "moderate", supportsDistance: false, supportsSteps: true,
    supervision: "Utiliza el apoyo necesario y un ritmo que permita mantener el equilibrio.",
  },
  { id: "dance", label: "Baile", impact: "moderate", supportsDistance: false },
  {
    id: "rope", label: "Cuica / saltar la cuerda", needsEquipment: "Cuica, calzado y espacio despejado",
    impact: "high", supportsDistance: false,
  },
  {
    id: "hike", label: "Senderismo", needsEquipment: "Calzado y ruta adecuados al terreno y a tu capacidad",
    impact: "moderate", supportsDistance: true, supportsSteps: true,
  },
  {
    id: "adaptive", label: "Cardio adaptado", needsEquipment: "Según la adaptación acordada con el profesional",
    impact: "low", supportsDistance: false,
    supervision: "Con movilidad reducida, acuerda modalidad, apoyos y esfuerzo con un profesional cualificado. La opción adaptada requiere valoración individual.",
  },
];

export interface TrainingStyle {
  id: "classic" | "circuit" | "cross_training" | "mixed" | "crossfit" | "endurance";
  label: string;
  description: string;
}

export const trainingStyles: TrainingStyle[] = [
  {
    id: "classic", label: "Fuerza tradicional",
    description: "Ejercicios de fuerza por series y repeticiones, con descansos ajustables y registro de cargas.",
  },
  {
    id: "circuit", label: "Circuito de fuerza",
    description: "Alterna estaciones sencillas y vueltas planificadas. Descansa lo necesario para conservar la técnica.",
  },
  {
    id: "cross_training", label: "Entrenamiento cruzado",
    description: "Combina modalidades de fuerza y acondicionamiento durante la semana para variar el estímulo según tu objetivo.",
  },
  {
    id: "mixed", label: "Mixto: fuerza + cardio",
    description: "Integra bloques de fuerza y cardio ajustables. Esta etiqueta describe la combinación elegida, sin atribuirle un método estandarizado llamado Mixfit.",
  },
  {
    id: "crossfit", label: "Funcional inspirado en CrossFit",
    description: "Prioriza mecánica, consistencia y después intensidad. La práctica específica y los movimientos complejos requieren aprendizaje y adaptación con entrenador.",
  },
  {
    id: "endurance", label: "Resistencia cardiovascular",
    description: "Da prioridad al cardio que disfrutas y puedes sostener, complementado por trabajo de fuerza y recuperación.",
  },
];

export const conditioningSources = [
  {
    id: "cdc-intensity",
    title: "CDC · Intensidad relativa y prueba del habla",
    url: "https://www.cdc.gov/physical-activity-basics/measuring/",
    use: "Escala de esfuerzo 0–10: moderado 5–6 y vigoroso 7–8; prueba del habla como referencia práctica.",
  },
  {
    id: "acsm-hiit",
    title: "ACSM · Entrenamiento por intervalos de alta intensidad",
    url: "https://acsm.org/high-intensity-interval-training-fitness/",
    use: "HIIT alterna esfuerzo elevado y recuperación; sus formatos varían y los aumentos de volumen o intensidad requieren adaptación.",
  },
  {
    id: "crossfit-mechanics",
    title: "CrossFit · Mecánica, consistencia e intensidad",
    url: "https://www.crossfit.com/essentials/mechanics-consistency-intensity-part-1-what-does-it-mean",
    use: "Aprender el movimiento y repetirlo de forma consistente precede al aumento de intensidad.",
  },
  {
    id: "crossfit-progression",
    title: "CrossFit · Progresión de intensidad",
    url: "https://www.crossfit.com/essentials/mechanics-consistency-intensity-intensity",
    use: "Modificar una variable cada vez y ajustar carga, repeticiones o velocidad a la capacidad y técnica individuales.",
  },
  {
    id: "cdc-adaptive",
    title: "CDC · Actividad física y discapacidad",
    url: "https://www.cdc.gov/disability-and-health/articles-documents/physical-activity-for-people-with-disability.html",
    use: "Elegir actividades y adaptaciones con un profesional de salud o especialista en actividad física cuando se necesita orientación individual.",
  },
  {
    id: "nih-activity-symptoms",
    title: "NIH/NIDDK · Actividad y señales para detenerse",
    url: "https://www.niddk.nih.gov/health-information/weight-management/staying-active-at-any-size",
    use: "Interrumpir la actividad y buscar ayuda ante dolor torácico, falta de aire extrema o mareo.",
  },
];

export const conditioningGuidance = {
  effort: "Registra el esfuerzo percibido (RPE) de 0 a 10: 0 es reposo y 10 es esfuerzo máximo. Como referencia, 5–6 corresponde a moderado y 7–8 a vigoroso. El mismo ejercicio puede sentirse diferente entre personas y días.",
  talkTest: "A esfuerzo moderado puedes hablar, aunque cantar resulta difícil. En esfuerzo vigoroso solo puedes decir unas pocas palabras antes de pausar para respirar. Reduce el ritmo cuando necesites recuperar el control.",
  progression: "Consolida una técnica cómoda y constante. Después modifica una variable cada vez: duración, repeticiones, resistencia o ritmo, según tu respuesta y recuperación.",
  intervals: "Los intervalos alternan trabajo y recuperación; su duración y esfuerzo son editables. Un temporizador por sí solo no convierte una sesión en HIIT. Empieza con esfuerzo manejable y conserva recuperación suficiente antes del siguiente intervalo.",
  circuit: "En un circuito, cada vuelta recorre las estaciones seleccionadas. Prioriza repeticiones controladas y descansos ajustables; el objetivo de tiempo o repeticiones cede ante la calidad del movimiento.",
  emom: "EMOM: inicia la estación indicada al comienzo de cada minuto. Completa las repeticiones controladas y descansa el tiempo restante. Reduce repeticiones o facilita la variante si no queda descanso; no persigas el reloj perdiendo la técnica.",
  crossfit: "En CrossFit, aprende la mecánica, demuestra consistencia y después ajusta intensidad con tu entrenador. La app permite registrar bloques sencillos; los levantamientos olímpicos, habilidades gimnásticas y WOD avanzados necesitan programación y supervisión apropiadas.",
  mixed: "Mixto significa combinar fuerza y cardio en este plan. Mixfit no se presenta como un método estandarizado verificado ni como una certificación.",
  impact: "El impacto orientativo describe la carga mecánica habitual, no el esfuerzo cardiovascular ni la idoneidad personal. Terreno, técnica, saltos y adaptaciones pueden cambiarlo. En máquinas, las distancias estimadas no son directamente comparables entre equipos.",
  adaptive: "Si tienes movilidad reducida o necesitas adaptaciones, acuerda movimientos, equipo, apoyos e intensidad con un profesional cualificado. La etiqueta de bajo impacto no sustituye esa valoración.",
  stop: "Detén la actividad ante dolor torácico, desmayo o dificultad respiratoria intensa e inusual y busca atención médica. Ajusta o interrumpe movimientos que provoquen dolor agudo.",
};

export const effortLevels = [
  { id: "moderate", label: "Moderado", rpeMin: 5, rpeMax: 6, talkTest: "Puedes hablar, aunque cantar resulta difícil." },
  { id: "vigorous", label: "Vigoroso", rpeMin: 7, rpeMax: 8, talkTest: "Solo unas pocas palabras antes de pausar para respirar." },
];

/** Conserva etiquetas legibles para registros anteriores a este catálogo. */
export function cardioLabel(kind: string): string {
  if (kind === "mobility") return "Movilidad";
  return cardioActivities.find((activity) => activity.id === kind)?.label || kind || "Cardio";
}
