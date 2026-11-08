import { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Dumbbell,
  ExternalLink,
  Footprints,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Timer,
  Trash2,
} from "lucide-react";
import {
  exercises,
  schedule,
  recommendLoad,
  type Exercise,
} from "../data/training";
import { type FitStore, type Row, seedId } from "../lib/store";
import { dateLabel, formatTime, prDate, weekday } from "../lib/time";
import "./Workout.css";

type Unit = "lb" | "kg";
type WorkoutProps = { store: FitStore; date: string; unit: Unit };
const toDisplay = (lb: number, unit: Unit) =>
  Math.round((unit === "kg" ? lb / 2.2046226218 : lb) * 100) / 100;
const toLb = (weight: number, unit: Unit) =>
  unit === "kg" ? weight * 2.2046226218 : weight;
const numeric = (value: unknown, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
function safeSave(run: () => void, setError: (error: string) => void) {
  try {
    run();
    setError("");
  } catch (e) {
    setError(
      e instanceof Error
        ? e.message
        : "No se pudo guardar. Inténtalo de nuevo.",
    );
  }
}

export function Workout({ store, date, unit }: WorkoutProps) {
  const catalog = exercises.map((e) => ({
    ...e,
    ...store
      .list("exercise_catalog")
      .find(
        (r) =>
          r.data.key === e.id ||
          r.data.exerciseId === e.id ||
          r.data.id === e.id,
      )?.data,
  })) as Exercise[];
  const base = schedule.find((d) => d.day === weekday(date))!;
  const plan = {
    ...base,
    ...store.list("workout_plans").find((r) => r.data.day === weekday(date))
      ?.data,
  };
  const [sessionId, setSessionId] = useState<string | undefined>(
    () =>
      store.list("workout_sessions", date).find((r) => !r.data.finishedAt)?.id,
  );
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [restUntil, setRestUntil] = useState<number | undefined>(() => {
    const raw = localStorage.getItem(`fittrack-rest:${store.userId}`);
    const value = Number(raw);
    return value > Date.now() ? value : undefined;
  });
  const [restSeconds, setRestSeconds] = useState(90);
  const [notes, setNotes] = useState("");
  const currentSession = store
    .list("workout_sessions")
    .find((r) => r.id === sessionId);
  const session = currentSession;
  const lockedDate = session?.local_date || date;
  const sessionPlan = session?.data.plan || plan;
  const plannedExercises: Exercise[] =
    session?.data.exercises ||
    sessionPlan.exerciseIds
      .map((id: string) => catalog.find((e) => e.id === id))
      .filter(Boolean);
  const sets = session
    ? store.list("workout_sets").filter((r) => r.session_id === session.id)
    : [];
  const completedCount = plannedExercises.filter(
    (e) =>
      sets.filter((s) => s.data.exerciseId === e.id && s.data.completed)
        .length >=
        (session?.data.setCounts?.[e.id] || e.sets) -
          (session?.data.removedSetNumbers?.[e.id]?.length || 0) ||
      session?.data.skipped?.includes(e.id),
  ).length;
  const elapsed = session
    ? Math.max(
        0,
        Math.floor(
          ((session.data.finishedAt
            ? Date.parse(session.data.finishedAt)
            : now) -
            Date.parse(session.data.startedAt)) /
            1000,
        ),
      )
    : 0;
  const restLeft = restUntil
    ? Math.max(0, Math.ceil((restUntil - now) / 1000))
    : 0;
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!session || session.data.finishedAt) {
      const next = store
        .list("workout_sessions", date)
        .find((r) => !r.data.finishedAt);
      setSessionId(next?.id);
    }
  }, [date, store.hydrated]);
  useEffect(() => {
    setNotes(session?.data.notes || "");
  }, [session?.id]);
  useEffect(() => {
    if (restUntil)
      localStorage.setItem(`fittrack-rest:${store.userId}`, String(restUntil));
    else localStorage.removeItem(`fittrack-rest:${store.userId}`);
  }, [restUntil, store.userId]);
  function updateSession(data: Record<string, any>) {
    if (!session) return;
    store.save(
      "workout_sessions",
      { ...session.data, ...data },
      { id: session.id, local_date: lockedDate },
    );
  }
  function start() {
    safeSave(() => {
      const next = store.save(
        "workout_sessions",
        {
          title: plan.title,
          plan: { ...plan },
          exercises: plannedExercises.map((e) => ({ ...e })),
          startedAt: new Date().toISOString(),
          finishedAt: null,
          endedAt: null,
          notes: "",
          skipped: [],
        },
        { local_date: date },
      );
      setSessionId(next.id);
    }, setError);
  }
  function finish() {
    safeSave(() => {
      updateSession({
        finishedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        notes,
        skipped: plannedExercises
          .filter(
            (e) =>
              !sets.some((s) => s.data.exerciseId === e.id && s.data.completed),
          )
          .map((e) => e.id),
      });
      setRestUntil(undefined);
    }, setError);
  }
  function startRest() {
    setRestUntil(Date.now() + restSeconds * 1000);
  }
  return (
    <div className="stack workout-page">
      <div className="section-title">
        <div>
          <p className="eyebrow">TU PLAN DE MOVIMIENTO</p>
          <h1>{sessionPlan.title}</h1>
          <p className="muted">
            {dateLabel(lockedDate)} ·{" "}
            {sessionPlan.type === "strength"
              ? `${plannedExercises.length} ejercicios`
              : "Recuperación y bienestar"}
          </p>
        </div>
        <span className="badge">
          <Dumbbell size={16} />{" "}
          {sessionPlan.type === "strength"
            ? "Fuerza"
            : sessionPlan.type === "rest"
              ? "Descanso"
              : "Movimiento"}
        </span>
      </div>
      {lockedDate !== date && (
        <div className="card workout-notice">
          <Clock3 size={20} />
          <div>
            <strong>Tu sesión sigue en {dateLabel(lockedDate)}.</strong>
            <p>
              La fecha se fijó al comenzar. Las nuevas series se guardarán en
              ese día aunque haya pasado medianoche.
            </p>
          </div>
        </div>
      )}
      {error && (
        <p className="danger" role="alert">
          {error}
        </p>
      )}
      {sessionPlan.type === "rest" && (
        <div className="card rest-hero">
          <span className="rest-symbol">☾</span>
          <h2>Recuperarte también cuenta.</h2>
          <p>
            Hoy es tu día de descanso. Recuperarte también es parte del
            progreso.
          </p>
          <p className="muted">
            Si te apetece, registra una caminata tranquila.
          </p>
        </div>
      )}
      {sessionPlan.type === "recovery" && (
        <div className="card rest-hero">
          <Footprints size={36} />
          <h2>Día de recuperación activa</h2>
          <p>
            Caminata rápida de {sessionPlan.walkMinutes} minutos y{" "}
            {sessionPlan.mobilityMinutes || 10} minutos de movilidad general.
          </p>
          <p className="muted">No hay entrenamiento de pesas obligatorio.</p>
        </div>
      )}
      {sessionPlan.type === "strength" && (
        <>
          {!session && (
            <div className="card workout-start">
              <div>
                <span className="eyebrow">LISTO CUANDO TÚ ESTÉS</span>
                <h2>Un entrenamiento a la vez.</h2>
                <p className="muted">
                  Series programadas completas. Escoge cargas que te permitan
                  mantener la técnica.
                </p>
              </div>
              <button className="btn primary" onClick={start}>
                <Play size={18} /> Comenzar entrenamiento
              </button>
            </div>
          )}
          {session && (
            <div className="card session-bar">
              <div>
                <span className="eyebrow">
                  {session.data.finishedAt
                    ? "SESIÓN FINALIZADA"
                    : "ENTRENAMIENTO EN CURSO"}
                </span>
                <strong className="session-clock">
                  <Clock3 size={18} />
                  {formatTime(elapsed)}
                </strong>
              </div>
              <div>
                <span className="eyebrow">EJERCICIOS</span>
                <strong>
                  {completedCount} / {plannedExercises.length}
                </strong>
              </div>
              <div
                className="session-progress"
                role="progressbar"
                aria-label="Ejercicios completados"
                aria-valuenow={completedCount}
                aria-valuemin={0}
                aria-valuemax={plannedExercises.length}
              >
                <span
                  style={{
                    width: `${plannedExercises.length ? (completedCount / plannedExercises.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
          {session && !session.data.finishedAt && (
            <div className="card rest-timer">
              <Timer size={21} />
              <div className="rest-timer-main">
                <strong>Descanso opcional</strong>
                <span className="muted">
                  {restLeft > 0
                    ? formatTime(restLeft)
                    : restUntil
                      ? "Descanso terminado"
                      : "A tu ritmo"}
                </span>
              </div>
              <label className="sr-only" htmlFor="rest-seconds">
                Segundos de descanso
              </label>
              <select
                id="rest-seconds"
                value={restSeconds}
                onChange={(e) => setRestSeconds(Number(e.target.value))}
              >
                <option value={30}>30 s</option>
                <option value={60}>60 s</option>
                <option value={90}>90 s</option>
                <option value={120}>2 min</option>
                <option value={180}>3 min</option>
              </select>
              <button
                className="btn ghost icon-btn"
                aria-label={restLeft ? "Detener descanso" : "Iniciar descanso"}
                onClick={() =>
                  restLeft ? setRestUntil(undefined) : startRest()
                }
              >
                {restLeft ? <Pause size={19} /> : <Play size={19} />}
              </button>
            </div>
          )}
          <div className="stack">
            {plannedExercises.map((exercise, index) => (
              <ExerciseCard
                key={`${session?.id || "plan"}:${exercise.id}:${index}`}
                exercise={exercise}
                index={index}
                session={session}
                store={store}
                unit={unit}
                date={lockedDate}
                allSets={sets}
                onSaved={() => {
                  setNow(Date.now());
                }}
                onRest={startRest}
                onSkip={() =>
                  safeSave(() => {
                    updateSession({
                      skipped: [
                        ...new Set([
                          ...(session?.data.skipped || []),
                          exercise.id,
                        ]),
                      ],
                    });
                  }, setError)
                }
                skipped={session?.data.skipped?.includes(exercise.id) || false}
                onUnskip={() =>
                  safeSave(
                    () =>
                      updateSession({
                        skipped: (session?.data.skipped || []).filter(
                          (id: string) => id !== exercise.id,
                        ),
                      }),
                    setError,
                  )
                }
                onSubstitute={(id) =>
                  safeSave(() => {
                    const next = catalog.find((e) => e.id === id);
                    if (
                      next &&
                      !plannedExercises.some(
                        (e, i) => i !== index && e.id === id,
                      )
                    )
                      updateSession({
                        exercises: plannedExercises.map((e, i) =>
                          i === index ? { ...next } : e,
                        ),
                      });
                  }, setError)
                }
                catalog={catalog.filter(
                  (candidate) =>
                    candidate.id === exercise.id ||
                    !plannedExercises.some((e) => e.id === candidate.id),
                )}
              />
            ))}
          </div>
          {session && (
            <div className="card stack">
              <label className="field">
                <span>Notas de esta sesión</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() =>
                    safeSave(() => updateSession({ notes }), setError)
                  }
                  placeholder="Cómo te sentiste, ajustes de máquina, técnica…"
                  rows={3}
                />
              </label>
              {!session.data.finishedAt ? (
                <button className="btn primary" onClick={finish}>
                  <Check size={18} /> Finalizar entrenamiento
                </button>
              ) : (
                <div className="row">
                  <span className="badge">
                    <Check size={16} /> Sesión guardada
                  </span>
                  <button
                    className="btn ghost"
                    onClick={() =>
                      safeSave(
                        () =>
                          updateSession({ finishedAt: null, endedAt: null }),
                        setError,
                      )
                    }
                  >
                    <RotateCcw size={16} /> Reabrir sesión
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => {
                      setSessionId(undefined);
                    }}
                  >
                    Ver plan
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <CardioCard
        store={store}
        date={sessionPlan.type === "strength" ? lockedDate : date}
        plan={sessionPlan}
      />
    </div>
  );
}

type ExerciseProps = {
  exercise: Exercise;
  index: number;
  session?: Row;
  store: FitStore;
  unit: Unit;
  date: string;
  allSets: Row[];
  onSaved: () => void;
  onRest: () => void;
  onSkip: () => void;
  onUnskip: () => void;
  skipped: boolean;
  catalog: Exercise[];
  onSubstitute: (id: string) => void;
};
function ExerciseCard({
  exercise,
  index,
  session,
  store,
  unit,
  date,
  allSets,
  onSaved,
  onRest,
  onSkip,
  onUnskip,
  skipped,
  catalog,
  onSubstitute,
}: ExerciseProps) {
  const [open, setOpen] = useState(index === 0);

  const current = allSets
    .filter((r) => r.data.exerciseId === exercise.id)
    .sort((a, b) => a.data.setNumber - b.data.setNumber);
  const previousSessions = store
    .list("workout_sessions")
    .filter(
      (r) =>
        r.id !== session?.id &&
        r.data.finishedAt &&
        (!session || r.data.startedAt < session.data.startedAt),
    )
    .sort((a, b) => b.data.startedAt.localeCompare(a.data.startedAt));
  const previousSession = previousSessions.find((s) =>
    store
      .list("workout_sets")
      .some(
        (r) =>
          r.session_id === s.id &&
          r.data.exerciseId === exercise.id &&
          r.data.completed,
      ),
  );
  const previous = previousSession
    ? store
        .list("workout_sets")
        .filter(
          (r) =>
            r.session_id === previousSession.id &&
            r.data.exerciseId === exercise.id &&
            r.data.completed,
        )
    : [];
  const recommendation = recommendLoad(
    exercise,
    previous.map((r) => ({
      ...r.data,
      sessionId: r.session_id,
      weightLb: numeric(r.data.weightLb),
      reps: numeric(r.data.reps),
      mode:
        r.data.bodyweightMode === "assistance"
          ? "assisted"
          : r.data.bodyweightMode === "additional"
            ? "added"
            : "load",
    })),
  );
  const record = store
    .list("workout_sets")
    .filter(
      (r) =>
        r.data.exerciseId === exercise.id &&
        r.data.completed &&
        r.data.bodyweightMode !== "assistance",
    )
    .reduce((max, r) => Math.max(max, numeric(r.data.weightLb)), 0);
  const removedNumbers: number[] =
    session?.data.removedSetNumbers?.[exercise.id] || [];
  const defaultCount = Math.max(
    session?.data.setCounts?.[exercise.id] || exercise.sets,
    current.length ? Math.max(...current.map((r) => r.data.setNumber)) : 0,
  );
  function sessionConfig(data: Record<string, any>) {
    if (session)
      store.save(
        "workout_sessions",
        { ...session.data, ...data },
        { id: session.id, local_date: date },
      );
  }
  function removeNumber(n: number) {
    sessionConfig({
      removedSetNumbers: {
        ...session?.data.removedSetNumbers,
        [exercise.id]: [...new Set([...removedNumbers, n])],
      },
    });
  }
  const done = current.filter((r) => r.data.completed).length;
  const requiredCount = Math.max(1, defaultCount - removedNumbers.length);
  const doneAll = done >= requiredCount;
  const nextNumber =
    Math.max(
      defaultCount,
      ...current.map((r) => numeric(r.data.setNumber)),
      0,
    ) + 1;
  return (
    <article
      className={`card exercise-card ${skipped ? "exercise-skipped" : ""}`}
    >
      <button
        className="exercise-heading"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={`exercise-number ${doneAll ? "done" : ""}`}>
          {doneAll ? <Check size={18} /> : String(index + 1).padStart(2, "0")}
        </span>
        <span className="exercise-title">
          <strong>{exercise.name}</strong>
          <span className="muted">
            {exercise.sets} × {exercise.minReps}–{exercise.maxReps}
            {exercise.unilateral ? " por lado" : ""} · {exercise.muscles}
          </span>
        </span>
        <span className="exercise-completion">
          {skipped ? "Omitido" : `${done}/${requiredCount}`}
        </span>
        <ChevronDown size={18} className={open ? "turned" : ""} />
      </button>
      {open && (
        <div className="exercise-content stack">
          <div className="exercise-loads">
            <div>
              <span className="eyebrow">
                SUGERIDO {recommendation.provisional ? "· PROVISIONAL" : ""}
              </span>
              <strong>
                {exercise.bodyweight
                  ? `BW${recommendation.weightLb ? ` · ${previous[0]?.data.bodyweightMode === "assistance" ? "ayuda" : "extra"} ${toDisplay(recommendation.weightLb, unit)} ${unit}` : ""}`
                  : `${toDisplay(recommendation.weightLb, unit)} ${unit}`}
              </strong>
            </div>
            <div>
              <span className="eyebrow">ÚLTIMA SESIÓN</span>
              <strong>
                {previous.length
                  ? `${toDisplay(numeric(previous[0].data.weightLb), unit)} ${unit}`
                  : "Sin registro"}
              </strong>
            </div>
            <div>
              <span className="eyebrow">MEJOR CARGA</span>
              <strong>
                {record ? `${toDisplay(record, unit)} ${unit}` : "—"}
              </strong>
            </div>
          </div>
          {exercise.weightNote && (
            <p className="muted small">{exercise.weightNote}</p>
          )}
          <p className="muted small">
            {recommendation.reason}{" "}
            {exercise.bodyweight
              ? "BW = peso corporal. Registra solo la resistencia adicional o asistencia."
              : "En máquinas, verifica la escala y anota el equipo: las resistencias varían."}
          </p>
          <a
            className="exercise-video"
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Play size={16} /> Ver cómo se hace <ExternalLink size={14} />
          </a>
          <details className="technique-details">
            <summary>Técnica y errores comunes</summary>
            <div className="technique-grid">
              <div>
                <strong>Claves de ejecución</strong>
                <ul>
                  {exercise.cues.map((cue, i) => (
                    <li key={i}>{cue}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Evita</strong>
                <ul>
                  {exercise.mistakes.map((mistake, i) => (
                    <li key={i}>{mistake}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="muted small">
              Detén la serie si aparece dolor agudo. Ajusta recorrido y carga a
              tu control actual.
            </p>
          </details>
          {session && !skipped && (
            <>
              <div className="set-column-labels" aria-hidden="true">
                <span>Serie</span>
                <span>
                  {exercise.bodyweight ? "Extra / ayuda" : `Peso (${unit})`}
                </span>
                <span>Reps</span>
                <span>RIR</span>
                <span>Guardar</span>
              </div>
              <div className="set-rows">
                {Array.from({ length: defaultCount }, (_, i) => {
                  const n = i + 1;
                  if (removedNumbers.includes(n)) return null;
                  return (
                    <SetRow
                      key={`${exercise.id}:${n}`}
                      number={n}
                      row={current.find((r) => r.data.setNumber === n)}
                      previousRow={current.find(
                        (r) => r.data.setNumber === n - 1,
                      )}
                      lastRow={
                        previous.find((r) => r.data.setNumber === n) ||
                        previous[0]
                      }
                      exercise={exercise}
                      store={store}
                      session={session}
                      date={date}
                      unit={unit}
                      suggested={recommendation.weightLb}
                      onCompleted={() => {
                        onSaved();
                      }}
                      onRest={onRest}
                      removable={defaultCount - removedNumbers.length > 1}
                      onRemoved={() => removeNumber(n)}
                    />
                  );
                })}
              </div>
              <div className="row workout-set-actions">
                <button
                  className="btn ghost"
                  onClick={() =>
                    sessionConfig({
                      setCounts: {
                        ...session?.data.setCounts,
                        [exercise.id]: nextNumber,
                      },
                    })
                  }
                >
                  <Plus size={16} /> Añadir serie
                </button>
                {!session.data.finishedAt && (
                  <button className="btn ghost" onClick={onSkip}>
                    <SkipForward size={16} /> Omitir ejercicio
                  </button>
                )}
              </div>
              {done === 0 && (
                <label className="field">
                  <span>Sustituir ejercicio en esta sesión</span>
                  <select
                    value={exercise.id}
                    onChange={(e) => onSubstitute(e.target.value)}
                  >
                    {catalog.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
          {skipped && (
            <div className="row">
              <p className="muted">Ejercicio omitido en esta sesión.</p>
              <button className="btn ghost" onClick={onUnskip}>
                Volver a incluir
              </button>
            </div>
          )}
          {!session && (
            <p className="muted small">
              Comienza el entrenamiento para registrar tus series. El peso
              sugerido se puede editar en cada serie.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

type SetProps = {
  number: number;
  row?: Row;
  previousRow?: Row;
  lastRow?: Row;
  exercise: Exercise;
  store: FitStore;
  session: Row;
  date: string;
  unit: Unit;
  suggested: number;
  onCompleted: () => void;
  onRest: () => void;
  removable: boolean;
  onRemoved: () => void;
};
function SetRow({
  number,
  row,
  previousRow,
  lastRow,
  exercise,
  store,
  session,
  date,
  unit,
  suggested,
  onCompleted,
  onRest,
  removable,
  onRemoved,
}: SetProps) {
  const [weight, setWeight] = useState(
    String(
      toDisplay(
        numeric(
          row?.data.weightLb,
          lastRow
            ? numeric(lastRow.data.weightLb)
            : exercise.bodyweight
              ? 0
              : suggested,
        ),
        unit,
      ),
    ),
  );
  const [reps, setReps] = useState(
    String(row?.data.reps ?? lastRow?.data.reps ?? exercise.minReps),
  );
  const [rir, setRir] = useState(String(row?.data.rir ?? ""));
  const [mode, setMode] = useState(
    row?.data.bodyweightMode || lastRow?.data.bodyweightMode || "additional",
  );
  const [technique, setTechnique] = useState(row?.data.techniqueGood ?? false);
  const [error, setError] = useState("");
  const [removed, setRemoved] = useState(false);
  const [equipment, setEquipment] = useState(
    row?.data.equipment || lastRow?.data.equipment || "",
  );
  const editingRef = useRef(false);
  useEffect(() => {
    if (editingRef.current || !row) return;
    setWeight(String(toDisplay(numeric(row.data.weightLb), unit)));
    setReps(String(row.data.reps ?? exercise.minReps));
    setRir(row.data.rir == null ? "" : String(row.data.rir));
    setMode(row.data.bodyweightMode || "additional");
    setTechnique(row.data.techniqueGood === true);
    setEquipment(row.data.equipment || "");
  }, [row?.id, row?.updated_at]);
  useEffect(() => {
    setWeight(
      String(
        toDisplay(
          numeric(
            row?.data.weightLb,
            lastRow
              ? numeric(lastRow.data.weightLb)
              : exercise.bodyweight
                ? 0
                : suggested,
          ),
          unit,
        ),
      ),
    );
  }, [unit]);
  const valid =
    weight.trim() !== "" &&
    Number(weight) >= 0 &&
    Number.isFinite(Number(weight)) &&
    reps.trim() !== "" &&
    Number.isInteger(Number(reps)) &&
    Number(reps) > 0 &&
    Number(reps) <= 500 &&
    (rir === "" ||
      (Number(rir) >= 0 && Number(rir) <= 10 && Number.isFinite(Number(rir))));
  function save(completed: boolean) {
    if (!valid) {
      setError(
        "Usa peso ≥ 0, repeticiones enteras de 1 a 500 y RIR de 0 a 10.",
      );
      return;
    }
    safeSave(() => {
      store.save(
        "workout_sets",
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          exerciseSnapshot: { ...exercise },
          weightLb: toLb(Number(weight), unit),
          reps: Number(reps),
          rir: rir === "" ? null : Number(rir),
          techniqueGood: technique ? true : null,
          completed,
          setNumber: number,
          bodyweightMode: exercise.bodyweight ? mode : null,
          equipment,
          completedAt: completed ? new Date().toISOString() : null,
        },
        {
          id:
            row?.id ||
            seedId(store.userId, `${session.id}:${exercise.id}:set:${number}`),
          session_id: session.id,
          local_date: date,
        },
      );
      if (completed) onCompleted();
    }, setError);
  }
  function remove() {
    if (
      row &&
      !window.confirm(`¿Eliminar la serie ${number} de ${exercise.name}?`)
    )
      return;
    safeSave(() => {
      if (row) store.remove("workout_sets", row);
      setRemoved(true);
      onRemoved();
    }, setError);
  }
  if (removed)
    return (
      <button className="btn ghost" onClick={() => setRemoved(false)}>
        <Plus size={14} /> Reponer serie {number}
      </button>
    );
  return (
    <div
      className={`set-wrap ${row?.data.completed ? "set-completed" : ""}`}
      onFocusCapture={() => {
        editingRef.current = true;
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          editingRef.current = false;
      }}
    >
      <div className="set-row">
        <span className="set-index">{number}</span>
        <label>
          <span className="sr-only">
            {exercise.name} serie {number} peso {unit}
          </span>
          <input
            inputMode="decimal"
            type="number"
            min="0"
            max="3000"
            step={unit === "kg" ? 1 : exercise.stepLb || 2.5}
            list={`weights-${exercise.id}`}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={() => {
              if (!row?.data.completed) save(false);
            }}
          />
        </label>
        <label>
          <span className="sr-only">
            {exercise.name} serie {number} repeticiones
          </span>
          <input
            inputMode="numeric"
            type="number"
            min="1"
            max="500"
            step="1"
            list="fittrack-repetitions"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={() => {
              if (!row?.data.completed) save(false);
            }}
          />
        </label>
        <label>
          <span className="sr-only">
            {exercise.name} serie {number} RIR opcional
          </span>
          <input
            inputMode="decimal"
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={rir}
            placeholder="—"
            onChange={(e) => setRir(e.target.value)}
            onBlur={() => {
              if (!row?.data.completed) save(false);
            }}
          />
        </label>
        <button
          className={`btn set-save ${row?.data.completed ? "saved" : ""}`}
          onClick={() => save(true)}
          aria-label={`Completar serie ${number} de ${exercise.name}`}
        >
          <Check size={20} />
        </button>
      </div>
      <div className="set-extras">
        <label className="technique-check">
          <input
            type="checkbox"
            checked={technique}
            onChange={(e) => setTechnique(e.target.checked)}
          />
          <span>Técnica controlada</span>
        </label>
        {previousRow && (
          <button
            className="text-button"
            onClick={() =>
              setWeight(
                String(toDisplay(numeric(previousRow.data.weightLb), unit)),
              )
            }
          >
            <Copy size={13} /> Copiar peso
          </button>
        )}
        <button className="text-button" onClick={onRest}>
          <Timer size={13} /> Descanso
        </button>
        {removable && (
          <button
            className="text-button"
            onClick={remove}
            aria-label={`Eliminar serie ${number}`}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {exercise.bodyweight && (
        <label className="bw-label">
          <span>
            BW ·{" "}
            {Number(weight) === 0
              ? "sin carga extra"
              : "resistencia registrada"}
          </span>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="additional">Peso adicional</option>
            <option value="assistance">Asistencia</option>
          </select>
        </label>
      )}
      {number === 1 && (
        <label className="field equipment-field">
          <span>Equipo / máquina (opcional)</span>
          <input
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="Ej.: máquina del gimnasio A"
            onBlur={() => {
              if (!row?.data.completed) save(false);
            }}
          />
        </label>
      )}
      {row?.data.completed && (
        <span className="set-saved-label">
          <Check size={12} /> Serie guardada · modifica y pulsa ✓ para
          actualizar
        </span>
      )}
      {error && (
        <p className="danger small" role="alert">
          {error}
        </p>
      )}
      {number === 1 && (
        <datalist id={`weights-${exercise.id}`}>
          {Array.from({ length: 101 }, (_, i) => (
            <option
              key={i}
              value={toDisplay(i * (exercise.stepLb || 2.5), unit)}
            />
          ))}
        </datalist>
      )}
      {number === 1 && (
        <datalist id="fittrack-repetitions">
          {Array.from({ length: 30 }, (_, i) => (
            <option key={i} value={i + 1} />
          ))}
        </datalist>
      )}
    </div>
  );
}

function CardioCard({
  store,
  date,
  plan,
}: {
  store: FitStore;
  date: string;
  plan: Record<string, any>;
}) {
  const [kind, setKind] = useState("walk");
  const [minutes, setMinutes] = useState(String(plan.walkMinutes || 20));
  const [distance, setDistance] = useState("");
  const [steps, setSteps] = useState("");
  const [rounds, setRounds] = useState(String(plan.rope?.rounds || 5));
  const [work, setWork] = useState(String(plan.rope?.work || 20));
  const [rest, setRest] = useState(String(plan.rope?.rest || 60));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [draftDate, setDraftDate] = useState(date);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<Row | undefined>();
  const logs = store.list("cardio_logs", date);
  useEffect(() => {
    if (!dirty && !editing) setDraftDate(date);
  }, [date, dirty, editing]);
  useEffect(() => {
    if (!dirty && !editing)
      setMinutes(
        String(
          kind === "mobility"
            ? plan.mobilityMinutes || 10
            : plan.walkMinutes || 20,
        ),
      );
  }, [date, kind, dirty, editing]);
  function edit(row: Row) {
    setDirty(true);
    setEditing(row);
    setDraftDate(row.local_date || date);
    setKind(row.data.kind || "walk");
    setMinutes(String(row.data.minutes || 0));
    setDistance(
      row.data.distanceKm === null ? "" : String(row.data.distanceKm || ""),
    );
    setSteps(row.data.steps === null ? "" : String(row.data.steps || ""));
    setRounds(String(row.data.rounds || 5));
    setWork(String(row.data.workSeconds || 20));
    setRest(String(row.data.restSeconds || 60));
    setNotes(row.data.notes || "");
  }
  function save() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draftDate)) {
      setError("Selecciona una fecha válida.");
      return;
    }
    const target = editing?.local_date || draftDate;
    const min = Number(minutes),
      dist = distance === "" ? null : Number(distance),
      stepCount = steps === "" ? null : Number(steps);
    if (kind !== "rope" && (!Number.isFinite(min) || min <= 0 || min > 1440)) {
      setError("Introduce entre 1 y 1,440 minutos.");
      return;
    }
    if (
      (dist !== null && (!Number.isFinite(dist) || dist < 0)) ||
      (stepCount !== null && (!Number.isInteger(stepCount) || stepCount < 0))
    ) {
      setError("Distancia y pasos deben ser valores positivos.");
      return;
    }
    if (
      kind === "rope" &&
      (!Number.isInteger(Number(rounds)) ||
        Number(rounds) < 1 ||
        Number(rounds) > 100 ||
        Number(work) <= 0 ||
        Number(rest) < 0)
    ) {
      setError("Comprueba los intervalos de cuica.");
      return;
    }
    safeSave(() => {
      store.save(
        "cardio_logs",
        {
          kind,
          title:
            kind === "walk"
              ? "Caminata"
              : kind === "mobility"
                ? "Movilidad general"
                : "Cuica",
          minutes:
            kind === "rope"
              ? (Number(rounds) * Number(work) +
                  Math.max(0, Number(rounds) - 1) * Number(rest)) /
                60
              : min,
          distanceKm: dist,
          steps: stepCount,
          rounds: kind === "rope" ? Number(rounds) : null,
          workSeconds: kind === "rope" ? Number(work) : null,
          restSeconds: kind === "rope" ? Number(rest) : null,
          notes,
          recordedAt: new Date().toISOString(),
        },
        { id: editing?.id, local_date: target },
      );
      setEditing(undefined);
      setDirty(false);
      setDraftDate(date);
      setNotes("");
      setDistance("");
      setSteps("");
    }, setError);
  }
  return (
    <section className="card stack" onChange={() => setDirty(true)}>
      <div className="section-title">
        <div>
          <p className="eyebrow">MOVIMIENTO DIARIO</p>
          <h2>Cardio y movilidad</h2>
        </div>
        <Footprints size={24} />
      </div>
      <p className="muted">
        {plan.type === "rest"
          ? "Caminata opcional."
          : `Caminata: ${plan.walkMinutes || 0} min${plan.mobilityMinutes ? ` · movilidad: ${plan.mobilityMinutes} min` : ""}${plan.rope ? ` · cuica: ${plan.rope.rounds} × ${plan.rope.work} s, descanso ${plan.rope.rest} s` : ""}.`}{" "}
        Las calorías de actividad no se descuentan de tu objetivo nutricional.
      </p>
      <label className="field">
        <span>Fecha del registro (Puerto Rico)</span>
        <input
          type="date"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          required
        />
      </label>
      {draftDate !== date && /^\d{4}-\d{2}-\d{2}$/.test(draftDate) && (
        <p className="muted small">
          Esta actividad se guardará en {dateLabel(draftDate)}. La fecha no
          cambia mientras completas el formulario.
        </p>
      )}
      <div className="grid2">
        <label className="field">
          <span>Actividad</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="walk">Caminata</option>
            <option value="rope">Cuica</option>
            <option value="mobility">Movilidad</option>
          </select>
        </label>
        {kind !== "rope" && (
          <label className="field">
            <span>Tiempo (minutos)</span>
            <input
              type="number"
              min="1"
              max="1440"
              step="0.5"
              inputMode="decimal"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
        )}
      </div>
      {kind === "rope" ? (
        <div className="grid2">
          <label className="field">
            <span>Intervalos</span>
            <input
              type="number"
              min="1"
              max="100"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Trabajo (segundos)</span>
            <input
              type="number"
              min="1"
              value={work}
              onChange={(e) => setWork(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Descanso (segundos)</span>
            <input
              type="number"
              min="0"
              value={rest}
              onChange={(e) => setRest(e.target.value)}
            />
          </label>
        </div>
      ) : (
        kind === "walk" && (
          <div className="grid2">
            <label className="field">
              <span>Distancia (km, opcional)</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Pasos (opcional)</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
              />
            </label>
          </div>
        )
      )}
      <label className="field">
        <span>Observaciones (opcional)</span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ruta, ritmo, sensaciones…"
        />
      </label>
      {error && (
        <p className="danger" role="alert">
          {error}
        </p>
      )}
      <div className="row">
        <button className="btn primary" onClick={save}>
          <Check size={17} />
          {editing ? "Actualizar actividad" : "Registrar actividad"}
        </button>
        {editing && (
          <button className="btn ghost" onClick={() => setEditing(undefined)}>
            Cancelar edición
          </button>
        )}
      </div>
      {logs.length > 0 && (
        <div className="cardio-logs">
          {logs.map((row) => (
            <div className="cardio-log" key={row.id}>
              <div>
                <strong>{row.data.title}</strong>
                <p className="muted small">
                  {Math.round(numeric(row.data.minutes) * 10) / 10} min
                  {row.data.distanceKm ? ` · ${row.data.distanceKm} km` : ""}
                  {row.data.steps ? ` · ${row.data.steps} pasos` : ""}
                  {row.data.rounds
                    ? ` · ${row.data.rounds} × ${row.data.workSeconds} s`
                    : ""}
                </p>
                {row.data.notes && (
                  <p className="muted small">{row.data.notes}</p>
                )}
              </div>
              <div className="row">
                <button className="text-button" onClick={() => edit(row)}>
                  Editar
                </button>
                <button
                  className="text-button"
                  aria-label={`Eliminar ${row.data.title}`}
                  onClick={() => {
                    if (window.confirm("¿Eliminar esta actividad?"))
                      safeSave(
                        () => store.remove("cardio_logs", row),
                        setError,
                      );
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
