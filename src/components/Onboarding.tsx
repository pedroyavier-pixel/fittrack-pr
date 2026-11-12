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
import {
  allergenOptions,
  restrictionOptions,
  mealSuggestionGuidance,
} from "../data/mealSuggestions";
import {
  cardioActivities,
  cardioLabel,
  trainingStyles,
  type TrainingStyle,
} from "../data/conditioning";

/** New fields remain optional while an older saved questionnaire is being reviewed. */
type QuestionnaireAnswers = GuideAnswers & {
  version?: number;
  sex?: "male" | "female";
  allergyReviewed?: boolean;
  trainingStyle?: TrainingStyle["id"];
  cardioChoices?: string[];
  impactTolerance?: "low" | "any";
  cardioAccess?: boolean;
  dietaryRestrictions?: string[];
  favoriteIngredients?: string[];
};

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
          tus respuestas. Las fuentes y la bibliografía respaldan principios
          generales; no significan que esta rutina individual haya sido validada
          clínicamente. Los videos y las indicaciones técnicas están en cada
          ejercicio.
        </p>
        <h3>Fuentes y bibliografía</h3>
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
          No publicamos tus datos personales en GitHub. Los filtros de
          ingredientes no certifican productos seguros para alergias.
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
const impactLabels = {
  low: "Bajo impacto",
  moderate: "Impacto moderado",
  high: "Impacto alto",
};
function legacyCardioChoices(previous: Record<string, unknown> | undefined) {
  if (Array.isArray(previous?.cardioChoices))
    return previous.cardioChoices.filter(
      (id): id is string =>
        typeof id === "string" && cardioActivities.some((c) => c.id === id),
    );
  if (previous?.cardio === "both") return ["walk", "rope"];
  if (previous?.cardio === "rope") return ["rope"];
  if (previous?.cardio === "walk") return ["walk"];
  return [];
}
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
  const [a, setA] = useState<QuestionnaireAnswers>(() => ({
    ...initialAnswers,
    ...previous,
    version: 2,
    days: Array.isArray(previous?.days)
      ? [...previous.days]
      : [...initialAnswers.days],
    excluded: Array.isArray(previous?.excluded)
      ? previous.excluded.filter((id: string) =>
          allergenOptions.some((o) => o.id === id),
        )
      : [],
    cardioChoices: legacyCardioChoices(previous),
    trainingStyle: previous?.trainingStyle,
    impactTolerance: previous?.impactTolerance,
    cardioAccess:
      typeof previous?.cardioAccess === "boolean"
        ? previous.cardioAccess
        : false,
    dietaryRestrictions: Array.isArray(previous?.dietaryRestrictions)
      ? previous.dietaryRestrictions.filter((id: string) =>
          restrictionOptions.some((o) => o.id === id),
        )
      : [],
    favoriteIngredients: Array.isArray(previous?.favoriteIngredients)
      ? previous.favoriteIngredients.filter((id: string) =>
          foods.some((f) => f.id === id),
        )
      : [],
    allergyReviewed: previous?.allergyReviewed === true,
    consent: false,
  }));
  const [allergyMode, setAllergyMode] = useState<"none" | "selected" | "">(
    () =>
      previous?.allergyReviewed === true
        ? previous?.excluded?.length
          ? "selected"
          : "none"
        : "",
  );
  const [step, setStep] = useState(0),
    [error, setError] = useState("");
  const update = <K extends keyof QuestionnaireAnswers>(
    key: K,
    value: QuestionnaireAnswers[K],
  ) => {
    setA((x) => ({ ...x, [key]: value }));
    setError("");
  };
  const blocked = a.age === "under18" || a.professionalSupport !== "no";
  const choices = a.cardioChoices || [];
  const selectedCardio = cardioActivities.filter((c) => choices.includes(c.id));
  const needsAccess = selectedCardio.some((c) => c.needsEquipment);
  const compatibleCardio = selectedCardio.filter(
    (c) =>
      (a.impactTolerance !== "low" || c.impact === "low") &&
      (!c.needsEquipment || a.cardioAccess === true),
  );
  const selectedStyle = trainingStyles.find((s) => s.id === a.trainingStyle);
  const select = (key: keyof typeof guideOptions, label: string) => (
    <label className="field">
      {label}
      <select
        value={String(a[key] ?? "")}
        onChange={(e) => update(key, e.target.value as never)}
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
    if (step === 1 && (!a.sex || !a.activity || !a.experience)) {
      setError("Selecciona tu sexo, actividad diaria y experiencia.");
      return;
    }
    if (
      step === 2 &&
      (!a.goal || !a.equipment || !a.horizon || !a.trainingStyle)
    ) {
      setError(
        "Selecciona tu meta, entorno, estilo de entrenamiento y horizonte.",
      );
      return;
    }
    if (step === 3) {
      if (a.days.length < 2 || a.days.length > 5) {
        setError("Selecciona entre 2 y 5 días disponibles.");
        return;
      }
      if (!choices.length || !a.impactTolerance) {
        setError(
          "Elige al menos una actividad cardiovascular y tu preferencia de impacto.",
        );
        return;
      }
      if (!compatibleCardio.length) {
        setError(
          "Elige al menos una actividad compatible con tu preferencia de impacto y el equipo al que tienes acceso. Confirma el acceso al equipo si corresponde.",
        );
        return;
      }
    }
    if (
      step === 4 &&
      (!a.allergyReviewed ||
        !allergyMode ||
        (allergyMode === "selected" && !a.excluded.length))
    ) {
      setError(
        "Confirma que no excluyes ninguno de los ingredientes indicados o selecciona los que necesitas excluir.",
      );
      return;
    }
    setError("");
    setStep(step === 0 && blocked ? 5 : step + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  let preview: ReturnType<typeof buildGuide> | undefined;
  let previewError = "";
  if (step === 5)
    try {
      preview = buildGuide(a);
    } catch (e) {
      previewError =
        e instanceof Error
          ? e.message
          : "Faltan respuestas. Vuelve a las preguntas para completarlas.";
    }
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
              Responde unas preguntas para preparar una propuesta que podrás
              revisar y editar antes de usarla. Esta versión orienta a personas
              adultas; no reemplaza evaluación profesional.
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
            <label className="field">
              Sexo biológico
              <select
                required
                value={a.sex || ""}
                onChange={(e) =>
                  update("sex", e.target.value as "male" | "female")
                }
              >
                <option value="" disabled>
                  Selecciona una opción
                </option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </label>
            <p className="muted small">
              Este dato aporta contexto a tu perfil. La selección de ejercicios
              y las cargas se adaptan a tu experiencia, equipo y registros, sin
              asumir capacidades por sexo.
            </p>
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
            <label className="field">
              ¿Qué estilo de entrenamiento te interesa?
              <select
                required
                value={a.trainingStyle || ""}
                onChange={(e) =>
                  update("trainingStyle", e.target.value as TrainingStyle["id"])
                }
              >
                <option value="" disabled>
                  Selecciona una opción
                </option>
                {trainingStyles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            {selectedStyle && (
              <p className="muted small">{selectedStyle.description}</p>
            )}
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
            <label className="field">
              ¿Qué impacto prefieres para el cardio?
              <select
                required
                value={a.impactTolerance || ""}
                onChange={(e) =>
                  update("impactTolerance", e.target.value as "low" | "any")
                }
              >
                <option value="" disabled>
                  Selecciona una opción
                </option>
                <option value="low">Prefiero bajo impacto</option>
                <option value="any">
                  Puedo considerar distintos niveles de impacto
                </option>
              </select>
            </label>
            <fieldset className="guide-days">
              <legend>
                ¿Qué actividades cardiovasculares te interesan? Puedes elegir
                varias.
              </legend>
              {cardioActivities.map((c) => (
                <label
                  key={c.id}
                  className={choices.includes(c.id) ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={choices.includes(c.id)}
                    onChange={() =>
                      update(
                        "cardioChoices",
                        choices.includes(c.id)
                          ? choices.filter((id) => id !== c.id)
                          : [...choices, c.id],
                      )
                    }
                  />
                  <span>
                    <strong>{c.label}</strong>
                    <small className="muted" style={{ display: "block" }}>
                      {impactLabels[c.impact]}
                      {c.needsEquipment ? ` · ${c.needsEquipment}` : ""}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
            {needsAccess && (
              <label className="guide-check">
                <input
                  type="checkbox"
                  checked={a.cardioAccess === true}
                  onChange={(e) => update("cardioAccess", e.target.checked)}
                />
                <span>
                  Confirmo que tengo acceso al equipo, al espacio y a las
                  condiciones necesarias para las actividades seleccionadas que
                  los requieren.
                </span>
              </label>
            )}
            {selectedCardio.some((c) => c.supervision) && (
              <p className="muted small">
                {selectedCardio
                  .filter((c) => c.supervision)
                  .map((c) => `${c.label}: ${c.supervision}`)
                  .join(" ")}
              </p>
            )}
            {selectedCardio.length > compatibleCardio.length && (
              <p className="notice">
                La guía omitirá las actividades que no coincidan con tu
                preferencia de impacto o para las que no hayas confirmado acceso
                al equipo. No añadiremos otra modalidad sin que la selecciones.
              </p>
            )}
            <p className="muted">
              Distribuimos fuerza, cardio y recuperación según tu
              disponibilidad. El impacto describe la carga mecánica habitual, no
              la intensidad cardiovascular. Los minutos son una referencia:
              registra lo que realmente realizas.
            </p>
          </>
        )}
        {step === 4 && (
          <>
            {select("preference", "¿Qué tipo de alimentación prefieres?")}
            <fieldset
              className="stack"
              style={{ border: 0, padding: 0, margin: 0 }}
            >
              <legend>
                Confirma las alergias o ingredientes que necesitas excluir.
              </legend>
              <label className="guide-check">
                <input
                  type="radio"
                  name="allergy-review"
                  value="none"
                  checked={allergyMode === "none"}
                  onChange={() => {
                    setAllergyMode("none");
                    setA((x) => ({
                      ...x,
                      excluded: [],
                      allergyReviewed: true,
                    }));
                    setError("");
                  }}
                />
                <span>Ninguna de las opciones indicadas</span>
              </label>
              <label className="guide-check">
                <input
                  type="radio"
                  name="allergy-review"
                  value="selected"
                  checked={allergyMode === "selected"}
                  onChange={() => {
                    setAllergyMode("selected");
                    update("allergyReviewed", a.excluded.length > 0);
                  }}
                />
                <span>Necesito excluir uno o más de estos ingredientes</span>
              </label>
            </fieldset>
            {allergyMode === "selected" && (
              <fieldset className="guide-days">
                <legend>Selecciona todos los que correspondan.</legend>
                {allergenOptions.map((o) => (
                  <label
                    key={o.id}
                    className={a.excluded.includes(o.id) ? "selected" : ""}
                  >
                    <input
                      type="checkbox"
                      checked={a.excluded.includes(o.id)}
                      onChange={() => {
                        const excluded = a.excluded.includes(o.id)
                          ? a.excluded.filter((id) => id !== o.id)
                          : [...a.excluded, o.id];
                        setA((x) => ({
                          ...x,
                          excluded,
                          allergyReviewed: excluded.length > 0,
                        }));
                        setError("");
                      }}
                    />
                    {o.label}
                  </label>
                ))}
              </fieldset>
            )}
            <fieldset className="guide-days">
              <legend>Otras preferencias o restricciones · opcional</legend>
              {restrictionOptions.map((o) => (
                <label
                  key={o.id}
                  className={
                    a.dietaryRestrictions?.includes(o.id) ? "selected" : ""
                  }
                >
                  <input
                    type="checkbox"
                    checked={a.dietaryRestrictions?.includes(o.id) || false}
                    onChange={() =>
                      update(
                        "dietaryRestrictions",
                        a.dietaryRestrictions?.includes(o.id)
                          ? a.dietaryRestrictions.filter((id) => id !== o.id)
                          : [...(a.dietaryRestrictions || []), o.id],
                      )
                    }
                  />
                  {o.label}
                </label>
              ))}
            </fieldset>
            <p className="muted small">
              Evitar lactosa es una preferencia o restricción distinta de una
              alergia a la leche. Selecciona las exclusiones que correspondan y
              revisa las etiquetas reales.
            </p>
            <details>
              <summary>Ingredientes que disfrutas · opcional</summary>
              <p className="muted small">
                Elige favoritos del catálogo. Las exclusiones y restricciones
                tienen prioridad sobre tus favoritos.
              </p>
              <fieldset className="guide-days">
                <legend>Ingredientes favoritos</legend>
                {foods.map((f) => (
                  <label
                    key={f.id}
                    className={
                      a.favoriteIngredients?.includes(f.id) ? "selected" : ""
                    }
                  >
                    <input
                      type="checkbox"
                      checked={a.favoriteIngredients?.includes(f.id) || false}
                      onChange={() =>
                        update(
                          "favoriteIngredients",
                          a.favoriteIngredients?.includes(f.id)
                            ? a.favoriteIngredients.filter((id) => id !== f.id)
                            : [...(a.favoriteIngredients || []), f.id],
                        )
                      }
                    />
                    {f.name}
                  </label>
                ))}
              </fieldset>
            </details>
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
              trazas ni contacto cruzado. Si necesitas adaptación alimentaria,
              revisaremos solo el registro manual.
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
                      }{" "}
                      · {selectedStyle?.label}
                    </p>
                    <p className="muted">
                      {a.sex === "female"
                        ? "Femenino"
                        : a.sex === "male"
                          ? "Masculino"
                          : ""}
                      {a.weight
                        ? ` · ${a.weight} ${a.unit} indicados voluntariamente`
                        : ""}{" "}
                      ·{" "}
                      {guideOptions.horizon.find(([v]) => v === a.horizon)?.[1]}
                    </p>
                    <p>
                      <strong>Cardio seleccionado:</strong>{" "}
                      {selectedCardio.map((c) => c.label).join(" · ")}.{" "}
                      {a.impactTolerance === "low"
                        ? "Preferencia de bajo impacto."
                        : "Impacto según modalidad y capacidad."}
                    </p>
                    <div className="guide-week">
                      {preview.plans.map((p) => {
                        const ids =
                          p.conditioning?.exerciseIds || p.exerciseIds;
                        return (
                          <div key={p.day}>
                            <strong>{names[p.day]}</strong>
                            <span>{p.title}</span>
                            {p.conditioning ? (
                              <small>
                                {p.conditioning.format === "emom"
                                  ? "EMOM"
                                  : "Circuito"}{" "}
                                · {p.conditioning.rounds} vueltas ·{" "}
                                {p.conditioning.durationMinutes} min
                              </small>
                            ) : (
                              <small>
                                {p.exerciseIds.length
                                  ? `${p.exerciseIds.length} ejercicios`
                                  : p.cardio?.length
                                    ? p.cardio
                                        .map(
                                          (c) =>
                                            `${cardioLabel(c.kind)} · ${c.minutes} min`,
                                        )
                                        .join(" / ")
                                    : p.walkMinutes
                                      ? `${p.walkMinutes} min de caminata`
                                      : "Recuperación"}
                              </small>
                            )}
                            {ids.length > 0 && !!p.cardio?.length && (
                              <small>
                                {p.cardio
                                  .map(
                                    (c) =>
                                      `${cardioLabel(c.kind)} · ${c.minutes} min`,
                                  )
                                  .join(" / ")}
                              </small>
                            )}
                            {!!p.sessionPhases?.length && (
                              <small>
                                {p.sessionPhases
                                  .map(
                                    (phase) =>
                                      `${phase.label}: ${phase.minutes} min`,
                                  )
                                  .join(" · ")}
                              </small>
                            )}
                            {ids.length > 0 && (
                              <ul>
                                {ids.map((id) => {
                                  const exercise = preview!.catalog.find(
                                    (e) => e.id === id,
                                  );
                                  return exercise ? (
                                    <li key={id}>
                                      {exercise.name} ·{" "}
                                      {p.conditioning
                                        ? `${p.conditioning.targetReps} repeticiones de referencia por estación`
                                        : `${exercise.sets} × ${exercise.minReps}–${exercise.maxReps}`}
                                    </li>
                                  ) : null;
                                })}
                              </ul>
                            )}
                            {p.conditioning && (
                              <small>
                                {p.conditioning.workSeconds} s de trabajo ·{" "}
                                {p.conditioning.restSeconds} s de descanso.{" "}
                                {p.conditioning.instruction}
                              </small>
                            )}
                          </div>
                        );
                      })}
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
                {!preview.blocked && (
                  <p className="muted">
                    <strong>Ingredientes excluidos:</strong>{" "}
                    {a.excluded.length
                      ? a.excluded
                          .map(
                            (id) =>
                              allergenOptions.find((o) => o.id === id)?.label ||
                              id,
                          )
                          .join(" · ")
                      : "Ninguno de los indicados"}
                    .
                    {!!a.dietaryRestrictions?.length && (
                      <>
                        {" "}
                        <strong>Restricciones:</strong>{" "}
                        {a.dietaryRestrictions
                          .map(
                            (id) =>
                              restrictionOptions.find((o) => o.id === id)
                                ?.label || id,
                          )
                          .join(" · ")}
                        .
                      </>
                    )}
                  </p>
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
              <p className="danger" role="alert">
                {previewError ||
                  "Faltan respuestas. Vuelve a las preguntas para completarlas."}
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
