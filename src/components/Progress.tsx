import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  Edit3,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
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
import { supabase } from "../lib/client";
import { FitStore, type Row, useStore } from "../lib/store";
import { dateLabel, prDate, shiftDate } from "../lib/time";

const LB_PER_KG = 2.2046226218;
const round = (n: number, d = 1) => Number(n.toFixed(d));
const shortDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
function dailyWeights(rows: Row[]) {
  const result = new Map<string, number[]>();
  for (const row of rows) {
    const value = Number(row.data.weightLb);
    if (row.local_date && Number.isFinite(value) && value > 0)
      result.set(row.local_date, [
        ...(result.get(row.local_date) || []),
        value,
      ]);
  }
  return new Map(
    [...result].map(([day, values]) => [
      day,
      values.reduce((a, b) => a + b, 0) / values.length,
    ]),
  );
}
export function weightSeries(
  rows: Row[],
  end: string,
  days: number,
  unit: "lb" | "kg",
) {
  const daily = dailyWeights(rows),
    divisor = unit === "kg" ? LB_PER_KG : 1;
  return Array.from({ length: days }, (_, index) => {
    const day = shiftDate(end, index - days + 1);
    const previous = Array.from({ length: 7 }, (_, i) =>
      daily.get(shiftDate(day, -i)),
    ).filter((v): v is number => v !== undefined);
    return {
      date: day,
      label: shortDate(day),
      weight: daily.has(day) ? round(daily.get(day)! / divisor) : null,
      average: previous.length
        ? round(previous.reduce((a, b) => a + b, 0) / previous.length / divisor)
        : null,
    };
  });
}
function readingSort(a: Row, b: Row) {
  return `${a.local_date}T${a.data.time || "00:00"}:${a.created_at || ""}`.localeCompare(
    `${b.local_date}T${b.data.time || "00:00"}:${b.created_at || ""}`,
  );
}
export function Progress({
  store,
  date,
  unit,
}: {
  store: FitStore;
  date: string;
  unit: "lb" | "kg";
}) {
  useStore(store);
  const records = store.list("body_measurements").sort(readingSort);
  const latest = records.at(-1);
  const profile = store.list("user_profiles")[0]?.data || {};
  const initial =
    Number(profile.initialWeightLb) || Number(records[0]?.data.weightLb) || 0;
  const current = Number(latest?.data.weightLb) || 0;
  const divisor = unit === "kg" ? LB_PER_KG : 1;
  const [days, setDays] = useState(30);
  const [recordDate, setRecordDate] = useState(date);
  const [time, setTime] = useState("");
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [waistUnit, setWaistUnit] = useState<"cm" | "in">("cm");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);
  const series = useMemo(
    () => weightSeries(records, date, days, unit),
    [records.map((r) => r.id + r.updated_at).join("|"), date, days, unit],
  );
  const rolling = series.at(-1)?.average;
  const photoKey = records
    .map((r) => r.data.photoPath)
    .filter(Boolean)
    .join("|");
  useEffect(() => {
    let cancelled = false;
    const entries = records.filter((r) => r.data.photoPath);
    const refresh = () => {
      void Promise.all(
        entries.map(async (row) => {
          const { data } = await supabase.storage
            .from("fittrack-progress")
            .createSignedUrl(String(row.data.photoPath), 900);
          return [row.id, data?.signedUrl || ""] as const;
        }),
      ).then((results) => {
        if (!cancelled) setPhotoUrls(Object.fromEntries(results));
      });
    };
    refresh();
    const timer = setInterval(refresh, 12 * 60 * 1000);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [photoKey, store.userId]);
  useEffect(() => {
    if (!weight && !waist && !notes && !editing && !file) setRecordDate(date);
  }, [date]);
  function clear() {
    setEditing(null);
    setWeight("");
    setWaist("");
    setTime("");
    setNotes("");
    setFile(null);
    setRecordDate(date);
  }
  function edit(row: Row) {
    setEditing(row);
    setRecordDate(row.local_date || date);
    setWeight(String(round(Number(row.data.weightLb) / divisor, 2)));
    setWaist(
      row.data.waistCm
        ? String(
            round(
              Number(row.data.waistCm) / (waistUnit === "in" ? 2.54 : 1),
              2,
            ),
          )
        : "",
    );
    setTime(row.data.time || "");
    setNotes(row.data.notes || "");
    setFile(null);
    setMessage("");
    setError("");
    document
      .getElementById("body-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    const weightLb = Number(weight) * divisor;
    const waistCm = waist
      ? Number(waist) * (waistUnit === "in" ? 2.54 : 1)
      : undefined;
    if (
      !recordDate ||
      !Number.isFinite(weightLb) ||
      weightLb <= 0 ||
      weightLb > 1500 ||
      (waistCm !== undefined && (!Number.isFinite(waistCm) || waistCm <= 0))
    ) {
      setError(
        "Introduce un peso válido y una cintura mayor que cero, si la registras.",
      );
      return;
    }
    setBusy(true);
    try {
      let photoPath = editing?.data.photoPath;
      if (file) {
        if (!navigator.onLine)
          throw new Error(
            "La foto necesita conexión. Puedes quitarla y guardar la medición ahora.",
          );
        if (file.size > 10 * 1024 * 1024)
          throw new Error("La foto debe pesar menos de 10 MB.");
        if (
          ![
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
          ].includes(file.type)
        )
          throw new Error("Selecciona una foto JPEG, PNG, WebP o HEIC.");
        const extension = file.type.split("/")[1].replace("jpeg", "jpg");
        photoPath = `${store.userId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("fittrack-progress")
          .upload(photoPath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
      }
      store.save(
        "body_measurements",
        {
          ...editing?.data,
          weightLb: round(weightLb, 3),
          waistCm: waistCm === undefined ? null : round(waistCm, 2),
          time: time || null,
          notes,
          photoPath: photoPath || null,
        },
        { id: editing?.id, local_date: recordDate },
      );
      clear();
      setMessage("Medición guardada. Se sincronizará con tu cuenta.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : (e as { message?: string })?.message ||
              "No se pudo guardar la medición.",
      );
    } finally {
      setBusy(false);
    }
  }
  function remove(row: Row) {
    if (!window.confirm(`¿Eliminar la medición del ${row.local_date}?`)) return;
    try {
      store.remove("body_measurements", row);
      if (editing?.id === row.id) clear();
      setMessage("Medición eliminada del historial.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  }
  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <p className="eyebrow">TU EVOLUCIÓN</p>
          <h1>Mi progreso</h1>
        </div>
        <Scale size={25} aria-hidden="true" />
      </div>
      <div className="grid2">
        <div className="card">
          <span className="muted">Peso inicial</span>
          <h2>
            {initial ? round(initial / divisor) : "—"} <small>{unit}</small>
          </h2>
          <span className="muted">Referencia de tu perfil</span>
        </div>
        <div className="card">
          <span className="muted">Peso más reciente</span>
          <h2>
            {current ? round(current / divisor) : "—"} <small>{unit}</small>
          </h2>
          <span className="muted">
            {latest?.local_date
              ? shortDate(latest.local_date)
              : "Registra tu primera medición"}
          </span>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <div className="row">
            <span className="muted">Cambio acumulado</span>
            {current && initial ? (
              current < initial ? (
                <TrendingDown size={18} />
              ) : (
                <TrendingUp size={18} />
              )
            ) : null}
          </div>
          <h2>
            {current && initial
              ? `${current - initial > 0 ? "+" : ""}${round((current - initial) / divisor)}`
              : "—"}{" "}
            <small>{unit}</small>
          </h2>
        </div>
        <div className="card">
          <span className="muted">Promedio móvil · 7 días</span>
          <h2>
            {rolling ?? "—"} <small>{unit}</small>
          </h2>
          <span className="muted">Días con mediciones registradas</span>
        </div>
      </div>
      <section className="card">
        <div className="section-title">
          <h2>Tendencia de peso</h2>
          <div className="row" aria-label="Período del gráfico">
            {[7, 30, 90].map((n) => (
              <button
                key={n}
                className={`btn ${days === n ? "primary" : "ghost"}`}
                onClick={() => setDays(n)}
                aria-pressed={days === n}
              >
                {n} días
              </button>
            ))}
          </div>
        </div>
        {records.length ? (
          <div style={{ width: "100%", height: 260, marginTop: 18 }}>
            <ResponsiveContainer>
              <LineChart
                data={series}
                margin={{ left: 0, right: 12, top: 10, bottom: 0 }}
              >
                <CartesianGrid stroke="#24353c" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#8da2ab"
                  minTickGap={30}
                  fontSize={11}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#8da2ab"
                  width={45}
                  fontSize={11}
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
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)} ${unit}`,
                    name === "weight" ? "Peso" : "Media de 7 días",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#d5e8e9"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#62d8ba"
                  strokeWidth={3}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty">
            <Scale size={30} />
            <p>Tu primera medición inicia la gráfica.</p>
          </div>
        )}
        <p className="muted">
          El promedio usa la media de cada día registrado en una ventana de
          siete días calendario. Las variaciones diarias también reflejan agua,
          comida y otras fluctuaciones; una medición aislada no determina
          cambios de grasa.
        </p>
      </section>
      <form id="body-form" className="card stack" onSubmit={save}>
        <div className="section-title">
          <h2>{editing ? "Editar medición" : "Registrar una medición"}</h2>
          {editing && (
            <button type="button" className="btn ghost" onClick={clear}>
              <X size={17} /> Cancelar
            </button>
          )}
        </div>
        <p className="muted">
          {recordDate !== prDate()
            ? `Guardando para ${dateLabel(recordDate)}.`
            : "Una referencia consistente: al levantarte, después de ir al baño y antes de desayunar."}
        </p>
        <div className="grid2">
          <label className="field">
            Fecha
            <input
              aria-label="Fecha de medición"
              type="date"
              required
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
            />
          </label>
          <label className="field">
            Hora · opcional
            <input
              aria-label="Hora de medición"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>
        <div className="grid2">
          <label className="field">
            Peso ({unit})
            <input
              aria-label={`Peso corporal en ${unit}`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0.1"
              required
              value={weight}
              placeholder={unit === "lb" ? "190.0" : "86.2"}
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
          <div className="field">
            <div className="row">
              <label htmlFor="waist-input">Cintura · opcional</label>
              <select
                aria-label="Unidad de cintura"
                value={waistUnit}
                onChange={(e) => {
                  const next = e.target.value as "cm" | "in";
                  if (waist)
                    setWaist(
                      String(
                        round(
                          Number(waist) * (next === "in" ? 1 / 2.54 : 2.54),
                          2,
                        ),
                      ),
                    );
                  setWaistUnit(next);
                }}
              >
                <option value="cm">cm</option>
                <option value="in">pulgadas</option>
              </select>
            </div>
            <input
              id="waist-input"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0.1"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
            />
          </div>
        </div>
        <label className="field">
          Notas
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cómo te sientes, sueño, contexto de la medición…"
            rows={3}
          />
        </label>
        <label className="field">
          <span className="row">
            <Camera size={18} /> Foto privada · opcional
          </span>
          <input
            aria-label="Fotografía de progreso privada"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <span className="muted">
            Máximo 10 MB. Solo tu cuenta tiene acceso; para subirla necesitas
            conexión.
          </span>
        </label>
        {file && (
          <button
            type="button"
            className="btn ghost"
            onClick={() => setFile(null)}
          >
            Quitar foto seleccionada
          </button>
        )}
        {error && (
          <p role="alert" className="danger">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <button className="btn primary" disabled={busy} type="submit">
          <Check size={18} />
          {busy
            ? "Guardando…"
            : editing
              ? "Guardar cambios"
              : "Guardar medición"}
        </button>
      </form>
      <section className="card stack">
        <div className="section-title">
          <h2>Historial de mediciones</h2>
          <span className="badge">{records.length} registros</span>
        </div>
        {!records.length && (
          <p className="empty">Aún no hay mediciones registradas.</p>
        )}
        {(showAll ? records : records.slice(-10))
          .slice()
          .reverse()
          .map((row) => (
            <article
              key={row.id}
              className="stack"
              style={{ borderTop: "1px solid #263a42", paddingTop: 16 }}
            >
              <div className="row">
                <div>
                  <strong>
                    {round(Number(row.data.weightLb) / divisor)} {unit}
                  </strong>
                  <p className="muted">
                    {row.local_date} {row.data.time || ""}
                    {row.data.waistCm
                      ? ` · Cintura: ${round(Number(row.data.waistCm) / (waistUnit === "in" ? 2.54 : 1))} ${waistUnit === "in" ? "pulg." : "cm"}`
                      : ""}
                  </p>
                </div>
                <div className="row">
                  <button
                    className="btn ghost"
                    type="button"
                    aria-label={`Editar medición del ${row.local_date}`}
                    onClick={() => edit(row)}
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    className="btn ghost danger"
                    type="button"
                    aria-label={`Eliminar medición del ${row.local_date}`}
                    onClick={() => remove(row)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              {row.data.notes && <p>{row.data.notes}</p>}
              {photoUrls[row.id] && (
                <details>
                  <summary className="btn ghost">
                    <Camera size={17} /> Ver foto privada
                  </summary>
                  <img
                    src={photoUrls[row.id]}
                    alt={`Progreso del ${row.local_date}`}
                    loading="lazy"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 480,
                      borderRadius: 16,
                      marginTop: 12,
                      objectFit: "contain",
                    }}
                  />
                </details>
              )}
            </article>
          ))}
        {records.length > 10 && (
          <button className="btn ghost" onClick={() => setShowAll(!showAll)}>
            <ChevronDown size={16} />
            {showAll ? "Mostrar diez recientes" : "Ver historial completo"}
          </button>
        )}
      </section>
    </div>
  );
}
