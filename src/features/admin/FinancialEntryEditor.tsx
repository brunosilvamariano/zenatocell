"use client";
import AdminSelect from "./AdminSelect";
import { useState } from "react";
import AdminDialog from "./AdminDialog";
import { mutate } from "./service";
export default function FinancialEntryEditor({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <AdminDialog
      onClose={() => {
        if (!busy) onClose();
      }}
      labelledBy="finance-entry-title"
    >
      <div className="admin-modal-inner">
        <header>
          <h2 id="finance-entry-title">Lançamento financeiro</h2>
          <button className="admin-quiet" disabled={busy} onClick={onClose}>
            Fechar
          </button>
        </header>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setBusy(true);
            setError("");
            try {
              await mutate("add_financial_entry", {
                p_kind: String(data.get("kind")),
                p_amount: Math.round(Number(data.get("amount")) * 100),
                p_description: String(data.get("description")).trim(),
                p_date: String(data.get("date")),
              });
              await onSaved();
              onClose();
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Não foi possível registrar o lançamento.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Tipo
            <AdminSelect name="kind">
              <option value="expense">Saída / despesa</option>
              <option value="income">Entrada</option>
            </AdminSelect>
          </label>
          <label>
            Valor (R$)
            <input name="amount" type="number" min=".01" step=".01" required />
          </label>
          <label>
            Descrição
            <input name="description" minLength={3} required maxLength={250} />
          </label>
          <label>
            Data
            <input
              name="date"
              type="date"
              defaultValue={new Date().toLocaleDateString("sv-SE")}
              required
            />
          </label>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          <button disabled={busy}>
            {busy ? "Salvando…" : "Salvar lançamento"}
          </button>
        </form>
      </div>
    </AdminDialog>
  );
}
