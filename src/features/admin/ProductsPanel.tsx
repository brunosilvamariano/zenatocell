"use client";
import AdminSelect from "./AdminSelect";
import { useState } from "react";
import { money, normalize } from "@/lib/format";
import type { AdminProduct, Movement } from "./types";
import StockHistory from "./StockHistory";
import AdminIcon from "./AdminIcon";
type Props = {
  products: AdminProduct[];
  movements: Movement[];
  search: string;
  onSearch: (value: string) => void;
  connected: boolean;
  canManage: boolean;
  onEdit: (product: AdminProduct) => void;
  onMove: (product: AdminProduct | null) => void;
  onHistory: (product: AdminProduct) => void;
};
export default function ProductsPanel({
  products,
  movements,
  search,
  onSearch,
  connected,
  canManage,
  onEdit,
  onMove,
  onHistory,
}: Props) {
  const [view, setView] = useState<"catalog" | "history">("catalog");
  const [category, setCategory] = useState("all"),
    [availability, setAvailability] = useState("all");
  const filtered = products.filter(
    (product) =>
      normalize(product.name + " " + product.category).includes(
        normalize(search),
      ) &&
      (category === "all" || product.category === category) &&
      (availability === "all" ||
        (connected &&
          (availability === "available"
            ? product.stock > 0
            : product.stock === 0))),
  );
  const showHistory = view === "history";
  const units = products.reduce((sum, product) => sum + product.stock, 0);
  return (
    <div className="admin-products-workspace">
      <div className="admin-product-summary">
        <div>
          <span>Produtos cadastrados</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Unidades em estoque</span>
          <strong>{connected ? units : "—"}</strong>
        </div>
        <div>
          <span>Produtos sem estoque</span>
          <strong>
            {connected
              ? products.filter((product) => product.stock === 0).length
              : "—"}
          </strong>
        </div>
      </div>
      <div
        className="admin-product-views"
        role="group"
        aria-label="Visualização de produtos"
      >
        <button aria-pressed={!showHistory} onClick={() => setView("catalog")}>
          <AdminIcon name="products" />
          Produtos
        </button>
        <button
          aria-pressed={showHistory}
          onClick={() => {
            setView("history");
            onSearch("");
          }}
        >
          <AdminIcon name="history" />
          Movimentações de estoque
        </button>
      </div>
      {showHistory ? (
        <StockHistory movements={movements} products={products} />
      ) : (
        <section className="admin-panel">
          <header className="admin-product-filters">
            <label className="admin-search">
              <span className="admin-sr">Pesquisar produtos</span>
              <input
                value={search}
                placeholder="Buscar por modelo ou condição"
                onChange={(event) => onSearch(event.target.value)}
              />
            </label>
            <label>
              <span className="admin-sr">Filtrar por condição</span>
              <AdminSelect
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">Todas as condições</option>
                <option>Lacrado</option>
                <option>Seminovo</option>
                <option>Apple Watch</option>
              </AdminSelect>
            </label>
            <label>
              <span className="admin-sr">Filtrar por estoque</span>
              <AdminSelect
                value={availability}
                disabled={!connected}
                onChange={(event) => setAvailability(event.target.value)}
              >
                <option value="all">Todo o estoque</option>
                <option value="available">Com estoque</option>
                <option value="empty">Sem estoque</option>
              </AdminSelect>
            </label>
            <span>
              {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
            </span>
          </header>
          <div className="admin-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Condição</th>
                  <th>Preço à vista</th>
                  <th>Estoque</th>
                  <th>Publicação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product">
                        <img
                          src={product.photos[0]}
                          alt=""
                          width={44}
                          height={44}
                        />
                        <span>
                          <strong>{product.name}</strong>
                          <small>{product.id}</small>
                        </span>
                      </div>
                    </td>
                    <td data-label="Condição">{product.category}</td>
                    <td
                      data-label="Preço à vista"
                      className="admin-product-price"
                    >
                      {product.price === null
                        ? "Sob consulta"
                        : money(product.price)}
                    </td>
                    <td data-label="Estoque">
                      <span
                        className={
                          "admin-stock-count" +
                          (connected && product.stock === 0 ? " is-empty" : "")
                        }
                      >
                        {connected ? product.stock : "—"}
                      </span>
                      <small className="admin-stock-caption">
                        {connected
                          ? product.stock === 1
                            ? "unidade"
                            : "unidades"
                          : "A conectar"}
                      </small>
                    </td>
                    <td data-label="Publicação">
                      <span className="admin-status">
                        {!connected
                          ? "A importar"
                          : product.active
                            ? "Publicado"
                            : "Oculto"}
                      </span>
                    </td>
                    <td data-label="Ações">
                      <div className="admin-product-actions">
                        <button
                          className="admin-quiet"
                          disabled={!canManage}
                          aria-label={
                            "Editar cadastro de " +
                            product.name +
                            " · " +
                            product.category
                          }
                          onClick={() => onEdit(product)}
                        >
                          <AdminIcon name="edit" />
                          Cadastro
                        </button>
                        <button
                          className="admin-quiet"
                          disabled={!connected}
                          aria-label={
                            "Movimentar estoque de " +
                            product.name +
                            " · " +
                            product.category
                          }
                          onClick={() => onMove(product)}
                        >
                          <AdminIcon name="stock" />
                          Estoque
                        </button>
                        <button
                          className="admin-quiet"
                          disabled={!connected}
                          aria-label={
                            "Ver histórico de " +
                            product.name +
                            " · " +
                            product.category
                          }
                          onClick={() => onHistory(product)}
                        >
                          <AdminIcon name="history" />
                          Histórico
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && (
            <div className="admin-empty">
              <h3>Nenhum produto encontrado.</h3>
              <p>Altere a busca ou os filtros para encontrar o que precisa.</p>
              <button
                className="admin-quiet"
                onClick={() => {
                  onSearch("");
                  setCategory("all");
                  setAvailability("all");
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}
          <div className="admin-product-table-footer">
            <span>Cadastro e estoque no mesmo lugar.</span>
            <button
              className="admin-quiet"
              disabled={!connected || !products.length}
              onClick={() => onMove(null)}
            >
              Registrar entrada ou saída
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
