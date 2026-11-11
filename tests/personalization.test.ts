// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyGuide,
  buildGuide,
  initialAnswers,
  validateAnswers,
  type GuideAnswers,
} from "../src/lib/personalization";
import { FitStore, seedId, type Table } from "../src/lib/store";
import { exercises } from "../src/data/training";
import { foods } from "../src/data/nutrition";

const api = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("../src/lib/client", () => ({ supabase: { from: api.from } }));

function answers(overrides: Partial<GuideAnswers> = {}): GuideAnswers {
  return {
    ...initialAnswers,
    age: "30-49",
    activity: "sedentary",
    experience: "returning",
    goal: "recomp",
    equipment: "gym",
    professionalSupport: "no",
    consent: true,
    days: [1, 4],
    excluded: [],
    ...overrides,
  };
}
const selectedDays = [
  [1, 4],
  [1, 3, 5],
  [1, 2, 4, 5],
  [0, 1, 2, 4, 5],
];
const exerciseLimit: Record<number, number> = { 20: 3, 30: 4, 45: 5, 60: 6 };
const catalogIds = new Set(exercises.map((e) => e.id));
const foodIds = new Set(foods.map((f) => f.id));

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  api.from.mockReset();
  api.from.mockImplementation(() => {
    throw new Error("Unexpected remote call in offline test");
  });
});
afterEach(() => vi.restoreAllMocks());

describe("personalización: calendario, equipo y experiencia", () => {
  it.each(["gym", "dumbbells", "bodyweight", "walking"])(
    "%s adapta entre 2 y 5 días y sesiones de 20 a 60 minutos",
    (equipment) => {
      for (const days of selectedDays) {
        for (const minutes of [20, 30, 45, 60]) {
          const guide = buildGuide(answers({ equipment, days, minutes }));
          expect(guide.blocked).toBe(false);
          expect(guide.plans).toHaveLength(7);
          expect(new Set(guide.plans.map((p) => p.day)).size).toBe(7);
          const active = guide.plans.filter((p) => p.type !== "rest");
          expect(active.map((p) => p.day).sort()).toEqual([...days].sort());
          for (const plan of guide.plans) {
            if (!days.includes(plan.day)) expect(plan.type).toBe("rest");
            expect(plan.exerciseIds.length).toBeLessThanOrEqual(
              exerciseLimit[minutes],
            );
            expect(plan.walkMinutes).toBeLessThanOrEqual(minutes);
            expect(new Set(plan.exerciseIds).size).toBe(
              plan.exerciseIds.length,
            );
            for (const id of plan.exerciseIds) {
              expect(catalogIds.has(id)).toBe(true);
              expect(guide.catalog.some((e) => e.id === id)).toBe(true);
            }
          }
          if (equipment === "walking") {
            expect(guide.catalog).toHaveLength(0);
            expect(guide.plans.every((p) => p.exerciseIds.length === 0)).toBe(
              true,
            );
            expect(
              active.every((p) => p.type === "cardio" && p.walkMinutes > 0),
            ).toBe(true);
          } else {
            expect(
              guide.plans.filter((p) => p.type === "strength").length,
            ).toBeGreaterThanOrEqual(2);
            expect(
              guide.plans.filter((p) => p.type === "strength").length,
            ).toBeLessThanOrEqual(4);
          }
        }
      }
    },
  );

  it("el plan de peso corporal usa únicamente movimientos domésticos sin máquinas ni cargas externas", () => {
    const allowed = new Set([
      "chair-squat",
      "wall-push-up",
      "push-ups",
      "glute-bridge",
    ]);
    for (const experience of ["new", "regular"]) {
      const guide = buildGuide(
        answers({
          equipment: "bodyweight",
          experience,
          minutes: 60,
          days: [1, 2, 4, 5],
        }),
      );
      expect(guide.catalog.length).toBeGreaterThan(0);
      expect(
        guide.catalog.every(
          (e) => allowed.has(e.id) && e.bodyweight && e.trialLb === 0,
        ),
      ).toBe(true);
      expect(
        guide.plans
          .flatMap((p) => p.exerciseIds)
          .every((id) => allowed.has(id)),
      ).toBe(true);
      expect(guide.warnings.join(" ")).toMatch(/tirón|espalda/);
    }
  });

  it("el equipo de mancuernas no introduce poleas, máquinas o barras", () => {
    const allowed = new Set([
      "chair-squat",
      "dumbbell-row",
      "wall-push-up",
      "push-ups",
      "dumbbell-rdl",
      "glute-bridge",
      "lateral-raises",
      "hammer-curl",
    ]);
    const guide = buildGuide(
      answers({
        equipment: "dumbbells",
        experience: "regular",
        minutes: 60,
        days: [1, 2, 4, 5],
      }),
    );
    expect(guide.catalog.every((e) => allowed.has(e.id))).toBe(true);
  });

  it("principiantes reciben dos series y personas regulares conservan tres con tiempo suficiente", () => {
    const novice = buildGuide(
      answers({ experience: "new", minutes: 60, goal: "muscle" }),
    );
    const regular = buildGuide(
      answers({ experience: "regular", minutes: 60, goal: "muscle" }),
    );
    expect(novice.catalog.length).toBeGreaterThan(0);
    expect(novice.catalog.every((e) => e.sets === 2)).toBe(true);
    expect(regular.catalog.every((e) => e.sets === 3)).toBe(true);
    expect(
      buildGuide(answers({ experience: "regular", minutes: 20 })).catalog.every(
        (e) => e.sets === 2,
      ),
    ).toBe(true);
  });

  it("no modifica las respuestas ni los arreglos originales al ordenar días o filtrar alimentos", () => {
    const a = answers({ days: [5, 0, 1], excluded: ["egg", "dairy"] });
    const snapshot = structuredClone(a);
    Object.freeze(a.days);
    Object.freeze(a.excluded);
    Object.freeze(a);
    const guide = buildGuide(a);
    expect(a).toEqual(snapshot);
    expect(guide.plans.some((p) => p.type === "strength")).toBe(true);
  });
});

describe("personalización: límites y alimentación", () => {
  it.each([
    { age: "under18", professionalSupport: "no" },
    { age: "30-49", professionalSupport: "yes" },
    { age: "30-49", professionalSupport: "unsure" },
  ] as const)(
    "no genera rutina ni menú con edad=$age y orientación=$professionalSupport",
    (patch) => {
      const guide = buildGuide(answers(patch));
      expect(guide.blocked).toBe(true);
      expect(guide.catalog).toHaveLength(0);
      expect(
        guide.plans.every(
          (p) =>
            p.type === "rest" && !p.exerciseIds.length && p.walkMinutes === 0,
        ),
      ).toBe(true);
      expect(guide.menus).toHaveLength(7);
      expect(guide.menus.every((m) => m.meals.length === 0)).toBe(true);
      expect(guide.warnings.join(" ")).toMatch(/profesional/);
    },
  );

  it("necesidades dietéticas específicas vacían el menú sin eliminar la guía de actividad autorizada", () => {
    const guide = buildGuide(answers({ dietaryCare: "yes" }));
    expect(guide.blocked).toBe(false);
    expect(guide.plans.some((p) => p.type === "strength")).toBe(true);
    expect(guide.menus.every((m) => m.meals.length === 0)).toBe(true);
    expect(guide.warnings.join(" ")).toMatch(/alimentación|menú/);
  });

  it("el peso es opcional y no determina calorías, nutrientes ni cargas", () => {
    const empty = answers({ weight: "" });
    expect(() => validateAnswers(empty)).not.toThrow();
    const baseline = buildGuide(empty);
    for (const patch of [
      { weight: "120", unit: "lb" },
      { weight: "250", unit: "lb" },
      { weight: "100", unit: "kg" },
    ] as const) {
      const other = buildGuide(answers(patch));
      expect(other.catalog).toEqual(baseline.catalog);
      expect(other.menus).toEqual(baseline.menus);
      expect(other.plans).toEqual(baseline.plans);
      expect(other).not.toHaveProperty("calorieTarget");
    }
    const s = new FitStore("optional-weight");
    applyGuide(s, empty);
    expect(s.list("user_profiles")[0].data.initialWeightLb).toBeNull();
    expect(s.list("user_goals")).toHaveLength(0);
  });

  it.each(["omnivore", "vegetarian", "plant"] as const)(
    "%s respeta exclusiones sin reintroducirlas como alternativas",
    (preference) => {
      const guide = buildGuide(
        answers({
          preference,
          excluded: ["dairy", "egg", "fish", "nuts", "gluten"],
        }),
      );
      const forbidden = new Set([
        "milk",
        "yogurt",
        "butter",
        "egg",
        "salmon",
        "tuna",
        "almonds",
        "oats",
        "farina",
        "bread",
      ]);
      if (preference !== "omnivore")
        for (const id of ["chicken", "thigh", "beef", "steak"])
          forbidden.add(id);
      expect(guide.menus).toHaveLength(7);
      for (const menu of guide.menus) {
        expect(menu.meals).toHaveLength(4);
        for (const item of menu.meals.flatMap((m) => m.items)) {
          expect(foodIds.has(item.foodId)).toBe(true);
          expect(forbidden.has(item.foodId)).toBe(false);
          expect(item.amount).toBeGreaterThan(0);
          expect(item.coffee).not.toBe(true);
        }
      }
    },
  );

  it("rechaza datos incompletos, días repetidos, días fuera de rango, tiempos y pesos inválidos y falta de consentimiento", () => {
    for (const patch of [
      { age: "" },
      { activity: "" },
      { experience: "" },
      { goal: "" },
      { equipment: "" },
      { days: [1] },
      { days: [1, 1] },
      { days: [1, 7] },
      { days: [0, 1, 2, 3, 4, 5] },
      { minutes: 15 },
      { minutes: 90 },
      { weight: "-2" },
      { weight: "not-a-number" },
      { weight: "1000" },
      { consent: false },
      { preference: "unknown" },
      { excluded: ["unknown"] },
    ])
      expect(() =>
        validateAnswers(answers(patch as Partial<GuideAnswers>)),
      ).toThrow();
  });
});

describe("aplicar guía y atomicidad del almacenamiento", () => {
  function seededStore() {
    const s = new FitStore("history-owner");
    s.save(
      "user_profiles",
      {
        name: "Historia",
        unit: "lb",
        initialWeightLb: 190,
        startDate: "2026-01-01",
      },
      { id: seedId(s.userId, "profile") },
    );
    s.save(
      "user_goals",
      { kcal: 2250, protein: 150, carbs: 240, fat: 70 },
      { id: "goal" },
    );
    const session = s.save(
      "workout_sessions",
      {
        title: "Rutina anterior",
        plan: { title: "Snapshot anterior", exerciseIds: ["bench-press"] },
        exercises: [{ id: "bench-press", name: "Ejercicio anterior", sets: 4 }],
        startedAt: "2026-01-01T16:00:00Z",
      },
      { id: "session", local_date: "2026-01-01" },
    );
    s.save(
      "workout_sets",
      {
        exerciseId: "bench-press",
        weightLb: 135,
        reps: 8,
        completed: true,
        exerciseSnapshot: { name: "Nombre antiguo", sets: 4 },
      },
      { id: "set", session_id: session.id, local_date: "2026-01-01" },
    );
    s.save(
      "food_logs",
      {
        foodId: "rice",
        amount: 185,
        kcal: 240.5,
        per100: { kcal: 130 },
        goalSnapshot: { kcal: 2250 },
      },
      { id: "food", local_date: "2026-01-01" },
    );
    s.save(
      "body_measurements",
      { weightLb: 188, waistCm: 85, notes: "Contexto anterior" },
      { id: "body", local_date: "2026-01-01" },
    );
    s.save(
      "cardio_logs",
      { kind: "walk", minutes: 25, steps: 2400 },
      { id: "cardio", local_date: "2026-01-01" },
    );
    return s;
  }

  it("conserva históricos, snapshots, metas y perfil al reemplazar planes futuros", () => {
    const s = seededStore();
    const historyTables: Table[] = [
      "workout_sessions",
      "workout_sets",
      "food_logs",
      "body_measurements",
      "cardio_logs",
      "user_goals",
    ];
    const before = Object.fromEntries(
      historyTables.map((t) => [t, structuredClone(s.all(t))]),
    );
    const input = answers({
      equipment: "bodyweight",
      weight: "75",
      unit: "kg",
    });
    const original = structuredClone(input);
    applyGuide(s, input);
    expect(input).toEqual(original);
    for (const table of historyTables)
      expect(s.all(table)).toEqual(before[table]);
    expect(s.list("user_profiles")[0].data.name).toBe("Historia");
    expect(s.list("user_profiles")[0].data.initialWeightLb).toBe(190);
    expect(s.list("user_profiles")[0].data.startDate).toBe("2026-01-01");
    expect(s.list("user_profiles")[0].data.onboardingRequired).toBe(false);
    expect(s.list("workout_plans")).toHaveLength(7);
    expect(s.list("meal_plans")).toHaveLength(7);
    expect(api.from).not.toHaveBeenCalled();
  });

  it("reaplicar conserva IDs y no duplica perfiles, planes, ejercicios o entradas pendientes", () => {
    const s = new FitStore("stable-owner");
    const input = answers({
      days: [1, 2, 4, 5],
      experience: "regular",
      minutes: 60,
    });
    applyGuide(s, input);
    const ids = Object.fromEntries(
      (
        [
          "user_profiles",
          "workout_plans",
          "meal_plans",
          "exercise_catalog",
        ] as const
      ).map((t) => [
        t,
        s
          .list(t)
          .map((r) => r.id)
          .sort(),
      ]),
    );
    const queueCount = s.cache.queue.length;
    applyGuide(s, input);
    for (const [table, expected] of Object.entries(ids))
      expect(
        s
          .list(table as Table)
          .map((r) => r.id)
          .sort(),
      ).toEqual(expected);
    expect(s.list("user_profiles")).toHaveLength(1);
    expect(s.cache.queue.length).toBe(queueCount);
    expect(
      new Set(s.cache.queue.map((p) => p.table + ":" + p.row.id)).size,
    ).toBe(queueCount);
  });

  it("revocar la guía automática sustituye planes y menús existentes por días vacíos sin eliminar históricos", () => {
    const s = seededStore();
    applyGuide(s, answers());
    applyGuide(s, answers({ professionalSupport: "yes" }));
    expect(
      s.list("workout_plans").every((p) => p.data.exerciseIds.length === 0),
    ).toBe(true);
    expect(s.list("meal_plans").every((p) => p.data.meals.length === 0)).toBe(
      true,
    );
    expect(s.list("user_profiles")[0].data.guideBlocked).toBe(true);
    expect(s.list("workout_sessions")).toHaveLength(1);
    expect(s.list("food_logs")).toHaveLength(1);
  });

  it("un fallo de almacenamiento revierte toda la guía y la cola sin emitir ni sincronizar", () => {
    const s = seededStore();
    const before = structuredClone(s.cache);
    const beforeSerialized = localStorage.getItem(s.key);
    const revision = s.revision;
    const sync = vi.spyOn(s, "sync");
    const emit = vi.spyOn(s, "emit");
    const persist = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });
    expect(() => applyGuide(s, answers())).toThrow(/Quota/);
    expect(s.cache).toEqual(before);
    expect(s.revision).toBe(revision);
    expect(localStorage.getItem(s.key)).toBe(beforeSerialized);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(sync).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    expect(api.from).not.toHaveBeenCalled();
  });

  it("una excepción dentro de transaction revierte incluso varias entradas previas y deja utilizable el almacén", () => {
    const s = new FitStore("rollback-owner");
    const before = structuredClone(s.cache);
    const sync = vi.spyOn(s, "sync");
    expect(() =>
      s.transaction(() => {
        s.save("meal_plans", { day: 1, meals: [] });
        s.save("workout_plans", { day: 1, exerciseIds: [] });
        throw new Error("Interrupted guide");
      }),
    ).toThrow("Interrupted guide");
    expect(s.cache).toEqual(before);
    expect(sync).not.toHaveBeenCalled();
    expect(localStorage.getItem(s.key)).toBeNull();
    s.save("food_logs", { amount: 100 }, { local_date: "2026-01-01" });
    expect(s.list("food_logs")).toHaveLength(1);
    expect(sync).toHaveBeenCalledTimes(1);
  });
});

describe("relaciones de la guía", () => {
  it("actualiza hijos de planes y oculta los sobrantes sin alterar registros históricos", () => {
    const s = new FitStore("relations-owner");
    s.save(
      "workout_sessions",
      { title: "Histórico", exercises: [] },
      { local_date: "2026-01-01" },
    );
    s.save(
      "food_logs",
      { name: "Consumo anterior", kcal: 100 },
      { local_date: "2026-01-01" },
    );
    applyGuide(s, answers({ days: [1, 2, 4, 5] }));
    expect(s.list("workout_plan_exercises").length).toBeGreaterThan(0);
    expect(s.list("meal_plan_items").length).toBeGreaterThan(0);
    for (const item of s.list("workout_plan_exercises")) {
      expect(s.list("workout_plans").some((p) => p.id === item.plan_id)).toBe(
        true,
      );
      expect(
        s.list("exercise_catalog").some((e) => e.id === item.exercise_id),
      ).toBe(true);
    }
    applyGuide(s, answers({ equipment: "walking", dietaryCare: "yes" }));
    expect(s.list("workout_plan_exercises")).toHaveLength(0);
    expect(s.list("meal_plan_items")).toHaveLength(0);
    expect(s.list("workout_sessions")).toHaveLength(1);
    expect(s.list("food_logs")).toHaveLength(1);
  });
});
