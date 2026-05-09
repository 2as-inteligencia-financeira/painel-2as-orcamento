import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";
import App from "./App.jsx";
import { clearAuth, initHubSessionFromUrl } from "./hubAuth.js";

function Logo2AS({ size = 36 }) {
  return (
    <div style={{
      fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",
      fontSize:size,
      fontWeight:900,
      letterSpacing:"-.04em",
      lineHeight:1,
      display:"flex",
      alignItems:"baseline",
    }}
    >
      <span style={{ color:"var(--amber)" }}>2</span>
      <span style={{ color:"var(--ink)" }}>AS</span>
    </div>
  );
}

export default function Gate() {
  if (!supabase) return <App />;
  return <GateWithSupabase />;
}

function GateWithSupabase() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    initHubSessionFromUrl().then(() =>
      supabase.auth.getSession().then(({ data: { session:s } }) => setSession(s))
    );

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email, password, setLoading, setError) => {
    setLoading(true);
    setError("");
    try {
      const { error:e } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (e) setError("E-mail ou senha inválidos.");
    } catch {
      setError("Não foi possível validar o acesso.");
    }
    finally {
      setLoading(false);
    }
  }, []);

  if (session === undefined) return <div style={{ padding:24, fontSize:13, color:"var(--muted)" }}>Carregando…</div>;
  if (!session) return <Login onLogin={signIn} />;
  return (
    <App
      sessionEmail={session.user?.email ?? null}
      onSignOut={() => clearAuth()}
    />
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = (ev) => {
    ev.preventDefault();
    void onLogin(email, password, setLoading, setError);
  };

  const border = "1px solid var(--line-strong)";
  return (
    <div style={{
      minHeight:"100vh",
      background:"var(--paper)",
      color:"var(--ink)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:24,
    }}
    >
      <form onSubmit={submit}
        style={{
          width:"100%",
          maxWidth:360,
          background:"var(--card)",
          border,
          padding:24,
          boxShadow:"0 14px 40px rgba(10,10,10,.08)",
        }}
      >
        <Logo2AS size={32} />
        <h1 style={{ fontSize:18, margin:"14px 0 4px", fontWeight:700 }}>Módulo Orçamento 2AS</h1>
        <p style={{ fontSize:12, color:"var(--muted)", margin:"0 0 18px" }}>
          Mesmo login do Hub. Ou abra a partir do <strong>app.2asfinancas.com</strong>.
        </p>
        <label style={{ fontSize:11, fontWeight:700 }}>E-mail</label>
        <input autoComplete="username" style={{ marginTop:6, marginBottom:12 }} type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="login-field"
        />
        <label style={{ fontSize:11, fontWeight:700 }}>Senha</label>
        <input autoComplete="current-password" style={{ marginTop:6 }} type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="login-field"
        />
        {error && <div style={{ color:"var(--red)", fontSize:12, marginTop:10 }}>{error}</div>}
        <button disabled={loading || !email.trim() || !password} type="submit"
          style={{
            width:"100%",
            marginTop:16,
            height:40,
            border:0,
            borderRadius:4,
            background:loading ? "var(--line)" : "var(--amber)",
            color:loading ? "var(--dim)" : "var(--ink)",
            fontWeight:800,
            cursor:loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Validando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
