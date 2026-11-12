import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Coffee,
  Plus,
  Check,
  Star,
  Utensils,
  Bookmark,
  Search,
  Repeat2,
  ExternalLink,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { FitStore, seedId, type Row } from "../lib/store";
import {
  foodLibrary,
  menuFor,
  nutrients,
  sumNutrition,
  goals,
} from "../lib/model";
import { weekday, dateLabel } from "../lib/time";
import { mealSuggestionGuidance } from "../data/mealSuggestions";
import { starterRecipes, type Food, type MealItem } from "../data/nutrition";
import { RecipeAssistant, safeNutritionFilterFor } from "./RecipeAssistant";
export function NutritionBars({
  store,
  date,
  compact = false,
}: {
  store: FitStore;
  date: string;
  compact?: boolean;
}) {
  const n = sumNutrition(store.list("food_logs", date));
  const g = goals(store);
  if (g.trackingEnabled === false)
    return (
      <section className="card nutrition-panel">
        <div className="section-title">
          <span className="eyebrow">CONSUMO REGISTRADO</span>
          <span className="badge">Sin objetivo numérico</span>
        </div>
        <div className="calorie-value">
          <strong>{Math.round(n.kcal).toLocaleString("es-PR")}</strong>
          <span>kcal registradas</span>
        </div>
        <div className="macros">
          {(["protein", "carbs", "fat"] as const).map((key, i) => (
            <div className="macro" key={key}>
              <span>{["Proteína", "Carbohidratos", "Grasas"][i]}</span>
              <b>{Math.round(n[key])} g</b>
            </div>
          ))}
        </div>
        <p className="muted small">
          Un registro de lo consumido, sin dieta ni calorías asignadas. Puedes
          configurar tus propias referencias en Ajustes.
        </p>
      </section>
    );
  const percent = (n.kcal / g.kcal) * 100;
  return (
    <section className={`card nutrition-panel ${compact ? "compact" : ""}`}>
      <div className="section-title">
        <span className="eyebrow">NUTRICIÓN DE HOY</span>
        <span className="badge">{Math.round(percent)} % del objetivo</span>
      </div>
      <div className="calorie-value">
        <strong>{Math.round(n.kcal).toLocaleString("es-PR")}</strong>
        <span>/ {g.kcal.toLocaleString("es-PR")} kcal</span>
      </div>
      <div
        className={`progress-bar ${percent > 100 ? "over" : percent > 90 ? "near" : ""}`}
        role="progressbar"
        aria-label="Calorías consumidas"
        aria-valuenow={Math.round(n.kcal)}
        aria-valuemin={0}
        aria-valuemax={Math.max(g.kcal, n.kcal)}
      >
        <span style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <div className="calorie-foot">
        <span>
          {n.kcal <= g.kcal ? (
            <>
              <b>{Math.round(g.kcal - n.kcal)}</b> kcal disponibles
            </>
          ) : (
            <>
              <b>{Math.round(n.kcal - g.kcal)}</b> kcal sobre tu referencia
            </>
          )}
        </span>
        <span>Meta inicial ajustable</span>
      </div>
      <div className="macros">
        {(["protein", "carbs", "fat"] as const).map((key, i) => (
          <div key={key} className={"macro macro-" + i}>
            <div>
              <span>{["Proteína", "Carbohidratos", "Grasas"][i]}</span>
              <b>
                {Math.round(n[key])}
                <small> / {g[key]} g</small>
              </b>
            </div>
            <div className="progress-bar">
              <span
                style={{ width: `${Math.min((n[key] / g[key]) * 100, 100)}%` }}
              />
            </div>
            <small>
              {Math.max(0, Math.round(g[key] - n[key]))} g disponibles
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}
function loggedData(
  food: Food,
  amount: number,
  meal: string,
  extra: Record<string, unknown> = {},
) {
  return {
    ...extra,
    name: food.name,
    foodId: food.id,
    amount,
    unit: food.unit,
    meal,
    state: food.state,
    source: food.source,
    per100: {
      kcal: food.kcal,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    },
    ...nutrients(food, amount),
  };
}
export function logFood(
  store: FitStore,
  food: Food,
  amount: number,
  meal: string,
  date: string,
  extra: Record<string, unknown> = {},
  id?: string,
) {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000)
    throw new Error("Introduce una cantidad entre 0 y 10,000.");
  return store.save(
    "food_logs",
    loggedData(food, amount, meal, { ...extra, goalSnapshot: goals(store) }),
    { id, local_date: date },
  );
}
export function CoffeeCard({ store, date }: { store: FitStore; date: string }) {
  const coffeePlan = (
    menuFor(store, weekday(date)) as { name: string; items: MealItem[] }[]
  )
    .flatMap((m) => m.items)
    .filter((i) => i.coffee);
  const plannedMilk =
    coffeePlan.find((i) => i.foodId === "milk")?.amount || 118;
  const plannedEspresso =
    coffeePlan.find((i) => i.foodId === "espresso")?.amount || 30;
  const [milk, setMilk] = useState(plannedMilk);
  const [draftDate, setDraftDate] = useState<string>();
  const saving = useRef(false);
  useEffect(() => {
    if (!draftDate) setMilk(plannedMilk);
  }, [date, plannedMilk, draftDate]);
  const lib = foodLibrary(store);
  const cups = store
    .list("food_logs", date)
    .filter((r) => r.data.coffee && r.data.foodId === "milk").length;
  const total =
    nutrients(lib.find((f) => f.id === "milk")!, milk).kcal +
    nutrients(lib.find((f) => f.id === "espresso")!, plannedEspresso).kcal;
  function add() {
    if (saving.current) return;
    saving.current = true;
    try {
      const d = draftDate || date;
      const batch = crypto.randomUUID();
      for (const [id, amount] of [
        ["milk", milk],
        ["espresso", plannedEspresso],
      ] as const) {
        const food = lib.find((f) => f.id === id)!;
        logFood(
          store,
          food,
          amount,
          "Desayuno",
          d,
          { coffee: true, batchId: batch },
          seedId(store.userId, batch + id),
        );
      }
      setDraftDate(undefined);
    } finally {
      saving.current = false;
    }
  }
  if (
    store.list("user_profiles")[0]?.data.personalization &&
    !coffeePlan.length
  )
    return null;
  if (!safeNutritionFilterFor(store)("milk") || !safeNutritionFilterFor(store)("espresso")) return null;
  return (
    <div className="coffee-card">
      <span className="coffee-icon">
        <Coffee size={24} />
      </span>
      <div className="coffee-copy">
        <strong>Tu café de todos los días</strong>
        <span>Espresso + leche entera · sin azúcar</span>
        <small>Leche genérica provisional; ajusta con tu etiqueta.</small>
      </div>
      <label className="coffee-amount">
        <input
          aria-label="Leche del café en mililitros"
          type="number"
          min={1}
          max={1000}
          value={milk}
          onChange={(e) => {
            setMilk(Number(e.target.value));
            setDraftDate(draftDate || date);
          }}
        />{" "}
        ml
      </label>
      <button
        className="btn coffee-btn"
        onClick={add}
        disabled={!milk || milk < 1}
      >
        {cups ? "Tomé otro café" : "Registrar mi café"}
        <Plus size={16} />
      </button>
      <span className="coffee-info">
        {Math.round(total)} kcal por taza
        {cups > 0
          ? ` · ${cups} ${cups === 1 ? "registrado" : "registrados"}`
          : ""}
        {draftDate && draftDate !== date
          ? ` · se guardará en ${draftDate}`
          : ""}
      </span>
    </div>
  );
}
function PlannedItem({
  store,
  date,
  meal,
  item,
  index,
}: {
  store: FitStore;
  date: string;
  meal: string;
  item: MealItem;
  index: number;
}) {
  const lib = foodLibrary(store);
  const liveFood = lib.find((f) => f.id === item.foodId);
  const [draft, setDraft] = useState<
    { date: string; food: Food; key: string } | undefined
  >();
  const activeDate = draft?.date || date;
  const food = draft?.food || liveFood;
  const key = draft?.key || `${date}:${meal}:${index}:${item.foodId}`;
  const id = seedId(store.userId, key);
  const logged = store.list("food_logs", activeDate).find((r) => r.id === id);
  const [amount, setAmount] = useState(logged?.data.amount ?? item.amount);
  useEffect(() => {
    if (!draft) setAmount(logged?.data.amount ?? item.amount);
  }, [date, item.amount, item.foodId, logged?.data.amount, draft]);
  if (!food) return null;
  const n = nutrients(food, amount);
  return (
    <div className={`food-row ${logged ? "is-logged" : ""}`}>
      <div className="food-name">
        <strong>{food.name}</strong>
        <span>
          {food.state} · plan {item.amount} {food.unit}
        </span>
        <small>
          {Math.round(n.kcal)} kcal · P {Math.round(n.protein)} g
          {logged ? " · registrado" : ""}
        </small>
      </div>
      <div className="food-controls">
        <label>
          <input
            aria-label={`${food.name} cantidad real`}
            type="number"
            min="0.1"
            max="10000"
            step="0.1"
            value={amount}
            onChange={(e) => {
              setAmount(Number(e.target.value));
              if (!draft) setDraft({ date, food: { ...food }, key });
            }}
          />
          <span>{food.unit}</span>
        </label>
        <button
          className={`icon-btn ${logged ? "done" : ""}`}
          aria-label={`${logged ? "Actualizar" : "Registrar"} ${food.name}`}
          disabled={!amount || amount <= 0}
          onClick={() => {
            logFood(
              store,
              food,
              amount,
              meal,
              activeDate,
              { planKey: key },
              id,
            );
            setDraft(undefined);
          }}
        >
          <Check size={18} />
        </button>
      </div>
      {draft && draft.date !== date && (
        <small className="date-warning">Se guardará en {draft.date}</small>
      )}
    </div>
  );
}
export function Meals({
  store,
  date,
  preview = false,
}: {
  store: FitStore;
  date: string;
  preview?: boolean;
}) {
  const [view, setView] = useState<"plan" | "library" | "recipes" | "assistant">("plan");
  const [, refreshPreferences] = useState(0);
  const lib = foodLibrary(store);
  const configured=!!(store.list("user_profiles")[0]?.data.personalization || store.list("user_profiles")[0]?.data.nutritionPreferences);
  const permitted=safeNutritionFilterFor(store);
  const originalMeals = menuFor(store, weekday(date)) as {name:string;items:MealItem[]}[];
  const meals=originalMeals.map(meal=>({...meal,items:meal.items.filter(item=>lib.some(food=>food.id===item.foodId)&&(!configured||permitted(item.foodId)))}));
  const hiddenIngredients=originalMeals.reduce((sum,meal)=>sum+meal.items.length,0)-meals.reduce((sum,meal)=>sum+meal.items.length,0);
  const planTotal = meals.reduce(
    (sum, m) =>
      sum +
      m.items.reduce(
        (n, i) =>
          n + nutrients(lib.find((f) => f.id === i.foodId)!, i.amount).kcal,
        0,
      ),
    0,
  );
  function logMeal(meal: { name: string; items: MealItem[] }) {
    for (const [i, item] of meal.items.entries()) {
      if (item.coffee) continue;
      const id = seedId(
        store.userId,
        `${date}:${meal.name}:${i}:${item.foodId}`,
      );
      if (!store.list("food_logs", date).some((r) => r.id === id))
        logFood(
          store,
          lib.find((f) => f.id === item.foodId)!,
          item.amount,
          meal.name,
          date,
          { planKey: `${date}:${meal.name}:${i}:${item.foodId}` },
          id,
        );
    }
  }
  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <span className="eyebrow">ALIMENTACIÓN FLEXIBLE</span>
          <h2>
            {preview ? "Lo que puedes comer hoy" : "Comidas, a tu medida."}
          </h2>
        </div>
        <span className="badge">
          Plan · {Math.round(planTotal).toLocaleString("es-PR")} kcal
        </span>
      </div>
      {!preview && (
        <div className="tabs">
          <button
            className={view === "plan" ? "active" : ""}
            onClick={() => setView("plan")}
          >
            Mi menú
          </button>
          <button
            className={view === "library" ? "active" : ""}
            onClick={() => setView("library")}
          >
            Alimentos
          </button>
          <button
            className={view === "recipes" ? "active" : ""}
            onClick={() => setView("recipes")}
          >
            Recetas y frecuentes
          </button>
          <button className={view === "assistant" ? "active" : ""} onClick={()=>setView("assistant")}>Cocina PR</button>
        </div>
      )}
      {view === "plan" ? (
        <>
          {store.list("user_profiles")[0]?.data.personalization && (
            <section className="notice">
              <strong>Menú sugerido, no una dieta.</strong>{" "}
              {mealSuggestionGuidance.description}
              <br />
              {mealSuggestionGuidance.exclusions}
              {store.list("user_profiles")[0]?.data.personalization
                ?.preference === "plant" && (
                <p>{mealSuggestionGuidance.limitations}</p>
              )}
              {!meals.length && (
                <p>
                  No se genera menú automático cuando has indicado que necesitas
                  orientación profesional. Puedes registrar lo que consumes.
                </p>
              )}
            </section>
          )}
          {hiddenIngredients>0&&<p className="notice">Se omitieron {hiddenIngredients} ingredientes del menú actual por tus filtros o porque requieren revisión. Ajusta tus recetas en Cocina PR. El historial permanece intacto.</p>}
          <CoffeeCard store={store} date={date} />
          <div className={preview ? "meal-grid" : "meal-grid full"}>
            {meals.map((meal, mi) => {
              const items = meal.items.filter((i) => !i.coffee);
              const kc = items.reduce(
                (n, i) =>
                  n +
                  nutrients(lib.find((f) => f.id === i.foodId)!, i.amount).kcal,
                0,
              );
              return (
                <article className="card meal-card" key={meal.name}>
                  <div className="section-title">
                    <div className="row">
                      <span className="meal-number">0{mi + 1}</span>
                      <h3>{meal.name}</h3>
                    </div>
                    <span className="muted">{Math.round(kc)} kcal</span>
                  </div>
                  {preview ? (
                    <>
                      <p className="meal-preview">
                        {items
                          .filter(
                            (i) =>
                              !["oil", "tomato", "butter", "milk"].includes(
                                i.foodId,
                              ),
                          )
                          .map((i) => lib.find((f) => f.id === i.foodId)?.name)
                          .join(" · ")}
                      </p>
                      <button
                        className="btn ghost"
                        onClick={() => logMeal(meal)}
                      >
                        Registrar porciones planificadas
                        <Plus size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      {meal.items.map((item, i) =>
                        item.coffee ? null : (
                          <PlannedItem
                            store={store}
                            date={date}
                            meal={meal.name}
                            item={item}
                            index={i}
                            key={`${meal.name}:${i}`}
                          />
                        ),
                      )}
                      <div className="meal-actions">
                        <button
                          className="btn ghost"
                          onClick={() => logMeal(meal)}
                        >
                          <Check size={16} />
                          Registrar pendientes
                        </button>
                        <button
                          className="icon-btn"
                          title="Guardar como comida frecuente"
                          aria-label={`Guardar ${meal.name} como frecuente`}
                          onClick={() =>
                            store.save("recipes", {
                              name: `${meal.name} · ${dateLabel(date)}`,
                              items: meal.items,
                            })
                          }
                        >
                          <Bookmark size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
          <p className="muted small">
            El menú es una sugerencia: sólo lo confirmado suma al consumo. Pesa
            cada alimento en el estado indicado. Los aceites y salsas se
            registran por separado.
          </p>
          {!preview && (
            <>
              <QuickAdd store={store} date={date} />
              <Consumed store={store} date={date} />
            </>
          )}
        </>
      ) : view === "library" ? (
        <FoodLibrary store={store} />
      ) : view === "recipes" ? (
        <Recipes store={store} date={date} />
      ) : (
        <RecipeAssistant store={store} date={date} onPreferencesSaved={()=>refreshPreferences(value=>value+1)} onLog={(recipe,recordDate,batchId)=>{
          const currentLib=foodLibrary(store);
          const allowed=safeNutritionFilterFor(store);
          for(const item of recipe.items) if(!allowed(item.foodId)||!currentLib.some(food=>food.id===item.foodId)||!Number.isFinite(item.amount)||item.amount<=0||item.amount>10000) throw new Error("Revisa ingredientes, cantidades y filtros antes de registrar.");
          store.transaction(()=>recipe.items.forEach((item,index)=>logFood(store,currentLib.find(food=>food.id===item.foodId)!,item.amount,recipe.meal,recordDate,{recipeName:recipe.name,sourceRecipe:recipe.id,batchId},seedId(store.userId,`${batchId}:${index}:${item.foodId}`))));
        }}/>
      )}
    </div>
  );
}
function QuickAdd({ store, date }: { store: FitStore; date: string }) {
  const lib = foodLibrary(store);
  const [id, setId] = useState(lib[0].id);
  const [amount, setAmount] = useState(100);
  const [meal, setMeal] = useState("Merienda");
  const [draftDate, setDraftDate] = useState<string>();
  const [msg, setMsg] = useState("");
  const f = lib.find((x) => x.id === id)!;
  return (
    <section className="card">
      <h3>
        <Plus size={18} /> Algo fuera del menú
      </h3>
      <form
        className="quick-add"
        onSubmit={(e) => {
          e.preventDefault();
          logFood(store, f, amount, meal, draftDate || date);
          setDraftDate(undefined);
          setMsg("Alimento registrado.");
        }}
      >
        <label className="field">
          Alimento
          <select
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setDraftDate(draftDate || date);
            }}
          >
            {lib.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Cantidad ({f.unit})
          <input
            type="number"
            min="0.1"
            max="10000"
            step="0.1"
            required
            value={amount}
            onChange={(e) => {
              setAmount(Number(e.target.value));
              setDraftDate(draftDate || date);
            }}
          />
        </label>
        <label className="field">
          Momento
          <select value={meal} onChange={(e) => setMeal(e.target.value)}>
            {["Desayuno", "Almuerzo", "Merienda", "Cena"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <button className="btn primary" type="submit">
          Registrar · {Math.round(nutrients(f, amount).kcal)} kcal
        </button>
      </form>
      {draftDate && draftDate !== date && (
        <p className="notice">Este registro se guardará en {draftDate}.</p>
      )}
      {msg && (
        <p role="status" className="muted small">
          {msg}
        </p>
      )}
    </section>
  );
}
export function Consumed({ store, date }: { store: FitStore; date: string }) {
  const rows = store.list("food_logs", date);
  return (
    <section className="card">
      <div className="section-title">
        <h3>Lo que sí consumiste</h3>
        <span className="badge">{rows.length} ingredientes</span>
      </div>
      {!rows.length ? (
        <p className="empty">
          Todavía no has registrado alimentos para esta fecha.
        </p>
      ) : (
        rows.map((r) => (
          <div className="consumed-row" key={r.id}>
            <div>
              <strong>{r.data.name}</strong>
              <span>
                {r.data.meal} · {r.data.amount} {r.data.unit} ·{" "}
                {Math.round(r.data.kcal)} kcal
              </span>
            </div>
            <button
              className="icon-btn"
              aria-label={`Eliminar registro de ${r.data.name}`}
              onClick={() => {
                if (confirm("¿Eliminar este consumo del historial?"))
                  store.remove("food_logs", r);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))
      )}
    </section>
  );
}
function FoodLibrary({ store }: { store: FitStore }) {
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<Food>();
  const [open, setOpen] = useState(false);
  const lib = foodLibrary(store);
  const favorites = store.list("user_profiles")[0]?.data.favorites || [];
  function favorite(id: string) {
    const p = store.list("user_profiles")[0];
    store.save(
      "user_profiles",
      {
        ...p?.data,
        favorites: favorites.includes(id) ? favorites.filter((f:string)=>f!==id) : [...favorites,id],
        ...(p?.data.personalization ? {personalization:{...p.data.personalization,favoriteIngredients:favorites.includes(id)?favorites.filter((f:string)=>f!==id):[...favorites,id]}} : {}),
        ...(p?.data.nutritionPreferences ? {nutritionPreferences:{...p.data.nutritionPreferences,favoriteIngredients:favorites.includes(id)?favorites.filter((f:string)=>f!==id):[...favorites,id]}} : {}),
      },
      { id: p?.id || seedId(store.userId, "profile") },
    );
  }
  return (
    <div className="stack">
      <div className="row">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Buscar alimento"
            placeholder="Buscar en tus alimentos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button
          className="btn primary"
          onClick={() => {
            setEdit(undefined);
            setOpen(true);
          }}
        >
          <Plus size={16} />
          Nuevo
        </button>
      </div>
      {open && (
        <FoodForm
          key={edit?.id || "new"}
          food={edit}
          onCancel={() => setOpen(false)}
          onSave={(f) => {
            const key = edit?.id || crypto.randomUUID();
            store.save(
              "food_catalog",
              { ...f, key },
              { id: seedId(store.userId, "food:" + key) },
            );
            setOpen(false);
          }}
        />
      )}
      <div className="food-library">
        {[...lib]
          .sort(
            (a, b) =>
              Number(favorites.includes(b.id)) -
              Number(favorites.includes(a.id)),
          )
          .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
          .map((f) => (
            <article className="card" key={f.id}>
              <div className="section-title">
                <h3>{f.name}</h3>
                <button
                  className={
                    "icon-btn " + (favorites.includes(f.id) ? "done" : "")
                  }
                  aria-label={`Favorito ${f.name}`}
                  onClick={() => favorite(f.id)}
                >
                  <Star size={18} />
                </button>
              </div>
              <p className="muted small">{f.state}</p>
              <p>
                <b>{f.kcal.toFixed(1)} kcal</b> / 100 {f.unit}
              </p>
              <p className="muted small">
                P {f.protein.toFixed(1)} · C {f.carbs.toFixed(1)} · G{" "}
                {f.fat.toFixed(1)} g
              </p>
              <div className="row">
                <button
                  className="btn ghost"
                  onClick={() => {
                    setEdit(f);
                    setOpen(true);
                  }}
                >
                  Editar etiqueta
                </button>
                {f.source.startsWith("https://") && (
                  <a
                    className="source-link"
                    href={f.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fuente <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
function FoodForm({
  food,
  onSave,
  onCancel,
}: {
  food?: Food;
  onSave: (f: Food) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState<Food>(
    food || {
      id: "",
      name: "",
      state: "Según etiqueta",
      unit: "g",
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      source: "Etiqueta personal",
    },
  );
  const update = (k: string, v: string | number) => setF({ ...f, [k]: v });
  return (
    <form
      className="card stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      <h3>{food ? "Editar datos nutricionales" : "Nuevo alimento"}</h3>
      <div className="grid2">
        <label className="field">
          Nombre
          <input
            required
            value={f.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>
        <label className="field">
          Estado / preparación
          <input
            required
            value={f.state}
            onChange={(e) => update("state", e.target.value)}
          />
        </label>
        <label className="field">
          Datos por 100
          <select
            value={f.unit}
            onChange={(e) => update("unit", e.target.value)}
          >
            <option value="g">gramos</option>
            <option value="ml">mililitros</option>
          </select>
        </label>
        <label className="field">
          Fuente / etiqueta
          <input
            required
            value={f.source}
            onChange={(e) => update("source", e.target.value)}
          />
        </label>
        {(["kcal", "protein", "carbs", "fat"] as const).map((k, i) => (
          <label key={k} className="field">
            {["Calorías", "Proteína (g)", "Carbohidratos (g)", "Grasas (g)"][i]}
            <input
              type="number"
              required
              min={0}
              max={k === "kcal" ? 1000 : 100}
              step="0.01"
              value={f[k]}
              onChange={(e) => update(k, Number(e.target.value))}
            />
          </label>
        ))}
      </div>
      <div className="row">
        <button className="btn primary">Guardar alimento</button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
      <small className="muted">
        Los registros anteriores conservan los nutrientes que tenían al
        guardarse.
      </small>
    </form>
  );
}
function Recipes({ store, date }: { store: FitStore; date: string }) {
  const lib = foodLibrary(store);
  const recipes = [
    ...(store.list("user_profiles")[0]?.data.guideBlocked || store.list("user_profiles")[0]?.data.personalization?.dietaryCare === "yes" ? [] : starterRecipes.map((r,i)=>({id:"starter"+i,data:r}))),
    ...store.list("recipes"),
  ].filter(row=>!store.list("user_profiles")[0]?.data.personalization && !store.list("user_profiles")[0]?.data.nutritionPreferences || (Array.isArray(row.data.items) && row.data.items.every((item:MealItem)=>safeNutritionFilterFor(store)(item.foodId))));
  const [name, setName] = useState("");
  const [items, setItems] = useState<MealItem[]>([]);
  const [id, setId] = useState(lib[0].id);
  const [amount, setAmount] = useState(100);
  const [meal, setMeal] = useState("Almuerzo");
  const [serving, setServing] = useState(100);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const recent = store
    .list("food_logs")
    .filter((r) => r.local_date !== date)
    .sort((a, b) => (b.local_date || "").localeCompare(a.local_date || ""))
    .slice(0, 10);
  return (
    <div className="stack">
      <div className="section-title">
        <h3>Recetas guardadas</h3>
        <button className="btn primary" onClick={() => setOpen(!open)}>
          <Plus size={16} />
          Crear receta
        </button>
      </div>
      <div className="row">
        <label className="field">
          Registrar en
          <select value={meal} onChange={(e) => setMeal(e.target.value)}>
            {["Desayuno", "Almuerzo", "Merienda", "Cena"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Porción del total (%)
          <input
            type="number"
            min="1"
            max="1000"
            value={serving}
            onChange={(e) => setServing(Number(e.target.value))}
          />
        </label>
      </div>
      {open && (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!items.length) return;
            const row = store.save("recipes", { name, items });
            items.forEach((item, position) =>
              store.save(
                "recipe_ingredients",
                { ...item, position },
                { recipe_id: row.id },
              ),
            );
            setItems([]);
            setName("");
            setOpen(false);
          }}
        >
          <label className="field">
            Nombre de receta
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="quick-add">
            <label className="field">
              Ingrediente
              <select value={id} onChange={(e) => setId(e.target.value)}>
                {lib.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Cantidad ({lib.find((f) => f.id === id)?.unit})
              <input
                type="number"
                min="0.1"
                max="10000"
                step="0.1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </label>
            <button
              type="button"
              className="btn ghost"
              disabled={amount <= 0}
              onClick={() => setItems([...items, { foodId: id, amount }])}
            >
              Añadir ingrediente
            </button>
          </div>
          {items.map((item, i) => (
            <div className="row" key={i}>
              <span>
                {lib.find((f) => f.id === item.foodId)?.name} · {item.amount}
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label="Quitar ingrediente"
                onClick={() => setItems(items.filter((_, j) => i !== j))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button className="btn primary" disabled={!items.length}>
            Guardar receta
          </button>
        </form>
      )}
      <div className="meal-grid">
        {recipes.map((r) => {
          const ri = r.data.items as MealItem[];
          const total = ri.reduce(
            (n, i) =>
              n + nutrients(lib.find((f) => f.id === i.foodId)!, i.amount).kcal,
            0,
          );
          return (
            <article className="card" key={r.id}>
              <h3>{r.data.name}</h3>
              <p className="muted small">
                {ri
                  .map(
                    (i) =>
                      `${lib.find((f) => f.id === i.foodId)?.name} (${i.amount} ${lib.find((f) => f.id === i.foodId)?.unit})`,
                  )
                  .join(" · ")}
              </p>
              <p>
                <b>{Math.round((total * serving) / 100)} kcal</b> · porción{" "}
                {serving}%
              </p>
              <button
                className="btn ghost"
                disabled={serving <= 0}
                onClick={() => {
                  for (const i of ri)
                    logFood(
                      store,
                      lib.find((f) => f.id === i.foodId)!,
                      (i.amount * serving) / 100,
                      meal,
                      date,
                      { recipeName: r.data.name },
                    );
                  setMsg(`${r.data.name} registrada.`);
                }}
              >
                <Plus size={16} />
                Registrar ingredientes
              </button>
              {!r.id.startsWith("starter") && (
                <button
                  className="icon-btn"
                  aria-label="Eliminar receta"
                  onClick={() => {
                    if (
                      confirm(
                        "¿Eliminar esta receta? Los consumos anteriores se conservan.",
                      )
                    )
                      store.remove("recipes", r as Row);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </article>
          );
        })}
      </div>
      {msg && (
        <p role="status" className="notice">
          {msg}
        </p>
      )}
      <h3>Repetir un registro anterior</h3>
      {recent.length ? (
        recent.map((r) => (
          <div className="card consumed-row" key={r.id}>
            <div>
              <strong>{r.data.name}</strong>
              <span>
                {r.local_date} · {r.data.amount} {r.data.unit} ·{" "}
                {Math.round(r.data.kcal)} kcal
              </span>
            </div>
            <button
              className="btn ghost"
              onClick={() => {
                store.save(
                  "food_logs",
                  { ...r.data, meal },
                  { local_date: date },
                );
                setMsg("Registro repetido en la fecha seleccionada.");
              }}
            >
              <Repeat2 size={16} />
              Repetir
            </button>
          </div>
        ))
      ) : (
        <p className="empty">
          Tus registros aparecerán aquí cuando tengas días anteriores.
        </p>
      )}
    </div>
  );
}
