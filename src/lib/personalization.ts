import { exercises, type Exercise, type WorkoutDay } from "../data/training";
import { foods } from "../data/nutrition";
import {
  mealSuggestions,
  restrictionOptions,
  type MealPreference,
  type MealExclusion,
} from "../data/mealSuggestions";
import { FitStore, seedId } from "./store";
import { prDate } from "./time";
import { cardioActivities, cardioLabel, conditioningGuidance, conditioningSources, trainingStyles, type CardioPrescription, type ConditioningPrescription, type SessionPhase, type TrainingStyle } from "../data/conditioning";
import {recommendFrequency,spacedDays,designDays,strengthCandidates,type DayDesign,type FrequencyRecommendation} from './trainingDesign';
export const guideSources = [
  {
    title: "ACSM · Revisión de entrenamiento de fuerza, 2026",
    url: "https://acsm.org/resistance-training-guidelines-update-2026/",
    use: "Fuerza progresiva, grandes grupos musculares y adaptación al objetivo; no valida cada rutina individual.",
  },
  {
    title: "OMS · Actividad física",
    url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
    use: "Referencia general para adultos: actividad regular, menos sedentarismo y aumento gradual.",
  },
  {
    title: "Harvard · Plato de alimentación saludable",
    url: "https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/",
    use: "Variedad y calidad de alimentos; no prescribe las calorías ni porciones de esta persona.",
  },
  ...conditioningSources,
  {
    title: "CrossFit · Frecuencia según experiencia y recuperación",
    url: "https://www.crossfit.com/essentials/how-often-should-i-do-crossfit",
    use: "Empezar con dos o tres sesiones y adaptar la frecuencia a capacidad, aprendizaje y recuperación; cinco días no son un requisito universal ni una regla del entrenamiento cruzado.",
  },
  {
    title: "Brad Schoenfeld · Science and Development of Muscle Hypertrophy, 3.ª edición",
    url: "https://us.humankinetics.com/products/science-and-development-of-muscle-hypertrophy-3rd-edition",
    use: "Referencia bibliográfica de hipertrofia; se verificó la página editorial, sin acceso ni lectura del texto completo para generar esta guía.",
  },
  {
    title: "Frédéric Delavier · Strength Training Anatomy, 4.ª edición",
    url: "https://us.humankinetics.com/products/strength-training-anatomy-4th-edition",
    use: "Referencia bibliográfica de anatomía y movimientos; página editorial consultada, sin afirmar lectura del libro completo.",
  },
  {
    title: "Eric Helms y colaboradores · The Muscle and Strength Pyramids: Training",
    url: "https://muscleandstrengthpyramids.com/training-videos/",
    use: "Material abierto de los autores sobre entrenamiento; no equivale a acceso al libro completo ni valida esta rutina individual.",
  },
  {
    title: "Mark Rippetoe · Starting Strength: Basic Barbell Training",
    url: "https://store.startingstrength.com/products/starting-strength-basic-barbell-training",
    use: "Referencia bibliográfica y material abierto de técnica con barra; no se usó el texto completo ni se prescribe automáticamente su programa.",
  },
];
export const guideOptions = {
  sex: [["male", "Masculino"], ["female", "Femenino"]],
  age: [
    ["18-29", "18–29 años"],
    ["30-49", "30–49 años"],
    ["50-64", "50–64 años"],
    ["65+", "65 años o más"],
    ["under18", "Menos de 18 años"],
  ],
  activity: [
    ["sedentary", "Paso la mayor parte del día sentado/a"],
    ["standing", "Paso bastante tiempo de pie"],
    ["active", "Camino o me muevo con frecuencia"],
    ["physical", "Mi trabajo exige esfuerzo físico"],
  ],
  experience: [
    ["new", "Estoy empezando"],
    ["returning", "Estoy retomando después de una pausa"],
    ["regular", "Entreno con regularidad y conozco la técnica"],
  ],
  goal: [
    ["health", "Crear el hábito y mejorar mi condición física"],
    ["strength", "Ganar fuerza"],
    ["muscle", "Desarrollar masa muscular"],
    ["recomp", "Mejorar mi composición corporal"],
    ["endurance", "Mejorar mi resistencia cardiovascular"],
  ],
  equipment: [
    ["gym", "Gimnasio: máquinas y pesas"],
    ["hybrid", "Gimnasio y calistenia / peso corporal"],
    ["dumbbells", "En casa: mancuernas"],
    ["bodyweight", "En casa: peso corporal y silla estable"],
    ["walking", "Prefiero comenzar con cardio"],
  ],
  cardio: [
    ["walk", "Caminar"],
    ["rope", "Cuica, si tolero los impactos"],
    ["both", "Caminar y cuica"],
  ],
  trainingStyle: trainingStyles.map(style=>[style.id,style.label] as const),
  impactTolerance: [["low", "Prefiero bajo impacto"], ["any", "Tolero impactos y saltos"]],
  horizon: [
    ["4-8", "Me gustaría notar avances en 4–8 semanas"],
    ["3-6", "Quiero trabajar durante 3–6 meses"],
    ["ongoing", "Prefiero avanzar sin plazo"],
  ],
  preference: [
    ["omnivore", "Variada: incluyo alimentos animales y vegetales"],
    ["vegetarian", "Vegetariana: incluyo huevos y lácteos"],
    ["plant", "Solo alimentos vegetales"],
  ],
} as const;
export interface GuideAnswers {
  name?: string;
  version?: number;
  sex?: "male" | "female";
  allergyReviewed?: boolean;
  trainingStyle?: TrainingStyle["id"];
  cardioChoices?: string[];
  impactTolerance?: "low" | "any";
  cardioAccess?: boolean;
  dietaryRestrictions?: string[];
  favoriteIngredients?: string[];
  age: string;
  weight: string;
  unit: "lb" | "kg";
  activity: string;
  experience: string;
  goal: string;
  equipment: string;
  cardio: string;
  days: number[];
  minutes: number;
  horizon: string;
  preference: MealPreference;
  excluded: MealExclusion[];
  professionalSupport: "no" | "yes" | "unsure";
  dietaryCare: "no" | "yes";
  consent: boolean;
}
export const initialAnswers: GuideAnswers = {
  age: "",
  weight: "",
  unit: "lb",
  activity: "",
  experience: "",
  goal: "",
  equipment: "",
  cardio: "walk",
  days: [1, 4],
  minutes: 30,
  horizon: "ongoing",
  preference: "omnivore",
  excluded: [],
  professionalSupport: "unsure",
  dietaryCare: "no",
  consent: false,
};
export function validateAnswers(a: GuideAnswers) {
  if(a.name!==undefined && (typeof a.name!=="string" || a.name.trim().length>60 || /[\u0000-\u001f\u007f]/.test(a.name))) throw new Error("Usa un nombre o apodo de hasta 60 caracteres.");
  const blocked = a.age === "under18" || a.professionalSupport !== "no";
  for (const key of ["age", "activity", "experience", "goal", "equipment", "horizon", "preference"] as const) {
    if (
      (!blocked || key === "age") &&
      !guideOptions[key].some(([value]) => value === a[key])
    )
      throw new Error("Completa todas las preguntas de tu guía.");
  }
  if (!blocked && !a.cardioChoices?.length && !guideOptions.cardio.some(([value])=>value===a.cardio)) throw new Error("Selecciona una preferencia de cardio válida.");
  if (a.version != null && (!Number.isInteger(a.version)||a.version<1||a.version>2)) throw new Error("La versión del cuestionario no es válida.");
  if (a.sex != null && !["male","female"].includes(a.sex)) throw new Error("Selecciona sexo masculino o femenino.");
  if (!blocked && a.version===2 && (!a.sex || a.allergyReviewed!==true)) throw new Error("Selecciona tu sexo y revisa las exclusiones de alimentos para continuar.");
  if (!blocked && isModernGuide(a)) {
    if (!a.trainingStyle || !trainingStyles.some(style=>style.id===a.trainingStyle) || !["low","any"].includes(a.impactTolerance||"") || typeof a.cardioAccess!=="boolean") throw new Error("Selecciona estilo, tolerancia al impacto y acceso al equipo de cardio.");
    if (!Array.isArray(a.cardioChoices)||!a.cardioChoices.length||a.cardioChoices.length>cardioActivities.length||new Set(a.cardioChoices).size!==a.cardioChoices.length||a.cardioChoices.some(kind=>!cardioActivities.some(activity=>activity.id===kind))) throw new Error("Selecciona al menos una actividad de cardio válida, sin repeticiones.");
    const compatible=compatibleCardio(a);
    if (!compatible.length && !a.cardioChoices.includes("adaptive")) throw new Error("Selecciona al menos una actividad compatible con el impacto y el equipo disponibles.");
  }
  for (const list of [a.dietaryRestrictions,a.favoriteIngredients]) if (list!=null&&(!Array.isArray(list)||list.length>100||list.some(value=>typeof value!=="string"||!value.trim()||value.length>120))) throw new Error("Revisa los ingredientes y restricciones seleccionados.");
  if (a.dietaryRestrictions?.some(value=>!restrictionOptions.some(option=>option.id===value))) throw new Error("Hay una restricción que este catálogo no puede evaluar. Revisa las opciones disponibles.");
  if (
    !["lb", "kg"].includes(a.unit) ||
    !["no", "yes", "unsure"].includes(a.professionalSupport) ||
    !["no", "yes"].includes(a.dietaryCare)
  )
    throw new Error("Revisa tus respuestas.");
  if (
    a.weight !== "" &&
    (!Number.isFinite(Number(a.weight)) ||
      Number(a.weight) < (a.unit === "lb" ? 60 : 30) ||
      Number(a.weight) > (a.unit === "lb" ? 660 : 300))
  )
    throw new Error("Selecciona un peso válido o deja el dato sin indicar.");
  if (
    ![20, 30, 45, 60].includes(a.minutes) ||
    a.days.length < 2 ||
    a.days.length > 5 ||
    new Set(a.days).size !== a.days.length ||
    a.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
  )
    throw new Error("Selecciona entre 2 y 5 días diferentes.");
  if (
    a.excluded.some(
      (x) => !["dairy", "egg", "fish", "nuts", "gluten", "soy", "sesame", "shellfish", "peanut"].includes(x),
    ) ||
    !a.consent
  )
    throw new Error(
      "Revisa las exclusiones y acepta guardar tus respuestas para continuar.",
    );
}
function isModernGuide(a:GuideAnswers){return a.version===2||a.trainingStyle!==undefined||a.cardioChoices!==undefined;}
function compatibleCardio(a:GuideAnswers){return (a.cardioChoices||[]).filter(kind=>{const activity=cardioActivities.find(item=>item.id===kind);return activity&&kind!=="adaptive"&&(a.impactTolerance!=="low"||activity.impact==="low")&&(!activity.needsEquipment||a.cardioAccess===true);});}

function buildLegacyGuide(a: GuideAnswers) {
  validateAnswers(a);
  const blocked = a.age === "under18" || a.professionalSupport !== "no";
  const days = [...a.days].sort((x, y) => ((x + 6) % 7) - ((y + 6) % 7));
  const regular = a.experience === "regular";
  const warnings: string[] = [];
  if (blocked)
    warnings.push(
      "No generamos una rutina automática en este caso. Un profesional debe valorar cómo adaptar la actividad. Puedes conservar tus registros y consultar las fuentes generales.",
    );
  if (a.dietaryCare === "yes")
    warnings.push(
      "Si tienes alergias, necesidades clínicas o antecedentes de un trastorno alimentario, revisa cualquier cambio de alimentación con un profesional. No se genera un menú personalizado.",
    );
  if (a.equipment === "bodyweight")
    warnings.push(
      "Sin resistencia externa, esta guía inicial no cubre bien los movimientos de tirón para la espalda. Añade equipo o pide ayuda para completar el plan.",
    );
  if (a.equipment === "walking" && a.goal !== "health")
    warnings.push(
      "Caminar ayuda a crear el hábito; por sí solo no cubre una meta de fuerza o hipertrofia. Considera incorporar fuerza con orientación.",
    );
  if (a.age === "65+")
    warnings.push(
      "Incluye trabajo de equilibrio adaptado y consulta si necesitas apoyos o supervisión. Esta guía no evalúa el riesgo de caídas.",
    );
  const strengthDays =
    blocked || a.equipment === "walking"
      ? []
      : a.goal === "health" && days.length > 3
        ? [days[0], days[Math.floor(days.length / 2)], days.at(-1)!]
        : days.slice(
            0,
            a.goal === "health"
              ? Math.min(3, days.length)
              : Math.min(4, days.length),
          );
  const split = strengthDays.length >= 4;
  if (!split && strengthDays.some((d) => strengthDays.includes((d + 1) % 7)))
    warnings.push(
      "Has elegido días de fuerza consecutivos. Separa las sesiones de cuerpo completo con un día de recuperación cuando puedas, o reduce el esfuerzo si no has recuperado.",
    );
  const maxExercises =
    a.minutes === 20 ? 3 : a.minutes === 30 ? 4 : a.minutes === 45 ? 5 : 6;
  const selected = new Set<string>();
  const plans: WorkoutDay[] = Array.from({ length: 7 }, (_, day) => {
    const index = strengthDays.indexOf(day);
    if (blocked)
      return {
        day,
        title: "Guía pendiente de orientación profesional",
        type: "rest",
        exerciseIds: [],
        walkMinutes: 0,
      };
    if (index < 0) {
      const cardio = days.includes(day);
      return {
        day,
        title: cardio ? "Caminata a tu ritmo" : "Descanso",
        type: cardio ? "cardio" : "rest",
        exerciseIds: [],
        walkMinutes: cardio
          ? Math.min(
              a.minutes,
              regular ? 30 : a.activity === "physical" ? 10 : 15,
            )
          : 0,
      };
    }
    const upper = split && index % 2 === 0,
      lower = split && index % 2 === 1;
    const push = regular ? "push-ups" : "wall-push-up";
    const gym = upper
      ? [
          "incline-dumbbell-press",
          "lat-pulldown",
          "seated-cable-row",
          "machine-shoulder-press",
          "lateral-raises",
          "hammer-curl",
        ]
      : lower
        ? [
            "leg-press",
            "dumbbell-rdl",
            "seated-leg-curl",
            "standing-calf-raises",
            "cable-crunch",
            "hip-thrust",
          ]
        : [
            "leg-press",
            "incline-dumbbell-press",
            "lat-pulldown",
            "dumbbell-rdl",
            "seated-cable-row",
            "cable-crunch",
          ];
    const home = upper
      ? ["dumbbell-row", push, "lateral-raises", "hammer-curl"]
      : lower
        ? ["chair-squat", "dumbbell-rdl", "glute-bridge"]
        : [
            "chair-squat",
            "dumbbell-row",
            push,
            "dumbbell-rdl",
            "glute-bridge",
            "lateral-raises",
          ];
    const ids = (
      a.equipment === "gym"
        ? gym
        : a.equipment === "dumbbells"
          ? home
          : ["chair-squat", push, "glute-bridge"]
    ).slice(0, maxExercises);
    ids.forEach((id) => selected.add(id));
    return {
      day,
      title: upper
        ? "Tren superior"
        : lower
          ? "Tren inferior"
          : `Cuerpo completo ${String.fromCharCode(65 + index)}`,
      type: "strength",
      exerciseIds: ids,
      walkMinutes: a.minutes >= 45 && a.cardio !== "rope" ? 10 : 0,
      ...(a.cardio !== "walk" && index === 0
        ? {
            rope: {
              rounds: regular ? 5 : 3,
              work: regular ? 20 : 10,
              rest: 60,
            },
          }
        : {}),
    };
  });
  const catalog = exercises
    .filter((e) => selected.has(e.id))
    .map((e) => {
      const strength =
        a.goal === "strength" &&
        regular &&
        ![
          "lateral-raises",
          "hammer-curl",
          "cable-crunch",
          "standing-calf-raises",
          "glute-bridge",
        ].includes(e.id);
      const minReps = e.bodyweight ? e.minReps : strength ? 6 : 8,
        maxReps = e.bodyweight
          ? e.maxReps
          : strength
            ? 10
            : a.goal === "health"
              ? 15
              : 12;
      return {
        ...e,
        sets: regular && a.minutes >= 45 && a.goal !== "health" ? 3 : 2,
        minReps,
        maxReps,
        trialLb: e.bodyweight
          ? 0
          : regular
            ? e.trialLb
            : e.id.includes("dumbbell") ||
                ["lateral-raises", "hammer-curl"].includes(e.id)
              ? 5
              : 0,
      } satisfies Exercise;
    });
  const menus =
    blocked || a.dietaryCare === "yes"
      ? Array.from({ length: 7 }, (_, day) => ({ day, meals: [] }))
      : mealSuggestions(a.preference, a.excluded, {dietaryRestrictions:a.dietaryRestrictions,favoriteIngredients:a.favoriteIngredients});
  return {
    blocked,
    plans,
    catalog,
    menus,
    warnings,
    summary: `${strengthDays.length} días de fuerza · ${a.minutes} min por sesión como referencia`,
    principles: [
      "Calienta con movimientos suaves y series de aproximación. El tiempo de sesión es aproximado.",
      "Usa una carga que controles y deja unas 2–3 repeticiones en reserva; no necesitas entrenar al fallo. Descansa aproximadamente 1–3 minutos entre series.",
      "Progresa en repeticiones y después considera una carga que puedas controlar. Tú eliges los cambios; no se asigna peso automáticamente.",
      "El plazo expresa una preferencia para revisar avances, no garantiza cambios de peso, grasa o músculo. El progreso depende de muchas variables.",
      "Detén el ejercicio si aparece dolor, mareo o malestar inusual y solicita orientación.",
    ],
  };
}
/** Select separated strength days where possible; preserve the exact days chosen. */
function chooseStrengthDays(days:number[],limit:number){
  if (days.length<=limit) return [...days];
  const result=[days[0]];
  while(result.length<limit){
    const candidates=days.filter(day=>!result.includes(day));
    const distance=(day:number)=>Math.min(...result.map(other=>Math.min((day-other+7)%7,(other-day+7)%7)));
    candidates.sort((left,right)=>distance(right)-distance(left)||days.indexOf(left)-days.indexOf(right));
    result.push(candidates[0]);
  }
  return days.filter(day=>result.includes(day));
}

/** New questionnaires use explicit modalities and a shared, finite session budget. */
function buildModernGuide(a:GuideAnswers){
  const style=a.trainingStyle||"classic";
  const chosenCardio=compatibleCardio(a);
  const requiresAdaptation=!!a.cardioChoices?.includes("adaptive")&&!chosenCardio.length;
  const blocked=a.age==="under18"||a.professionalSupport!=="no"||requiresAdaptation;
  const days=[...a.days].sort((x,y)=>((x+6)%7)-((y+6)%7));
  const regular=a.experience==="regular";
  const enduranceFocus=style==="endurance"||a.goal==="endurance";
  const warnings:string[]=[];
  if(blocked)warnings.push("La guía automática queda pendiente de orientación profesional. Conserva tus registros y acuerda una actividad adaptada antes de aplicar un plan.");
  if(a.cardioChoices?.includes("adaptive"))warnings.push(conditioningGuidance.adaptive);
  const omitted=(a.cardioChoices||[]).filter(kind=>kind!=="adaptive"&&!chosenCardio.includes(kind));
  if(omitted.length)warnings.push(`Se omiten por impacto o acceso al equipo: ${omitted.map(cardioLabel).join(", ")}. No se sustituyen por actividades que no seleccionaste.`);
  if(a.equipment==="bodyweight")warnings.push("Sin resistencia externa, esta guía no cubre bien los movimientos de tirón para la espalda. Incorpora resistencia adecuada u orientación para completar el trabajo de fuerza; no se presenta un tirón sin resistencia como equivalente.");
  if(a.equipment==="walking"&&["strength","muscle","recomp"].includes(a.goal))warnings.push("El entorno elegido ofrece un plan de cardio. Para fuerza o hipertrofia, incorpora trabajo de resistencia con equipo y orientación adecuados.");
  if(a.age==="65+")warnings.push("Incluye equilibrio adaptado y los apoyos que necesites; esta guía no evalúa riesgo de caídas.");
  if(a.dietaryCare==="yes")warnings.push("Las necesidades clínicas, alergias o antecedentes de trastornos alimentarios requieren revisión profesional. No se genera un menú personalizado.");
  if(style==="crossfit")warnings.push("Esta guía propone acondicionamiento básico registrable. Aprende CrossFit y escala sus movimientos con un entrenador; no genera WOD avanzados, levantamientos olímpicos ni habilidades gimnásticas complejas.");
  if(style==="mixed")warnings.push(conditioningGuidance.mixed);
  const frequencyRecommendation:FrequencyRecommendation|undefined=blocked?undefined:recommendFrequency(a);
  const primaryDays=frequencyRecommendation?spacedDays(days,Math.min(days.length,frequencyRecommendation.recommendedDays)):[];
  const designs=designDays(a,primaryDays);
  if(primaryDays.length<4&&primaryDays.some(day=>primaryDays.includes((day+1)%7)))warnings.push("Tu agenda contiene sesiones principales consecutivas. Se han buscado los huecos más separados disponibles; conserva margen y ajusta el esfuerzo si no has recuperado.");
  if(a.minutes===20&&a.equipment!=="walking")warnings.push("Con 20 minutos, los patrones se reparten entre días A/B/C. Esta selección breve no garantiza cubrir por sí sola todo el volumen semanal de fuerza; puedes revisar más días o tiempo cuando tu agenda lo permita.");
  const sets=regular&&a.minutes>=45&&a.goal!=="health"&&!enduranceFocus?3:2;
  const exerciseLimit=a.minutes===20?3:a.minutes===30?4:a.minutes===45?5:6;
  const perExerciseMinutes=sets===3?6:4;
  const selected=new Set<string>();
  const deliveredCardio=new Set<string>();
  let cardioCursor=0;
  function cardioBlock(kind:string,budget:number,design:DayDesign):CardioPrescription {
    const controlledIntervals=regular&&design.aerobic==="intervals";
    if(kind==="rope"||kind==="walk_run"||controlledIntervals){
      const work=kind==="rope"?(regular?20:10):kind==="walk_run"?(regular?60:30):60;
      const rest=kind==="rope"?60:kind==="walk_run"?(regular?60:90):60;
      const cap=kind==="rope"?(design.aerobic==="easy"?3:5):Math.max(1,Math.min(10,Math.floor(budget/2)));
      const rounds=Math.max(1,Math.min(cap,Math.floor((budget*60+rest)/(work+rest))));
      return {kind,rounds,workSeconds:work,restSeconds:rest,minutes:(rounds*work+Math.max(0,rounds-1)*rest)/60,intensity:kind==="rope"?"Saltos bajos y controlados con margen; recupera antes de cada intervalo.":kind==="walk_run"?"Alterna trote controlado y caminata cómoda; reduce el trote si la técnica o el habla se deterioran.":"Alterna tramos moderados alrededor de RPE 5–6 con recuperación cómoda; no son sprints ni esfuerzos máximos."};
    }
    return {kind,minutes:Math.floor(budget*10)/10,intensity:design.aerobic==="easy"||!regular?"Ritmo cómodo que permita conversar con facilidad; reduce la duración si lo necesitas.":"Base aeróbica cómoda a moderada, orientada por la prueba del habla y tu recuperación."};
  }
  function prescribeCardio(budget:number,design:DayDesign):CardioPrescription[]{
    if(budget<1||!chosenCardio.length)return [];
    const count=budget>=16&&chosenCardio.length>1?2:1;
    return Array.from({length:count},()=>{const kind=chosenCardio[cardioCursor++%chosenCardio.length];deliveredCardio.add(kind);return cardioBlock(kind,budget/count,design);});
  }
  function conditioningBlock(budget:number,design:DayDesign):ConditioningPrescription|undefined{
    // Keep timed blocks technically simple even when a strength goal uses barbells elsewhere.
    const aliases:Record<string,string>={"hack-squat":"goblet-squat","bench-press":regular?"push-ups":"wall-push-up","romanian-deadlift":"glute-bridge"};
    const ids=[...new Set(strengthCandidates(a,design.variant).slice(0,3).map(id=>aliases[id]||id))];
    const format=design.format||"circuit";
    const workSeconds=format==="emom"?35:regular?40:30;
    const restSeconds=60-workSeconds;
    const rounds=Math.min(regular?4:2,Math.floor(budget/ids.length));
    if(rounds<1)return undefined;
    ids.forEach(id=>selected.add(id));
    return {format,rounds,workSeconds,restSeconds,durationMinutes:rounds*ids.length,exerciseIds:ids,targetReps:regular?8:6,intensity:design.effort,instruction:format==="emom"?conditioningGuidance.emom:conditioningGuidance.circuit};
  }
  const plans:WorkoutDay[]=Array.from({length:7},(_,day)=>{
    const empty:WorkoutDay={day,title:blocked?"Guía pendiente de orientación profesional":"Descanso",type:"rest",exerciseIds:[],walkMinutes:0,cardio:[],style,sessionPhases:[],focus:blocked?"Pendiente de orientación":"Recuperación",rationale:blocked?"Acuerda un plan adaptado con un profesional.":"Un día sin entrenamiento planificado permite recuperar y sostener el programa.",effort:"Sin sesión obligatoria."};
    if(blocked||!days.includes(day))return empty;
    const design=designs.get(day)!;
    const warmup=design.optional?2:a.minutes>=45?5:3;
    const cooldown=design.optional?1:a.minutes>=45?3:2;
    const available=a.minutes-warmup-cooldown;
    const phases:SessionPhase[]=[{kind:"warmup",minutes:warmup,label:design.optional?"Movimiento suave a tu gusto":"Calentamiento y práctica de los movimientos"}];
    let ids:string[]=[];
    let conditioning:ConditioningPrescription|undefined;
    let cardioBudget=available;
    if(design.mode==="conditioning"){
      conditioning=conditioningBlock(Math.max(3,available-(a.minutes>=30?8:3)),design);
      if(conditioning){phases.push({kind:"conditioning",minutes:conditioning.durationMinutes,label:`${conditioning.format==="emom"?"EMOM":"Circuito"} ${design.variant} · estaciones y descansos`});cardioBudget=Math.min(available-conditioning.durationMinutes,a.minutes>=45?12:8);}
    }else if(design.mode==="strength"){
      const minimumCardio=style==="mixed"?Math.max(3,Math.floor(available*0.35)):3;
      const strengthBudget=enduranceFocus?Math.min(12,available-3):available-minimumCardio;
      const count=Math.max(1,Math.min(exerciseLimit,Math.floor(strengthBudget/perExerciseMinutes)));
      ids=strengthCandidates(a,design.variant).slice(0,count);
      ids.forEach(id=>selected.add(id));
      const strengthMinutes=Math.min(strengthBudget,ids.length*perExerciseMinutes);
      phases.push({kind:"strength",minutes:strengthMinutes,label:`${design.focus} · descansos incluidos`});
      const remaining=available-strengthMinutes;
      cardioBudget=design.aerobic==="long"&&regular?remaining:style==="mixed"?remaining:Math.min(remaining,enduranceFocus?10:6);
    }else{
      const factor=design.optional?0.35:!regular?0.6:design.aerobic==="long"?1:design.aerobic==="intervals"?0.75:design.aerobic==="base"?0.75:0.5;
      cardioBudget=Math.max(1,Math.floor(available*factor));
      if(design.optional)cardioBudget=Math.min(10,cardioBudget);
    }
    const cardio=prescribeCardio(cardioBudget,design);
    const cardioMinutes=cardio.reduce((total,item)=>total+item.minutes,0);
    if(cardio.length)phases.push({kind:"cardio",minutes:cardioMinutes,label:cardio.map(item=>cardioLabel(item.kind)).join(" + ")});
    phases.push({kind:"cooldown",minutes:cooldown,label:"Vuelta a la calma"});
    const type:WorkoutDay["type"]=design.mode==="recovery"?"recovery":design.mode==="cardio"?"cardio":"strength";
    return {day,title:design.focus,type,exerciseIds:ids,walkMinutes:0,cardio,style,sessionPhases:phases,focus:design.focus,rationale:design.rationale,effort:design.effort,optional:design.optional||false,...(conditioning?{conditioning}:{})};
  });
  const unplanned=chosenCardio.filter(kind=>!deliveredCardio.has(kind));
  if(unplanned.length&&!blocked)warnings.push(`Tu agenda no incluye todavía todas las opciones seleccionadas: ${unplanned.map(cardioLabel).join(", ")}. Prioriza tus preferidas o intercambia modalidades al editar el programa; no se añade tiempo extra fuera de tu disponibilidad.`);
  const catalog=exercises.filter(exercise=>selected.has(exercise.id)).map(exercise=>{
    const strength=a.goal==="strength"&&regular&&!exercise.bodyweight&&!["lateral-raises","hammer-curl","cable-crunch","standing-calf-raises"].includes(exercise.id);
    return {...exercise,sets,minReps:exercise.bodyweight?exercise.minReps:strength?6:8,maxReps:exercise.bodyweight?exercise.maxReps:strength?10:a.goal==="health"?15:12,trialLb:exercise.bodyweight?0:exercise.trialLb} satisfies Exercise;
  });
  const menus=blocked||a.dietaryCare==="yes"?Array.from({length:7},(_,day)=>({day,meals:[]})):mealSuggestions(a.preference,a.excluded,{dietaryRestrictions:a.dietaryRestrictions,favoriteIngredients:a.favoriteIngredients});
  return {blocked,plans,catalog,menus,warnings,frequencyRecommendation,designVersion:3,summary:`${primaryDays.length} sesiones principales en tu agenda actual · hasta ${a.minutes} min por sesión`,principles:[
    "Cada día tiene un propósito y una selección estable A/B/C. Se mantienen las referencias en semanas sucesivas para registrar progreso, sin cambiar ejercicios al azar.",
    "La frecuencia orientativa se calcula por separado de tu disponibilidad. El plan actual usa solo los días elegidos; los adicionales, si sobran, son opcionales y suaves.",
    "La suma de los bloques planificados respeta el tiempo elegido; los descansos reales pueden variar. No se compensa una agenda corta con esfuerzos máximos.",
    "Las estaciones del circuito o EMOM se registran en su propio bloque y no añaden otra rutina completa de series para los mismos ejercicios.",
    conditioningGuidance.effort,conditioningGuidance.talkTest,conditioningGuidance.progression,
    "Las cargas se eligen mediante tus registros y el equipo real; no se calculan a partir de sexo, edad o peso corporal.",
    "Las ideas de comidas filtradas no establecen metas calóricas ni garantizan cubrir necesidades individuales.",
    "Las distribuciones de frecuencia y los minutos por bloque son propuestas editoriales ajustables basadas en principios generales; no son un óptimo individual demostrado.",
    "El horizonte sirve para revisar avances, sin garantizar cambios de peso, grasa o masa muscular.",conditioningGuidance.stop,
  ]};
}

export function buildGuide(a:GuideAnswers){validateAnswers(a);return isModernGuide(a)?buildModernGuide(a):{...buildLegacyGuide(a),frequencyRecommendation:undefined,designVersion:1};}

export function applyGuide(store: FitStore, a: GuideAnswers) {
  const guide = buildGuide(a);
  const guideVersion = isModernGuide(a) ? 2 : 1;
  store.transaction(() => {
    const exerciseRows = new Map<string, string>();
    for (const e of guide.catalog) {
      const old = store
        .list("exercise_catalog")
        .find((r) => r.data.key === e.id);
      const row = store.save(
        "exercise_catalog",
        { ...old?.data, ...e, key: e.id, guideVersion },
        { id: old?.id || seedId(store.userId, `guide-exercise-${e.id}`) },
      );
      exerciseRows.set(e.id, row.id);
    }
    for (const p of guide.plans) {
      const old = store.list("workout_plans").find((r) => r.data.day === p.day);
      const row = store.save(
        "workout_plans",
        { ...p, guideVersion },
        { id: old?.id || seedId(store.userId, `guide-plan-${p.day}`) },
      );
      const keep = new Set<string>();
      p.exerciseIds.forEach((key, position) => {
        const id = seedId(store.userId, `guide-plan-${p.day}-item-${position}`);
        keep.add(id);
        const exercise = guide.catalog.find((e) => e.id === key)!;
        store.save(
          "workout_plan_exercises",
          {
            key,
            exerciseId: key,
            position,
            sets: exercise.sets,
            minReps: exercise.minReps,
            maxReps: exercise.maxReps,
          },
          { id, plan_id: row.id, exercise_id: exerciseRows.get(key) },
        );
      });
      for (const item of store
        .list("workout_plan_exercises")
        .filter((r) => r.plan_id === row.id))
        if (!keep.has(item.id)) store.remove("workout_plan_exercises", item);
    }
    const foodRows = new Map<string, string>();
    for (const item of guide.menus.flatMap((m) =>
      m.meals.flatMap((x) => x.items),
    )) {
      if (foodRows.has(item.foodId)) continue;
      const old = store
        .list("food_catalog")
        .find((r) => r.data.key === item.foodId);
      const food = foods.find((f) => f.id === item.foodId)!;
      const row =
        old ||
        store.save(
          "food_catalog",
          { ...food, key: food.id },
          { id: seedId(store.userId, "food:" + food.id) },
        );
      foodRows.set(item.foodId, row.id);
    }
    for (const m of guide.menus) {
      const old = store.list("meal_plans").find((r) => r.data.day === m.day);
      const row = store.save(
        "meal_plans",
        { ...m, guideVersion },
        { id: old?.id || seedId(store.userId, `guide-menu-${m.day}`) },
      );
      const keep = new Set<string>();
      m.meals.forEach((meal, mi) =>
        meal.items.forEach((item, position) => {
          const id = seedId(
            store.userId,
            `guide-menu-${m.day}-${mi}-${position}`,
          );
          keep.add(id);
          store.save(
            "meal_plan_items",
            { ...item, meal: meal.name, position },
            { id, meal_plan_id: row.id, food_id: foodRows.get(item.foodId) },
          );
        }),
      );
      for (const item of store
        .list("meal_plan_items")
        .filter((r) => r.meal_plan_id === row.id))
        if (!keep.has(item.id)) store.remove("meal_plan_items", item);
    }
    const old = store.list("user_profiles")[0];
    store.save(
      "user_profiles",
      {
        ...old?.data,
        name: a.name?.trim() || old?.data.name || "",
        unit: a.unit,
        initialWeightLb:
          old?.data.initialWeightLb ??
          (a.weight
            ? Number(a.weight) * (a.unit === "kg" ? 2.2046226218 : 1)
            : null),
        personalization: {
          ...a,
          consent: true,
          version: guideVersion,
          savedAt: new Date().toISOString(),
        },
        guideDesignVersion: isModernGuide(a) ? 3 : 1,
        frequencyRecommendation: "frequencyRecommendation" in guide ? guide.frequencyRecommendation : null,
        guideWarnings: guide.warnings,
        guideBlocked: guide.blocked,
        onboardingRequired: false,
        startDate: old?.data.startDate || prDate(),
      },
      { id: old?.id || seedId(store.userId, "profile") },
    );
  });
  return guide;
}
