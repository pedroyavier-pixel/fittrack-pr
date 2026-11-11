import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Dumbbell,
  ShieldCheck,
  Mail,
  Activity,
} from "lucide-react";
import { supabase } from "../lib/client";
export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "code">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (mode === "code") {
        const { error } = sent
          ? await supabase.auth.verifyOtp({ email, token: code, type: "email" })
          : await supabase.auth.signInWithOtp({
              email,
              options: {
                emailRedirectTo: location.origin + import.meta.env.BASE_URL,
              },
            });
        if (error) throw error;
        if (!sent) {
          setSent(true);
          setMsg(
            "Revisa tu correo. Puedes abrir el enlace recibido o introducir el código si aparece en el mensaje.",
          );
        }
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: location.origin + import.meta.env.BASE_URL,
          },
        });
        if (error) throw error;
        if (!data.session)
          setMsg(
            "Revisa tu correo y confirma tu cuenta. Después podrás entrar con tu contraseña.",
          );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-brand">
        <span className="brand-icon">
          <Activity size={24} />
        </span>{" "}
        FITTRACK <span>PR</span>
      </div>
      <div className="auth-layout">
        <section className="auth-story">
          <span className="eyebrow">
            <span className="live-dot" /> TU PLAN. TU RITMO.
          </span>
          <h1>
            Lo que haces hoy.
            <br />
            <em>
              Lo que construyes
              <br />
              mañana.
            </em>
          </h1>
          <p>
            Tu entrenamiento, tus comidas y tu progreso.
            <br />
            Todo conectado, un día a la vez.
          </p>
          <div className="auth-program">
            <Dumbbell />
            <div>
              <strong>Entrena a tu ritmo</strong>
              <span>Guía adaptable · Comidas sugeridas · Registro privado</span>
            </div>
            <ArrowUpRight />
          </div>
          <div className="auth-art">
            <span className="art-ring one" />
            <span className="art-ring two" />
            <span className="art-ring three" />
            <span className="art-caption">
              CONSTANCIA
              <br />
              <b>sobre perfección.</b>
            </span>
            <span className="art-number">HOY</span>
          </div>
        </section>
        <section className="auth-card card">
          <span className="eyebrow">BIENVENIDO A FITTRACK PR</span>
          <h2>
            {mode === "signup"
              ? "Comienza a tu ritmo."
              : "Tu siguiente paso empieza aquí."}
          </h2>
          <p className="muted">
            Entra para crear tu guía y guardar tus registros. FitTrack orienta;
            no sustituye a un entrenador, nutricionista ni profesional de salud.
          </p>
          <div className="segmented">
            <button
              onClick={() => {
                setMode("login");
                setMsg("");
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setMsg("");
              }}
            >
              Crear cuenta
            </button>
          </div>
          <form onSubmit={submit} className="stack">
            <label className="field">
              Correo electrónico
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </label>
            {mode !== "code" ? (
              <label className="field">
                Contraseña
                <input
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </label>
            ) : (
              sent && (
                <label className="field">
                  Código del correo
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Código de verificación"
                  />
                </label>
              )
            )}
            <button disabled={busy} className="btn primary" type="submit">
              {busy
                ? "Conectando…"
                : mode === "signup"
                  ? "Crear mi cuenta"
                  : mode === "code"
                    ? sent
                      ? "Verificar código"
                      : "Recibir enlace de acceso"
                    : "Entrar a mi plan"}
              <ArrowRight size={18} />
            </button>
          </form>
          <button
            className="btn ghost"
            onClick={() => {
              setMode(mode === "code" ? "login" : "code");
              setSent(false);
              setMsg("");
            }}
          >
            <Mail size={16} />
            {mode === "code"
              ? "Usar contraseña"
              : "Entrar con un enlace por correo"}
          </button>
          {msg && (
            <p className="notice" role="status">
              {msg}
            </p>
          )}
          <div className="auth-security">
            <ShieldCheck size={18} />
            <span>Tus registros son privados y pertenecen a tu cuenta.</span>
          </div>
          <small className="muted">
            Hora de Puerto Rico · America/Puerto_Rico
          </small>
        </section>
      </div>
      <footer className="auth-footer">
        HECHO PARA LA VIDA REAL. <span>UN DÍA A LA VEZ.</span>
      </footer>
    </main>
  );
}
