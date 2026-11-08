import { foods, weeklyMenu, type Food } from "../data/nutrition";
import {
  exercises,
  schedule,
  type Exercise,
  type WorkoutDay,
} from "../data/training";
import { FitStore, seedId, type Row } from "./store";
import { prDate } from "./time";
export const defaultGoals = { kcal: 2100, protein: 170, carbs: 210, fat: 64 };
export function profile(store: FitStore) {
  return (
    store.list("user_profiles")[0]?.data || {
      name: "Pedro",
      startDate: prDate(),
      initialWeightLb: 190,
      unit: "lb",
    }
  );
}
export function goals(store: FitStore) {
  return { ...defaultGoals, ...store.list("user_goals")[0]?.data };
}
export function foodLibrary(store: FitStore): Food[] {
  const custom = store
    .list("food_catalog")
    .map((r) => ({ ...r.data, id: r.data.key || r.id }) as Food);
  return [
    ...foods.filter((f) => !custom.some((c) => c.id === f.id)),
    ...custom,
  ];
}
export function exerciseLibrary(store: FitStore): Exercise[] {
  const overrides = store.list("exercise_catalog");
  return exercises.map((e) => ({
    ...e,
    ...overrides.find((r) => r.data.key === e.id)?.data,
  }));
}
export function planFor(store: FitStore, day: number): WorkoutDay {
  return {
    ...schedule.find((d) => d.day === day)!,
    ...store.list("workout_plans").find((r) => r.data.day === day)?.data,
  };
}
export function menuFor(store: FitStore, day: number) {
  return (
    store.list("meal_plans").find((r) => r.data.day === day)?.data.meals ||
    weeklyMenu.find((d) => d.day === day)?.meals ||
    []
  );
}
export function nutrients(
  food: Pick<Food, "kcal" | "protein" | "carbs" | "fat">,
  amount: number,
) {
  return {
    kcal: (food.kcal * amount) / 100,
    protein: (food.protein * amount) / 100,
    carbs: (food.carbs * amount) / 100,
    fat: (food.fat * amount) / 100,
  };
}
export function sumNutrition(rows: Row[]) {
  return rows.reduce(
    (n, r) => ({
      kcal: n.kcal + (r.data.kcal || 0),
      protein: n.protein + (r.data.protein || 0),
      carbs: n.carbs + (r.data.carbs || 0),
      fat: n.fat + (r.data.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
export function initialize(store: FitStore) {
  if (!store.hydrated) return;
  const ensure = (
    table: "user_profiles" | "user_goals",
    key: string,
    data: Record<string, unknown>,
  ) => {
    const id = seedId(store.userId, key);
    if (!store.list(table).length) store.save(table, data, { id });
  };
  ensure("user_profiles", "profile", {
    name: "Pedro",
    startDate: prDate(),
    initialWeightLb: 190,
    unit: "lb",
  });
  ensure("user_goals", "goals", defaultGoals);
}
