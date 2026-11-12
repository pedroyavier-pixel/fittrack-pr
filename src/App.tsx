import {FrequencyAdvice} from "./components/FrequencyAdvice";
import {cardioLabel} from "./data/conditioning";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  House,
  Dumbbell,
  Utensils,
  CalendarDays,
  ChartNoAxesCombined,
  Settings as SettingsIcon,
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  Footprints,
  Flame,
  Target,
  Clock3,
} from "lucide-react";
import { supabase } from "./lib/client";
import { disablePush } from "./lib/push";
import { FitStore, useStore } from "./lib/store";
import { prDate, dateLabel, weekday, shiftDate, ZONE } from "./lib/time";
import {
  profile,
  goals,
  planFor,
  exerciseLibrary,
  initialize,
  sumNutrition,
} from "./lib/model";
import Auth from "./components/Auth";
import { Onboarding, GuideInformation } from "./components/Onboarding";
import { Meals, NutritionBars } from "./components/Nutrition";
const Workout = lazy(() =>
  import("./components/Workout").then((m) => ({ default: m.Workout })),
);
const Progress = lazy(() =>
  import("./components/Progress").then((m) => ({ default: m.Progress })),
);
const History = lazy(() =>
  import("./components/History").then((m) => ({ default: m.History })),
);
const Settings = lazy(() =>
  import("./components/Settings").then((m) => ({ default: m.Settings })),
);
type View = "today" | "workout" | "meals" | "history" | "progress" | "settings";
export default function App() {
  const [session, setSession] = useState<Session | null>();
  const [error, setError] = useState("");
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined)
    return (
      <div className="loading">
        <Activity size={40} />
        <span>Preparando tu día…</span>
      </div>
    );
  if (!session)
    return (
      <>
        <Auth />
        {error && <p className="notice">{error}</p>}
      </>
    );
  return <FitTrackShell key={session.user.id} userId={session.user.id} />;
}
export function FitTrackShell({
  userId,
  testStore,
}: {
  userId: string;
  testStore?: FitStore;
}) {
  const store = useMemo(
    () => testStore || new FitStore(userId),
    [userId, testStore],
  );
  useStore(store);
  const [customizing, setCustomizing] = useState(false);
  const [view, setView] = useState<View>("today");
  const [now, setNow] = useState(new Date());
  const [selected, setSelected] = useState<string>();
  const [notice, setNotice] = useState("");
  useEffect(() => store.start(), [store]);
  useEffect(() => {
    if (store.hydrated) initialize(store);
  }, [store, store.hydrated]);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  const today = prDate(now);
  const date = selected || today;
  const p = profile(store);
  const unit = p.unit === "kg" ? "kg" : "lb";
  const plan = planFor(store, weekday(date));
  const todayExerciseIds = plan.conditioning?.exerciseIds || plan.exerciseIds;
  const lib = exerciseLibrary(store);
  const logs = store.list("food_logs", date);
  const latest = store
    .list("body_measurements")
    .sort((a, b) => (b.local_date || "").localeCompare(a.local_date || ""))[0];
  const weight = latest?.data.weightLb;
  const clock = new Intl.DateTimeFormat("es-PR", {
    timeZone: ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
  const nav = [
    { id: "today", name: "Hoy", icon: House },
    { id: "workout", name: "Entrenar", icon: Dumbbell },
    { id: "meals", name: "Comidas", icon: Utensils },
    { id: "history", name: "Historial", icon: CalendarDays },
    { id: "progress", name: "Progreso", icon: ChartNoAxesCombined },
  ] as const;
  function changeView(v: View) {
    setView(v);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function signOut() {
    if (store.cache.queue.length) {
      setNotice(
        "Hay cambios pendientes. Conéctate y sincroniza antes de cerrar sesión.",
      );
      return;
    }
    try {
      await disablePush(store.userId);
    } catch {
      setNotice(
        "No se pudieron desactivar los avisos. Revisa la conexión antes de cerrar sesión.",
      );
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      setNotice("No se pudo cerrar sesión. Inténtalo de nuevo.");
      return;
    }
    localStorage.removeItem(store.key);
    localStorage.removeItem(`fittrack-rest:${store.userId}`);
  }
  if (!store.hydrated && !store.list("user_profiles").length)
    return (
      <main className="onboarding-page stack">
        <h1>Preparando tu cuenta…</h1>
        <p>Necesitamos recuperar tu perfil antes de mostrar tu guía.</p>
        {store.error && <p className="notice">{store.error}</p>}
        <button className="btn" onClick={() => void store.sync()}>
          Reintentar conexión
        </button>
      </main>
    );
  const needsOnboarding =
    store.hydrated && p.onboardingRequired && !p.personalization;
  if (customizing || needsOnboarding)
    return (
      <Onboarding
        store={store}
        reviewSaved={!needsOnboarding && p.personalization?.version===2 && p.guideDesignVersion!==3 && !p.guideBlocked}
        onDone={() => {
          setCustomizing(false);
          changeView("today");
        }}
        onCancel={needsOnboarding ? undefined : () => setCustomizing(false)}
        onSignOut={() => void signOut()}
      />
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#today"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            changeView("today");
          }}
        >
          <span className="brand-icon">
            <Activity size={23} />
          </span>
          <span>
            FITTRACK <b>PR</b>
          </span>
        </a>
        <span className="sidebar-caption">TU ESPACIO PERSONAL</span>
        <nav>
          {nav.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => changeView(id)}
              className={view === id ? "active" : ""}
            >
              <Icon size={20} />
              <span>{name}</span>
              {view === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-program">
          <span className="eyebrow">TU RUTINA DIARIA</span>
          <strong>
            Un día a la vez.
            <br />A tu ritmo.
          </strong>
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => changeView("settings")}>
            <SettingsIcon size={18} />
            Ajustes
          </button>
          <button onClick={signOut}>
            <LogOut size={18} />
            Cerrar sesión
          </button>
          <span>HORA DE PUERTO RICO · UTC−4</span>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <span className="mobile-brand">
            <Activity size={23} /> FITTRACK <b>PR</b>
          </span>
          <span className="desktop-breadcrumb">
            MI ESPACIO <ChevronRight size={13} />{" "}
            {view === "settings"
              ? "Ajustes"
              : nav.find((n) => n.id === view)?.name}
          </span>
          <div className="topbar-right">
            <button
              className={`sync-status ${store.error ? "sync-error" : ""}`}
              onClick={() => void store.sync()}
              title={store.error || "Sincronizar ahora"}
            >
              {!store.online ? (
                <CloudOff size={15} />
              ) : store.syncing ? (
                <RefreshCw size={15} className="spin" />
              ) : (
                <Cloud size={15} />
              )}
              <span>
                {!store.online
                  ? "Sin conexión"
                  : store.syncing
                    ? "Sincronizando"
                    : store.cache.queue.length
                      ? `${store.cache.queue.length} pendientes`
                      : store.error
                        ? "Reintentar guardado"
                        : "Sincronizado"}
              </span>
            </button>
            <button
              className="avatar"
              aria-label="Abrir ajustes de perfil"
              onClick={() => changeView("settings")}
            >
              {(p.name || "P").slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <main className="content">
          <Suspense
            fallback={<div className="empty">Cargando tu espacio…</div>}
          >
            {store.error && (
              <div className="notice" role="status">
                {store.error}. Los cambios pendientes se conservan en este
                dispositivo.{" "}
                <button onClick={() => void store.sync()}>Reintentar</button>
              </div>
            )}
            {notice && (
              <div className="notice" role="status">
                {notice}
                <button onClick={() => setNotice("")}>Cerrar</button>
              </div>
            )}
            {!store.hydrated && (
              <div className="notice">
                {store.online
                  ? "Cargando tus datos guardados…"
                  : "Modo sin conexión: puedes registrar con los datos ya guardados en este dispositivo."}
              </div>
            )}
            {view !== "settings" && (
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    {view === "today"
                      ? "CADA DÍA CUENTA"
                      : view === "workout"
                        ? "MOVIMIENTO CON PROPÓSITO"
                        : view === "meals"
                          ? "COMER PARA AVANZAR"
                          : view === "history"
                            ? "TODO TU RECORRIDO"
                            : "MÁS ALLÁ DE LA BALANZA"}
                  </span>
                  <h1>
                    {view === "today" ? (
                      <>
                        Vamos a por hoy, <em>{p.name || "Atleta"}.</em>
                      </>
                    ) : view === "workout" ? (
                      "Tu entrenamiento."
                    ) : view === "meals" ? (
                      "Tu alimentación."
                    ) : view === "history" ? (
                      "Tu historial."
                    ) : (
                      "Tu progreso."
                    )}
                  </h1>
                  <p className="date-heading">
                    {dateLabel(date)} <span>· {clock} AST</span>
                  </p>
                </div>
              </div>
            )}
            {view !== "settings" && (
              <div className="date-strip">
                <div className="week-days">
                  {Array.from({ length: 7 }, (_, i) => {
                    const monday = shiftDate(date, -((weekday(date) + 6) % 7));
                    const d = shiftDate(monday, i);
                    const done = store
                      .list("workout_sessions", d)
                      .some((s) => s.data.endedAt);
                    return (
                      <button
                        key={d}
                        className={
                          (date === d ? "selected " : "") +
                          (d === today ? "is-today" : "")
                        }
                        onClick={() => setSelected(d === today ? undefined : d)}
                      >
                        <span>{["L", "M", "M", "J", "V", "S", "D"][i]}</span>
                        <strong>{Number(d.slice(-2))}</strong>
                        <i className={done ? "day-done" : ""} />
                      </button>
                    );
                  })}
                </div>
                <div className="date-picker">
                  <button
                    className="icon-btn"
                    aria-label="Día anterior"
                    onClick={() => setSelected(shiftDate(date, -1))}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <input
                    aria-label="Seleccionar fecha del registro"
                    type="date"
                    value={date}
                    onChange={(e) => {
                      if (e.target.value)
                        setSelected(
                          e.target.value === today ? undefined : e.target.value,
                        );
                    }}
                  />
                  <button
                    className="icon-btn"
                    aria-label="Día siguiente"
                    onClick={() => setSelected(shiftDate(date, 1))}
                  >
                    <ChevronRight size={16} />
                  </button>
                  {selected && (
                    <button
                      className="text-btn"
                      onClick={() => setSelected(undefined)}
                    >
                      Hoy
                    </button>
                  )}
                </div>
              </div>
            )}
            {selected && selected !== today && view !== "settings" && (
              <p className="selected-date-note">
                Estás consultando y registrando en {dateLabel(selected)}.{" "}
                <button onClick={() => setSelected(undefined)}>
                  Volver a hoy
                </button>
              </p>
            )}
            {view === "today" &&
              store
                .list("workout_sessions")
                .filter(
                  (s) =>
                    !s.data.endedAt &&
                    !s.data.finishedAt &&
                    s.local_date !== date,
                )
                .slice(-1)
                .map((s) => (
                  <div className="notice" key={s.id}>
                    Tienes una sesión sin terminar de {s.local_date}.{" "}
                    <button
                      onClick={() => {
                        setSelected(s.local_date);
                        changeView("workout");
                      }}
                    >
                      Continuar esa sesión
                    </button>
                  </div>
                ))}
            {view === "today" && (
              <div className="stack dashboard">
                <section className="card row">
                  <div>
                    <span className="eyebrow">TU GUÍA PERSONAL</span>
                    <p>
                      {p.personalization
                        ? "Puedes revisar tus respuestas y adaptar tus próximas sesiones."
                        : "Personaliza tu entrenamiento según tu meta, equipo y disponibilidad."}
                    </p>
                    {p.personalization?.version===2 && !p.guideBlocked && p.guideDesignVersion!==3 && <p className="notice">Distribución mejorada disponible. Revisa tu guía para aplicar sesiones con enfoques distintos y una recomendación de frecuencia. Tus registros se conservan.</p>}
                    {p.guideBlocked && (
                      <p className="notice">
                        Guía pendiente de orientación profesional. No se ha
                        generado una rutina automática.
                      </p>
                    )}
                  </div>
                  <button
                    className="btn ghost"
                    onClick={() => setCustomizing(true)}
                  >
                    {p.personalization?.version===2 && p.guideDesignVersion!==3 && !p.guideBlocked ? "Revisar distribución mejorada" : "Personalizar mi guía"}
                  </button>
                </section>
                {!p.guideBlocked && <FrequencyAdvice advice={p.frequencyRecommendation} compact/>}
                <div className="dashboard-top">
                  <NutritionBars store={store} date={date} />
                  <section className="card workout-preview">
                    <div className="section-title">
                      <span className="eyebrow">TU MOVIMIENTO DE HOY</span>
                      <span className="mini-icon">
                        <Dumbbell size={20} />
                      </span>
                    </div>
                    <span className="workout-type">
                      {plan.type === "strength"
                        ? plan.conditioning ? (plan.conditioning.format==="emom"?"EMOM TÉCNICO":"CIRCUITO CONTROLADO") : "FUERZA + CONSTANCIA"
                        : plan.type === "rest"
                          ? "RECUPERACIÓN"
                          : "MANTENTE EN MOVIMIENTO"}
                    </span>
                    <h2>{plan.title}</h2>
                    {plan.focus && plan.focus!==plan.title && <p className="training-focus">{plan.focus}</p>}
                    {plan.rationale && <p className="muted small">{plan.rationale}</p>}
                    <p>
                      {plan.type === "rest"
                        ? "Hoy es tu día de descanso. Recuperarte también es parte del progreso."
                        : plan.type === "recovery"
                          ? "Día de recuperación activa. Movimiento suave y movilidad, según tu plan."
                          : plan.type === "cardio"
                            ? plan.cardio?.length ? plan.cardio.map(c=>`${c.minutes} min · ${cardioLabel(c.kind)}`).join(" · ") : `${plan.walkMinutes} minutos de caminata. A tu ritmo.`
                            : plan.conditioning ? `${todayExerciseIds.length} estaciones · ${plan.conditioning.rounds} vueltas · ${plan.conditioning.durationMinutes} min` : `${plan.exerciseIds.length} ejercicios · ${plan.exerciseIds.reduce((n, id) => n + (lib.find((e) => e.id === id)?.sets || 3), 0)} series programadas`}
                    </p>
                    {plan.type === "strength" ? (
                      <div className="preview-exercises">
                        {todayExerciseIds.map((id) => {
                          const e = lib.find((e) => e.id === id);
                          return (
                            <div key={id}>
                              <span>{e?.name}</span>
                              <small>
                                {plan.conditioning ? `${plan.conditioning.targetReps} reps de referencia` : `${e?.sets} × ${e?.minReps}–${e?.maxReps}`}
                              </small>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rest-visual">
                        <Footprints size={60} strokeWidth={1} />
                        <span>
                          {plan.type === "rest"
                            ? "RECUPERAR TAMBIÉN ES AVANZAR"
                            : plan.cardio?.length ? plan.cardio.map(c=>`${c.minutes} MIN · ${cardioLabel(c.kind)}`).join(" · ") : `${plan.walkMinutes} MIN · CAMINATA`}
                        </span>
                      </div>
                    )}
                    <button
                      className="btn primary"
                      onClick={() => changeView("workout")}
                    >
                      {plan.type === "strength"
                        ? store
                            .list("workout_sessions", date)
                            .some((s) => !s.data.endedAt)
                          ? "Continuar entrenamiento"
                          : "Comenzar entrenamiento"
                        : "Registrar actividad"}
                      <ArrowRight size={18} />
                    </button>
                  </section>
                </div>
                <div className="quick-stats">
                  <div className="card">
                    <span className="stat-icon">
                      <ChartNoAxesCombined size={19} />
                    </span>
                    <div>
                      <span>Último peso</span>
                      <strong>
                        {weight
                          ? unit === "kg"
                            ? (weight / 2.2046226218).toFixed(1)
                            : Number(weight).toFixed(1)
                          : "—"}{" "}
                        <small>{unit}</small>
                      </strong>
                    </div>
                    <button
                      aria-label="Registrar peso"
                      className="icon-btn"
                      onClick={() => changeView("progress")}
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                  <div className="card">
                    <span className="stat-icon">
                      <Target size={19} />
                    </span>
                    <div>
                      <span>Proteína registrada</span>
                      <strong>
                        {Math.round(sumNutrition(logs).protein)}{" "}
                        <small>/ {goals(store).protein} g</small>
                      </strong>
                    </div>
                  </div>
                  <div className="card">
                    <span className="stat-icon">
                      <Check size={19} />
                    </span>
                    <div>
                      <span>Series de hoy</span>
                      <strong>
                        {
                          store
                            .list("workout_sets", date)
                            .filter((r) => r.data.completed !== false).length
                        }
                        <small> completadas</small>
                      </strong>
                    </div>
                  </div>
                </div>
                <Meals store={store} date={date} preview />
                <section className="daily-note">
                  <span className="live-dot" />
                  <p>
                    {goals(store).trackingEnabled === false
                      ? "Un día a la vez. Tus registros sirven para observar hábitos; no hay una meta de calorías asignada."
                      : "Tu meta es constancia. Las calorías del ejercicio no se descuentan de tu objetivo diario."}
                  </p>
                  <span>UN DÍA A LA VEZ ↗</span>
                </section>
              </div>
            )}
            {view === "workout" && (
              <Workout store={store} date={date} unit={unit} />
            )}
            {view === "meals" && (
              <div className="stack">
                <NutritionBars store={store} date={date} compact />
                <Meals store={store} date={date} />
              </div>
            )}
            {view === "history" && (
              <History
                store={store}
                date={date}
                onDate={(d) => setSelected(d === today ? undefined : d)}
              />
            )}
            {view === "progress" && (
              <Progress store={store} date={date} unit={unit} />
            )}
            {view === "settings" && (
              <>
                <Settings
                  store={store}
                  onClose={() => changeView("today")}
                  onPersonalize={() => setCustomizing(true)}
                />
                <div className="card mobile-signout">
                  <button className="btn ghost" onClick={signOut}>
                    <LogOut size={18} />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
            <p className="muted small">
              FitTrack es una guía educativa y un registro personal. No
              sustituye a un entrenador, nutricionista ni profesional de salud.
              Los resultados varían.
            </p>
          </Suspense>
        </main>
        <footer className="desktop-footer">
          <span>FITTRACK PR</span>
          <span>Tu progreso empieza con lo que haces hoy.</span>
          <span>America/Puerto_Rico</span>
        </footer>
      </div>
      <nav className="bottom-nav">
        {nav.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => changeView(id)}
            className={view === id ? "active" : ""}
          >
            <Icon size={21} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
