import type { Exercise } from "./training";

/** Alternativas por patrón y músculos: no equivalencias de carga ni biomecánica idéntica. */
export const variantNotice =
  "Cada variante tiene su propia carga e historial. Prueba su técnica y el equipo con una carga cómoda; no copies el peso del ejercicio sustituido.";
const ms = "https://www.muscleandstrength.com/exercises/";
type Entry = {
  id: string; name: string; muscles: string; url: string; reference?: string; equipment: string[];
  cues: [string, string]; mistakes: [string, string];
  reps?: [number, number]; bodyweight?: boolean; unilateral?: boolean; note?: string;
};
const make = (e: Entry): Exercise => ({
  id: e.id, name: e.name, muscles: e.muscles, sets: 3,
  minReps: e.reps?.[0] ?? 8, maxReps: e.reps?.[1] ?? 12,
  // Valor legado de transporte: no constituye una recomendación de carga inicial.
  trialLb: 0, stepLb: 2.5, bodyweight: e.bodyweight, unilateral: e.unilateral,
  equipment: e.equipment, videoUrl: e.url, referenceUrl: e.reference ?? e.url,
  weightNote: e.note ?? (e.bodyweight
    ? "BW: registra sólo resistencia externa o asistencia. Ajusta primero recorrido, control y dificultad; no añadas lastre automáticamente."
    : "Carga sin configurar: elige una prueba cómoda según el equipo y anótala. No transfieras la carga de otro ejercicio o máquina. Con mancuernas registra peso por mancuerna; con barra incluye la barra."),
  cues: e.cues, mistakes: e.mistakes,
});

/** Páginas educativas con demostración real comprobadas el 12 de noviembre de 2026. */
export const extraExercises: Exercise[] = [
  make({id:"flat-dumbbell-press",name:"Press plano con mancuernas",muscles:"Pectorales · tríceps · deltoides anterior",url:ms+"dumbbell-bench-press.html",equipment:["dumbbell","bench"],cues:["Apoya pies, glúteos y espalda alta en un banco estable.","Baja las mancuernas con muñecas sobre los codos y empuja dentro de un recorrido cómodo."],mistakes:["Rebotar abajo o forzar el hombro.","Chocar las mancuernas o perder el apoyo del tronco."]}),
  make({id:"seated-dumbbell-shoulder-press",name:"Press de hombros sentado con mancuernas",muscles:"Deltoides anterior y lateral · tríceps",url:ms+"seated-dumbbell-press.html",equipment:["dumbbell","bench"],cues:["Usa un respaldo estable y mantén las costillas controladas.","Empuja las mancuernas arriba con muñecas alineadas y baja lentamente."],mistakes:["Arquear la zona lumbar para terminar.","Forzar un recorrido doloroso o lanzar la carga."]}),
  make({id:"seated-arnold-press",name:"Arnold press sentado",muscles:"Deltoides anterior y lateral · tríceps",url:ms+"seated-arnold-press.html",equipment:["dumbbell","bench"],cues:["Comienza con las mancuernas delante de los hombros y el tronco estable.","Rota y eleva de forma gradual sólo dentro de un rango cómodo."],mistakes:["Forzar la rotación del hombro.","Compensar con un arco lumbar o un impulso."]}),
  make({id:"single-arm-cable-lateral-raise",name:"Elevación lateral en polea a un brazo",muscles:"Deltoides lateral",url:ms+"one-arm-cable-lateral-raise.html",equipment:["cable"],reps:[12,20],unilateral:true,cues:["Colócate estable junto a una polea baja y conserva una flexión suave del codo.","Eleva lateralmente hasta una altura cómoda cercana al hombro y regresa con control."],mistakes:["Encoger el hombro o balancear el torso.","Usar un recorrido doloroso o soltar la carga."]}),
  make({id:"seated-dumbbell-lateral-raise",name:"Elevación lateral sentado",muscles:"Deltoides lateral",url:ms+"seated-dumbbell-lateral-raise.html",equipment:["dumbbell","bench"],reps:[12,20],cues:["Siéntate con ambos pies firmes y el tronco estable.","Abre los brazos con codos ligeramente flexionados y baja lentamente."],mistakes:["Impulsarse con la espalda.","Elevar los hombros o cargar más de lo que puedes controlar."]}),
  make({id:"lying-dumbbell-triceps-extension",name:"Extensión de tríceps acostado con mancuernas",muscles:"Tríceps",url:ms+"lying-dumbbell-extension.html",equipment:["dumbbell","bench"],reps:[10,15],cues:["Acuéstate en un banco estable y coloca los brazos en una posición cómoda.","Flexiona los codos para bajar junto a la cabeza y extiende con control."],mistakes:["Dejar caer las mancuernas hacia la cara.","Mover todo el hombro o forzar dolor en el codo."]}),
  make({id:"ez-bar-curl",name:"Curl con barra EZ",muscles:"Bíceps · braquial",url:ms+"ez-bar-curl.html",equipment:["ez-bar"],reps:[10,15],cues:["Sujeta la barra en un ángulo cómodo para las muñecas.","Flexiona los codos manteniéndolos cerca del cuerpo y baja lentamente."],mistakes:["Impulsarse con la cadera.","Extender las muñecas o elevar los hombros para completar."]}),
  make({id:"goblet-squat",name:"Sentadilla goblet",muscles:"Cuádriceps · glúteos · abdomen",url:ms+"dumbbell-goblet-squat",equipment:["dumbbell"],cues:["Sujeta una mancuerna cerca del pecho y apoya los pies de forma estable.","Desciende con rodillas siguiendo la dirección de los pies dentro de un rango controlado."],mistakes:["Despegar los talones o perder el equilibrio.","Redondear la espalda para buscar más profundidad."]}),
  make({id:"bodyweight-reverse-lunge",name:"Zancada inversa",muscles:"Cuádriceps · glúteos",url:ms+"rear-bodyweight-lunge.html",equipment:["bodyweight"],bodyweight:true,unilateral:true,cues:["Da un paso atrás manteniendo una base con anchura suficiente.","Desciende con control y vuelve impulsándote principalmente con la pierna delantera."],mistakes:["Cruzar los pies o golpear la rodilla trasera contra el suelo.","Perder el apoyo del pie delantero o forzar una zancada incómoda."]}),
  make({id:"goblet-split-squat",name:"Split squat goblet",muscles:"Cuádriceps · glúteos",url:ms+"dumbbell-goblet-split-squat",equipment:["dumbbell"],unilateral:true,cues:["Coloca ambos pies en el suelo en una base dividida estable.","Desciende entre los pies y conserva la mancuerna junto al pecho; repite por lado."],mistakes:["Usar una base demasiado estrecha para mantener el equilibrio.","Rebotar abajo o forzar el rango de la cadera."]}),
  make({id:"single-leg-barbell-rdl",name:"Peso muerto rumano a una pierna con barra",muscles:"Isquiotibiales · glúteos · estabilizadores",url:ms+"single-leg-barbell-romanian-deadlift",equipment:["barbell"],unilateral:true,cues:["Ensaya primero la bisagra y el equilibrio sin carga; usa barra de técnica si hace falta.","Lleva la cadera atrás conservando pelvis orientada al suelo y barra cerca de la pierna."],mistakes:["Girar la pelvis para bajar más.","Perder el equilibrio o redondear la espalda para alcanzar el suelo."]}),
  make({id:"exercise-ball-leg-curl",name:"Curl femoral con pelota",muscles:"Isquiotibiales · glúteos · abdomen",url:ms+"exercise-ball-hamstring-curl",equipment:["exercise-ball","bodyweight"],bodyweight:true,reps:[10,15],cues:["Apoya los talones en una pelota adecuada y estabiliza el tronco en el suelo.","Eleva la pelvis con control y flexiona las rodillas acercando la pelota; limita el recorrido si pierdes estabilidad."],mistakes:["Arquear la espalda o dejar caer la pelvis.","Mover la pelota demasiado rápido o usar una superficie que no controlas."]}),
  make({id:"standing-single-leg-dumbbell-calf-raise",name:"Elevación de talón a una pierna con mancuerna",muscles:"Gastrocnemio · sóleo",url:ms+"standing-one-leg-calf-raise-with-dumbbell.html",equipment:["dumbbell","stable-support"],unilateral:true,reps:[10,15],cues:["Sujeta un apoyo firme y conserva la rodilla extendida sin bloquearla de golpe.","Eleva el talón, pausa y baja con control en un rango cómodo."],mistakes:["Rebotar con el tendón de Aquiles.","Perder el apoyo del antepié o impulsarse flexionando la rodilla."]}),
  make({id:"leg-press-calf-raise",name:"Elevación de gemelos en prensa",muscles:"Gastrocnemio · sóleo",url:"https://www.muscleandstrength.com/node/3772",equipment:["leg-press-machine"],reps:[10,15],cues:["Comprueba seguros y apoyo del antepié antes de empezar; usa una carga que controles.","Mantén la rodilla estable y mueve los tobillos para elevar y bajar los talones."],mistakes:["Permitir que los pies resbalen del borde.","Rebotar o bloquear con fuerza las rodillas."]}),
  make({id:"seated-dumbbell-calf-raise",name:"Elevación de gemelos sentado con mancuernas",muscles:"Sóleo · gastrocnemio",url:ms+"seated-dumbbell-calf-raise.html",equipment:["dumbbell","chair"],reps:[12,20],cues:["Siéntate estable con rodillas flexionadas y coloca las cargas sobre los muslos, no sobre las rótulas.","Eleva ambos talones, pausa y vuelve lentamente manteniendo el antepié apoyado."],mistakes:["Dejar deslizar la mancuerna.","Rebotar abajo o ayudar levantando la carga con las manos."]}),
  make({id:"single-leg-seated-dumbbell-calf-raise",name:"Elevación de gemelo sentado a una pierna",muscles:"Sóleo · gastrocnemio",url:ms+"one-leg-seated-dumbbell-calf-raise.html",equipment:["dumbbell","chair"],unilateral:true,reps:[12,20],cues:["Coloca una mancuerna estable sobre el muslo y conserva la rodilla flexionada.","Eleva el talón y baja con control; completa el mismo trabajo por lado."],mistakes:["Apoyar la carga directamente sobre la rótula.","Impulsarse con rebotes o perder el contacto del antepié."]}),
  make({id:"weighted-crunch",name:"Crunch con carga",muscles:"Recto abdominal",url:ms+"weighted-crunch.html",equipment:["weight-plate"],reps:[10,15],cues:["Apoya el cuerpo en el suelo y sujeta una carga ligera junto al pecho.","Acerca costillas a pelvis elevando ligeramente la espalda alta, sin tirar del cuello."],mistakes:["Convertirlo en un sit-up completo usando impulso.","Tirar de la cabeza o forzar flexión dolorosa."]}),
  make({id:"standing-cable-crunch",name:"Crunch de pie en polea",muscles:"Recto abdominal",url:ms+"standing-cable-crunch.html",equipment:["cable"],reps:[10,15],cues:["Coloca una cuerda en polea alta y adopta una base estable.","Flexiona el tronco acercando costillas a pelvis; deja las caderas relativamente quietas."],mistakes:["Hacer únicamente una bisagra de cadera.","Tirar sólo con los brazos o dejar que la carga te desplace."]}),
  make({id:"machine-reverse-fly",name:"Apertura posterior en máquina",muscles:"Deltoides posterior · espalda alta",url:ms+"machine-reverse-fly",equipment:["reverse-fly-machine"],reps:[12,20],cues:["Ajusta el asiento y apoya el pecho sobre el soporte.","Abre los brazos con codos suavemente flexionados y vuelve lentamente."],mistakes:["Convertirlo en un remo flexionando mucho los codos.","Elevar los hombros o separar el pecho del apoyo."]}),
  make({id:"standing-cable-reverse-fly",name:"Apertura posterior en poleas",muscles:"Deltoides posterior · espalda alta",url:ms+"standing-cable-flys.html",equipment:["dual-cable"],reps:[12,20],cues:["Cruza los agarres a una altura cómoda y estabiliza el tronco.","Abre los brazos manteniendo una flexión suave de codos y controla la vuelta."],mistakes:["Arquear la espalda o sacar la cabeza hacia delante.","Dar tirones y transformar la apertura en un remo."]}),
  make({id:"single-leg-glute-bridge",name:"Puente de glúteos a una pierna",muscles:"Glúteos · isquiotibiales · estabilizadores de pelvis",url:ms+"single-leg-glute-bridge",equipment:["bodyweight"],bodyweight:true,unilateral:true,reps:[10,15],cues:["Apoya un pie y mantén la otra pierna elevada de forma cómoda.","Eleva la pelvis sin girarla y regresa lentamente; reduce recorrido si pierdes alineación."],mistakes:["Hiperextender la espalda baja.","Rotar la pelvis o impulsarse con rebotes."]}),
  make({id:"half-kneeling-pallof-press",name:"Pallof press semiarrodillado",muscles:"Abdomen · oblicuos · estabilizadores del tronco",url:ms+"half-kneeling-pallof-press",equipment:["cable","mat"],unilateral:true,reps:[10,15],cues:["Apoya una rodilla en una superficie cómoda de lado a la polea.","Extiende las manos desde el pecho resistiendo que pelvis y tronco giren; trabaja ambos lados."],mistakes:["Girar hacia el cable o inclinarse de lado.","Arquear la espalda o contener la respiración."]}),
  make({id:"half-kneeling-adductor-pallof-press",name:"Pallof press semiarrodillado con base lateral",muscles:"Abdomen · oblicuos · estabilizadores de cadera",url:ms+"half-kneeling-adductor-pallof-press",equipment:["cable","mat"],unilateral:true,reps:[10,15],cues:["Apoya una rodilla y extiende la otra pierna lateralmente sólo en un rango cómodo.","Desde una base estable, presiona las manos al frente sin permitir rotación del tronco."],mistakes:["Forzar un estiramiento de aductores para abrir más la base.","Girar la pelvis o arquear la espalda al extender los brazos."]}),
  make({id:"single-leg-machine-extension",name:"Extensión de cuádriceps a una pierna",muscles:"Cuádriceps",url:"https://www.youtube-nocookie.com/embed/82IuSLk5zNc",reference:"https://www.puregym.com/exercises/legs/quad-exercises/leg-extensions/",equipment:["leg-extension-machine"],unilateral:true,reps:[12,15],cues:["Alinea la rodilla con el eje de la máquina y ajusta la almohadilla por encima del tobillo.","Extiende una rodilla y vuelve lentamente; repite con la otra pierna."],mistakes:["Despegar la pelvis del asiento.","Dar tirones o golpear el bloqueo de rodilla."]}),
  make({id:"supported-sissy-squat",name:"Sissy squat con apoyo",muscles:"Cuádriceps · estabilizadores",url:ms+"sissy-squat.html",equipment:["stable-support","bodyweight"],bodyweight:true,reps:[8,12],note:"Variante de cuádriceps con distinto perfil de carga a la extensión de máquina. Usa apoyo estable y un recorrido corto controlado; BW sin lastre. No fuerces dolor de rodilla ni transfieras la carga de la máquina.",cues:["Sujeta un apoyo que no se desplace y conserva alineación entre tronco y muslos.","Permite que las rodillas avancen e inclina el cuerpo gradualmente sólo hasta donde controles el regreso."],mistakes:["Buscar profundidad sin control o con dolor.","Soltar el apoyo o arquear mucho la espalda."]}),
  make({id:"machine-assisted-pull-up",name:"Dominada asistida en máquina",muscles:"Dorsales · bíceps · espalda alta",url:"https://www.puregym.com/exercises/back/pull-up/assisted-pull-ups/",equipment:["assisted-pull-up-machine"],bodyweight:true,cues:["Ajusta la asistencia y sube a la plataforma siguiendo las instrucciones de la máquina.","Lleva los codos hacia abajo y baja lentamente sin balancearte."],mistakes:["Interpretar más asistencia como más carga levantada.","Dejar caer la plataforma o soltar los agarres antes de salir con seguridad."]}),
];

/** Exactamente dos alternativas por cada ejercicio del catálogo inicial (27 gimnasio + 5 casa). */
export const exerciseVariants: Record<string, readonly [string, string]> = {
  "bench-press": ["flat-dumbbell-press", "push-ups"],
  "lat-pulldown": ["neutral-grip-lat-pulldown", "machine-assisted-pull-up"],
  "incline-dumbbell-press": ["incline-bench-press", "flat-dumbbell-press"],
  "seated-cable-row": ["chest-supported-row", "dumbbell-row"],
  "lateral-raises": ["single-arm-cable-lateral-raise", "seated-dumbbell-lateral-raise"],
  "rope-triceps-pushdown": ["lying-dumbbell-triceps-extension", "overhead-triceps-extension"],
  "dumbbell-biceps-curl": ["ez-bar-curl", "hammer-curl"],
  "hack-squat": ["leg-press", "goblet-squat"],
  "romanian-deadlift": ["dumbbell-rdl", "single-leg-barbell-rdl"],
  "bulgarian-split-squat": ["goblet-split-squat", "bodyweight-reverse-lunge"],
  "seated-leg-curl": ["lying-leg-curl", "exercise-ball-leg-curl"],
  "standing-calf-raises": ["standing-single-leg-dumbbell-calf-raise", "leg-press-calf-raise"],
  "cable-crunch": ["weighted-crunch", "standing-cable-crunch"],
  "incline-bench-press": ["incline-dumbbell-press", "flat-dumbbell-press"],
  "chest-supported-row": ["seated-cable-row", "dumbbell-row"],
  "push-ups": ["flat-dumbbell-press", "wall-push-up"],
  "neutral-grip-lat-pulldown": ["lat-pulldown", "machine-assisted-pull-up"],
  "machine-shoulder-press": ["seated-dumbbell-shoulder-press", "seated-arnold-press"],
  "rear-delt-fly": ["machine-reverse-fly", "standing-cable-reverse-fly"],
  "overhead-triceps-extension": ["lying-dumbbell-triceps-extension", "rope-triceps-pushdown"],
  "hammer-curl": ["dumbbell-biceps-curl", "ez-bar-curl"],
  "leg-press": ["hack-squat", "goblet-squat"],
  "hip-thrust": ["glute-bridge", "single-leg-glute-bridge"],
  "lying-leg-curl": ["seated-leg-curl", "exercise-ball-leg-curl"],
  "leg-extension": ["single-leg-machine-extension", "supported-sissy-squat"],
  "seated-calf-raises": ["seated-dumbbell-calf-raise", "single-leg-seated-dumbbell-calf-raise"],
  "pallof-press": ["half-kneeling-pallof-press", "half-kneeling-adductor-pallof-press"],
  "chair-squat": ["goblet-squat", "bodyweight-reverse-lunge"],
  "glute-bridge": ["hip-thrust", "single-leg-glute-bridge"],
  "wall-push-up": ["push-ups", "flat-dumbbell-press"],
  "dumbbell-row": ["seated-cable-row", "chest-supported-row"],
  "dumbbell-rdl": ["romanian-deadlift", "single-leg-barbell-rdl"],
  // Las variantes nuevas también conservan una salida de sustitución útil.
  "flat-dumbbell-press": ["bench-press", "push-ups"],
  "seated-dumbbell-shoulder-press": ["machine-shoulder-press", "seated-arnold-press"],
  "seated-arnold-press": ["machine-shoulder-press", "seated-dumbbell-shoulder-press"],
  "single-arm-cable-lateral-raise": ["lateral-raises", "seated-dumbbell-lateral-raise"],
  "seated-dumbbell-lateral-raise": ["lateral-raises", "single-arm-cable-lateral-raise"],
  "lying-dumbbell-triceps-extension": ["rope-triceps-pushdown", "overhead-triceps-extension"],
  "ez-bar-curl": ["dumbbell-biceps-curl", "hammer-curl"],
  "goblet-squat": ["chair-squat", "leg-press"],
  "bodyweight-reverse-lunge": ["bulgarian-split-squat", "goblet-split-squat"],
  "goblet-split-squat": ["bulgarian-split-squat", "bodyweight-reverse-lunge"],
  "single-leg-barbell-rdl": ["dumbbell-rdl", "romanian-deadlift"],
  "exercise-ball-leg-curl": ["seated-leg-curl", "lying-leg-curl"],
  "standing-single-leg-dumbbell-calf-raise": ["standing-calf-raises", "leg-press-calf-raise"],
  "leg-press-calf-raise": ["standing-calf-raises", "standing-single-leg-dumbbell-calf-raise"],
  "seated-dumbbell-calf-raise": ["seated-calf-raises", "single-leg-seated-dumbbell-calf-raise"],
  "single-leg-seated-dumbbell-calf-raise": ["seated-calf-raises", "seated-dumbbell-calf-raise"],
  "weighted-crunch": ["cable-crunch", "standing-cable-crunch"],
  "standing-cable-crunch": ["cable-crunch", "weighted-crunch"],
  "machine-reverse-fly": ["rear-delt-fly", "standing-cable-reverse-fly"],
  "standing-cable-reverse-fly": ["rear-delt-fly", "machine-reverse-fly"],
  "single-leg-glute-bridge": ["glute-bridge", "hip-thrust"],
  "half-kneeling-pallof-press": ["pallof-press", "half-kneeling-adductor-pallof-press"],
  "half-kneeling-adductor-pallof-press": ["pallof-press", "half-kneeling-pallof-press"],
  "single-leg-machine-extension": ["leg-extension", "supported-sissy-squat"],
  "supported-sissy-squat": ["leg-extension", "single-leg-machine-extension"],
  "machine-assisted-pull-up": ["lat-pulldown", "neutral-grip-lat-pulldown"],
};
export const variants = exerciseVariants;
export const variantSourcesVerified = extraExercises.map((exercise) => ({
  id: exercise.id, url: exercise.videoUrl,
  checkedAt: "2026-11-12", method: "provider-demonstration-page" as const,
}));
