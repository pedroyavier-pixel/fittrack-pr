import {exerciseVariants,variantNotice} from "../data/exerciseVariants";
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
  type Exercise,
} from "../data/training";
import { type FitStore, type Row, seedId, useStore } from "../lib/store";
import { dateLabel, formatTime, prDate, weekday } from "../lib/time";
import {cardioActivities,cardioLabel,type ConditioningPrescription} from "../data/conditioning";
import "./Workout.css";
import {defaultLoadBasis,normalizeLoad,loadLabels,type LoadBasis} from "../lib/loads";

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
      {sessionPlan.sessionPhases?.length>0 && <details className="card technique-details"><summary>Distribución de tu sesión</summary><div className="stack">{sessionPlan.sessionPhases.map((phase: {kind:string;label:string;minutes:number},i:number)=><p key={i}><strong>{Math.round(phase.minutes*10)/10} min</strong> · {phase.label}</p>)}<p className="muted small">Tiempos orientativos con descansos incluidos. Ajusta el ritmo a tu técnica y recuperación.</p></div></details>}
      {sessionPlan.conditioning && <ConditioningBlock key={session?.id || "unstarted-conditioning"} store={store} date={lockedDate} plan={sessionPlan} catalog={catalog} session={session} onSessionCreated={setSessionId}/>}
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
  const weightNote=exercises.find(item=>item.id===exercise.id)?.weightNote || exercise.weightNote;

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
          <details className="technique-details">
            <summary>Dos variantes</summary>
            <p className="muted small">Alternativas de función similar; el recorrido, la estabilidad y la demanda pueden cambiar. {variantNotice}</p>
            <div className="variant-options">{(exerciseVariants[exercise.id] || []).map(id=>{
              const alternative=exercises.find(candidate=>candidate.id===id);
              if(!alternative)return null;
              const available=catalog.some(candidate=>candidate.id===id);
              return <div className="variant-option" key={id}><div><strong>{alternative.name}</strong><p className="muted small">{alternative.equipment?.map(item=>({dumbbell:'Mancuernas',bench:'Banco',cable:'Polea',bodyweight:'Peso corporal',barbell:'Barra',machine:'Máquina','ez-bar':'Barra EZ',band:'Banda elástica','exercise-ball':'Balón de ejercicio'}[item] || item)).join(' · ') || alternative.muscles}</p><a href={alternative.videoUrl} target="_blank" rel="noopener noreferrer">Ver técnica ↗</a></div>
              {session && available && done===0 && !session.data.finishedAt && <button className="btn ghost" onClick={()=>onSubstitute(id)}>Usar variante</button>}
              {session && (!available || done>0) && <small className="muted">{done>0?'Ya hay series guardadas; conserva su ejercicio.':'Ya está en la sesión.'}</small>}</div>;
            })}</div>
          </details>
          <div className="exercise-loads">
            <div>
              <span className="eyebrow">ÚLTIMA SESIÓN</span>
              <strong>
                {previous.length
                  ? `${toDisplay(numeric(previous[0].data.weightLb), unit)} ${unit}`
                  : "Sin registro"}
              </strong>
            </div>
            <div>
              <span className="eyebrow">MÁXIMA REGISTRADA</span>
              <strong>
                {record ? `${toDisplay(record, unit)} ${unit}` : "—"}
              </strong>
            </div>
          </div>
          {previous.length>0 && <p className="muted small">Última convención: {previous[0].data.loadBasis ? loadLabels[previous[0].data.loadBasis as LoadBasis] : 'registro anterior sin especificar'}. Las cargas de equipos o convenciones diferentes no son comparables.</p>}
          {weightNote && (
            <p className="muted small">{weightNote}</p>
          )}
          <p className="muted small">
            Elige una carga que controles. No se asignan pesos automáticamente.{" "}
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
              lo introduces tú en cada serie.
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
  onCompleted,
  onRest,
  removable,
  onRemoved,
}: SetProps) {
  const source = row?.data;
  const [basis,setBasis] = useState<LoadBasis>(source?.loadBasis || (source ? 'total' : defaultLoadBasis(exercise.id)));
  const [bar,setBar] = useState(source?.barWeightLb == null ? '' : String(toDisplay(source.barWeightLb,unit)));
  const [weight, setWeight] = useState(source ? String(toDisplay(source.enteredWeightLb ?? source.weightLb,unit)) : exercise.bodyweight ? '0' : '');
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
    setWeight(String(toDisplay(numeric(row.data.enteredWeightLb ?? row.data.weightLb), unit)));
    setBasis(row.data.loadBasis || "total");
    setBar(row.data.barWeightLb == null ? "" : String(toDisplay(row.data.barWeightLb,unit)));
    setReps(String(row.data.reps ?? exercise.minReps));
    setRir(row.data.rir == null ? "" : String(row.data.rir));
    setMode(row.data.bodyweightMode || "additional");
    setTechnique(row.data.techniqueGood === true);
    setEquipment(row.data.equipment || "");
  }, [row?.id, row?.updated_at]);
  const lastUnit = useRef(unit);
  useEffect(() => {
    const previousUnit = lastUnit.current;
    if(previousUnit !== unit) {
      setWeight(value => value === '' ? '' : String(toDisplay(toLb(Number(value),previousUnit),unit)));
      setBar(value => value === '' ? '' : String(toDisplay(toLb(Number(value),previousUnit),unit)));
      lastUnit.current=unit;
    }
  }, [unit]);
  const valid =
    (basis !== "bar_sides" || (bar.trim() !== "" && Number.isFinite(Number(bar)) && Number(bar)>=0)) &&
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
          ...normalizeLoad(toLb(Number(weight), unit),exercise.bodyweight ? "total" : basis,bar === "" ? undefined : toLb(Number(bar),unit)),
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
      {!exercise.bodyweight && <div className="load-convention">
        <label className="field">Cómo registras la carga · serie {number}
          <select value={basis} onChange={e=>{setBasis(e.target.value as LoadBasis);setWeight('');setBar('');}}>
            {Object.entries(loadLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {basis==='bar_sides' && <label className="field">Peso real de barra / Smith ({unit})
          <input type="number" min="0" step="any" value={bar} placeholder="Consulta el equipo" onChange={e=>setBar(e.target.value)} />
        </label>}
        <p className="muted small">{basis==='bar_sides'?'Escribe los discos de UN lado. Total = discos × 2 + barra real.':basis==='per_hand'?'Escribe el peso de UNA mancuerna. Con dos mancuernas iguales se calcula el total × 2. Si usas sólo una, selecciona Total.':basis==='per_side'?'Escribe los discos de UN lado. Se cuentan ambos lados; la resistencia base de la máquina no está incluida.':'Escribe el total mostrado por la máquina o la carga externa total.'}</p>
        {row && !row.data.loadBasis && <p className="muted small">Registro anterior: conserva su carga original como total sin recalcularla. Comprueba la convención antes de editar.</p>}
      </div>}
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
            onClick={() => {
              setWeight(String(toDisplay(numeric(previousRow.data.enteredWeightLb ?? previousRow.data.weightLb),unit)));
              setBasis(previousRow.data.loadBasis || "total");
              setBar(previousRow.data.barWeightLb == null ? "" : String(toDisplay(previousRow.data.barWeightLb,unit)));
              setMode(previousRow.data.bodyweightMode || "additional");
            }}
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

type CardioPlanSnapshot = {
  kind: string;
  minutes: number;
  rounds?: number;
  workSeconds?: number;
  restSeconds?: number;
  intensity?: string;
};

function validCardioDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00-04:00`);
  return Number.isFinite(parsed.getTime()) && prDate(parsed) === value;
}

function plannedCardios(plan: Record<string, any>): CardioPlanSnapshot[] {
  const entries = Array.isArray(plan.cardio) ? plan.cardio : plan.cardio && typeof plan.cardio === "object" ? [plan.cardio] : null;
  if (entries) return entries.filter((item: unknown) => item && typeof item === "object").map((configured: Record<string, any>) => ({
    kind: typeof configured.kind === "string" ? configured.kind : "walk",
    minutes: numeric(configured.minutes),
    ...(configured.rounds != null ? {rounds: numeric(configured.rounds)} : {}),
    ...(configured.workSeconds != null ? {workSeconds: numeric(configured.workSeconds)} : {}),
    ...(configured.restSeconds != null ? {restSeconds: numeric(configured.restSeconds)} : {}),
    intensity: typeof configured.intensity === "string" ? configured.intensity : "",
  }));
  const legacy: CardioPlanSnapshot[] = [];
  if (numeric(plan.walkMinutes) > 0) legacy.push({kind: "walk", minutes: numeric(plan.walkMinutes)});
  if (plan.rope && numeric(plan.rope.rounds) > 0 && numeric(plan.rope.work) > 0) legacy.push({kind: "rope", minutes: intervalMinutes(plan.rope.rounds, plan.rope.work, plan.rope.rest ?? 0), rounds: numeric(plan.rope.rounds), workSeconds: numeric(plan.rope.work), restSeconds: numeric(plan.rope.rest)});
  return legacy;
}

function intervalMinutes(rounds: string | number, work: string | number, rest: string | number) {
  return (Number(rounds) * Number(work) + Math.max(0, Number(rounds) - 1) * Number(rest)) / 60;
}

export function CardioCard({
  store,
  date,
  plan,
}: {
  store: FitStore;
  date: string;
  plan: Record<string, any>;
}) {
  const currentPlannedList = plannedCardios(plan);
  const currentPlanned = currentPlannedList[0] || null;
  const initialKind = currentPlanned?.kind || "walk";
  const activityFor = (value: string) => cardioActivities.find((activity) => activity.id === value);
  const supportsDistance = (value: string) => !!activityFor(value)?.supportsDistance;
  const supportsSteps = (value: string) => ["walk", "run", "walk_run", "stairs", "hike"].includes(value) && !!activityFor(value)?.supportsSteps;
  const initialIntervals = !!(currentPlanned?.rounds && currentPlanned.workSeconds);
  const [kind, setKind] = useState(initialKind);
  const [minutes, setMinutes] = useState(String(currentPlanned?.minutes || 20));
  const [distance, setDistance] = useState("");
  const [steps, setSteps] = useState("");
  const [intervals, setIntervals] = useState(initialIntervals);
  const [rounds, setRounds] = useState(String(currentPlanned?.rounds ?? plan.rope?.rounds ?? 5));
  const [work, setWork] = useState(String(currentPlanned?.workSeconds ?? plan.rope?.work ?? 20));
  const [rest, setRest] = useState(String(currentPlanned?.restSeconds ?? plan.rope?.rest ?? 60));
  const [rpe, setRpe] = useState("");
  const [lowImpact, setLowImpact] = useState(activityFor(initialKind)?.impact === "low");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [draftDate, setDraftDate] = useState(date);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<Row | undefined>();
  const [plannedSnapshot, setPlannedSnapshot] = useState<CardioPlanSnapshot | null>(currentPlanned);
  const logs = store.list("cardio_logs", date).filter(row => !row.data.conditioning && !["circuit", "emom"].includes(row.data.kind));
  const [planListSnapshot, setPlanListSnapshot] = useState<CardioPlanSnapshot[]>(currentPlannedList);
  const planSignature = JSON.stringify({cardio: currentPlannedList, rope: plan.rope, mobilityMinutes: plan.mobilityMinutes});
  const activity = activityFor(kind);
  const computedMinutes = intervalMinutes(rounds, work, rest);
  const actualMinutes = intervals ? computedMinutes : Number(minutes);

  function resetDraft() {
    const nextList = plannedCardios(plan);
    const next = nextList[0] || null;
    setPlanListSnapshot(nextList);
    const nextKind = next?.kind || "walk";
    setKind(nextKind);
    setMinutes(String(next?.minutes || 20));
    setIntervals(!!(next?.rounds && next.workSeconds));
    setRounds(String(next?.rounds ?? plan.rope?.rounds ?? 5));
    setWork(String(next?.workSeconds ?? plan.rope?.work ?? 20));
    setRest(String(next?.restSeconds ?? plan.rope?.rest ?? 60));
    setDistance("");
    setSteps("");
    setRpe("");
    setLowImpact(activityFor(nextKind)?.impact === "low");
    setNotes("");
    setDraftDate(date);
    setPlannedSnapshot(next);
    setEditing(undefined);
    setDirty(false);
    setError("");
  }

  // A draft retains its original date, plan and actual inputs across midnight.
  // Only an untouched form follows a new date or a changed plan automatically.
  useEffect(() => {
    if (!dirty && !editing) resetDraft();
  }, [date, planSignature]);

  function changeKind(nextKind: string) {
    setKind(nextKind);
    // Measurements belong to the selected activity, even when both activities
    // accept distance. A previous activity's hidden values must never leak.
    setDistance("");
    setSteps("");
    setLowImpact(activityFor(nextKind)?.impact === "low");
    const nextIsPlanned = nextKind === plannedSnapshot?.kind;
    const nextIntervals = !!(nextIsPlanned && plannedSnapshot?.rounds && plannedSnapshot.workSeconds);
    setIntervals(nextKind === "rope" || nextIntervals);
    setRounds(String(nextIsPlanned ? plannedSnapshot?.rounds ?? 5 : plan.rope?.rounds ?? 5));
    setWork(String(nextIsPlanned ? plannedSnapshot?.workSeconds ?? 20 : plan.rope?.work ?? 20));
    setRest(String(nextIsPlanned ? plannedSnapshot?.restSeconds ?? 60 : plan.rope?.rest ?? 60));
    if (!dirty)
      setMinutes(String(nextKind === "mobility" ? plan.mobilityMinutes || 10 : (nextIsPlanned ? plannedSnapshot?.minutes : null) || 20));
    setDirty(true);
    setError("");
  }

  function edit(row: Row) {
    const savedKind = typeof row.data.kind === "string" ? row.data.kind : "walk";
    setDirty(true);
    setEditing(row);
    setDraftDate(row.local_date || date);
    setKind(savedKind);
    setMinutes(String(row.data.minutes ?? 0));
    setDistance(row.data.distanceKm == null ? "" : String(row.data.distanceKm));
    setSteps(row.data.steps == null ? "" : String(row.data.steps));
    setIntervals(row.data.intervals === true || (numeric(row.data.rounds) > 0 && numeric(row.data.workSeconds ?? row.data.work) > 0));
    setRounds(String(row.data.rounds ?? 5));
    setWork(String(row.data.workSeconds ?? row.data.work ?? 20));
    setRest(String(row.data.restSeconds ?? row.data.rest ?? 60));
    setRpe(row.data.rpe == null ? "" : String(row.data.rpe));
    setLowImpact(typeof row.data.lowImpact === "boolean" ? row.data.lowImpact : activityFor(savedKind)?.impact === "low");
    setNotes(row.data.notes || "");
    setPlannedSnapshot(row.data.plannedCardio && typeof row.data.plannedCardio === "object" ? {...row.data.plannedCardio} : null);
    setPlanListSnapshot(row.data.plannedCardio && typeof row.data.plannedCardio === "object" ? [{...row.data.plannedCardio}] : []);
    setError("");
  }

  function save() {
    if (!validCardioDate(draftDate)) {
      setError("Selecciona una fecha válida.");
      return;
    }
    if (!activity && kind !== "mobility") {
      setError("Selecciona una actividad disponible.");
      return;
    }
    if (intervals && (
      !Number.isSafeInteger(Number(rounds)) || Number(rounds) < 1 || Number(rounds) > 100 ||
      !Number.isSafeInteger(Number(work)) || Number(work) < 1 || Number(work) > 86400 ||
      rest.trim() === "" || !Number.isSafeInteger(Number(rest)) || Number(rest) < 0 || Number(rest) > 86400
    )) {
      setError("Usa de 1 a 100 intervalos, segundos de trabajo enteros positivos y descanso entero de 0 o más segundos.");
      return;
    }
    if ((!intervals && minutes.trim() === "") || !Number.isFinite(actualMinutes) || actualMinutes <= 0 || actualMinutes > 1440) {
      setError("Introduce una duración mayor que 0 y de hasta 1,440 minutos.");
      return;
    }
    const dist = supportsDistance(kind) && distance.trim() !== "" ? Number(distance) : null;
    const stepCount = supportsSteps(kind) && steps.trim() !== "" ? Number(steps) : null;
    const actualRpe = rpe.trim() === "" ? null : Number(rpe);
    if ((dist !== null && (!Number.isFinite(dist) || dist < 0)) ||
        (stepCount !== null && (!Number.isSafeInteger(stepCount) || stepCount < 0))) {
      setError("La distancia debe ser un número finito de 0 o más y los pasos un número entero de 0 o más.");
      return;
    }
    if (actualRpe !== null && (!Number.isFinite(actualRpe) || actualRpe < 1 || actualRpe > 10)) {
      setError("El esfuerzo percibido (RPE) debe estar entre 1 y 10.");
      return;
    }
    safeSave(() => {
      store.save("cardio_logs", {
        ...(editing?.data || {}),
        kind,
        title: cardioLabel(kind),
        minutes: actualMinutes,
        distanceKm: dist,
        steps: stepCount,
        intervals,
        rounds: intervals ? Number(rounds) : null,
        workSeconds: intervals ? Number(work) : null,
        restSeconds: intervals ? Number(rest) : null,
        intensity: plannedSnapshot?.intensity || null,
        rpe: actualRpe,
        lowImpact,
        plannedCardio: plannedSnapshot ? {...plannedSnapshot} : null,
        notes,
        recordedAt: editing?.data.recordedAt || new Date().toISOString(),
      }, {id: editing?.id, local_date: draftDate});
      resetDraft();
    }, setError);
  }

  function planDescription(plannedSnapshot: CardioPlanSnapshot | null) {
    if (plannedSnapshot) {
      const intervalText = plannedSnapshot.rounds && plannedSnapshot.workSeconds
        ? ` · ${plannedSnapshot.rounds} × ${plannedSnapshot.workSeconds} s, descanso ${plannedSnapshot.restSeconds ?? 0} s`
        : "";
      return `${cardioLabel(plannedSnapshot.kind)}: ${plannedSnapshot.minutes} min${intervalText}${plannedSnapshot.intensity ? ` · ${plannedSnapshot.intensity}` : ""}.`;
    }
    return editing ? "Este registro anterior no tiene un plan guardado." : "No hay cardio obligatorio para este día. Puedes registrar movimiento opcional.";
  }

  return (
    <section className="card stack" onChange={() => setDirty(true)}>
      <div className="section-title">
        <div><p className="eyebrow">MOVIMIENTO DIARIO</p><h2>Cardio y movilidad</h2></div>
        <Footprints size={24}/>
      </div>
      <div className="card" style={{padding: "14px 16px"}}>
        <p className="eyebrow">PLANIFICADO · SOLO REFERENCIA</p>
        <p className="muted">{planListSnapshot.length ? planListSnapshot.map(item => planDescription(item)).join(" ") : planDescription(null)}{!editing && plan.mobilityMinutes ? ` Movilidad: ${plan.mobilityMinutes} min.` : ""}</p>
        <p className="muted small">Nada se contabiliza hasta registrar lo realizado. Las calorías de actividad no se descuentan de tu objetivo nutricional.</p>
      </div>
      {planListSnapshot.length > 1 && <label className="field"><span>Preparar una actividad del plan</span><select value={Math.max(0,planListSnapshot.findIndex(item => item.kind === plannedSnapshot?.kind))} onChange={event => {
        const chosen = planListSnapshot[Number(event.target.value)];
        if (!chosen) return;
        setPlannedSnapshot({...chosen});setKind(chosen.kind);setMinutes(String(chosen.minutes || 20));setIntervals(!!(chosen.rounds && chosen.workSeconds));setRounds(String(chosen.rounds ?? 5));setWork(String(chosen.workSeconds ?? 20));setRest(String(chosen.restSeconds ?? 60));setDistance("");setSteps("");setLowImpact(activityFor(chosen.kind)?.impact === "low");setDirty(true);
      }}>{planListSnapshot.map((item,index) => <option key={`${item.kind}:${index}`} value={index}>{cardioLabel(item.kind)} · {Math.round(item.minutes * 100) / 100} min</option>)}</select></label>}
      <p className="eyebrow">LO QUE REALMENTE HICISTE</p>
      <label className="field"><span>Fecha del registro (Puerto Rico)</span><input type="date" value={draftDate} onChange={event => setDraftDate(event.target.value)} required/></label>
      {draftDate !== date && validCardioDate(draftDate) && <p className="muted small">Esta actividad se guardará en {dateLabel(draftDate)}. La fecha y los valores no cambian mientras completas el formulario.</p>}
      <div className="grid2">
        <label className="field"><span>Actividad</span><select value={kind} onChange={event => changeKind(event.target.value)}>
          {cardioActivities.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
          <option value="mobility">Movilidad</option>
          {!activity && kind !== "mobility" && <option value={kind}>{cardioLabel(kind)} (registro anterior)</option>}
        </select></label>
        {!intervals && <label className="field"><span>Tiempo realizado (minutos)</span><input type="number" min="0.01" max="1440" step="0.5" inputMode="decimal" value={minutes} onChange={event => setMinutes(event.target.value)}/></label>}
      </div>
      <label className="technique-check"><input type="checkbox" checked={intervals} onChange={event => setIntervals(event.target.checked)}/><span>Registrar por intervalos (cualquier actividad)</span></label>
      {intervals && <>
        <div className="grid2">
          <label className="field"><span>Intervalos</span><input type="number" min="1" max="100" step="1" inputMode="numeric" value={rounds} onChange={event => setRounds(event.target.value)}/></label>
          <label className="field"><span>Trabajo (segundos)</span><input type="number" min="1" max="86400" step="1" inputMode="numeric" value={work} onChange={event => setWork(event.target.value)}/></label>
          <label className="field"><span>Descanso (segundos)</span><input type="number" min="0" max="86400" step="1" inputMode="numeric" value={rest} onChange={event => setRest(event.target.value)}/></label>
        </div>
        <p className="muted small">Tiempo calculado del bloque: {Number.isFinite(computedMinutes) && computedMinutes >= 0 ? `${Math.round(computedMinutes * 100) / 100} min` : "—"}. Incluye trabajo y descansos entre intervalos; no añade descanso tras el último.</p>
      </>}
      {(supportsDistance(kind) || supportsSteps(kind)) && <div className="grid2">
        {supportsDistance(kind) && <label className="field"><span>Distancia (km, opcional)</span><input type="number" inputMode="decimal" min="0" step="0.01" value={distance} onChange={event => setDistance(event.target.value)}/></label>}
        {supportsSteps(kind) && <label className="field"><span>Pasos (opcional)</span><input type="number" inputMode="numeric" min="0" step="1" value={steps} onChange={event => setSteps(event.target.value)}/></label>}
      </div>}
      <div className="grid2">
        <label className="field"><span>Esfuerzo percibido RPE (1–10, opcional)</span><input type="number" inputMode="decimal" min="1" max="10" step="0.5" value={rpe} onChange={event => setRpe(event.target.value)} placeholder="1 suave · 10 máximo"/></label>
        <label className="technique-check"><input type="checkbox" checked={lowImpact} onChange={event => setLowImpact(event.target.checked)}/><span>Realicé una variante de bajo impacto</span></label>
      </div>
      {activity && <p className="muted small">El impacto describe la carga mecánica, no el esfuerzo: puedes hacer cardio de bajo impacto con un RPE alto.</p>}
      <label className="field"><span>Observaciones (opcional)</span><input value={notes} onChange={event => setNotes(event.target.value)} placeholder="Ruta, ritmo, adaptación, sensaciones…"/></label>
      {error && <p className="danger" role="alert">{error}</p>}
      <div className="row">
        <button className="btn primary" onClick={save}><Check size={17}/>{editing ? "Actualizar actividad" : "Registrar actividad"}</button>
        {(editing || dirty) && <button className="btn ghost" onClick={resetDraft}>{editing ? "Cancelar edición" : "Restablecer formulario"}</button>}
      </div>
      {logs.length > 0 && <div className="cardio-logs">{logs.map(row => <div className="cardio-log" key={row.id}>
        <div>
          <strong>{row.data.title || cardioLabel(row.data.kind)}</strong>
          <p className="muted small">{Math.round(numeric(row.data.minutes) * 10) / 10} min{row.data.distanceKm != null ? ` · ${row.data.distanceKm} km` : ""}{row.data.steps != null ? ` · ${row.data.steps} pasos` : ""}{row.data.rounds ? ` · ${row.data.rounds} × ${row.data.workSeconds ?? row.data.work} s · descanso ${row.data.restSeconds ?? row.data.rest ?? 0} s` : ""}{row.data.rpe != null ? ` · RPE ${row.data.rpe}/10` : ""}{row.data.lowImpact === true ? " · bajo impacto" : ""}</p>
          {row.data.notes && <p className="muted small">{row.data.notes}</p>}
        </div>
        <div className="row">
          <button className="text-button" onClick={() => edit(row)}>Editar</button>
          <button className="text-button" aria-label={`Eliminar ${row.data.title || cardioLabel(row.data.kind)}`} onClick={() => {if (window.confirm("¿Eliminar esta actividad?")) safeSave(() => store.remove("cardio_logs", row), setError);}}><Trash2 size={16}/></button>
        </div>
      </div>)}</div>}
    </section>
  );
}

type ConditioningState = {
  status: "running" | "paused" | "finished";
  startedAt: string;
  resumedAt: string | null;
  accumulatedSeconds: number;
  prescription: ConditioningPrescription;
  completedAt?: string;
  roundsDraft?: string;
  minutesDraft?: string;
  rpeDraft?: string;
  notesDraft?: string;
};

function conditioningElapsed(state: ConditioningState | undefined, now: number) {
  if (!state) return 0;
  const accumulated = Math.max(0, numeric(state.accumulatedSeconds));
  const resumed = state.resumedAt ? Date.parse(state.resumedAt) : NaN;
  return accumulated + (state.status === "running" && Number.isFinite(resumed) ? Math.max(0, (now - resumed) / 1000) : 0);
}

function validConditioning(prescription: ConditioningPrescription) {
  return ["circuit", "emom"].includes(prescription.format) &&
    Array.isArray(prescription.exerciseIds) && prescription.exerciseIds.length > 0 && prescription.exerciseIds.length <= 100 &&
    Number.isSafeInteger(prescription.rounds) && prescription.rounds >= 1 && prescription.rounds <= 100 &&
    Number.isSafeInteger(prescription.workSeconds) && prescription.workSeconds >= 1 && prescription.workSeconds <= (prescription.format === "emom" ? 59 : 3600) &&
    Number.isSafeInteger(prescription.restSeconds) && prescription.restSeconds >= 0 && prescription.restSeconds <= 3600 &&
    Number.isFinite(prescription.durationMinutes) && prescription.durationMinutes > 0 && prescription.durationMinutes <= 1440 &&
    Number.isSafeInteger(prescription.targetReps) && prescription.targetReps >= 1 && prescription.targetReps <= 500;
}

export function ConditioningBlock({
  store,
  date,
  plan,
  catalog,
  session,
  onSessionCreated,
}: {
  store: FitStore;
  date: string;
  plan: Record<string, any>;
  catalog: Exercise[];
  session?: Row;
  onSessionCreated?: (id: string) => void;
}) {
  useStore(store);
  const [ownSessionId, setOwnSessionId] = useState<string | undefined>();
  const liveSession = store.list("workout_sessions").find(row => row.id === (session?.id || ownSessionId)) || session;
  const state: ConditioningState | undefined = liveSession?.data.conditioningState;
  const [dirty, setDirty] = useState(false);
  const [draftDate, setDraftDate] = useState(date);
  const [draftPrescription, setDraftPrescription] = useState<ConditioningPrescription>(() => ({...plan.conditioning, exerciseIds: [...(plan.conditioning?.exerciseIds || [])]}));
  const prescription = state?.prescription || draftPrescription;
  const targetDate = liveSession?.local_date || draftDate;
  const logId = liveSession ? seedId(store.userId, `${liveSession.id}:conditioning`) : undefined;
  const logged = store.list("cardio_logs").find(row => row.id === logId);
  const [now, setNow] = useState(Date.now());
  const [actualRounds, setActualRounds] = useState(String(state?.roundsDraft ?? logged?.data.rounds ?? prescription.rounds));
  const [actualMinutes, setActualMinutes] = useState(String(state?.minutesDraft ?? logged?.data.minutes ?? ""));
  const [rpe, setRpe] = useState(String(state?.rpeDraft ?? logged?.data.rpe ?? ""));
  const [notes, setNotes] = useState(String(state?.notesDraft ?? logged?.data.notes ?? ""));
  const [error, setError] = useState("");
  const planSignature = JSON.stringify(plan.conditioning);
  const stoppedAt = liveSession?.data.finishedAt || liveSession?.data.endedAt;
  const elapsed = conditioningElapsed(state, stoppedAt && Number.isFinite(Date.parse(stoppedAt)) ? Math.min(now, Date.parse(stoppedAt)) : now);
  const targetSeconds = Math.max(0, numeric(prescription.durationMinutes) * 60);
  const remaining = Math.max(0, Math.ceil(targetSeconds - elapsed));
  const exerciseCount = Math.max(1, prescription.exerciseIds?.length || 1);
  const stepSeconds = prescription.format === "emom" ? 60 : Math.max(1, numeric(prescription.workSeconds) + numeric(prescription.restSeconds));
  const stepIndex = Math.floor(elapsed / stepSeconds);
  const withinStep = elapsed % stepSeconds;
  const working = withinStep < numeric(prescription.workSeconds);
  const stationIndex = stepIndex % exerciseCount;
  const round = Math.min(prescription.rounds, Math.floor(stepIndex / exerciseCount) + 1);
  const sourceExercises: Exercise[] = liveSession?.data.exercises || catalog;
  const stationNames = (prescription.exerciseIds || []).map(id => sourceExercises.find(item => item.id === id)?.name || catalog.find(item => item.id === id)?.name || id);
  const valid = validConditioning(prescription);

  useEffect(() => {const timer = setInterval(() => setNow(Date.now()), 1000);return () => clearInterval(timer);}, []);
  useEffect(() => {
    if (!dirty && !liveSession) {
      setDraftDate(date);
      setDraftPrescription({...plan.conditioning, exerciseIds: [...(plan.conditioning?.exerciseIds || [])]});
      setActualRounds(String(plan.conditioning?.rounds ?? ""));
    }
  }, [date, planSignature, dirty, liveSession?.id]);
  useEffect(() => {
    if (!dirty) {
      setActualRounds(String(state?.roundsDraft ?? logged?.data.rounds ?? prescription.rounds));
      setActualMinutes(String(state?.minutesDraft ?? logged?.data.minutes ?? ""));
      setRpe(String(state?.rpeDraft ?? logged?.data.rpe ?? ""));
      setNotes(String(state?.notesDraft ?? logged?.data.notes ?? ""));
    }
  }, [liveSession?.id, logged?.updated_at]);

  function ensureSession() {
    const existing = store.list("workout_sessions").find(row => row.id === (session?.id || ownSessionId));
    if (existing) return existing;
    const created = store.save("workout_sessions", {
      title: plan.title,
      plan: {...plan, conditioning: {...prescription, exerciseIds: [...prescription.exerciseIds]}},
      exercises: (Array.isArray(plan.exerciseIds) ? plan.exerciseIds : []).map((id: string) => catalog.find(item => item.id === id)).filter((item: Exercise | undefined): item is Exercise => item !== undefined).map((item: Exercise) => ({...item})),
      startedAt: new Date().toISOString(),
      finishedAt: null,
      endedAt: null,
      notes: "",
      skipped: [],
    }, {local_date: targetDate});
    setOwnSessionId(created.id);
    onSessionCreated?.(created.id);
    return created;
  }

  function persistState(next: ConditioningState, row = ensureSession()) {
    const latest = store.list("workout_sessions").find(item => item.id === row.id) || row;
    store.save("workout_sessions", {...latest.data, conditioningState: {
      ...next,
      roundsDraft: actualRounds,
      minutesDraft: actualMinutes,
      rpeDraft: rpe,
      notesDraft: notes,
    }}, {id: latest.id, local_date: latest.local_date || targetDate});
  }

  function startOrResume() {
    if (!valid) {setError("Revisa el bloque en Ajustes: estaciones, vueltas, trabajo, descanso y duración deben tener valores válidos.");return;}
    if (stoppedAt) {setError("Reabre la sesión de entrenamiento antes de continuar el temporizador.");return;}
    safeSave(() => {
      const stamp = new Date().toISOString();
      persistState({
        ...state,
        status: "running",
        startedAt: state?.startedAt || stamp,
        resumedAt: stamp,
        accumulatedSeconds: state ? elapsed : 0,
        prescription: {...prescription, exerciseIds: [...prescription.exerciseIds]},
      });
      setDirty(true);
      setNow(Date.now());
    }, setError);
  }

  function pause() {
    if (!state) return;
    safeSave(() => persistState({...state, status: "paused", resumedAt: null, accumulatedSeconds: elapsed}), setError);
  }

  function persistDraft() {
    if (state) safeSave(() => persistState({...state}), setError);
  }

  function complete() {
    const min = actualMinutes.trim() === "" ? elapsed / 60 : Number(actualMinutes);
    const rounds = Number(actualRounds);
    const effort = rpe.trim() === "" ? null : Number(rpe);
    if (!valid || !validCardioDate(targetDate)) {setError("Revisa la fecha y la configuración del bloque.");return;}
    if (!Number.isFinite(min) || min <= 0 || min > 1440) {setError("Indica los minutos reales (mayor que 0 y hasta 1,440), o inicia el temporizador.");return;}
    if (actualRounds.trim() === "" || !Number.isSafeInteger(rounds) || rounds < 0 || rounds > 100) {setError("Indica de 0 a 100 vueltas completas realizadas; puedes registrar un bloque parcial.");return;}
    if (effort !== null && (!Number.isFinite(effort) || effort < 1 || effort > 10)) {setError("El RPE debe estar entre 1 y 10.");return;}
    safeSave(() => {
      store.transaction(() => {
        const row = ensureSession();
        const stamp = new Date().toISOString();
        persistState({
          ...state,
          status: "finished",
          startedAt: state?.startedAt || stamp,
          resumedAt: null,
          accumulatedSeconds: elapsed,
          completedAt: stamp,
          prescription: {...prescription, exerciseIds: [...prescription.exerciseIds]},
        }, row);
        store.save("cardio_logs", {
          kind: prescription.format,
          conditioning: true,
          title: prescription.format === "emom" ? "Bloque EMOM" : "Circuito de fuerza",
          minutes: min,
          rounds,
          workSeconds: prescription.workSeconds,
          restSeconds: prescription.format === "emom" ? 60 - prescription.workSeconds : prescription.restSeconds,
          rpe: effort,
          intensity: prescription.intensity,
          lowImpact: plan.lowImpact === true,
          targetRounds: prescription.rounds,
          plannedConditioning: {...prescription, exerciseIds: [...prescription.exerciseIds]},
          exerciseNames: stationNames,
          notes,
          recordedAt: logged?.data.recordedAt || stamp,
        }, {id: seedId(store.userId, `${row.id}:conditioning`), session_id: row.id, local_date: row.local_date || targetDate});
      });
      setDirty(false);
      setNow(Date.now());
    }, setError);
  }

  return <section className="card stack" onChange={() => setDirty(true)} aria-label="Bloque de acondicionamiento">
    <div className="section-title"><div><p className="eyebrow">ACONDICIONAMIENTO</p><h2>{prescription.format === "emom" ? "EMOM · una estación por minuto" : "Circuito de fuerza"}</h2></div><Timer size={25}/></div>
    <p className="muted">{prescription.instruction}</p>
    <p className="muted small">Plan: {prescription.rounds} vueltas · {prescription.durationMinutes} min · {prescription.targetReps} repeticiones por estación · {prescription.intensity}. {prescription.format === "emom" ? `Trabaja hasta ${prescription.workSeconds} s y descansa el resto del minuto.` : `${prescription.workSeconds} s de trabajo y ${prescription.restSeconds} s de descanso entre estaciones.`}</p>
    <div className="stack" style={{gap: "8px"}}>{stationNames.map((name, index) => <div className="row" key={`${name}:${index}`}><span className="badge">{index + 1}</span><span>{name}</span></div>)}</div>
    <p className="muted small">Este bloque registra tiempo, vueltas completas y esfuerzo real. Sus estaciones no generan otra rutina de fuerza ni series automáticamente.</p>
    {targetDate !== date && validCardioDate(targetDate) && <p className="muted small">El bloque pertenece a {dateLabel(targetDate)}. La fecha se conserva aunque pase medianoche.</p>}
    <div className="card session-bar" style={{padding: "17px"}}>
      <div><span className="eyebrow">TIEMPO TRANSCURRIDO</span><strong className="session-clock"><Clock3 size={17}/>{formatTime(Math.floor(elapsed))}</strong></div>
      <div><span className="eyebrow">RESTANTE DEL PLAN</span><strong>{formatTime(remaining)}</strong></div>
      {state && state.status !== "finished" && <p className="muted small" aria-live="polite">{remaining === 0 ? "Tiempo del plan cumplido. Confirma los minutos y vueltas que realmente realizaste." : `Vuelta ${round} de ${prescription.rounds} · estación ${stationIndex + 1}: ${stationNames[stationIndex] || "—"} · ${working ? "trabajo" : "descanso"}`}</p>}
      <div className="row" style={{width: "100%"}}>{state?.status === "running" ? <button className="btn ghost" onClick={pause}><Pause size={16}/> Pausar bloque</button> : state?.status !== "finished" && <button className="btn primary" onClick={startOrResume}><Play size={16}/>{state ? "Continuar bloque" : "Comenzar bloque"}</button>}{state?.status === "finished" && <span className="badge"><Check size={16}/> Bloque registrado</span>}</div>
    </div>
    <div className="grid2">
      <label className="field"><span>Vueltas completas realizadas</span><input type="number" min="0" max="100" step="1" inputMode="numeric" value={actualRounds} onChange={event => setActualRounds(event.target.value)} onBlur={persistDraft}/></label>
      <label className="field"><span>Minutos reales (opcional con temporizador)</span><input type="number" min="0.01" max="1440" step="0.1" inputMode="decimal" value={actualMinutes} placeholder={`Temporizador: ${Math.round(elapsed / 6) / 10} min`} onChange={event => setActualMinutes(event.target.value)} onBlur={persistDraft}/></label>
      <label className="field"><span>RPE del bloque (1–10, opcional)</span><input type="number" min="1" max="10" step="0.5" inputMode="decimal" value={rpe} onChange={event => setRpe(event.target.value)} onBlur={persistDraft}/></label>
    </div>
    <label className="field"><span>Notas del bloque (opcional)</span><input value={notes} onChange={event => setNotes(event.target.value)} onBlur={persistDraft} placeholder="Adaptaciones, ritmo, técnica…"/></label>
    {error && <p className="danger" role="alert">{error}</p>}
    <button className="btn primary" onClick={complete}><Check size={17}/>{logged ? "Actualizar bloque realizado" : "Finalizar y registrar bloque"}</button>
    {logged && <p className="muted small">Guardado: {Math.round(numeric(logged.data.minutes) * 10) / 10} min · {logged.data.rounds} vueltas{logged.data.rpe == null ? "" : ` · RPE ${logged.data.rpe}/10`}. Actualizar este bloque conserva un solo registro.</p>}
  </section>;
}
