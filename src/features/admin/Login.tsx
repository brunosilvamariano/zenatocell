"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase/browser";
export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="admin-login">
      <a href="/" className="admin-wordmark">
        ZenatoCell<span>Gestão da loja</span>
      </a>
      <section>
        <span className="admin-eyebrow">ACESSO RESTRITO</span>
        <h1>Bem-vindo de volta.</h1>
        <p>Entre com o acesso disponibilizado pelo administrador.</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            const form = new FormData(event.currentTarget);
            try {
              const client = getSupabase();
              if (!client) throw new Error("Banco não configurado.");
              const { error } = await client.auth.signInWithPassword({
                email: String(form.get("email")).trim(),
                password: String(form.get("password")),
              });
              if (error) throw error;
              onSuccess();
            } catch {
              setError("Não foi possível entrar. Confira seu e-mail e senha.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            E-mail
            <input name="email" type="email" required autoComplete="username" />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button disabled={busy}>
            {busy ? "Entrando…" : "Entrar no painel"}
          </button>
        </form>
      </section>
      <a href="/">← Voltar para a loja</a>
    </main>
  );
}
