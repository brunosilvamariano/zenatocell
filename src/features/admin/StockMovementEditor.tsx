"use client";
import AdminSelect from "./AdminSelect";
import { useState } from "react";
import AdminDialog from "./AdminDialog";
import { mutate } from "./service";
import type { AdminProduct } from "./types";
export default function StockMovementEditor({
  products,
  product,
  onClose,
  onSaved,
}: {
  products: AdminProduct[];
  product: AdminProduct | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [productId, setProductId] = useState(
    product?.id || products[0]?.id || "",
  );
  const [direction, setDirection] = useState<"in" | "out">("in"),
    [quantity, setQuantity] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const selected = products.find((item) => item.id === productId),
    balance = selected
      ? selected.stock + (direction === "in" ? quantity : -quantity)
      : null;
  return (
    <AdminDialog
      onClose={() => {
        if (!busy) onClose();
      }}
      labelledBy="stock-editor-title"
    >
      <div className="admin-modal-inner admin-stock-editor">
        <header>
          <div>
            <h2 id="stock-editor-title">Movimentar estoque</h2>
            <p>Registre uma entrada ou saída com o motivo.</p>
          </div>
          <button
            type="button"
            className="admin-quiet"
            disabled={busy}
            onClick={onClose}
          >
            Fechar
          </button>
        </header>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!selected || !Number.isInteger(quantity) || quantity < 1) {
              setError(
                "Selecione um produto e uma quantidade inteira maior que zero.",
              );
              return;
            }
            if (balance !== null && balance < 0) {
              setError("A quantidade de saída supera o estoque disponível.");
              return;
            }
            const data = new FormData(event.currentTarget);
            setBusy(true);
            setError("");
            try {
              await mutate("adjust_stock", {
                p_product_id: productId,
                p_quantity: direction === "in" ? quantity : -quantity,
                p_reason: String(data.get("reason")).trim(),
              });
              await onSaved();
              onClose();
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Não foi possível registrar a movimentação.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Produto
            <AdminSelect
              value={productId}
              required
              disabled={busy}
              onChange={(event) => {
                setProductId(event.target.value);
                setError("");
              }}
            >
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.category}
                </option>
              ))}
            </AdminSelect>
          </label>
          <div className="admin-form-grid">
            <label>
              Tipo de movimentação
              <AdminSelect
                value={direction}
                disabled={busy}
                onChange={(event) => {
                  setDirection(event.target.value as "in" | "out");
                  setError("");
                }}
              >
                <option value="in">Entrada de estoque</option>
                <option value="out">Saída de estoque</option>
              </AdminSelect>
            </label>
            <label>
              Quantidade
              <input
                type="number"
                min={1}
                max={1000000}
                step={1}
                required
                disabled={busy}
                value={quantity}
                onChange={(event) => {
                  setQuantity(Number(event.target.value));
                  setError("");
                }}
              />
            </label>
          </div>
          <div className="admin-stock-preview" aria-live="polite">
            <div>
              <span>Estoque atual</span>
              <strong>{selected?.stock ?? "—"}</strong>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <span>Após a movimentação</span>
              <strong
                className={balance !== null && balance < 0 ? "admin-error" : ""}
              >
                {balance !== null && Number.isInteger(quantity) && quantity > 0
                  ? balance
                  : "—"}
              </strong>
            </div>
          </div>
          <label>
            Motivo
            <textarea
              name="reason"
              rows={3}
              minLength={3}
              maxLength={250}
              required
              placeholder="Ex.: recebimento de mercadoria, devolução ou ajuste de contagem"
              disabled={busy}
            />
          </label>
          <p className="admin-stock-note">
            O estoque é conferido novamente pelo banco. Vendas confirmadas e
            cancelamentos registram suas movimentações automaticamente.
          </p>
          {balance !== null && balance < 0 && (
            <p className="admin-error" role="alert">
              A saída supera o estoque disponível. Reduza a quantidade ou
              registre uma entrada.
            </p>
          )}
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <button
            disabled={
              busy ||
              !selected ||
              quantity < 1 ||
              !Number.isInteger(quantity) ||
              (balance !== null && balance < 0)
            }
          >
            {busy ? "Registrando…" : "Confirmar movimentação"}
          </button>
        </form>
      </div>
    </AdminDialog>
  );
}
