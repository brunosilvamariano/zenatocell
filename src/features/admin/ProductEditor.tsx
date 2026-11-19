"use client";
import AdminSelect from "./AdminSelect";
import { useRef, useState } from "react";
import AdminDialog from "./AdminDialog";
import type { AdminProduct } from "./types";
import { getSupabase } from "@/lib/supabase/browser";
import { mutate } from "./service";
type Props = {
  product: AdminProduct | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};
export default function ProductEditor({ product, onClose, onSaved }: Props) {
  const [photos, setPhotos] = useState(product?.photos || []),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const id = useRef(product?.id || crypto.randomUUID());
  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      if (
        file.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw new Error("Use JPG, PNG ou WebP de até 5 MB.");
      const client = getSupabase();
      if (!client) throw new Error("Banco não configurado.");
      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      }[file.type];
      const path = id.current + "/" + crypto.randomUUID() + "." + extension;
      const { error } = await client.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setPhotos((previous) => [
        ...previous,
        client.storage.from("product-images").getPublicUrl(path).data.publicUrl,
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminDialog onClose={onClose} labelledBy="edit-title">
      <div className="admin-modal-inner">
        <header>
          <h2 id="edit-title">{product ? "Editar produto" : "Novo produto"}</h2>
          <button type="button" className="admin-quiet" onClick={onClose}>
            Fechar
          </button>
        </header>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            const data = new FormData(event.currentTarget);
            const cents = (key: string) =>
              Math.round(Number(data.get(key)) * 100);
            try {
              await mutate("save_product", {
                p_product: {
                  id: id.current,
                  name: String(data.get("name")).trim(),
                  category: data.get("category"),
                  description: data.get("description"),
                  price: data.get("price") ? cents("price") : null,
                  cost: cents("cost"),
                  installment: data.get("installment")
                    ? cents("installment")
                    : null,
                  months: Number(data.get("months")),
                  warranty: data.get("warranty") || null,
                  active: data.get("active") === "on",
                  photos,
                },
              });
              await onSaved();
              onClose();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Não foi possível salvar.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="admin-form-grid">
            <label>
              Nome e capacidade
              <input
                name="name"
                defaultValue={product?.name}
                maxLength={160}
                required
              />
            </label>
            <label>
              Condição
              <AdminSelect
                name="category"
                defaultValue={product?.category || "Lacrado"}
              >
                <option>Lacrado</option>
                <option>Seminovo</option>
                <option>Apple Watch</option>
              </AdminSelect>
            </label>
            <label>
              Preço à vista (R$)
              <input
                name="price"
                type="number"
                min="0.01"
                step=".01"
                defaultValue={product?.price ? product.price / 100 : ""}
              />
            </label>
            <label>
              Custo por unidade (R$)
              <input
                name="cost"
                type="number"
                min="0"
                step=".01"
                defaultValue={(product?.cost || 0) / 100}
                required
              />
            </label>
            <label>
              Valor da parcela (R$)
              <input
                name="installment"
                type="number"
                min=".01"
                step=".01"
                defaultValue={
                  product?.installment ? product.installment / 100 : ""
                }
              />
            </label>
            <label>
              Número de parcelas
              <input
                name="months"
                type="number"
                min="1"
                max="48"
                defaultValue={product?.months || 12}
                required
              />
            </label>
          </div>
          <label>
            Descrição
            <textarea
              name="description"
              defaultValue={product?.description}
              rows={3}
            />
          </label>
          <label>
            Garantia
            <input name="warranty" defaultValue={product?.warranty || ""} />
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              name="active"
              defaultChecked={product?.active ?? false}
            />{" "}
            Publicar na loja
          </label>
          <fieldset>
            <legend>Fotos do produto</legend>
            <div className="admin-photo-grid">
              {photos.map((photo, index) => (
                <div key={photo}>
                  <img src={photo} alt={"Foto " + (index + 1)} />
                  <button
                    type="button"
                    className="admin-quiet"
                    onClick={() =>
                      setPhotos((previous) =>
                        previous.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <label>
              Adicionar foto
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                  event.target.value = "";
                }}
              />
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          <footer>
            <button disabled={busy}>
              {busy ? "Salvando…" : "Salvar produto"}
            </button>
          </footer>
        </form>
      </div>
    </AdminDialog>
  );
}
