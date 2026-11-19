"use client";
import { useEffect, useState } from "react";
import AdminDialog from "./AdminDialog";
import StockHistory from "./StockHistory";
import { getSupabase } from "@/lib/supabase/browser";
import type { AdminProduct, Movement } from "./types";
export default function ProductHistory({
  product,
  onClose,
}: {
  product: AdminProduct;
  onClose: () => void;
}) {
  const [movements, setMovements] = useState<Movement[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const client = getSupabase();
    if (!client) {
      setError("Conecte o banco para consultar o histórico.");
      setLoading(false);
      return;
    }
    void client
      .from("stock_movements")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error)
          setError(
            "Não foi possível consultar as movimentações deste produto.",
          );
        else setMovements(data || []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id, attempt]);
  return (
    <AdminDialog onClose={onClose} labelledBy="product-history-title">
      <div className="admin-modal-inner admin-history-dialog">
        <header>
          <div>
            <h2 id="product-history-title">Histórico do produto</h2>
            <p>
              {product.name} · {product.category}
            </p>
          </div>
          <button className="admin-quiet" onClick={onClose}>
            Fechar
          </button>
        </header>
        <div className="admin-history-balance">
          <span>Estoque atual</span>
          <strong>
            {product.stock} {product.stock === 1 ? "unidade" : "unidades"}
          </strong>
        </div>
        {loading ? (
          <p role="status">Carregando movimentações…</p>
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <button
              className="admin-quiet"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <StockHistory movements={movements} products={[product]} />
        )}
      </div>
    </AdminDialog>
  );
}
