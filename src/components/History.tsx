import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Dumbbell,
  Edit3,
  Footprints,
  Scale,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  exportFile,
  FitStore,
  type Row,
  type Table,
  tables,
  useStore,
} from "../lib/store";
import { dateLabel, prDate, shiftDate, weekday, ZONE } from "../lib/time";

type Filter = "all" | "workout" | "food" | "body" | "cardio";
type Editing = { table: Table; row: Row };
const num = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const round = (value: number) => Math.round(value * 10) / 10;
export function csvCell(value: unknown) {
  if (value === null || value === undefined) return '""';
  let s = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
export function exportRecords(store: FitStore, format: "json" | "csv") {
  const records = Object.fromEntries(
    tables.map((table) => [
      table,
      store.list(table).map(({ user_id, ...row }) => row),
    ]),
  );
  if (format === "json") {
    exportFile(
      `fittrack-pr-${prDate()}.json`,
      JSON.stringify(
        {
          schemaVersion: 1,
          timezone: ZONE,
          exportedAt: new Date().toISOString(),
          records,
        },
        null,
        2,
      ),
    );
    return;
  }
  const header = [
    "tabla",
    "id",
    "fecha_pr",
    "creado",
    "actualizado",
    "nombre",
    "comida",
    "cantidad",
    "unidad",
    "kcal",
    "proteina_g",
    "carbohidratos_g",
    "grasas_g",
    "ejercicio",
    "peso_lb",
    "repeticiones",
    "rir",
    "minutos",
    "distancia_km",
    "pasos",
    "cintura_cm",
    "notas",
    "datos_json",
  ];
  const lines: unknown[][] = [header];
  for (const table of tables) {
    for (const row of store.list(table)) {
      const d = row.data;
      lines.push([
        table,
        row.id,
        row.local_date,
        row.created_at,
        row.updated_at,
        d.name || d.title,
        d.meal,
        d.amount,
        d.unit,
        d.kcal,
        d.protein,
        d.carbs,
        d.fat,
        d.exerciseName || d.exerciseId,
        d.weightLb,
        d.reps,
        d.rir,
        d.minutes,
        d.distanceKm,
        d.steps,
        d.waistCm,
        d.notes,
        d,
      ]);
    }
  }
  exportFile(
    `fittrack-pr-${prDate()}.csv`,
    "\uFEFF" + lines.map((row) => row.map(csvCell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
}
function relativeGoal(store: FitStore, rows: Row[]) {
  const snapshot = rows.find((row) => row.data.goalSnapshot)?.data.goalSnapshot;
  const goal = snapshot || store.list("user_goals")[0]?.data || {};
  return {
    kcal: num(goal.kcal || goal.calories) || 2100,
    protein: num(goal.protein) || 170,
    carbs: num(goal.carbs) || 210,
    fat: num(goal.fat) || 64,
    historical: !!snapshot,
    trackingEnabled: goal.trackingEnabled !== false,
  };
}
function nutrientTotals(rows: Row[]) {
  return rows.reduce(
    (total, row) => ({
      kcal: total.kcal + num(row.data.kcal),
      protein: total.protein + num(row.data.protein),
      carbs: total.carbs + num(row.data.carbs),
      fat: total.fat + num(row.data.fat),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
function isFinished(row: Row) {
  return !!(
    row.data.endedAt ||
    row.data.finishedAt ||
    row.data.completed ||
    row.data.status === "completed"
  );
}
function workoutVolume(rows: Row[]) {
  return rows.reduce(
    (sum, row) =>
      row.data.completed === false || row.data.bodyweightMode === "assistance"
        ? sum
        : sum +
          Math.max(0, num(row.data.weightLb)) * Math.max(0, num(row.data.reps)),
    0,
  );
}
function strengthData(sets: Row[], id: string) {
  const days = new Map<string, number>();
  for (const row of sets) {
    if (
      row.data.exerciseId !== id ||
      row.data.completed === false ||
      row.data.bodyweightMode === "assistance" ||
      !row.local_date
    )
      continue;
    const load = num(row.data.weightLb);
    days.set(row.local_date, Math.max(days.get(row.local_date) || 0, load));
  }
  return [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight]) => ({
      date,
      label: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
      weight: round(weight),
    }));
}

export function History({
  store,
  date,
  onDate,
}: {
  store: FitStore;
  date: string;
  onDate: (date: string) => void;
}) {
  useStore(store);
  const [month, setMonth] = useState(date.slice(0, 7));
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [editDate, setEditDate] = useState(date);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [strengthId, setStrengthId] = useState("");
  useEffect(() => setMonth(date.slice(0, 7)), [date]);
  const sessions = store.list("workout_sessions", date);
  const sets = store.list("workout_sets", date);
  const foods = store.list("food_logs", date);
  const cardio = store.list("cardio_logs", date);
  const measurements = store.list("body_measurements", date);
  const totals = nutrientTotals(foods);
  const goal = relativeGoal(store, foods);
  const allSets = store.list("workout_sets");
  const strengthExercises = [
    ...new Map(
      allSets
        .filter((r) => r.data.exerciseId)
        .map((row) => [
          String(row.data.exerciseId),
          String(row.data.exerciseName || row.data.exerciseId),
        ]),
    ).entries(),
  ];
  const selectedStrength = strengthId || strengthExercises[0]?.[0] || "";
  const strength = useMemo(
    () => strengthData(allSets, selectedStrength),
    [allSets.map((r) => r.id + r.updated_at).join("|"), selectedStrength],
  );
  const recentDates = Array.from({ length: 7 }, (_, i) => shiftDate(date, -i));
  const weeklySessions = store
    .list("workout_sessions")
    .filter(
      (row) =>
        row.local_date &&
        recentDates.includes(row.local_date) &&
        isFinished(row),
    ).length;
  const weeklyKcal =
    nutrientTotals(
      store
        .list("food_logs")
        .filter(
          (row) => row.local_date && recentDates.includes(row.local_date),
        ),
    ).kcal / 7;
  const datesWithData = new Set(
    [
      ...store.list("food_logs"),
      ...store.list("workout_sessions"),
      ...store.list("cardio_logs"),
      ...store.list("body_measurements"),
    ].map((row) => row.local_date),
  );
  const first = month + "-01";
  const dayCount = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0,
  ).getDate();
  const leading = (weekday(first) + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("es-PR", {
    month: "long",
    year: "numeric",
    timeZone: ZONE,
  }).format(new Date(first + "T12:00:00-04:00"));
  function moveMonth(delta: number) {
    const d = new Date(first + "T12:00:00-04:00");
    d.setUTCMonth(d.getUTCMonth() + delta);
    setMonth(prDate(d).slice(0, 7));
  }
  function edit(table: Table, row: Row) {
    setEditing({ table, row });
    setDraft({ ...row.data });
    setEditDate(row.local_date || date);
    setError("");
    setNotice("");
  }
  function remove(table: Table, row: Row) {
    if (!window.confirm("¿Eliminar esta entrada del historial?")) return;
    try {
      if (table === "workout_sessions") {
        store
          .list("workout_sets")
          .filter((s) => s.session_id === row.id)
          .forEach((s) => store.remove("workout_sets", s));
      }
      store.remove(table, row);
      if (editing?.row.id === row.id) setEditing(null);
      setNotice("Entrada eliminada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setError("");
    try {
      const d = { ...draft };
      const table = editing.table;
      if (table === "food_logs") {
        const amount = num(d.amount);
        if (amount <= 0)
          throw new Error("La cantidad debe ser mayor que cero.");
        const original = editing.row.data;
        const per100 = original.per100 || original.snapshot?.per100;
        if (!per100 && num(original.amount) <= 0)
          throw new Error(
            "Esta entrada no tiene nutrientes por porción válidos. Regístrala de nuevo en Comidas.",
          );
        for (const key of ["kcal", "protein", "carbs", "fat"])
          d[key] = per100
            ? (num(per100[key]) * amount) / 100
            : (num(original[key]) * amount) / num(original.amount);
        d.amount = amount;
      }
      if (table === "workout_sets") {
        for (const key of ["weightLb", "reps"]) d[key] = num(d[key]);
        if (d.weightLb < 0 || d.reps <= 0 || !Number.isInteger(d.reps))
          throw new Error(
            "Usa carga cero o mayor y repeticiones enteras mayores que cero.",
          );
        if (d.rir !== "" && d.rir != null) {
          d.rir = num(d.rir);
          if (d.rir < 0 || d.rir > 10)
            throw new Error("El RIR debe estar entre 0 y 10.");
        } else d.rir = null;
      }
      if (table === "cardio_logs") {
        for (const key of [
          "minutes",
          "distanceKm",
          "steps",
          "rounds",
          "work",
          "rest",
          "workSeconds",
          "restSeconds",
        ]) {
          if (d[key] !== undefined && d[key] !== null && d[key] !== "") {
            d[key] = num(d[key]);
            if (d[key] < 0)
              throw new Error(
                "Los valores de actividad no pueden ser negativos.",
              );
          }
        }
        if (d.kind === "rope" && num(d.rounds) > 0) {
          const work = num(d.workSeconds ?? d.work),
            rest = num(d.restSeconds ?? d.rest);
          if (!Number.isInteger(num(d.rounds)) || work <= 0)
            throw new Error(
              "Introduce intervalos enteros y tiempo de trabajo mayor que cero.",
            );
          d.minutes =
            (num(d.rounds) * work + Math.max(0, num(d.rounds) - 1) * rest) / 60;
        }
        if (num(d.minutes) <= 0)
          throw new Error("Introduce una duración mayor que cero.");
        d.title =
          (
            {
              walk: "Caminata",
              mobility: "Movilidad general",
              rope: "Cuica",
            } as Record<string, string>
          )[d.kind] || d.title;
      }
      if (table === "body_measurements") {
        d.weightLb = num(d.weightLb);
        d.waistCm =
          d.waistCm === "" || d.waistCm == null ? null : num(d.waistCm);
        if (d.weightLb <= 0 || (d.waistCm !== null && d.waistCm <= 0))
          throw new Error("Introduce mediciones mayores que cero.");
      }
      // Sets remain on their session date. This protects workouts spanning midnight.
      const targetDate =
        table === "workout_sets" ? editing.row.local_date : editDate;
      store.save(table, d, { ...editing.row, local_date: targetDate });
      if (
        table === "workout_sessions" &&
        targetDate &&
        targetDate !== editing.row.local_date
      ) {
        for (const childTable of ["workout_sets", "cardio_logs"] as const) {
          for (const child of store.list(childTable)) {
            if (
              child.session_id === editing.row.id ||
              child.data.sessionId === editing.row.id
            ) {
              store.save(childTable, child.data, {
                ...child,
                local_date: targetDate,
              });
            }
          }
        }
      }
      setEditing(null);
      setNotice("Cambios guardados.");
      if (targetDate && targetDate !== date) onDate(targetDate);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron guardar los cambios.",
      );
    }
  }
  function controls(table: Table, row: Row) {
    return (
      <div className="row">
        <button
          type="button"
          className="btn ghost"
          aria-label={`Editar ${row.data.name || row.data.exerciseName || row.data.title || "entrada"}`}
          onClick={() => edit(table, row)}
        >
          <Edit3 size={16} />
        </button>
        <button
          type="button"
          className="btn ghost danger"
          aria-label={`Eliminar ${row.data.name || row.data.exerciseName || row.data.title || "entrada"}`}
          onClick={() => remove(table, row)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }
  const setField = (key: string, value: unknown) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const numericField = (
    key: string,
    label: string,
    step = "0.1",
    min = "0",
  ) => (
    <label className="field" key={key}>
      {label}
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        value={draft[key] ?? ""}
        onChange={(e) => setField(key, e.target.value)}
      />
    </label>
  );
  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <p className="eyebrow">CADA REGISTRO CUENTA</p>
          <h1>Tu historial</h1>
        </div>
        <CalendarDays size={25} />
      </div>
      <div className="grid2">
        <div className="card">
          <span className="muted">Entrenamientos completados</span>
          <h2>{weeklySessions}</h2>
          <span className="muted">Últimos 7 días hasta {date}</span>
        </div>
        <div className="card">
          <span className="muted">Promedio calórico diario</span>
          <h2>
            {Math.round(weeklyKcal).toLocaleString("es-PR")} <small>kcal</small>
          </h2>
          <span className="muted">
            7 días calendario, incluyendo días sin registro
          </span>
        </div>
      </div>
      <section className="card stack">
        <div className="section-title">
          <button
            type="button"
            className="btn ghost"
            aria-label="Mes anterior"
            onClick={() => moveMonth(-1)}
          >
            <ChevronLeft size={19} />
          </button>
          <h2 style={{ textTransform: "capitalize" }}>{monthLabel}</h2>
          <button
            type="button"
            className="btn ghost"
            aria-label="Mes siguiente"
            onClick={() => moveMonth(1)}
          >
            <ChevronRight size={19} />
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,minmax(0,1fr))",
            gap: 5,
          }}
          role="group"
          aria-label="Calendario del historial"
        >
          {["L", "M", "Mi", "J", "V", "S", "D"].map((day) => (
            <span
              key={day}
              className="muted"
              style={{ textAlign: "center", fontSize: 12 }}
            >
              {day}
            </span>
          ))}
          {Array.from({ length: leading }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: dayCount }, (_, i) => {
            const value = `${month}-${String(i + 1).padStart(2, "0")}`;
            return (
              <button
                type="button"
                key={value}
                className={`btn ${value === date ? "primary" : "ghost"}`}
                style={{
                  minWidth: 0,
                  padding: "9px 2px",
                  position: "relative",
                  border:
                    value === prDate() && value !== date
                      ? "1px solid #62d8ba"
                      : undefined,
                }}
                aria-label={`${value}${datesWithData.has(value) ? ", con registros" : ""}`}
                aria-pressed={value === date}
                onClick={() => onDate(value)}
              >
                {i + 1}
                {datesWithData.has(value) && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 9,
                      background: "currentColor",
                      position: "absolute",
                      bottom: 3,
                      left: "calc(50% - 2px)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="row">
          <label className="field" style={{ flex: 1 }}>
            Consultar fecha
            <input
              aria-label="Fecha del historial"
              type="date"
              value={date}
              onChange={(e) => e.target.value && onDate(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn ghost"
            onClick={() => onDate(prDate())}
          >
            Hoy
          </button>
        </div>
      </section>
      <div
        className="row"
        style={{ overflowX: "auto", paddingBottom: 5 }}
        aria-label="Filtrar historial"
      >
        {(
          [
            { id: "all", label: "Todo" },
            { id: "workout", label: "Entrenamiento" },
            { id: "food", label: "Comidas" },
            { id: "cardio", label: "Cardio" },
            { id: "body", label: "Cuerpo" },
          ] as { id: Filter; label: string }[]
        ).map((item) => (
          <button
            type="button"
            key={item.id}
            className={`btn ${filter === item.id ? "primary" : "ghost"}`}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <h2 style={{ textTransform: "capitalize" }}>{dateLabel(date)}</h2>
      {notice && <p role="status">{notice}</p>}
      {error && !editing && (
        <p role="alert" className="danger">
          {error}
        </p>
      )}
      {editing && (
        <form className="card stack" onSubmit={save}>
          <div className="section-title">
            <h2>Editar registro</h2>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setEditing(null)}
              aria-label="Cerrar edición"
            >
              <X size={18} />
            </button>
          </div>
          {editing.table !== "workout_sets" && (
            <label className="field">
              Fecha
              <input
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </label>
          )}
          {editing.table === "food_logs" && (
            <>
              <p>{draft.name}</p>
              <div className="grid2">
                {numericField(
                  "amount",
                  `Cantidad (${draft.unit || "g"})`,
                  "0.1",
                  "0.1",
                )}
                <label className="field">
                  Momento
                  <select
                    value={draft.meal || "Desayuno"}
                    onChange={(e) => setField("meal", e.target.value)}
                  >
                    {["Desayuno", "Almuerzo", "Merienda", "Cena", "Otro"].map(
                      (meal) => (
                        <option key={meal}>{meal}</option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <p className="muted">
                Las calorías y los macronutrientes se recalculan usando los
                nutrientes guardados en esta entrada.
              </p>
            </>
          )}
          {editing.table === "workout_sets" && (
            <>
              <p>
                {draft.exerciseName || draft.exerciseId} · Serie{" "}
                {draft.setNumber}
              </p>
              <p className="muted">
                Fecha de la sesión: {editing.row.local_date}. Las cargas se
                editan en libras.
              </p>
              <div className="grid2">
                {numericField("weightLb", "Peso (lb)", "0.1")}
                {numericField("reps", "Repeticiones", "1", "1")}
                {numericField("rir", "RIR · opcional", "1")}
              </div>
              <label className="row">
                <input
                  type="checkbox"
                  checked={!!draft.techniqueGood}
                  onChange={(e) => setField("techniqueGood", e.target.checked)}
                />{" "}
                Técnica controlada
              </label>
            </>
          )}
          {editing.table === "cardio_logs" && (
            <>
              <label className="field">
                Actividad
                <select
                  value={draft.kind || "walk"}
                  onChange={(e) => setField("kind", e.target.value)}
                >
                  <option value="walk">Caminata</option>
                  <option value="mobility">Movilidad</option>
                  <option value="rope">Cuica</option>
                </select>
              </label>
              <div className="grid2">
                {numericField("minutes", "Duración (min)", "0.1", "0.1")}
                {numericField("distanceKm", "Distancia (km) · opcional")}
                {numericField("steps", "Pasos · opcional", "1")}
                {draft.rounds !== undefined &&
                  numericField("rounds", "Intervalos", "1")}
                {draft.work !== undefined &&
                  numericField("work", "Trabajo por intervalo (s)", "1")}
                {draft.rest !== undefined &&
                  numericField("rest", "Descanso por intervalo (s)", "1")}
                {draft.workSeconds !== undefined &&
                  numericField("workSeconds", "Trabajo por intervalo (s)", "1")}
                {draft.restSeconds !== undefined &&
                  numericField(
                    "restSeconds",
                    "Descanso por intervalo (s)",
                    "1",
                  )}
              </div>
            </>
          )}
          {editing.table === "body_measurements" && (
            <>
              <div className="grid2">
                {numericField("weightLb", "Peso corporal (lb)", "0.1", "0.1")}
                {numericField(
                  "waistCm",
                  "Cintura (cm) · opcional",
                  "0.1",
                  "0.1",
                )}
              </div>
              <label className="field">
                Hora · opcional
                <input
                  type="time"
                  value={draft.time || ""}
                  onChange={(e) => setField("time", e.target.value)}
                />
              </label>
            </>
          )}
          {editing.table === "workout_sessions" && (
            <label className="field">
              Nombre de la sesión
              <input
                required
                value={draft.title || ""}
                onChange={(e) => setField("title", e.target.value)}
              />
            </label>
          )}
          <label className="field">
            Notas
            <textarea
              value={draft.notes || ""}
              onChange={(e) => setField("notes", e.target.value)}
              rows={3}
            />
          </label>
          {error && (
            <p role="alert" className="danger">
              {error}
            </p>
          )}
          <button type="submit" className="btn primary">
            Guardar cambios
          </button>
        </form>
      )}
      {(filter === "all" || filter === "food") && (
        <section className="card stack">
          <div className="section-title">
            <h2 className="row">
              <Utensils size={20} /> Nutrición
            </h2>
            <span className="badge">
              {Math.round(totals.kcal).toLocaleString("es-PR")} kcal
            </span>
          </div>
          <div className="grid2">
            <p>
              Proteína <strong>{round(totals.protein)} g</strong>
              <br />
              Carbohidratos <strong>{round(totals.carbs)} g</strong>
            </p>
            <p>
              Grasas <strong>{round(totals.fat)} g</strong>
              <br />
              {goal.trackingEnabled && (
                <>
                  Diferencia{" "}
                  <strong>
                    {totals.kcal - goal.kcal > 0 ? "+" : ""}
                    {Math.round(totals.kcal - goal.kcal)} kcal
                  </strong>
                </>
              )}
            </p>
          </div>
          <p className="muted">
            {goal.trackingEnabled
              ? `${goal.historical ? "Objetivo guardado con el registro" : "Objetivo actual"}: ${goal.kcal} kcal.`
              : "Sin objetivo numérico para este registro."}{" "}
            Solo se incluye lo que confirmaste como consumido.
          </p>
          {!foods.length && (
            <p className="empty">No hay alimentos registrados en esta fecha.</p>
          )}
          {foods.map((row) => (
            <article
              className="row"
              key={row.id}
              style={{ borderTop: "1px solid #263a42", paddingTop: 12 }}
            >
              <div>
                <strong>{row.data.name || "Alimento"}</strong>
                <p className="muted">
                  {row.data.meal} · {round(num(row.data.amount))}{" "}
                  {row.data.unit || "g"} · {Math.round(num(row.data.kcal))} kcal
                </p>
                <p className="muted">
                  P {round(num(row.data.protein))} · C{" "}
                  {round(num(row.data.carbs))} · G {round(num(row.data.fat))} g
                </p>
              </div>
              {controls("food_logs", row)}
            </article>
          ))}
        </section>
      )}
      {(filter === "all" || filter === "workout") && (
        <section className="card stack">
          <div className="section-title">
            <h2 className="row">
              <Dumbbell size={20} /> Entrenamiento
            </h2>
            <span className="badge">
              {round(workoutVolume(sets)).toLocaleString("es-PR")} lb · rep
            </span>
          </div>
          <p className="muted">
            Volumen externo: suma de carga por repeticiones. El peso corporal y
            la asistencia no se convierten en carga externa.
          </p>
          {!sessions.length && !sets.length && (
            <p className="empty">No hay sesiones registradas en esta fecha.</p>
          )}
          {sessions.map((session) => {
            const sessionSets = sets.filter(
              (row) =>
                row.session_id === session.id ||
                row.data.sessionId === session.id,
            );
            const snapshot = Array.isArray(session.data.exercises)
              ? session.data.exercises
              : [];
            const completedIds = new Set(
              sessionSets
                .filter((row) => row.data.completed !== false)
                .map((row) => row.data.exerciseId),
            );
            const omitted = snapshot.filter(
              (exercise: any) =>
                !completedIds.has(
                  typeof exercise === "string" ? exercise : exercise.id,
                ),
            );
            const duration = session.data.startedAt
              ? Math.max(
                  0,
                  (Date.parse(
                    session.data.endedAt ||
                      session.data.finishedAt ||
                      new Date().toISOString(),
                  ) -
                    Date.parse(session.data.startedAt)) /
                    60000,
                )
              : 0;
            return (
              <article
                key={session.id}
                className="stack"
                style={{ borderTop: "1px solid #263a42", paddingTop: 12 }}
              >
                <div className="row">
                  <div>
                    <strong>{session.data.title || "Entrenamiento"}</strong>
                    <p className="muted">
                      {isFinished(session) ? "Completado" : "Sesión incompleta"}{" "}
                      ·{" "}
                      {
                        sessionSets.filter(
                          (row) => row.data.completed !== false,
                        ).length
                      }{" "}
                      series completadas
                      {Number.isFinite(duration)
                        ? ` · ${Math.round(duration)} min`
                        : ""}
                    </p>
                  </div>
                  {controls("workout_sessions", session)}
                </div>
                {session.data.notes && <p>{session.data.notes}</p>}
                {sessionSets.map((row) => (
                  <div className="row" key={row.id}>
                    <div>
                      <strong>
                        {row.data.exerciseName || row.data.exerciseId}
                      </strong>
                      <p className="muted">
                        Serie {row.data.setNumber || "—"} ·{" "}
                        {row.data.bodyweightMode === "assistance"
                          ? "BW con asistencia "
                          : row.data.bodyweightMode
                            ? "BW + "
                            : ""}
                        {round(num(row.data.weightLb))} lb ×{" "}
                        {num(row.data.reps)} reps
                        {row.data.rir != null ? ` · RIR ${row.data.rir}` : ""}
                        {row.data.completed === false ? " · Pendiente" : ""}
                      </p>
                    </div>
                    {controls("workout_sets", row)}
                  </div>
                ))}
                {!!omitted.length && (
                  <p className="muted">
                    Sin series registradas:{" "}
                    {omitted
                      .map((exercise: any) =>
                        typeof exercise === "string"
                          ? exercise
                          : exercise.name || exercise.id,
                      )
                      .join(", ")}
                    .
                  </p>
                )}
              </article>
            );
          })}
          {sets
            .filter(
              (row) =>
                !sessions.some(
                  (s) => s.id === row.session_id || s.id === row.data.sessionId,
                ),
            )
            .map((row) => (
              <div className="row" key={row.id}>
                <div>
                  <strong>
                    {row.data.exerciseName || row.data.exerciseId}
                  </strong>
                  <p className="muted">
                    {num(row.data.weightLb)} lb × {num(row.data.reps)} reps
                  </p>
                </div>
                {controls("workout_sets", row)}
              </div>
            ))}
        </section>
      )}
      {(filter === "all" || filter === "cardio") && (
        <section className="card stack">
          <h2 className="row">
            <Footprints size={20} /> Actividad y movilidad
          </h2>
          {!cardio.length && (
            <p className="empty">No hay actividad registrada en esta fecha.</p>
          )}
          {cardio.map((row) => (
            <article className="row" key={row.id}>
              <div>
                <strong>
                  {row.data.title ||
                    (
                      {
                        walk: "Caminata",
                        mobility: "Movilidad",
                        rope: "Cuica",
                      } as Record<string, string>
                    )[row.data.kind] ||
                    row.data.kind ||
                    "Actividad"}
                </strong>
                <p className="muted">
                  {num(row.data.minutes)} min
                  {row.data.distanceKm
                    ? ` · ${round(num(row.data.distanceKm))} km`
                    : ""}
                  {row.data.steps
                    ? ` · ${num(row.data.steps).toLocaleString("es-PR")} pasos`
                    : ""}
                  {row.data.rounds
                    ? ` · ${num(row.data.rounds)} intervalos`
                    : ""}
                  {row.data.workSeconds
                    ? ` de ${num(row.data.workSeconds)} s`
                    : ""}
                  {row.data.restSeconds
                    ? ` · descanso ${num(row.data.restSeconds)} s`
                    : ""}
                </p>
                {row.data.notes && <p>{row.data.notes}</p>}
              </div>
              {controls("cardio_logs", row)}
            </article>
          ))}
        </section>
      )}
      {(filter === "all" || filter === "body") && (
        <section className="card stack">
          <h2 className="row">
            <Scale size={20} /> Condición física
          </h2>
          {!measurements.length && (
            <p className="empty">No hay mediciones en esta fecha.</p>
          )}
          {measurements.map((row) => (
            <article className="row" key={row.id}>
              <div>
                <strong>{round(num(row.data.weightLb))} lb</strong>
                <p className="muted">
                  {row.data.time || ""}
                  {row.data.waistCm
                    ? ` · Cintura ${round(num(row.data.waistCm))} cm`
                    : ""}
                </p>
                {row.data.notes && <p>{row.data.notes}</p>}
                {row.data.photoPath && (
                  <span className="badge">Foto privada en Mi progreso</span>
                )}
              </div>
              {controls("body_measurements", row)}
            </article>
          ))}
        </section>
      )}
      <section className="card stack">
        <div className="section-title">
          <h2>Tu fuerza en el tiempo</h2>
          <Dumbbell size={19} />
        </div>
        {strengthExercises.length ? (
          <>
            <label className="field">
              Ejercicio
              <select
                aria-label="Ejercicio del gráfico de fuerza"
                value={selectedStrength}
                onChange={(e) => setStrengthId(e.target.value)}
              >
                {strengthExercises.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ height: 240, width: "100%" }}>
              <ResponsiveContainer>
                <LineChart
                  data={strength}
                  margin={{ left: 0, right: 15, top: 10, bottom: 0 }}
                >
                  <CartesianGrid stroke="#24353c" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#8da2ab"
                    minTickGap={25}
                    fontSize={11}
                  />
                  <YAxis
                    stroke="#8da2ab"
                    width={45}
                    fontSize={11}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#142229",
                      border: "1px solid #2b4149",
                      borderRadius: 12,
                      color: "#e6f1f3",
                    }}
                    labelFormatter={(_, payload) =>
                      payload[0]?.payload?.date || ""
                    }
                    formatter={(value) => [
                      `${Number(value).toFixed(1)} lb`,
                      "Carga máxima",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#62d8ba"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="muted">
              Máxima carga externa en una serie de cada día, excluyendo series
              con asistencia. Compara la misma máquina, técnica y modalidad; la
              carga por sí sola no resume tu progreso.
            </p>
          </>
        ) : (
          <p className="empty">
            Registra tus primeras series para ver la evolución por ejercicio.
          </p>
        )}
      </section>
      <section className="card stack">
        <h2 className="row">
          <Download size={20} /> Exportar mis registros
        </h2>
        <p className="muted">
          Descarga todo tu historial y configuración. El JSON conserva la
          estructura completa; el CSV abre en hojas de cálculo.
        </p>
        <div className="grid2">
          <button
            type="button"
            className="btn ghost"
            onClick={() => exportRecords(store, "csv")}
          >
            Descargar CSV
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => exportRecords(store, "json")}
          >
            Descargar JSON
          </button>
        </div>
      </section>
    </div>
  );
}
