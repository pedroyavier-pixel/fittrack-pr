import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { FitStore, seedId } from "../lib/store";
import {
  profile,
  goals,
  foodLibrary,
  exerciseLibrary,
  planFor,
  menuFor,
  nutrients,
} from "../lib/model";
import type { WorkoutDay, Exercise } from "../data/training";
import type { MealItem } from "../data/nutrition";

type Meal = { name: string; items: MealItem[] };
type ExerciseDraft = Pick<Exercise, "trialLb" | "sets" | "minReps" | "maxReps">;
const days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const mealNames = ["Desayuno", "Almuerzo", "Merienda", "Cena"];
const kgPerLb = 1 / 2.2046226218;
const fromLb = (n: number, unit: string) =>
  Math.round(n * (unit === "kg" ? kgPerLb : 1) * 100) / 100;
const toLb = (n: number, unit: string) => (unit === "kg" ? n / kgPerLb : n);
const positive = (n: number) => Number.isFinite(n) && n > 0;
const validDate = (d: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(d) &&
  !Number.isNaN(Date.parse(d + "T12:00:00-04:00"));

function loadMenu(store: FitStore, day: number): Meal[] {
  const current = menuFor(store, day) as Meal[];
  return mealNames.map((name) => ({
    name,
    items: (current.find((m) => m.name === name)?.items || []).map((i) => ({
      ...i,
    })),
  }));
}
function exerciseDrafts(store: FitStore) {
  return Object.fromEntries(
    exerciseLibrary(store).map((e) => [
      e.id,
      {
        trialLb: e.trialLb,
        sets: e.sets,
        minReps: e.minReps,
        maxReps: e.maxReps,
      },
    ]),
  ) as Record<string, ExerciseDraft>;
}

export function Settings({
  store,
  onClose,
}: {
  store: FitStore;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"profile" | "workout" | "menu">("profile");
  const [p, setP] = useState(() => ({ ...profile(store) }));
  const [g, setG] = useState(() => ({ ...goals(store) }));
  const [day, setDay] = useState(1);
  const [plan, setPlan] = useState<WorkoutDay>(() => ({
    ...planFor(store, 1),
    exerciseIds: [...planFor(store, 1).exerciseIds],
    rope: planFor(store, 1).rope ? { ...planFor(store, 1).rope! } : undefined,
  }));
  const [drafts, setDrafts] = useState(() => exerciseDrafts(store));
  const [menuDay, setMenuDay] = useState(1);
  const [menu, setMenu] = useState<Meal[]>(() => loadMenu(store, 1));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const exLib = exerciseLibrary(store);
  const foodLib = foodLibrary(store);
  const unit = p.unit === "kg" ? "kg" : "lb";
  const touch = () => {
    setMessage("Cambios sin guardar.");
    setError("");
  };
  function runSave(action: () => void, text: string) {
    try {
      action();
      setError("");
      setMessage(
        text +
          " Los cambios están guardados en este dispositivo y se sincronizan con tu cuenta.",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron guardar los cambios. Inténtalo de nuevo.",
      );
      setMessage("");
    }
  }
  function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (
      !p.name?.trim() ||
      !validDate(p.startDate) ||
      !positive(Number(p.initialWeightLb))
    ) {
      setError("Revisa el nombre, la fecha inicial y el peso.");
      return;
    }
    if (
      !(["kcal", "protein", "carbs", "fat"] as const).every((k) =>
        positive(Number(g[k])),
      )
    ) {
      setError("Todos los objetivos deben ser números mayores que cero.");
      return;
    }
    runSave(() => {
      const current = store.list("user_profiles")[0];
      store.save(
        "user_profiles",
        {
          ...current?.data,
          ...p,
          name: p.name.trim(),
          initialWeightLb: Number(p.initialWeightLb),
          unit,
        },
        { id: current?.id || seedId(store.userId, "profile") },
      );
      const currentGoal = store.list("user_goals")[0];
      store.save(
        "user_goals",
        { ...currentGoal?.data, ...g },
        { id: currentGoal?.id || seedId(store.userId, "goals") },
      );
    }, "Perfil y objetivos actualizados.");
  }
  function selectDay(next: number) {
    const saved = planFor(store, next);
    setDay(next);
    setPlan({
      ...saved,
      exerciseIds: [...saved.exerciseIds],
      rope: saved.rope ? { ...saved.rope } : undefined,
    });
    setDrafts(exerciseDrafts(store));
    setMessage("");
    setError("");
  }
  function updateExercise(id: string, key: keyof ExerciseDraft, value: number) {
    setDrafts({ ...drafts, [id]: { ...drafts[id], [key]: value } });
    touch();
  }
  function saveWorkout(e: FormEvent) {
    e.preventDefault();
    if (!plan.title.trim()) {
      setError("Escribe un título para este día.");
      return;
    }
    if (
      !Number.isFinite(plan.walkMinutes) ||
      plan.walkMinutes < 0 ||
      !Number.isFinite(plan.mobilityMinutes || 0) ||
      (plan.mobilityMinutes || 0) < 0
    ) {
      setError("Los minutos deben ser cero o un número positivo.");
      return;
    }
    if (
      plan.rope &&
      (!Number.isInteger(plan.rope.rounds) ||
        plan.rope.rounds < 1 ||
        !positive(plan.rope.work) ||
        !Number.isFinite(plan.rope.rest) ||
        plan.rope.rest < 0)
    ) {
      setError(
        "Revisa los intervalos de cuica: al menos 1 ronda, trabajo mayor que cero y descanso de cero o más.",
      );
      return;
    }
    for (const id of plan.exerciseIds) {
      const d = drafts[id];
      if (
        !d ||
        !Number.isFinite(d.trialLb) ||
        d.trialLb < 0 ||
        !Number.isInteger(d.sets) ||
        d.sets < 1 ||
        d.sets > 20 ||
        !Number.isInteger(d.minReps) ||
        d.minReps < 1 ||
        !Number.isInteger(d.maxReps) ||
        d.maxReps < d.minReps
      ) {
        setError(
          "Revisa las cargas, series (1–20) y los rangos de repeticiones de todos los ejercicios.",
        );
        return;
      }
    }
    runSave(
      () => {
        const catalogIds = new Map<string, string>();
        for (const id of plan.exerciseIds) {
          const exercise = exLib.find((ex) => ex.id === id)!;
          const prior = store
            .list("exercise_catalog")
            .find((r) => r.data.key === id);
          const row = store.save(
            "exercise_catalog",
            { ...exercise, ...prior?.data, ...drafts[id], key: id },
            { id: prior?.id || seedId(store.userId, "exercise:" + id) },
          );
          catalogIds.set(id, row.id);
        }
        const old = store.list("workout_plans").find((r) => r.data.day === day);
        const row = store.save(
          "workout_plans",
          { ...plan, day, title: plan.title.trim() },
          { id: old?.id || seedId(store.userId, "plan:" + day) },
        );
        const keep = new Set<string>();
        plan.exerciseIds.forEach((id, position) => {
          const itemId = seedId(
            store.userId,
            `plan:${day}:exercise:${position}`,
          );
          keep.add(itemId);
          store.save(
            "workout_plan_exercises",
            { key: id, exerciseId: id, position, ...drafts[id] },
            { id: itemId, plan_id: row.id, exercise_id: catalogIds.get(id) },
          );
        });
        for (const previous of store
          .list("workout_plan_exercises")
          .filter((item) => item.plan_id === row.id))
          if (!keep.has(previous.id))
            store.remove("workout_plan_exercises", previous);
      },
      "Programa del " + days[day].toLowerCase() + " actualizado.",
    );
  }
  function updateItem(
    mealIndex: number,
    itemIndex: number,
    patch: Partial<MealItem>,
  ) {
    setMenu(
      menu.map((m, mi) =>
        mi !== mealIndex
          ? m
          : {
              ...m,
              items: m.items.map((item, ii) =>
                ii === itemIndex ? { ...item, ...patch } : item,
              ),
            },
      ),
    );
    touch();
  }
  function saveMenu(e: FormEvent) {
    e.preventDefault();
    if (
      menu.some((m) =>
        m.items.some(
          (item) =>
            !foodLib.some((f) => f.id === item.foodId) ||
            !positive(item.amount) ||
            item.amount > 10000,
        ),
      )
    ) {
      setError(
        "Cada ingrediente necesita un alimento válido y una cantidad entre 0 y 10,000.",
      );
      return;
    }
    runSave(
      () => {
        const catalogIds = new Map<string, string>();
        for (const item of menu.flatMap((m) => m.items)) {
          if (catalogIds.has(item.foodId)) continue;
          const food = foodLib.find((f) => f.id === item.foodId)!;
          let row = store
            .list("food_catalog")
            .find((r) => r.data.key === food.id);
          if (!row)
            row = store.save(
              "food_catalog",
              { ...food, key: food.id },
              { id: seedId(store.userId, "food:" + food.id) },
            );
          catalogIds.set(food.id, row.id);
        }
        const prior = store
          .list("meal_plans")
          .find((r) => r.data.day === menuDay);
        const row = store.save(
          "meal_plans",
          {
            day: menuDay,
            meals: menu.map((m) => ({
              ...m,
              items: m.items.map((item) => ({ ...item })),
            })),
          },
          { id: prior?.id || seedId(store.userId, "menu:" + menuDay) },
        );
        const keep = new Set<string>();
        menu.forEach((meal, mi) =>
          meal.items.forEach((item, position) => {
            const id = seedId(
              store.userId,
              `menu:${menuDay}:meal:${mi}:item:${position}`,
            );
            keep.add(id);
            store.save(
              "meal_plan_items",
              { ...item, meal: meal.name, position },
              {
                id,
                meal_plan_id: row.id,
                food_id: catalogIds.get(item.foodId),
              },
            );
          }),
        );
        for (const old of store
          .list("meal_plan_items")
          .filter((item) => item.meal_plan_id === row.id))
          if (!keep.has(old.id)) store.remove("meal_plan_items", old);
      },
      "Menú del " + days[menuDay].toLowerCase() + " actualizado.",
    );
  }
  const totals = menu
    .flatMap((m) => m.items)
    .reduce(
      (sum, item) => {
        const food = foodLib.find((f) => f.id === item.foodId);
        const n = food
          ? nutrients(food, item.amount)
          : { kcal: 0, protein: 0, carbs: 0, fat: 0 };
        return {
          kcal: sum.kcal + n.kcal,
          protein: sum.protein + n.protein,
          carbs: sum.carbs + n.carbs,
          fat: sum.fat + n.fat,
        };
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  return (
    <section className="stack settings-page">
      <div className="section-title">
        <div>
          <p className="eyebrow">A TU MEDIDA</p>
          <h1>Ajustes</h1>
          <p className="muted">Tu programa, tus porciones y tus referencias.</p>
        </div>
        <button type="button" className="btn ghost" onClick={onClose}>
          <ArrowLeft size={17} />
          Volver
        </button>
      </div>
      <div className="tabs" aria-label="Secciones de ajustes">
        {(
          [
            ["profile", "Perfil y objetivos"],
            ["workout", "Entrenamiento"],
            ["menu", "Menú semanal"],
          ] as const
        ).map(([key, label]) => (
          <button
            type="button"
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => {
              setTab(key);
              setMessage("");
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p className="danger" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {tab === "profile" && (
        <form className="stack" onSubmit={saveProfile}>
          <div className="card stack">
            <h2>Tu perfil</h2>
            <div className="grid2">
              <label className="field">
                Nombre
                <input
                  required
                  maxLength={80}
                  value={p.name || ""}
                  onChange={(e) => {
                    setP({ ...p, name: e.target.value });
                    touch();
                  }}
                />
              </label>
              <label className="field">
                Comienzo del programa
                <input
                  required
                  type="date"
                  value={p.startDate || ""}
                  onChange={(e) => {
                    setP({ ...p, startDate: e.target.value });
                    touch();
                  }}
                />
              </label>
              <label className="field">
                Unidad de peso
                <select
                  value={unit}
                  onChange={(e) => {
                    setP({ ...p, unit: e.target.value });
                    touch();
                  }}
                >
                  <option value="lb">Libras (lb)</option>
                  <option value="kg">Kilogramos (kg)</option>
                </select>
              </label>
              <label className="field">
                Peso inicial ({unit})
                <input
                  required
                  type="number"
                  min="0.1"
                  step="any"
                  value={fromLb(Number(p.initialWeightLb), unit)}
                  onChange={(e) => {
                    setP({
                      ...p,
                      initialWeightLb: toLb(Number(e.target.value), unit),
                    });
                    touch();
                  }}
                />
              </label>
            </div>
            <p className="muted small">
              Programa inicial: 24 semanas. Las fechas de registro usan
              America/Puerto_Rico.
            </p>
          </div>
          <div className="card stack">
            <h2>Objetivos diarios</h2>
            <p className="muted">
              La ingesta inicial es una referencia de prueba. Ajusta según el
              seguimiento de varias semanas.
            </p>
            <div className="grid2">
              {(["kcal", "protein", "carbs", "fat"] as const).map(
                (key, index) => (
                  <label className="field" key={key}>
                    {
                      [
                        "Calorías (kcal)",
                        "Proteína (g)",
                        "Carbohidratos (g)",
                        "Grasas (g)",
                      ][index]
                    }
                    <input
                      required
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={g[key]}
                      onChange={(e) => {
                        setG({ ...g, [key]: Number(e.target.value) });
                        touch();
                      }}
                    />
                  </label>
                ),
              )}
            </div>
            <p className="muted small">
              Tus macros equivalen aproximadamente a{" "}
              {Math.round(
                g.protein * 4 + g.carbs * 4 + g.fat * 9,
              ).toLocaleString("es-PR")}{" "}
              kcal. El objetivo calórico se configura por separado. La actividad
              física no descuenta calorías del objetivo.
            </p>
          </div>
          <button type="submit" className="btn primary">
            <Save size={18} />
            Guardar perfil y objetivos
          </button>
        </form>
      )}
      {tab === "workout" && (
        <form className="stack" onSubmit={saveWorkout}>
          <div className="card stack">
            <div className="grid2">
              <label className="field">
                Día del programa
                <select
                  value={day}
                  onChange={(e) => selectDay(Number(e.target.value))}
                >
                  {days.map((name, index) => (
                    <option key={name} value={index}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Título
                <input
                  required
                  value={plan.title}
                  onChange={(e) => {
                    setPlan({ ...plan, title: e.target.value });
                    touch();
                  }}
                />
              </label>
              <label className="field">
                Actividad
                <select
                  value={plan.type}
                  onChange={(e) => {
                    setPlan({
                      ...plan,
                      type: e.target.value as WorkoutDay["type"],
                    });
                    touch();
                  }}
                >
                  <option value="strength">Fuerza</option>
                  <option value="recovery">Recuperación activa</option>
                  <option value="cardio">Cardio</option>
                  <option value="rest">Descanso</option>
                </select>
              </label>
              <label className="field">
                Caminata (minutos)
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={plan.walkMinutes}
                  onChange={(e) => {
                    setPlan({ ...plan, walkMinutes: Number(e.target.value) });
                    touch();
                  }}
                />
              </label>
              <label className="field">
                Movilidad (minutos)
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={plan.mobilityMinutes || 0}
                  onChange={(e) => {
                    setPlan({
                      ...plan,
                      mobilityMinutes: Number(e.target.value),
                    });
                    touch();
                  }}
                />
              </label>
            </div>
            <label className="row">
              <input
                type="checkbox"
                checked={!!plan.rope}
                onChange={(e) => {
                  setPlan({
                    ...plan,
                    rope: e.target.checked
                      ? { rounds: 5, work: 20, rest: 60 }
                      : undefined,
                  });
                  touch();
                }}
              />
              Incluir cuica
            </label>
            {plan.rope && (
              <div className="grid2">
                {(["rounds", "work", "rest"] as const).map((key, i) => (
                  <label key={key} className="field">
                    {
                      [
                        "Intervalos",
                        "Trabajo por intervalo (segundos)",
                        "Descanso entre intervalos (segundos)",
                      ][i]
                    }
                    <input
                      type="number"
                      min={key === "rest" ? 0 : 1}
                      step={1}
                      value={plan.rope![key]}
                      onChange={(e) => {
                        setPlan({
                          ...plan,
                          rope: {
                            ...plan.rope!,
                            [key]: Number(e.target.value),
                          },
                        });
                        touch();
                      }}
                    />
                  </label>
                ))}
              </div>
            )}
            {plan.type !== "strength" && (
              <p className="muted small">
                Los días de recuperación, cardio y descanso no muestran una
                rutina de fuerza obligatoria. Los ejercicios seleccionados se
                conservan para poder reutilizarlos si cambias la actividad.
              </p>
            )}
          </div>
          <div className="section-title">
            <h2>Ejercicios y cargas habituales</h2>
            <span className="badge">{plan.exerciseIds.length} ejercicios</span>
          </div>
          <p className="muted small">
            Introduce cargas que ya conozcas o conserva las pruebas
            provisionales. Estas referencias son opcionales y editables; no
            obligan a aumentar peso. La calibración de cada ejercicio se aplica
            a tus próximos entrenamientos.
          </p>
          {plan.exerciseIds.map((id, index) => {
            const ex = exLib.find((e) => e.id === id);
            const d = drafts[id];
            if (!ex || !d) return null;
            return (
              <div className="card stack" key={id}>
                <div className="section-title">
                  <h3>
                    {String(index + 1).padStart(2, "0")} · {ex.name}
                  </h3>
                  <button
                    type="button"
                    className="btn ghost"
                    aria-label={"Quitar " + ex.name}
                    onClick={() => {
                      setPlan({
                        ...plan,
                        exerciseIds: plan.exerciseIds.filter(
                          (_, i) => i !== index,
                        ),
                      });
                      touch();
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <label className="field">
                  Sustituir ejercicio
                  <select
                    value={id}
                    onChange={(e) => {
                      setPlan({
                        ...plan,
                        exerciseIds: plan.exerciseIds.map((old, i) =>
                          i === index ? e.target.value : old,
                        ),
                      });
                      touch();
                    }}
                  >
                    {exLib
                      .filter(
                        (e) => e.id === id || !plan.exerciseIds.includes(e.id),
                      )
                      .map((e) => (
                        <option value={e.id} key={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="grid2">
                  <label className="field">
                    {ex.bodyweight
                      ? "Carga externa o asistencia de referencia"
                      : "Carga de referencia"}{" "}
                    ({unit})
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={fromLb(d.trialLb, unit)}
                      onChange={(e) =>
                        updateExercise(
                          id,
                          "trialLb",
                          toLb(Number(e.target.value), unit),
                        )
                      }
                    />
                  </label>
                  <label className="field">
                    Series
                    <input
                      type="number"
                      min={1}
                      max={20}
                      step={1}
                      value={d.sets}
                      onChange={(e) =>
                        updateExercise(id, "sets", Number(e.target.value))
                      }
                    />
                  </label>
                  <label className="field">
                    Repeticiones mínimas{ex.unilateral ? " por lado" : ""}
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={d.minReps}
                      onChange={(e) =>
                        updateExercise(id, "minReps", Number(e.target.value))
                      }
                    />
                  </label>
                  <label className="field">
                    Repeticiones máximas
                    <input
                      type="number"
                      min={d.minReps || 1}
                      step={1}
                      value={d.maxReps}
                      onChange={(e) =>
                        updateExercise(id, "maxReps", Number(e.target.value))
                      }
                    />
                  </label>
                </div>
                <p className="muted small">{ex.weightNote}</p>
              </div>
            );
          })}
          <button
            type="button"
            className="btn ghost"
            disabled={plan.exerciseIds.length >= exLib.length}
            onClick={() => {
              const next = exLib.find((e) => !plan.exerciseIds.includes(e.id));
              if (next) {
                setPlan({
                  ...plan,
                  exerciseIds: [...plan.exerciseIds, next.id],
                });
                touch();
              }
            }}
          >
            <Plus size={17} />
            Añadir ejercicio
          </button>
          <p className="muted small">
            Los cambios actualizan el programa para nuevas sesiones. Los
            entrenamientos ya registrados conservan su rutina, series y cargas.
          </p>
          <button type="submit" className="btn primary">
            <Save size={18} />
            Guardar programa del {days[day].toLowerCase()}
          </button>
        </form>
      )}
      {tab === "menu" && (
        <form className="stack" onSubmit={saveMenu}>
          <div className="card stack">
            <label className="field">
              Día del menú
              <select
                value={menuDay}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setMenuDay(next);
                  setMenu(loadMenu(store, next));
                  setMessage("");
                  setError("");
                }}
              >
                {days.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <span className="badge">
                Plan: {Math.round(totals.kcal).toLocaleString("es-PR")} kcal
              </span>
              <span className="badge">P {Math.round(totals.protein)} g</span>
              <span className="badge">C {Math.round(totals.carbs)} g</span>
              <span className="badge">G {Math.round(totals.fat)} g</span>
            </div>
            <p className="muted small">
              Totales calculados ingrediente por ingrediente. Esto es lo
              planificado; se contabiliza al confirmar lo que consumas. Incluye
              también el aceite, la leche, la mantequilla y las salsas que
              utilices.
            </p>
          </div>
          {menu.map((meal, mi) => (
            <div className="card stack" key={meal.name}>
              <h2>{meal.name}</h2>
              {meal.items.map((item, ii) => {
                const food = foodLib.find((f) => f.id === item.foodId);
                return (
                  <div
                    className="stack"
                    key={`${mi}:${ii}`}
                    style={{
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border, #28343f)",
                    }}
                  >
                    <div className="grid2">
                      <label className="field">
                        Alimento
                        <select
                          value={item.foodId}
                          onChange={(e) =>
                            updateItem(mi, ii, {
                              foodId: e.target.value,
                              coffee:
                                item.coffee &&
                                ["milk", "espresso"].includes(e.target.value)
                                  ? true
                                  : undefined,
                            })
                          }
                        >
                          {foodLib.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} · {f.state}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        Cantidad planificada ({food?.unit || "g"})
                        <input
                          required
                          type="number"
                          min="0.1"
                          max={10000}
                          step="0.1"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(mi, ii, {
                              amount: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                    </div>
                    <div className="row">
                      <span className="muted small">
                        {food
                          ? Math.round(nutrients(food, item.amount).kcal)
                          : 0}{" "}
                        kcal{item.coffee ? " · café diario" : ""}
                      </span>
                      {food?.source.startsWith("https://") ? (
                        <a
                          className="btn ghost"
                          href={food.source}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink size={14} />
                          Fuente
                        </a>
                      ) : (
                        <span className="muted small">{food?.source}</span>
                      )}
                      <button
                        type="button"
                        className="btn ghost"
                        aria-label={
                          "Quitar " +
                          (food?.name || "ingrediente") +
                          " de " +
                          meal.name
                        }
                        onClick={() => {
                          setMenu(
                            menu.map((m, i) =>
                              i === mi
                                ? {
                                    ...m,
                                    items: m.items.filter((_, j) => j !== ii),
                                  }
                                : m,
                            ),
                          );
                          touch();
                        }}
                      >
                        <Trash2 size={16} />
                        Quitar
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  if (foodLib[0]) {
                    setMenu(
                      menu.map((m, i) =>
                        i === mi
                          ? {
                              ...m,
                              items: [
                                ...m.items,
                                { foodId: foodLib[0].id, amount: 100 },
                              ],
                            }
                          : m,
                      ),
                    );
                    touch();
                  }
                }}
              >
                <Plus size={16} />
                Añadir ingrediente a {meal.name.toLowerCase()}
              </button>
            </div>
          ))}
          <p className="muted small">
            Los alimentos personalizados y las etiquetas se editan en Comidas →
            Alimentos. Las porciones realmente consumidas se guardan aparte y no
            cambian al editar este menú.
          </p>
          <button type="submit" className="btn primary">
            <Check size={18} />
            Guardar menú del {days[menuDay].toLowerCase()}
          </button>
        </form>
      )}
    </section>
  );
}
