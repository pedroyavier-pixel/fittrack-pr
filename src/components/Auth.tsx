import { useState, type FormEvent } from "react";
import { ArrowRight, Mail } from "lucide-react";
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
      <header className="auth-minimal-brand">
        <h1>FITTRACK</h1>
        <p>NO EXCUSES. JUST DO IT!</p>
      </header>
      <div className="auth-minimal-layout">
        <section className="auth-card card" aria-label="Acceso a FitTrack">
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
        </section>
      </div>
    </main>
  );
}
