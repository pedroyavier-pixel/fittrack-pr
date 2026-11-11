import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Check,
} from "lucide-react";
import { FitStore } from "../lib/store";
import {
  applyGuide,
  buildGuide,
  guideOptions,
  guideSources,
  initialAnswers,
  type GuideAnswers,
} from "../lib/personalization";
import { foods } from "../data/nutrition";
import { mealSuggestionGuidance } from "../data/mealSuggestions";
export function GuideInformation() {
  return (
    <details className="card guide-information">
      <summary>
        <BookOpen size={18} /> Alcance, fuentes y privacidad
      </summary>
      <div className="stack">
        <p>
          <strong>Una guía para comenzar.</strong> FitTrack no sustituye a un
          entrenador personal, nutricionista, médico, fisioterapeuta ni otro
          profesional. No diagnostica, trata ni garantiza resultados.
        </p>
        <p>
          Las reglas ajustan selección, frecuencia, series y repeticiones según
          tus respuestas. Las fuentes respaldan principios generales; no
          significan que esta rutina individual haya sido validada clínicamente.
          Los videos y las indicaciones técnicas están en cada ejercicio.
        </p>
        {guideSources.map((s) => (
          <p key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.title} ↗
            </a>
            <br />
            <span className="muted">{s.use}</span>
          </p>
        ))}
        <p>
          {mealSuggestionGuidance.description}{" "}
          {mealSuggestionGuidance.exclusions}
        </p>
        <h3>Tus datos y tus decisiones</h3>
        <p>
          Las respuestas y registros se vinculan a tu cuenta. Usamos conexión
          HTTPS, políticas de acceso por usuario y almacenamiento privado para
          fotos. Los administradores autorizados y el proveedor de
          infraestructura pueden tener acceso técnico. Ningún sistema ofrece
          seguridad absoluta.
        </p>
        <p>
          Las respuestas se procesan con reglas en la app; no se envían a un
          servicio de IA. La copia temporal del navegador no tiene cifrado
          adicional: protege y bloquea tu dispositivo, evita equipos compartidos
          y cierra sesión al terminar. Al cerrar sesión se elimina esa copia
          local, conservando lo sincronizado en tu cuenta.
        </p>
        <p>
          Puedes editar tus respuestas y exportar tus registros desde Historial.
          No publicamos tus datos personales en GitHub. Las exclusiones son
          preferencias de ingredientes, no una certificación de seguridad para
          alergias.
        </p>
      </div>
    </details>
  );
}
const names = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
export function Onboarding({
  store,
  onDone,
  onCancel,
  onSignOut,
}: {
  store: FitStore;
  onDone: () => void;
  onCancel?: () => void;
  onSignOut?: () => void;
}) {
  const previous = store.list("user_profiles")[0]?.data.personalization;
  const [a, setA] = useState<GuideAnswers>(() =>
    previous
      ? {
          ...initialAnswers,
          ...previous,
          days: [...previous.days],
          excluded: [...previous.excluded],
          consent: false,
        }
      : { ...initialAnswers, days: [...initialAnswers.days], excluded: [] },
  );
  const [step, setStep] = useState(0),
    [error, setError] = useState("");
  const update = <K extends keyof GuideAnswers>(
    key: K,
    value: GuideAnswers[K],
  ) => {
    setA((x) => ({ ...x, [key]: value }));
    setError("");
  };
  const blocked = a.age === "under18" || a.professionalSupport !== "no";
  const select = (key: keyof typeof guideOptions, label: string) => (
    <label className="field">
      {label}
      <select
        value={a[key]}
        onChange={(e) => {
          update(key, e.target.value as never);
          if (key === "equipment" && e.target.value === "walking")
            update("cardio", "walk");
        }}
        required
      >
        <option value="" disabled>
          Selecciona una opción
        </option>
        {guideOptions[key].map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  function next() {
    if (step === 0 && (!a.age || !a.consent)) {
      setError(
        "Selecciona tu edad y confirma que entiendes el uso de tus respuestas.",
      );
      return;
    }
    if (step === 1 && (!a.activity || !a.experience)) {
      setError("Selecciona tu actividad diaria y experiencia.");
      return;
    }
    if (step === 2 && (!a.goal || !a.equipment || !a.horizon)) {
      setError("Selecciona tu meta, entorno y horizonte.");
      return;
    }
    if (step === 3 && (a.days.length < 2 || a.days.length > 5)) {
      setError("Selecciona entre 2 y 5 días disponibles.");
      return;
    }
    setError("");
    setStep(step === 0 && blocked ? 5 : step + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  let preview: ReturnType<typeof buildGuide> | undefined;
  if (step === 5)
    try {
      preview = buildGuide(a);
    } catch {}
  const title = [
    "Empecemos con calma.",
    "Tu punto de partida.",
    "Qué quieres construir.",
    "Un plan que cabe en tu vida.",
    "Ideas para comer mejor.",
    "Tu guía, antes de guardarla.",
  ][step];
  return (
    <main className="onboarding-page stack">
      <header className="section-title">
        <span className="eyebrow">FITTRACK PR · TU GUÍA PERSONAL</span>
        {onCancel ? (
          <button className="btn ghost" onClick={onCancel}>
            Volver sin cambiar nada
          </button>
        ) : onSignOut ? (
          <button className="btn ghost" onClick={onSignOut}>
            Cerrar sesión
          </button>
        ) : null}
      </header>
      <div className="onboarding-steps" aria-label={`Paso ${step + 1} de 6`}>
        {["Alcance", "Perfil", "Meta", "Agenda", "Comidas", "Revisar"].map(
          (s, i) => (
            <span key={s} className={step === i ? "active" : ""}>
              {s}
            </span>
          ),
        )}
      </div>
      <h1>{title}</h1>
      <section className="card stack">
        {step === 0 && (
          <>
            <p>
              Responde unas preguntas de opción cerrada. Prepararemos una
              propuesta que podrás revisar y editar antes de usarla. Esta
              versión orienta a personas adultas; no reemplaza evaluación
              profesional.
            </p>
            {select("age", "¿En qué grupo de edad estás?")}
            <label className="field">
              ¿Tienes alguna situación que requiere adaptar el ejercicio o dudas
              sobre si es adecuado para ti?
              <span className="muted small">
                Por ejemplo: dolor o lesión que limita el movimiento, embarazo o
                posparto, una condición médica o una indicación profesional.
              </span>
              <select
                value={a.professionalSupport}
                onChange={(e) =>
                  update(
                    "professionalSupport",
                    e.target.value as GuideAnswers["professionalSupport"],
                  )
                }
              >
                <option value="unsure">No estoy seguro/a</option>
                <option value="no">
                  No identifico una situación de este tipo
                </option>
                <option value="yes">
                  Sí, necesito orientación o adaptación profesional
                </option>
              </select>
            </label>
            <p className="muted">
              Esto no es un examen médico ni confirma que el ejercicio sea
              seguro para ti. Si necesitas adaptación, conservaremos el registro
              manual sin generar una rutina automática.
            </p>
            <label className="guide-check">
              <input
                type="checkbox"
                checked={a.consent}
                onChange={(e) => update("consent", e.target.checked)}
              />
              <span>
                Entiendo el alcance de la guía y acepto guardar mis respuestas
                en mi cuenta para personalizarla. Puedo editarlas más adelante.
              </span>
            </label>
          </>
        )}
        {step === 1 && (
          <>
            <p>
              El peso es opcional y no se usa para adivinar cuánto puedes
              levantar ni para asignarte calorías.
            </p>
            <div className="grid2">
              <label className="field">
                Unidad de peso
                <select
                  value={a.unit}
                  onChange={(e) => {
                    update("unit", e.target.value as "lb" | "kg");
                    update("weight", "");
                  }}
                >
                  <option value="lb">Libras (lb)</option>
                  <option value="kg">Kilogramos (kg)</option>
                </select>
              </label>
              <label className="field">
                Peso actual, si deseas indicarlo
                <select
                  value={a.weight}
                  onChange={(e) => update("weight", e.target.value)}
                >
                  <option value="">Prefiero no indicarlo ahora</option>
                  {Array.from(
                    { length: a.unit === "lb" ? 601 : 541 },
                    (_, i) => (a.unit === "lb" ? 60 + i : 30 + i * 0.5),
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n} {a.unit}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {select(
              "activity",
              "¿Cómo es tu actividad fuera del entrenamiento?",
            )}
            {select("experience", "¿Cuál es tu experiencia actual?")}
          </>
        )}
        {step === 2 && (
          <>
            {select("goal", "¿Qué te gustaría priorizar?")}
            {select("equipment", "¿Dónde y con qué prefieres entrenar?")}
            {select("horizon", "¿En qué horizonte te gustaría trabajar?")}
            <p className="muted">
              Tu plazo es una preferencia para revisar avances. No se promete un
              peso final, porcentaje de grasa ni una transformación en esa
              fecha; no habrá cuenta regresiva.
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <fieldset className="guide-days">
              <legend>¿Qué días tienes disponibles? Elige entre 2 y 5.</legend>
              {names.map((name, day) => (
                <label
                  key={day}
                  className={a.days.includes(day) ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={a.days.includes(day)}
                    onChange={() =>
                      update(
                        "days",
                        a.days.includes(day)
                          ? a.days.filter((d) => d !== day)
                          : [...a.days, day],
                      )
                    }
                  />
                  {name}
                </label>
              ))}
            </fieldset>
            <label className="field">
              Tiempo aproximado por sesión
              <select
                value={a.minutes}
                onChange={(e) => update("minutes", Number(e.target.value))}
              >
                {[20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} minutos
                  </option>
                ))}
              </select>
            </label>
            {a.equipment !== "walking" &&
              select("cardio", "¿Qué actividad cardiovascular prefieres?")}
            <p className="muted">
              Distribuimos fuerza y recuperación según tu disponibilidad. Los
              minutos son una referencia: puedes acortar la sesión o registrar
              solo lo que realizaste.
            </p>
          </>
        )}
        {step === 4 && (
          <>
            {select("preference", "¿Qué tipo de alimentación prefieres?")}
            <fieldset className="guide-days">
              <legend>¿Qué ingredientes prefieres excluir?</legend>
              {(
                [
                  ["dairy", "Lácteos"],
                  ["egg", "Huevo"],
                  ["fish", "Pescado"],
                  ["nuts", "Frutos secos"],
                  ["gluten", "Ingredientes con gluten"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className={a.excluded.includes(key) ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={a.excluded.includes(key)}
                    onChange={() =>
                      update(
                        "excluded",
                        a.excluded.includes(key)
                          ? a.excluded.filter((k) => k !== key)
                          : [...a.excluded, key],
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <label className="field">
              ¿Necesitas un plan de alimentación adaptado por un profesional?
              <span className="muted small">
                Por alergias, una condición clínica, antecedentes de trastorno
                alimentario u otra necesidad especial. No pedimos detalles del
                diagnóstico.
              </span>
              <select
                value={a.dietaryCare}
                onChange={(e) =>
                  update("dietaryCare", e.target.value as "no" | "yes")
                }
              >
                <option value="no">No identifico esa necesidad</option>
                <option value="yes">Sí, o no estoy seguro/a</option>
              </select>
            </label>
            <p className="muted">
              Propondremos ideas de comidas con ingredientes separados, sin una
              dieta ni calorías prescritas. Los filtros no verifican etiquetas,
              trazas ni contacto cruzado.
            </p>
          </>
        )}
        {step === 5 && (
          <>
            {preview ? (
              <>
                <p className="eyebrow">
                  {preview.blocked
                    ? "REGISTRO MANUAL Y FUENTES GENERALES"
                    : preview.summary}
                </p>
                {!preview.blocked && (
                  <>
                    <p>
                      <strong>
                        {guideOptions.goal.find(([v]) => v === a.goal)?.[1]}
                      </strong>{" "}
                      ·{" "}
                      {
                        guideOptions.equipment.find(
                          ([v]) => v === a.equipment,
                        )?.[1]
                      }
                    </p>
                    <p className="muted">
                      {a.weight
                        ? `${a.weight} ${a.unit} indicados voluntariamente · `
                        : ""}
                      {guideOptions.horizon.find(([v]) => v === a.horizon)?.[1]}
                    </p>
                    <div className="guide-week">
                      {preview.plans.map((p) => (
                        <div key={p.day}>
                          <strong>{names[p.day]}</strong>
                          <span>{p.title}</span>
                          <small>
                            {p.exerciseIds.length
                              ? `${p.exerciseIds.length} ejercicios`
                              : p.walkMinutes
                                ? `${p.walkMinutes} min de caminata`
                                : "Recuperación"}
                          </small>
                          {p.exerciseIds.length > 0 && (
                            <ul>
                              {p.exerciseIds.map((id) => {
                                const e = preview!.catalog.find(
                                  (x) => x.id === id,
                                )!;
                                return (
                                  <li key={id}>
                                    {e.name} · {e.sets} × {e.minReps}–
                                    {e.maxReps}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {preview.warnings.map((w) => (
                  <p className="notice" key={w}>
                    {w}
                  </p>
                ))}
                {!preview.blocked && (
                  <ul>
                    {preview.principles.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
                {!preview.blocked && a.dietaryCare === "no" && (
                  <>
                    <h3>Ejemplo de menú sugerido</h3>
                    <p>{mealSuggestionGuidance.description}</p>
                    {preview.menus
                      .find((m) => m.day === 1)
                      ?.meals.map((m) => (
                        <p key={m.name}>
                          <strong>{m.name}:</strong>{" "}
                          {m.items
                            .map(
                              (i) =>
                                `${foods.find((f) => f.id === i.foodId)?.name || i.foodId} (${i.amount} ${foods.find((f) => f.id === i.foodId)?.unit || "g"})`,
                            )
                            .join(" · ")}
                        </p>
                      ))}
                    <p className="muted">
                      Podrás cambiar ingredientes y cantidades en Comidas.{" "}
                      {a.preference === "plant"
                        ? mealSuggestionGuidance.limitations
                        : ""}
                    </p>
                  </>
                )}
                <p className="notice">
                  Al guardar se reemplazan únicamente tu rutina semanal y menú
                  futuros. El historial y las sesiones ya iniciadas conservan
                  sus datos. Los objetivos numéricos que ya tengas se mantienen;
                  no se calculan calorías automáticamente.
                </p>
                <button
                  className="btn primary"
                  onClick={() => {
                    try {
                      applyGuide(store, a);
                      onDone();
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : "No se pudo guardar la guía.",
                      );
                    }
                  }}
                >
                  <Check size={18} />
                  {preview.blocked
                    ? "Usar solo registro manual"
                    : "Guardar y usar esta guía"}
                </button>
              </>
            ) : (
              <p className="danger">
                Faltan respuestas. Vuelve a las preguntas para completarlas.
              </p>
            )}
          </>
        )}
        {error && (
          <p className="danger" role="alert">
            {error}
          </p>
        )}
        <div className="section-title">
          {step > 0 ? (
            <button
              className="btn ghost"
              onClick={() => {
                setStep(step === 5 && blocked ? 0 : step - 1);
                setError("");
              }}
            >
              <ArrowLeft size={17} /> Anterior
            </button>
          ) : (
            <span />
          )}
          {step < 5 && (
            <button className="btn primary" onClick={next}>
              Continuar <ArrowRight size={17} />
            </button>
          )}
        </div>
      </section>
      <GuideInformation />
      <p className="muted small">
        <ShieldCheck size={15} /> Solo guardamos tus respuestas cuando confirmas
        la guía. Protege tu cuenta y tu dispositivo.
      </p>
    </main>
  );
}
