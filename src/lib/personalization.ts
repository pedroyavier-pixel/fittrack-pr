import { exercises, type Exercise, type WorkoutDay } from "../data/training";
import { foods } from "../data/nutrition";
import {
  mealSuggestions,
  type MealPreference,
  type MealExclusion,
} from "../data/mealSuggestions";
import { FitStore, seedId } from "./store";
import { prDate } from "./time";
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
];
export const guideOptions = {
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
  ],
  equipment: [
    ["gym", "Gimnasio: máquinas y pesas"],
    ["dumbbells", "En casa: mancuernas"],
    ["bodyweight", "En casa: peso corporal y silla estable"],
    ["walking", "Prefiero comenzar solo caminando"],
  ],
  cardio: [
    ["walk", "Caminar"],
    ["rope", "Cuica, si tolero los impactos"],
    ["both", "Caminar y cuica"],
  ],
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
  const blocked = a.age === "under18" || a.professionalSupport !== "no";
  for (const key of Object.keys(
    guideOptions,
  ) as (keyof typeof guideOptions)[]) {
    if (
      (!blocked || key === "age") &&
      !guideOptions[key].some(([value]) => value === a[key])
    )
      throw new Error("Completa todas las preguntas de tu guía.");
  }
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
      (x) => !["dairy", "egg", "fish", "nuts", "gluten"].includes(x),
    ) ||
    !a.consent
  )
    throw new Error(
      "Revisa las exclusiones y acepta guardar tus respuestas para continuar.",
    );
}
export function buildGuide(a: GuideAnswers) {
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
      : mealSuggestions(a.preference, a.excluded);
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
      "Sube repeticiones antes de sugerir carga; los cambios son opcionales y se basan en tus series y técnica, nunca en tu peso corporal.",
      "El plazo expresa una preferencia para revisar avances, no garantiza cambios de peso, grasa o músculo. El progreso depende de muchas variables.",
      "Detén el ejercicio si aparece dolor, mareo o malestar inusual y solicita orientación.",
    ],
  };
}
export function applyGuide(store: FitStore, a: GuideAnswers) {
  const guide = buildGuide(a);
  store.transaction(() => {
    const exerciseRows = new Map<string, string>();
    for (const e of guide.catalog) {
      const old = store
        .list("exercise_catalog")
        .find((r) => r.data.key === e.id);
      const row = store.save(
        "exercise_catalog",
        { ...old?.data, ...e, key: e.id, guideVersion: 1 },
        { id: old?.id || seedId(store.userId, `guide-exercise-${e.id}`) },
      );
      exerciseRows.set(e.id, row.id);
    }
    for (const p of guide.plans) {
      const old = store.list("workout_plans").find((r) => r.data.day === p.day);
      const row = store.save(
        "workout_plans",
        { ...p, guideVersion: 1 },
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
        { ...m, guideVersion: 1 },
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
        name: old?.data.name || "Atleta",
        unit: a.unit,
        initialWeightLb:
          old?.data.initialWeightLb ??
          (a.weight
            ? Number(a.weight) * (a.unit === "kg" ? 2.2046226218 : 1)
            : null),
        personalization: {
          ...a,
          consent: true,
          version: 1,
          savedAt: new Date().toISOString(),
        },
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
