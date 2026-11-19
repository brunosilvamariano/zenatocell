"use client";
import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/browser";
import { mutate } from "../service";
import { useBrand } from "./BrandProvider";
import { prepareLogo } from "./prepareLogo";
import AdminIcon from "../AdminIcon";
export default function BrandSettings() {
  const { brand, available, loading, reload } = useBrand();
  const [name, setName] = useState(brand.displayName),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<string | null>(null),
    [original, setOriginal] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setName(brand.displayName);
  }, [brand.displayName]);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <section className="admin-panel admin-brand-settings">
      <header>
        <div>
          <span className="admin-brand-eyebrow">Sua marca, seu sistema</span>
          <h2>Identidade da loja</h2>
          <p>
            Personalize a logo e o nome exibidos no acesso e no menu
            administrativo.
          </p>
        </div>
        <AdminIcon name="branding" />
      </header>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          setSuccess("");
          try {
            const client = getSupabase();
            if (!client)
              throw new Error("Não foi possível conectar. Tente novamente.");
            let logoPath = original ? null : brand.logoPath;
            if (file) {
              const blob = await prepareLogo(file);
              logoPath = "logos/" + crypto.randomUUID() + ".webp";
              const { error } = await client.storage
                .from("brand-assets")
                .upload(logoPath, blob, {
                  contentType: "image/webp",
                  upsert: false,
                  cacheControl: "31536000",
                });
              if (error)
                throw new Error(
                  "Não foi possível enviar a logo. Tente novamente.",
                );
            }
            await mutate("save_branding", {
              p_display_name: name.trim(),
              p_logo_path: logoPath,
            });
            await reload();
            setFile(null);
            setOriginal(false);
            if (fileInput.current) fileInput.current.value = "";
            setSuccess(
              "Identidade atualizada. A logo já aparece no acesso e no menu.",
            );
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Não foi possível salvar a identidade.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="admin-brand-upload">
          <div className="admin-brand-preview">
            <img
              src={
                preview ||
                (original ? "/zenatocell/zenatocell.svg" : brand.logoUrl)
              }
              alt="Prévia da logo da loja"
            />
          </div>
          <div>
            <strong>Logo da empresa</strong>
            <p>
              Prefira PNG com fundo transparente. Também aceitamos JPG e WebP de
              até 5 MB.
            </p>
            <label className="admin-brand-file">
              <AdminIcon name="upload" />
              {file ? "Trocar imagem" : "Escolher logo"}
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={!available || busy}
                onChange={(event) => {
                  const next = event.target.files?.[0];
                  if (!next) return;
                  if (
                    !["image/png", "image/jpeg", "image/webp"].includes(
                      next.type,
                    ) ||
                    next.size > 5 * 1024 * 1024
                  ) {
                    setError("Use PNG, JPG ou WebP de até 5 MB.");
                    event.target.value = "";
                    return;
                  }
                  setFile(next);
                  setOriginal(false);
                  setError("");
                  setSuccess("");
                }}
              />
            </label>
            {file && <span className="admin-brand-filename">{file.name}</span>}
            <button
              type="button"
              className="admin-quiet"
              disabled={!available || busy}
              onClick={() => {
                setFile(null);
                setOriginal(true);
                setSuccess("");
                if (fileInput.current) fileInput.current.value = "";
              }}
            >
              Usar logo original
            </button>
          </div>
        </div>
        <label>
          Nome da loja
          <input
            value={name}
            minLength={2}
            maxLength={60}
            required
            disabled={!available || busy}
            onChange={(event) => {
              setName(event.target.value);
              setSuccess("");
            }}
          />
        </label>
        <p className="admin-brand-footnote">
          A alteração vale para todos os usuários da administração. Produtos,
          estoque e preços continuam como estão.
        </p>
        {!loading && !available && (
          <p className="admin-error" role="alert">
            A personalização da identidade ainda precisa ser ativada pelo
            administrador do sistema.
          </p>
        )}
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="admin-brand-success" role="status">
            {success}
          </p>
        )}
        <div className="admin-brand-save">
          <button disabled={busy || loading || !available}>
            {busy ? "Salvando identidade…" : "Salvar identidade"}
          </button>
          <span>
            {loading
              ? "Carregando identidade…"
              : "Exibida no login e no painel"}
          </span>
        </div>
      </form>
    </section>
  );
}
