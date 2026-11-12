import {extraExercises} from "./exerciseVariants";
import type { CardioPrescription, ConditioningPrescription, SessionPhase, TrainingStyle } from "./conditioning";

/** Catálogo de movimientos. trialLb se conserva sólo para compatibilidad histórica; no asigna cargas en la interfaz. */
export interface Exercise {
  id: string;
  name: string;
  muscles: string;
  sets: number;
  minReps: number;
  maxReps: number;
  trialLb: number;
  stepLb: number;
  bodyweight?: boolean;
  unilateral?: boolean;
  videoUrl: string;
  referenceUrl?: string;
  weightNote?: string;
  /** Equipo necesario para elegir variantes domésticas; ausente en el catálogo original. */
  equipment?: string[];
  cues: string[];
  mistakes: string[];
}

export interface WorkoutDay {
  day: number;
  title: string;
  type: "strength" | "recovery" | "cardio" | "rest";
  exerciseIds: string[];
  walkMinutes: number;
  mobilityMinutes?: number;
  rope?: { rounds: number; work: number; rest: number };
  cardio?: CardioPrescription[];
  conditioning?: ConditioningPrescription;
  style?: TrainingStyle["id"];
  sessionPhases?: SessionPhase[];
}

const ms = "https://www.muscleandstrength.com/exercises/";
const machineNote =
  "Registra el total del selector de la máquina. Si carga discos bilaterales, elige discos por lado; la resistencia base no se asume. Anota el equipo.";
const dumbbellNote = "Peso por CADA mancuerna / mano. Con dos iguales, la carga externa total es el doble.";
const barbellNote =
  "Introduce los discos por CADA lado y el peso REAL de la barra o Smith. Total = 2 × discos de un lado + barra. No se asume que todas pesan 45 lb.";

export const exercises: Exercise[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    muscles: "Pectorales · tríceps · deltoides anterior",
    sets: 3,
    minReps: 6,
    maxReps: 10,
    trialLb: 45,
    stepLb: 5,
    videoUrl: ms + "barbell-bench-press.html",
    weightNote: barbellNote,
    cues: [
      "Apoya pies y glúteos, estabiliza las escápulas y sujeta la barra con el pulgar cerrado.",
      "Baja con control hacia el pecho; usa topes de seguridad o un compañero.",
    ],
    mistakes: [
      "Rebotar la barra sobre el pecho.",
      "Perder el apoyo de los pies o levantar los glúteos.",
    ],
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscles: "Dorsales · bíceps · espalda alta",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 40,
    stepLb: 5,
    videoUrl: ms + "lat-pull-down.html",
    weightNote: machineNote,
    cues: [
      "Fija las piernas bajo el soporte y mantén el torso estable.",
      "Lleva los codos hacia abajo y la barra hacia la parte superior del pecho.",
    ],
    mistakes: [
      "Tirar detrás de la nuca.",
      "Balancear el torso para mover la carga.",
    ],
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    muscles: "Pectoral superior · tríceps · deltoides anterior",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 15,
    stepLb: 2.5,
    videoUrl: ms + "incline-dumbbell-bench-press.html",
    weightNote: dumbbellNote,
    cues: [
      "Ajusta el banco a una inclinación moderada y apoya los pies.",
      "Mantén las muñecas sobre los codos y baja dentro de un rango cómodo.",
    ],
    mistakes: [
      "Arquear excesivamente la zona lumbar.",
      "Chocar las mancuernas o perder el control al bajarlas.",
    ],
  },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    muscles: "Espalda media · dorsales · bíceps",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 40,
    stepLb: 5,
    videoUrl: ms + "seated-row.html",
    weightNote: machineNote,
    cues: [
      "Mantén las rodillas ligeramente flexionadas y el torso estable.",
      "Lleva el agarre hacia el abdomen y vuelve con control.",
    ],
    mistakes: [
      "Impulsarse con la espalda baja.",
      "Encoger los hombros hacia las orejas.",
    ],
  },
  {
    id: "lateral-raises",
    name: "Lateral Raises",
    muscles: "Deltoides lateral",
    sets: 3,
    minReps: 12,
    maxReps: 20,
    trialLb: 5,
    stepLb: 2.5,
    videoUrl: ms + "dumbbell-lateral-raise.html",
    referenceUrl:
      "https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/",
    weightNote: dumbbellNote,
    cues: [
      "Eleva los brazos hasta una altura cómoda cercana al hombro, con los codos ligeramente flexionados.",
      "Mantén el tronco estable y baja lentamente.",
    ],
    mistakes: [
      "Balancear las caderas para subir el peso.",
      "Encoger los hombros o forzar un rango doloroso.",
    ],
  },
  {
    id: "rope-triceps-pushdown",
    name: "Rope Triceps Pushdown",
    muscles: "Tríceps",
    sets: 3,
    minReps: 10,
    maxReps: 15,
    trialLb: 20,
    stepLb: 5,
    videoUrl: ms + "rope-tricep-extension.html",
    weightNote: machineNote,
    cues: [
      "Conserva los codos junto al torso y el abdomen firme.",
      "Extiende los codos sin inclinar todo el cuerpo sobre la cuerda.",
    ],
    mistakes: [
      "Mover los hombros en cada repetición.",
      "Dejar que el peso tire bruscamente de los brazos al regresar.",
    ],
  },
  {
    id: "dumbbell-biceps-curl",
    name: "Dumbbell Biceps Curl",
    muscles: "Bíceps · braquial",
    sets: 3,
    minReps: 10,
    maxReps: 15,
    trialLb: 10,
    stepLb: 2.5,
    videoUrl: ms + "standing-dumbbell-curl.html",
    weightNote: dumbbellNote,
    cues: [
      "Mantén los codos cerca del cuerpo y las muñecas neutras.",
      "Flexiona y extiende los codos de manera controlada.",
    ],
    mistakes: [
      "Balancear el torso o arquear la espalda.",
      "Elevar el hombro para terminar una repetición.",
    ],
  },
  {
    id: "hack-squat",
    name: "Hack Squat",
    muscles: "Cuádriceps · glúteos",
    sets: 3,
    minReps: 6,
    maxReps: 10,
    trialLb: 0,
    stepLb: 5,
    videoUrl: ms + "hack-squat.html",
    weightNote:
      "Comienza probando el trineo sin discos; 0 lb significa sin discos añadidos, no resistencia cero. Registra siempre el mismo criterio y la misma máquina.",
    cues: [
      "Ajusta los seguros y conserva espalda y pelvis apoyadas.",
      "Desciende hasta un rango controlado que mantenga los talones apoyados.",
    ],
    mistakes: [
      "Despegar la pelvis del respaldo.",
      "Rebotar abajo o bloquear las rodillas de golpe.",
    ],
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    muscles: "Isquiotibiales · glúteos · erectores espinales",
    sets: 3,
    minReps: 8,
    maxReps: 10,
    trialLb: 45,
    stepLb: 5,
    videoUrl: ms + "romanian-deadlift",
    weightNote: barbellNote,
    cues: [
      "Empuja las caderas atrás con las rodillas ligeramente flexionadas.",
      "Mantén la barra cerca de las piernas; termina el descenso antes de perder la posición de la espalda.",
    ],
    mistakes: [
      "Redondear la zona lumbar para llegar más abajo.",
      "Convertir la bisagra en una sentadilla o hiperextender al subir.",
    ],
  },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    muscles: "Cuádriceps · glúteos",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 0,
    stepLb: 2.5,
    bodyweight: true,
    unilateral: true,
    videoUrl: ms + "one-leg-dumbbell-squat-aka-bulgarian-squat.html",
    weightNote:
      "BW al inicio; el campo de carga registra el total externo añadido o asistencia. Repeticiones por pierna.",
    cues: [
      "Apoya el pie trasero en un soporte estable y encuentra una separación cómoda.",
      "Carga principalmente la pierna delantera y baja sin perder el equilibrio.",
    ],
    mistakes: [
      "Usar una altura de banco que fuerce la cadera.",
      "Rebotar o forzar un rango doloroso.",
    ],
  },
  {
    id: "seated-leg-curl",
    name: "Seated Leg Curl",
    muscles: "Isquiotibiales",
    sets: 3,
    minReps: 10,
    maxReps: 15,
    trialLb: 30,
    stepLb: 5,
    videoUrl: ms + "seated-leg-curl",
    weightNote: machineNote,
    cues: [
      "Alinea la rodilla con el eje de la máquina y ajusta el apoyo del muslo.",
      "Flexiona las rodillas sin despegar la pelvis del asiento.",
    ],
    mistakes: [
      "Arquear la espalda para completar el movimiento.",
      "Soltar la carga durante la fase de regreso.",
    ],
  },
  {
    id: "standing-calf-raises",
    name: "Standing Calf Raises",
    muscles: "Gastrocnemio · sóleo",
    sets: 3,
    minReps: 10,
    maxReps: 15,
    trialLb: 20,
    stepLb: 5,
    videoUrl: ms + "standing-machine-calf-raise",
    weightNote: machineNote,
    cues: [
      "Apoya de forma segura el antepié en la plataforma.",
      "Sube los talones y baja con control, manteniendo las rodillas estables.",
    ],
    mistakes: [
      "Rebotar con el tendón de Aquiles.",
      "Doblar y extender las rodillas para impulsar la carga.",
    ],
  },
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    muscles: "Recto abdominal",
    sets: 3,
    minReps: 10,
    maxReps: 15,
    trialLb: 20,
    stepLb: 5,
    videoUrl: ms + "cable-crunch.html",
    weightNote: machineNote,
    cues: [
      "Mantén las caderas relativamente estables y la cuerda junto a la cabeza.",
      "Acerca las costillas a la pelvis mediante una flexión controlada del tronco.",
    ],
    mistakes: [
      "Tirar de la cuerda solamente con los brazos.",
      "Mover las caderas hacia atrás en lugar de flexionar el tronco.",
    ],
  },
  {
    id: "incline-bench-press",
    name: "Incline Bench Press",
    muscles: "Pectoral superior · tríceps · deltoides anterior",
    sets: 3,
    minReps: 6,
    maxReps: 10,
    trialLb: 45,
    stepLb: 5,
    videoUrl: ms + "incline-bench-press.html",
    weightNote: barbellNote,
    cues: [
      "Usa una inclinación moderada, pies firmes y agarre cerrado.",
      "Baja con control y usa topes de seguridad o un compañero.",
    ],
    mistakes: [
      "Abrir los codos en un ángulo incómodo.",
      "Rebotar sobre el pecho o levantar los glúteos.",
    ],
  },
  {
    id: "chest-supported-row",
    name: "Chest-Supported Row",
    muscles: "Espalda alta · dorsales · deltoides posterior · bíceps",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 15,
    stepLb: 2.5,
    videoUrl: "https://www.muscleandstrength.com/node/48713",
    weightNote: dumbbellNote,
    cues: [
      "Apoya el pecho en el banco inclinado y estabiliza los pies.",
      "Lleva los codos atrás sin despegar el pecho del apoyo.",
    ],
    mistakes: [
      "Extender el cuello para levantar la cabeza.",
      "Dar tirones o despegar el torso para mover más peso.",
    ],
  },
  {
    id: "push-ups",
    name: "Push-Ups",
    muscles: "Pectorales · tríceps · deltoides anterior · abdomen",
    sets: 3,
    minReps: 8,
    maxReps: 20,
    trialLb: 0,
    stepLb: 2.5,
    bodyweight: true,
    videoUrl: ms + "push-up.html",
    referenceUrl:
      "https://www.acefitness.org/resources/everyone/exercise-library/41/push-up/",
    weightNote:
      "BW; registra resistencia adicional o asistencia. Puedes elevar las manos para ajustar la dificultad sin perder la técnica.",
    cues: [
      "Mantén cabeza, tronco y pelvis alineados.",
      "Baja el pecho de forma controlada y empuja el suelo.",
    ],
    mistakes: [
      "Dejar caer la cadera o elevarla en exceso.",
      "Forzar las muñecas o los hombros en un ángulo doloroso.",
    ],
  },
  {
    id: "neutral-grip-lat-pulldown",
    name: "Neutral-Grip Lat Pulldown",
    muscles: "Dorsales · bíceps · espalda media",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 40,
    stepLb: 5,
    videoUrl:
      "https://www.puregym.com/exercises/back/lat-exercises/close-grip-lat-pulldown/",
    weightNote: machineNote,
    cues: [
      "Usa el agarre neutro con las palmas enfrentadas y los muslos sujetos.",
      "Dirige los codos abajo sin balancear el torso.",
    ],
    mistakes: [
      "Redondear los hombros al final del tirón.",
      "Llevar el agarre detrás de la cabeza.",
    ],
  },
  {
    id: "machine-shoulder-press",
    name: "Machine Shoulder Press",
    muscles: "Deltoides anterior y lateral · tríceps",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 20,
    stepLb: 5,
    videoUrl: ms + "machine-shoulder-press",
    weightNote: machineNote,
    cues: [
      "Ajusta el asiento para comenzar con los agarres a una altura cómoda cercana a los hombros.",
      "Conserva el respaldo como apoyo y empuja sin elevar las costillas.",
    ],
    mistakes: [
      "Arquear mucho la zona lumbar.",
      "Usar un recorrido que provoque dolor de hombro.",
    ],
  },
  {
    id: "rear-delt-fly",
    name: "Rear Delt Fly",
    muscles: "Deltoides posterior · espalda alta",
    sets: 3,
    minReps: 12,
    maxReps: 20,
    trialLb: 5,
    stepLb: 2.5,
    videoUrl: ms + "dumbbell-reverse-fly-on-incline-bench.html",
    weightNote:
      dumbbellNote +
      " Variante precargada con pecho apoyado en banco inclinado.",
    cues: [
      "Apoya el pecho y abre los brazos con una ligera flexión de codos.",
      "Conserva una carga ligera y controla la bajada.",
    ],
    mistakes: [
      "Transformar el movimiento en un remo.",
      "Elevar los hombros o dar impulso con el torso.",
    ],
  },
  {
    id: "overhead-triceps-extension",
    name: "Overhead Triceps Extension",
    muscles: "Tríceps",
    sets: 3,
    minReps: 10,
    maxReps: 15,
    trialLb: 15,
    stepLb: 5,
    videoUrl: ms + "overhead-tricep-extension.html",
    weightNote: machineNote + " Variante de polea alta con cuerda.",
    cues: [
      "Encuentra una posición estable con los brazos elevados en un ángulo cómodo.",
      "Extiende los codos sin arquear la espalda.",
    ],
    mistakes: [
      "Mover todo el hombro para impulsar el peso.",
      "Forzar un estiramiento doloroso detrás de la cabeza.",
    ],
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    muscles: "Braquial · braquiorradial · bíceps",
    sets: 3,
    minReps: 10,
    maxReps: 15,
    trialLb: 10,
    stepLb: 2.5,
    videoUrl: ms + "standing-hammer-curl.html",
    weightNote: dumbbellNote,
    cues: [
      "Mantén las palmas enfrentadas y los codos junto al cuerpo.",
      "Eleva y baja las mancuernas sin mover el torso.",
    ],
    mistakes: [
      "Usar las caderas para generar impulso.",
      "Doblar la muñeca para terminar la repetición.",
    ],
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscles: "Cuádriceps · glúteos",
    sets: 3,
    minReps: 10,
    maxReps: 12,
    trialLb: 0,
    stepLb: 5,
    videoUrl: ms + "45-degree-leg-press.html",
    weightNote:
      "Prueba el trineo sin discos añadidos; su resistencia varía según el equipo. Si la máquina usa stack, prueba su mínimo. Registra el criterio y la máquina.",
    cues: [
      "Ajusta el asiento y los seguros antes de comenzar.",
      "Desciende hasta donde puedas conservar pelvis y espalda apoyadas.",
    ],
    mistakes: [
      "Despegar la pelvis del respaldo para bajar más.",
      "Bloquear las rodillas de golpe o ayudarse empujándolas con las manos.",
    ],
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    muscles: "Glúteos · isquiotibiales",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 45,
    stepLb: 5,
    videoUrl: ms + "barbell-hip-thrust",
    weightNote:
      barbellNote +
      " Prueba primero sin barra si es necesario y usa protección acolchada.",
    cues: [
      "Asegura el banco y apoya la parte alta de la espalda.",
      "Eleva la pelvis con las costillas controladas y termina sin hiperextender la espalda.",
    ],
    mistakes: [
      "Mover un banco inestable.",
      "Terminar arqueando la zona lumbar en vez de extender la cadera.",
    ],
  },
  {
    id: "lying-leg-curl",
    name: "Lying Leg Curl",
    muscles: "Isquiotibiales",
    sets: 3,
    minReps: 10,
    maxReps: 15,
    trialLb: 30,
    stepLb: 5,
    videoUrl: ms + "leg-curl.html",
    weightNote: machineNote,
    cues: [
      "Alinea la rodilla con el eje y sitúa la almohadilla por encima del talón.",
      "Flexiona con control manteniendo la pelvis apoyada.",
    ],
    mistakes: [
      "Levantar las caderas o arquear la espalda.",
      "Lanzar la carga y dejarla caer.",
    ],
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    muscles: "Cuádriceps",
    sets: 3,
    minReps: 12,
    maxReps: 15,
    trialLb: 30,
    stepLb: 5,
    videoUrl: ms + "leg-extension.html",
    weightNote: machineNote,
    cues: [
      "Ajusta el respaldo y alinea la rodilla con el eje de la máquina.",
      "Extiende las rodillas sin golpear el bloqueo y vuelve lentamente.",
    ],
    mistakes: [
      "Despegar la cadera del asiento.",
      "Usar una carga que obligue a dar tirones.",
    ],
  },
  {
    id: "seated-calf-raises",
    name: "Seated Calf Raises",
    muscles: "Sóleo · gastrocnemio",
    sets: 3,
    minReps: 12,
    maxReps: 20,
    trialLb: 20,
    stepLb: 5,
    videoUrl: ms + "seated-calf-raise.html",
    weightNote: machineNote,
    cues: [
      "Coloca las almohadillas sobre los muslos y el antepié firme en la plataforma.",
      "Eleva los talones, haz una pausa breve y baja con control.",
    ],
    mistakes: [
      "Rebotar en la parte inferior.",
      "Empujar las almohadillas con las manos para ayudar a la carga.",
    ],
  },
  {
    id: "pallof-press",
    name: "Pallof Press",
    muscles: "Abdomen · oblicuos · estabilizadores del tronco",
    sets: 3,
    minReps: 10,
    maxReps: 15,
    trialLb: 10,
    stepLb: 2.5,
    unilateral: true,
    videoUrl: ms + "pallof-press",
    weightNote: machineNote + " Repeticiones por lado.",
    cues: [
      "Colócate de lado a la polea con los pies firmes.",
      "Extiende los brazos desde el pecho resistiendo la rotación del tronco.",
    ],
    mistakes: [
      "Rotar el torso hacia la polea.",
      "Contener la respiración o arquear la espalda para resistir.",
    ],
  },
  ...extraExercises,
];

// Catálogo doméstico añadido sin cambiar el programa ni los ejercicios originales.
// Páginas de los proveedores y sus demostraciones verificadas el 11 de noviembre de 2026.
exercises.push(
  {
    id: "chair-squat",
    name: "Sentadilla a silla",
    muscles: "Cuádriceps · glúteos · estabilizadores del tronco",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 0,
    stepLb: 2.5,
    bodyweight: true,
    equipment: ["chair", "bodyweight"],
    videoUrl:
      "https://www.csp.org.uk/campaigns-influencing/campaigns/stronger-my-way/i-want-feel-stronger/strengthening-exercises/lower",
    weightNote:
      "BW: registra sólo carga externa si la utilizas. Usa una silla firme, sin ruedas y apoyada contra una pared. Ajusta su altura a tu control; progresa hacia la sentadilla libre solo cuando puedas levantarte y sentarte con estabilidad.",
    cues: [
      "Con los pies firmes y separados de forma cómoda, inclina ligeramente el tronco y empuja el suelo para levantarte de la silla.",
      "Lleva la cadera atrás y vuelve a sentarte lentamente, conservando el control hasta tocar el asiento.",
    ],
    mistakes: [
      "Dejarse caer en el asiento o impulsarse con rebotes.",
      "Usar una silla inestable, levantar los talones o forzar un recorrido doloroso.",
    ],
  },
  {
    id: "glute-bridge",
    name: "Puente de glúteos",
    muscles: "Glúteos · isquiotibiales · abdomen",
    sets: 3,
    minReps: 10,
    maxReps: 15,
    trialLb: 0,
    stepLb: 2.5,
    bodyweight: true,
    equipment: ["bodyweight"],
    videoUrl: ms + "bodyweight-glute-bridge",
    weightNote:
      "BW: registra sólo carga externa si la utilizas. Prioriza el control y una pausa cómoda arriba antes de considerar lastre; el campo de carga representa solo resistencia externa.",
    cues: [
      "Túmbate boca arriba, flexiona las rodillas y apoya ambos pies en una superficie firme.",
      "Eleva la pelvis contrayendo los glúteos, con las costillas controladas; vuelve al suelo lentamente.",
    ],
    mistakes: [
      "Arquear la espalda baja para elevar más la pelvis.",
      "Impulsarse con rebotes o dejar que la pelvis gire hacia un lado.",
    ],
  },
  {
    id: "wall-push-up",
    name: "Flexión en pared",
    muscles: "Pectorales · tríceps · deltoides anterior · abdomen",
    sets: 3,
    minReps: 6,
    maxReps: 12,
    trialLb: 0,
    stepLb: 2.5,
    bodyweight: true,
    equipment: ["wall", "bodyweight"],
    videoUrl: "https://youtu.be/kmzcmFZ9NyY",
    referenceUrl:
      "https://www.southtees.nhs.uk/resources/combined-press-ups/",
    weightNote:
      "BW: sin lastre obligatorio. Ajusta la distancia de los pies para controlar la dificultad. Una futura flexión inclinada requiere una superficie fija que no pueda deslizarse; no añadas peso a la espalda para progresar esta variante.",
    cues: [
      "Apoya las manos sobre una pared firme, cerca de la altura y anchura de los hombros, con los pies estables.",
      "Flexiona los codos acercando el torso a la pared y vuelve empujando, manteniendo cabeza, tronco y pelvis alineados.",
    ],
    mistakes: [
      "Dejar caer la cadera o acercar solo la cabeza a la pared.",
      "Forzar las muñecas o abrir los codos en un ángulo doloroso.",
    ],
  },
  {
    id: "dumbbell-row",
    name: "Remo con mancuerna a un brazo",
    muscles: "Dorsales · espalda media y alta · bíceps · abdomen",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 5,
    stepLb: 2.5,
    unilateral: true,
    equipment: ["dumbbell"],
    videoUrl: ms + "one-arm-dumbbell-row.html",
    referenceUrl:
      "https://www.csp.org.uk/campaigns-influencing/campaigns/stronger-my-way/i-want-feel-stronger/strengthening-exercises/upper",
    weightNote:
      "Introduce el peso de UNA mancuerna; elige una carga que puedas controlar. Repeticiones por brazo. Puedes apoyar la mano libre en una superficie firme para ganar estabilidad, sin girar el torso.",
    cues: [
      "Con una base estable, flexiona ligeramente las rodillas e inclina el tronco desde la cadera, manteniendo la espalda en una posición cómoda.",
      "Lleva el codo hacia la cadera y baja la mancuerna con control; completa las mismas repeticiones por cada lado.",
    ],
    mistakes: [
      "Girar el torso o dar tirones para subir una carga excesiva.",
      "Encoger el hombro hacia la oreja o perder la posición de la espalda.",
    ],
  },
  {
    id: "dumbbell-rdl",
    name: "Peso muerto rumano con mancuernas",
    muscles: "Isquiotibiales · glúteos · erectores espinales · abdomen",
    sets: 3,
    minReps: 8,
    maxReps: 12,
    trialLb: 5,
    stepLb: 2.5,
    equipment: ["dumbbell"],
    videoUrl: "https://www.youtube.com/watch?v=V8Hdl1FiNt4",
    referenceUrl:
      "https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift",
    weightNote:
      "Introduce el peso por CADA mancuerna; no se asigna una carga inicial. Ensaya la bisagra sin peso si lo necesitas y conserva siempre el mismo criterio de registro por mancuerna.",
    cues: [
      "Sujeta las mancuernas cerca de las piernas, flexiona ligeramente las rodillas y lleva la cadera atrás.",
      "Baja solo hasta donde puedas controlar la espalda y sentir tensión tolerable en los muslos; vuelve extendiendo la cadera sin arquear la zona lumbar.",
    ],
    mistakes: [
      "Redondear la espalda o alejar las mancuernas del cuerpo para intentar llegar al suelo.",
      "Doblar demasiado las rodillas y convertir la bisagra en una sentadilla.",
    ],
  },
);

export const schedule: WorkoutDay[] = [
  { day: 0, title: "Descanso", type: "rest", exerciseIds: [], walkMinutes: 0 },
  {
    day: 1,
    title: "Upper A",
    type: "strength",
    exerciseIds: [
      "bench-press",
      "lat-pulldown",
      "incline-dumbbell-press",
      "seated-cable-row",
      "lateral-raises",
      "rope-triceps-pushdown",
      "dumbbell-biceps-curl",
    ],
    walkMinutes: 20,
  },
  {
    day: 2,
    title: "Lower A",
    type: "strength",
    exerciseIds: [
      "hack-squat",
      "romanian-deadlift",
      "bulgarian-split-squat",
      "seated-leg-curl",
      "standing-calf-raises",
      "cable-crunch",
    ],
    walkMinutes: 0,
  },
  {
    day: 3,
    title: "Día de recuperación activa",
    type: "recovery",
    exerciseIds: [],
    walkMinutes: 45,
    mobilityMinutes: 10,
  },
  {
    day: 4,
    title: "Upper B",
    type: "strength",
    exerciseIds: [
      "incline-bench-press",
      "chest-supported-row",
      "push-ups",
      "neutral-grip-lat-pulldown",
      "machine-shoulder-press",
      "rear-delt-fly",
      "overhead-triceps-extension",
      "hammer-curl",
    ],
    walkMinutes: 20,
    rope: { rounds: 5, work: 20, rest: 60 },
  },
  {
    day: 5,
    title: "Lower B",
    type: "strength",
    exerciseIds: [
      "leg-press",
      "hip-thrust",
      "lying-leg-curl",
      "leg-extension",
      "seated-calf-raises",
      "pallof-press",
    ],
    walkMinutes: 0,
  },
  {
    day: 6,
    title: "Caminata larga",
    type: "cardio",
    exerciseIds: [],
    walkMinutes: 60,
  },
];

/** Pass only comparable working sets from the latest session, excluding warm-ups. */
export interface PreviousSet {
  weightLb: number;
  reps: number;
  rir?: number | null;
  techniqueGood?: boolean;
  completed?: boolean;
  sessionId?: string;
  equipment?: string;
  /** Resistance added to BW or amount of assistance, never the person's body mass. */
  mode?: "load" | "added" | "assisted";
}

export interface LoadRecommendation {
  weightLb: number;
  action: "trial" | "maintain" | "increase" | "reduce";
  reason: string;
  provisional: boolean;
}

/** Advisory double progression. Does not change a stored load or force a progression. */
export function recommendLoad(
  exercise: Exercise,
  previousSets: PreviousSet[],
): LoadRecommendation {
  const valid = previousSets.filter(
    (s) =>
      s.completed !== false &&
      Number.isFinite(s.weightLb) &&
      s.weightLb >= 0 &&
      Number.isFinite(s.reps) &&
      s.reps > 0,
  );
  // Estas variantes domésticas progresan por ejecución o dificultad, no por lastre.
  if (["chair-squat", "glute-bridge", "wall-push-up"].includes(exercise.id)) {
    const needsEasierVariant = valid.some(
      (s) =>
        s.techniqueGood === false ||
        (s.reps < exercise.minReps && s.rir != null && s.rir <= 1),
    );
    const progression =
      exercise.id === "wall-push-up"
        ? "Mejora primero el control, el recorrido cómodo y las repeticiones. Cuando completes todas las series con técnica estable y margen, puedes alejar ligeramente los pies de la pared; acércalos si necesitas facilitar el movimiento."
        : exercise.id === "chair-squat"
          ? "Mejora el control al sentarte y levantarte y añade repeticiones dentro del rango. Ajusta la altura de una silla firme para conservar un recorrido cómodo y estable."
          : "Mejora el control de la pelvis, una pausa cómoda arriba y las repeticiones dentro del rango, conservando un recorrido que puedas realizar sin arquear la espalda.";
    return {
      weightLb: 0,
      action: valid.length ? "maintain" : "trial",
      reason: needsEasierVariant
        ? "Mantén BW. Usa una variante más fácil o un recorrido menor hasta recuperar una técnica estable. " + progression
        : "Mantén BW como referencia. " + progression,
      provisional: !valid.length,
    };
  }
  if (!valid.length)
    return {
      weightLb: exercise.trialLb,
      action: "trial",
      reason:
        "Carga de prueba provisional. Ajusta durante el calentamiento a tu capacidad y al equipo de hoy.",
      provisional: true,
    };
  const last = valid[valid.length - 1];
  const hold = (reason: string): LoadRecommendation => ({
    weightLb: last.weightLb,
    action: "maintain",
    reason,
    provisional: false,
  });
  if (
    new Set(valid.map((s) => s.sessionId).filter(Boolean)).size > 1 ||
    new Set(valid.map((s) => s.equipment).filter(Boolean)).size > 1
  )
    return hold(
      "Compara solamente la última sesión realizada en el mismo equipo. Confirma la carga manualmente.",
    );
  if (last.mode === "assisted")
    return hold(
      "Conserva la asistencia como referencia. Si completas el rango con margen y buena técnica, puedes reducir ligeramente la asistencia manualmente.",
    );
  const working = valid.slice(-exercise.sets);
  const hasTechniqueIssue = working.some((s) => s.techniqueGood === false);
  const missesMinimumAtLimit = working.some(
    (s) => s.reps < exercise.minReps && s.rir != null && s.rir <= 1,
  );
  if (hasTechniqueIssue || missesMinimumAtLimit) {
    const reduced = Math.max(
      0,
      Math.floor((last.weightLb * 0.95) / exercise.stepLb) * exercise.stepLb,
    );
    return {
      weightLb: reduced,
      action: "reduce",
      reason: hasTechniqueIssue
        ? "Considera bajar la carga y recuperar una técnica estable antes de progresar."
        : "No alcanzaste el mínimo cerca de tu límite. Considera una reducción pequeña; confirma según tu recuperación.",
      provisional: false,
    };
  }
  if (working.length < exercise.sets)
    return hold(
      "Sesión parcial: conserva la referencia y completa las series antes de evaluar un aumento.",
    );
  if (working.some((s) => s.weightLb !== last.weightLb || s.mode !== last.mode))
    return hold(
      "Usaste cargas distintas. Busca completar las series dentro del rango con una carga comparable.",
    );
  if (
    working.every(
      (s) =>
        s.reps >= exercise.maxReps &&
        s.rir != null &&
        s.rir >= 2 &&
        s.techniqueGood === true,
    )
  ) {
    return {
      weightLb: last.weightLb + exercise.stepLb,
      action: "increase",
      reason:
        "Completaste todas las series en el extremo superior, con técnica confirmada y al menos 2 RIR. Puedes probar el incremento mínimo disponible.",
      provisional: false,
    };
  }
  return hold(
    working.some((s) => s.reps < exercise.minReps)
      ? "No alcanzaste el mínimo: conserva o reduce la carga según tu esfuerzo y técnica; faltan datos para recomendar un cambio."
      : "Mantén la carga e intenta añadir repeticiones dentro del rango. El aumento requiere todas las series, buena técnica y margen confirmado.",
  );
}
