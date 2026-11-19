"use client";
import AdminSelect from "./AdminSelect";
import { useState } from "react";
import AdminDialog from "./AdminDialog";
import type { AdminProduct } from "./types";
import { mutate } from "./service";
import { money } from "@/lib/format";
type Props = {
  products: AdminProduct[];
  onClose: () => void;
  onSaved: () => Promise<void>;
};
export default function OrderEditor({ products, onClose, onSaved }: Props) {
  const available = products.filter((product) => product.price !== null);
  const [lines, setLines] = useState([
    {
      key: crypto.randomUUID(),
      product_id: available[0]?.id || "",
      quantity: 1,
    },
  ]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const total = lines.reduce(
    (sum, line) =>
      sum +
      (available.find((p) => p.id === line.product_id)?.price || 0) *
        line.quantity,
    0,
  );
  return (
    <AdminDialog onClose={onClose} labelledBy="order-title">
      <div className="admin-modal-inner">
        <header>
          <h2 id="order-title">Novo pedido</h2>
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
            try {
              await mutate("create_order", {
                p_customer: String(data.get("customer")),
                p_contact: String(data.get("contact")),
                p_notes: String(data.get("notes")),
                p_items: lines.map(({ product_id, quantity }) => ({
                  product_id,
                  quantity,
                })),
              });
              await onSaved();
              onClose();
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Não foi possível criar o pedido.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="admin-form-grid">
            <label>
              Nome do cliente
              <input name="customer" required minLength={2} maxLength={160} />
            </label>
            <label>
              Telefone / WhatsApp
              <input
                name="contact"
                type="tel"
                required
                minLength={5}
                maxLength={60}
              />
            </label>
          </div>
          <fieldset>
            <legend>Itens do pedido</legend>
            {lines.map((line, index) => (
              <div className="admin-order-line" key={line.key}>
                <label>
                  Produto {index + 1}
                  <AdminSelect
                    value={line.product_id}
                    required
                    onChange={(event) =>
                      setLines((previous) =>
                        previous.map((item) =>
                          item.key === line.key
                            ? { ...item, product_id: event.target.value }
                            : item,
                        ),
                      )
                    }
                  >
                    {available.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name} · {p.category} · {money(p.price!)}
                      </option>
                    ))}
                  </AdminSelect>
                </label>
                <label>
                  Qtd.
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={line.quantity}
                    onChange={(event) =>
                      setLines((previous) =>
                        previous.map((item) =>
                          item.key === line.key
                            ? { ...item, quantity: Number(event.target.value) }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  aria-label={"Remover item " + (index + 1)}
                  className="admin-quiet"
                  disabled={lines.length === 1}
                  onClick={() =>
                    setLines((previous) =>
                      previous.filter((item) => item.key !== line.key),
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="admin-quiet"
              disabled={!available.length || lines.length >= 100}
              onClick={() =>
                setLines((previous) => [
                  ...previous,
                  {
                    key: crypto.randomUUID(),
                    product_id: available[0].id,
                    quantity: 1,
                  },
                ])
              }
            >
              + Adicionar produto
            </button>
          </fieldset>
          <label>
            Observações
            <textarea name="notes" rows={3} maxLength={2000} />
          </label>
          <div className="admin-order-total">
            <span>Total à vista</span>
            <strong>{money(total)}</strong>
          </div>
          <p className="admin-panel-copy">
            O pedido começa como aguardando. O estoque será baixado ao confirmar
            a venda. O valor final é calculado novamente pelo banco.
          </p>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          <button disabled={busy || !available.length}>
            {busy ? "Criando…" : "Criar pedido"}
          </button>
        </form>
      </div>
    </AdminDialog>
  );
}
