"use client";
import { useId, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/browser";
import BrandIdentity from "./branding/BrandIdentity";
import { useBrand } from "./branding/BrandProvider";
import AdminIcon from "./AdminIcon";
export default function Login({
  onSuccess,
}: {
  onSuccess: () => void | Promise<void>;
}) {
  const { brand } = useBrand(),
    uid = useId(),
    errorRef = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [visible, setVisible] = useState(false),
    [capsLock, setCapsLock] = useState(false),
    [help, setHelp] = useState(false);
  return (
    <main className="auth-login">
      <section className="auth-story" aria-label="Sua central de gestão">
        <img
          className="auth-story-image"
          src="/zenatocell/admin-boutique.webp"
          alt=""
          width={1122}
          height={1402}
          fetchPriority="high"
        />
        <div className="auth-story-shade" />
        <a
          className="auth-story-brand"
          href="/"
          aria-label={"Visitar a loja " + brand.displayName}
        >
          <BrandIdentity />
        </a>
        <div className="auth-story-copy">
          <span className="auth-story-eyebrow">
            <i />
            Sua loja, conectada ao futuro
          </span>
          <h2>
            Seu negócio.
            <br />
            Seu próximo
            <br />
            <em>capítulo.</em>
          </h2>
          <p>
            Mais clareza para decidir.
            <br />
            Mais espaço para crescer.
          </p>
        </div>
        <div className="auth-story-bottom">
          <span className="auth-story-line" />
          <div>
            <span>
              <AdminIcon name="products" />
              Catálogo
            </span>
            <span>
              <AdminIcon name="stock" />
              Estoque
            </span>
            <span>
              <AdminIcon name="finance" />
              Financeiro
            </span>
          </div>
          <p>Uma central à altura da sua loja.</p>
        </div>
      </section>
      <section className="auth-content" aria-labelledby="auth-title">
        <header className="auth-topline">
          <span className="auth-access-label">
            <AdminIcon name="lock" />
            Área administrativa
          </span>
          <a href="/">
            <AdminIcon name="back" />
            Visitar a loja
          </a>
        </header>
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span className="auth-kicker">O seu dia começa por aqui</span>
            <h1 id="auth-title">
              Bem-vindo
              <br /> de volta<span>.</span>
            </h1>
            <p>
              Acesse sua conta para continuar
              <br className="auth-desktop-break" /> a gestão da{" "}
              <strong>{brand.displayName}</strong>.
            </p>
          </div>
          <form
            className="auth-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError("");
              const form = new FormData(event.currentTarget);
              try {
                const client = getSupabase();
                if (!client) throw new Error("connection");
                const { error } = await client.auth.signInWithPassword({
                  email: String(form.get("email")).trim(),
                  password: String(form.get("password")),
                });
                if (error) {
                  setError(
                    error.status === 429
                      ? "Muitas tentativas. Aguarde um momento e tente novamente."
                      : "Não foi possível entrar. Confira seu e-mail e sua senha.",
                  );
                  requestAnimationFrame(() =>
                    errorRef.current?.focus({ preventScroll: true }),
                  );
                  return;
                }
                await onSuccess();
              } catch {
                setError(
                  "Não foi possível conectar agora. Verifique sua conexão e tente novamente.",
                );
                requestAnimationFrame(() =>
                  errorRef.current?.focus({ preventScroll: true }),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="auth-field">
              <label htmlFor={uid + "-email"}>Seu e-mail</label>
              <div className="auth-input-wrap">
                <AdminIcon name="mail" />
                <input
                  id={uid + "-email"}
                  name="email"
                  type="email"
                  inputMode="email"
                  placeholder="voce@sualoja.com.br"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={busy}
                  aria-describedby={error ? uid + "-error" : undefined}
                />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor={uid + "-password"}>Sua senha</label>
              <div className="auth-input-wrap">
                <AdminIcon name="lock" />
                <input
                  id={uid + "-password"}
                  name="password"
                  type={visible ? "text" : "password"}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                  disabled={busy}
                  onKeyDown={(event) =>
                    setCapsLock(event.getModifierState("CapsLock"))
                  }
                  onKeyUp={(event) =>
                    setCapsLock(event.getModifierState("CapsLock"))
                  }
                  onBlur={() => setCapsLock(false)}
                  aria-describedby={
                    capsLock
                      ? uid + "-caps"
                      : error
                        ? uid + "-error"
                        : undefined
                  }
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                  aria-controls={uid + "-password"}
                  aria-pressed={visible}
                  disabled={busy}
                  onClick={() => setVisible((value) => !value)}
                >
                  <AdminIcon name={visible ? "eye-off" : "eye"} />
                </button>
              </div>
              {capsLock && (
                <span id={uid + "-caps"} className="auth-caps" role="status">
                  A tecla Caps Lock está ativada.
                </span>
              )}
            </div>
            <div className="auth-help-row">
              <span>
                <i />
                Sua conta é individual
              </span>
              <button
                type="button"
                onClick={() => setHelp((value) => !value)}
                aria-expanded={help}
                aria-controls={uid + "-help"}
              >
                Precisa de ajuda?
              </button>
            </div>
            {help && (
              <div id={uid + "-help"} className="auth-help">
                <strong>Estamos por perto.</strong>
                <p>
                  Seu acesso é liberado pelo administrador da loja. Se esqueceu
                  sua senha ou precisa de uma conta, fale com o responsável pelo
                  sistema.
                </p>
                <a
                  href="https://brunomarianosilva.com.br/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Falar com o desenvolvedor <AdminIcon name="external" />
                </a>
              </div>
            )}
            {error && (
              <p
                id={uid + "-error"}
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="auth-error"
              >
                <AdminIcon name="alert" />
                {error}
              </p>
            )}
            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Acessando sua central…
                </>
              ) : (
                <>
                  Entrar no painel
                  <AdminIcon name="arrow" />
                </>
              )}
            </button>
            <p className="auth-secure-note">
              <AdminIcon name="shield" />
              Acesso exclusivo para a equipe autorizada.
            </p>
          </form>
        </div>
        <footer className="auth-footer">
          <span>
            © {new Date().getFullYear()} {brand.displayName}
          </span>
          <a
            href="https://brunomarianosilva.com.br/"
            target="_blank"
            rel="noreferrer"
          >
            <span>Desenvolvido por</span>
            <strong>
              Bruno Mariano
              <svg
                width="11"
                height="11"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="m10 0 2.4 7.6L20 10l-7.6 2.4L10 20l-2.4-7.6L0 10l7.6-2.4Z" />
              </svg>
            </strong>
          </a>
        </footer>
      </section>
    </main>
  );
}
