"use client";
import AdminSelect from "./AdminSelect";
import { useState } from "react";
import { money } from "@/lib/format";
import AdminIcon from "./AdminIcon";
import type { AdminProduct, Order, Entry, Member } from "./types";
type Props = {
  products: AdminProduct[];
  orders: Order[];
  entries: Entry[];
  member: Member | null;
  onOrders: () => void;
  onProducts: () => void;
  onNewOrder: () => void;
  onFinance: () => void;
};
const statusLabels: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  paid: "Pago",
  cancelled: "Cancelado",
};
const colors = ["#4b72f5", "#30c5b5", "#ffb744", "#f06c87"];
function LineChart({
  income,
  outgoing,
  labels,
  connected,
}: {
  income: number[];
  outgoing: number[];
  labels: string[];
  connected: boolean;
}) {
  const max = Math.max(100, ...income, ...outgoing),
    hasData = income.some(Boolean) || outgoing.some(Boolean);
  const path = (values: number[]) =>
    values
      .map(
        (value, index) =>
          (index ? "L" : "M") +
          (52 + (index * 624) / Math.max(1, values.length - 1)).toFixed(1) +
          "," +
          (220 - (value / max) * 170).toFixed(1),
      )
      .join(" ");
  return (
    <div className="star-chart">
      <svg
        viewBox="0 0 710 260"
        role="img"
        aria-label={
          hasData
            ? "Gráfico de entradas e saídas por dia"
            : "Gráfico sem movimentações registradas"
        }
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <g key={fraction}>
            <line
              x1="52"
              x2="678"
              y1={220 - fraction * 170}
              y2={220 - fraction * 170}
              stroke="#eef0f5"
            />
            <text
              x="42"
              y={224 - fraction * 170}
              textAnchor="end"
              fill="#9ba3b1"
              fontSize="10"
            >
              {hasData
                ? ((max * fraction) / 100).toLocaleString("pt-BR", {
                    maximumFractionDigits: 0,
                  })
                : "—"}
            </text>
          </g>
        ))}
        {hasData && (
          <>
            <path d={path(income) + " L676,220 L52,220 Z"} fill="#4b72f510" />
            <path
              d={path(income)}
              fill="none"
              stroke="#4b72f5"
              strokeWidth="2.5"
            />
            <path
              d={path(outgoing)}
              fill="none"
              stroke="#30c5b5"
              strokeWidth="2.5"
            />
          </>
        )}
        {[0, Math.floor(labels.length / 2), labels.length - 1].map(
          (index, position) => (
            <text
              key={position}
              x={52 + (index * 624) / Math.max(1, labels.length - 1)}
              y="247"
              textAnchor="middle"
              fill="#9ba3b1"
              fontSize="10"
            >
              {labels[index]}
            </text>
          ),
        )}
      </svg>
      {!hasData && (
        <div className="star-chart-empty">
          <AdminIcon name="finance" />
          <strong>
            {connected
              ? "Nenhuma movimentação neste período"
              : "Seus indicadores começam aqui"}
          </strong>
          <span>
            {connected
              ? "Os lançamentos vão formar este gráfico."
              : "Conecte o Supabase para acompanhar sua operação."}
          </span>
        </div>
      )}
    </div>
  );
}
export default function Dashboard({
  products,
  orders,
  entries,
  member,
  onOrders,
  onProducts,
  onNewOrder,
  onFinance,
}: Props) {
  const [days, setDays] = useState(30);
  const connected = Boolean(member),
    financeAllowed = member?.role !== "staff";
  const dates = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - days + index + 1);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  });
  const income = dates.map((date) =>
    entries
      .filter((entry) => entry.occurred_on === date && entry.kind === "income")
      .reduce((sum, entry) => sum + entry.amount, 0),
  );
  const outgoing = dates.map((date) =>
    entries
      .filter((entry) => entry.occurred_on === date && entry.kind === "expense")
      .reduce((sum, entry) => sum + entry.amount, 0),
  );
  const receipts = income.reduce((a, b) => a + b, 0),
    expenses = outgoing.reduce((a, b) => a + b, 0);
  const scopedOrders = orders.filter(
    (order) => order.created_at.slice(0, 10) >= dates[0],
  );
  const counts = ["pending", "confirmed", "paid", "cancelled"].map(
    (status) => scopedOrders.filter((order) => order.status === status).length,
  );
  const orderCount = counts.reduce((a, b) => a + b, 0);
  const stock = products.reduce((sum, product) => sum + product.stock, 0);
  const labelDates = dates.map(
    (date) => date.slice(8) + "/" + date.slice(5, 7),
  );
  function exportEntries() {
    const selected = entries.filter((entry) => entry.occurred_on >= dates[0]);
    const quote = (value: string) =>
      '"' +
      (/^[=+\-@]/.test(value) ? "'" : "") +
      value.replaceAll('"', '""') +
      '"';
    const csv =
      "\uFEFFData;Tipo;Descrição;Valor (R$)\n" +
      selected
        .map((entry) =>
          [
            entry.occurred_on,
            entry.kind === "income" ? "Entrada" : "Saída",
            quote(entry.description),
            (entry.amount / 100).toFixed(2).replace(".", ","),
          ].join(";"),
        )
        .join("\n");
    const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      ),
      link = document.createElement("a");
    link.href = url;
    link.download = "zenatocell-financeiro.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  let offset = 0;
  return (
    <div className="star-dashboard">
      <div className="star-toolbar">
        <div className="star-date-range">
          <AdminIcon name="calendar" />
          <span>
            {labelDates[0]} — {labelDates[labelDates.length - 1]}
          </span>
        </div>
        <label>
          <span className="admin-sr">Período dos indicadores</span>
          <AdminSelect
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </AdminSelect>
        </label>
        <button className="star-toolbar-link" onClick={onProducts}>
          Gerenciar catálogo
        </button>
        <button disabled={!connected} onClick={onNewOrder}>
          + Novo pedido
        </button>
        {financeAllowed && (
          <button
            className="admin-quiet star-export"
            disabled={
              !connected ||
              !entries.some((entry) => entry.occurred_on >= dates[0])
            }
            onClick={exportEntries}
          >
            <AdminIcon name="download" />
            Exportar
          </button>
        )}
      </div>
      <section className="star-kpis" aria-label="Indicadores da loja">
        {[
          {
            label: financeAllowed ? "Recebimentos" : "Pedidos no período",
            value: connected
              ? financeAllowed
                ? money(receipts)
                : String(orderCount)
              : "—",
            note: "No período selecionado",
            icon: "finance",
          },
          {
            label: "Pedidos aguardando",
            value: connected
              ? String(
                  orders.filter((order) => order.status === "pending").length,
                )
              : "—",
            note: "Aguardando confirmação",
            icon: "orders",
          },
          {
            label: "Unidades em estoque",
            value: connected ? String(stock) : "—",
            note: "Disponibilidade cadastrada",
            icon: "stock",
          },
          {
            label: "Produtos no catálogo",
            value: String(products.length),
            note: connected
              ? "Variantes cadastradas"
              : "Catálogo atual da loja",
            icon: "products",
          },
        ].map((item) => (
          <article key={item.label}>
            <div>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.note}</small>
            </div>
            <div className="star-kpi-icon">
              <AdminIcon name={item.icon} />
            </div>
          </article>
        ))}
      </section>
      <div className="star-analysis-grid">
        <section className="admin-panel star-sales">
          <header>
            <div>
              <h2>
                {financeAllowed
                  ? "Visão geral financeira"
                  : "Visão geral do catálogo"}
              </h2>
              <p>
                {financeAllowed
                  ? "Entradas e saídas registradas no período."
                  : "Produtos organizados por condição."}
              </p>
            </div>
            <span className="star-period-pill">{days} dias</span>
          </header>
          {financeAllowed ? (
            <>
              <div className="star-chart-totals">
                <div>
                  <span>Recebimentos</span>
                  <strong>{connected ? money(receipts) : "—"}</strong>
                </div>
                <div>
                  <span>Despesas e estornos</span>
                  <strong>{connected ? money(expenses) : "—"}</strong>
                </div>
                <div className="star-chart-legend">
                  <span>
                    <i />
                    Entradas
                  </span>
                  <span>
                    <i />
                    Saídas
                  </span>
                </div>
              </div>
              <LineChart
                income={income}
                outgoing={outgoing}
                labels={labelDates}
                connected={connected}
              />
            </>
          ) : (
            <div className="star-categories">
              {["Lacrado", "Seminovo", "Apple Watch"].map((category, index) => (
                <div key={category}>
                  <span>{category}</span>
                  <strong>
                    {
                      products.filter(
                        (product) => product.category === category,
                      ).length
                    }
                  </strong>
                  <div>
                    <i
                      style={{
                        width:
                          (products.filter(
                            (product) => product.category === category,
                          ).length /
                            Math.max(1, products.length)) *
                            100 +
                          "%",
                        background: colors[index],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="admin-panel star-orders-summary">
          <header>
            <div>
              <h2>Situação dos pedidos</h2>
              <p>Distribuição no período selecionado.</p>
            </div>
          </header>
          <div className="star-donut">
            <svg
              viewBox="0 0 200 200"
              role="img"
              aria-label={
                orderCount
                  ? orderCount + " pedidos no período"
                  : "Sem pedidos registrados"
              }
            >
              <circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke="#eff1f7"
                strokeWidth="20"
              />
              {counts.map((count, index) => {
                const length = (count / Math.max(1, orderCount)) * 471.24;
                const previous = offset;
                offset += length;
                return (
                  <circle
                    key={index}
                    cx="100"
                    cy="100"
                    r="75"
                    fill="none"
                    stroke={colors[index]}
                    strokeWidth="20"
                    strokeDasharray={length + " " + (471.24 - length)}
                    strokeDashoffset={-previous}
                    transform="rotate(-90 100 100)"
                  />
                );
              })}
            </svg>
            <div>
              <strong>{connected ? orderCount : "—"}</strong>
              <span>pedidos</span>
            </div>
          </div>
          <div className="star-status-list">
            {["pending", "confirmed", "paid", "cancelled"].map(
              (status, index) => (
                <div key={status}>
                  <span>
                    <i style={{ background: colors[index] }} />
                    {statusLabels[status]}
                  </span>
                  <strong>{connected ? counts[index] : "—"}</strong>
                </div>
              ),
            )}
          </div>
        </section>
      </div>
      <div className="star-bottom-grid">
        <div className="star-stat-stack">
          <article className="star-color-stat">
            <div>
              <span>
                {financeAllowed ? "Saldo do período" : "Pedidos confirmados"}
              </span>
              <AdminIcon name="finance" />
            </div>
            <strong>
              {connected
                ? financeAllowed
                  ? money(receipts - expenses)
                  : String(counts[1])
                : "—"}
            </strong>
            <small>
              {financeAllowed
                ? "Entradas menos saídas registradas"
                : "Prontos para o próximo atendimento"}
            </small>
            <button onClick={financeAllowed ? onFinance : onOrders}>
              Ver detalhes →
            </button>
          </article>
          <section className="admin-panel star-stock-overview">
            <header>
              <div>
                <h2>Composição do catálogo</h2>
                <p>Organização dos seus produtos.</p>
              </div>
            </header>
            <div className="star-categories">
              {["Lacrado", "Seminovo", "Apple Watch"].map((category, index) => (
                <div key={category}>
                  <span>{category}</span>
                  <strong>
                    {
                      products.filter(
                        (product) => product.category === category,
                      ).length
                    }
                  </strong>
                  <div>
                    <i
                      style={{
                        width:
                          (products.filter(
                            (product) => product.category === category,
                          ).length /
                            Math.max(1, products.length)) *
                            100 +
                          "%",
                        background: colors[index],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="admin-quiet" onClick={onProducts}>
              Ver todos os produtos →
            </button>
          </section>
        </div>
        <section className="admin-panel star-recent">
          <header>
            <div>
              <h2>Pedidos recentes</h2>
              <p>Acompanhe cada etapa do atendimento.</p>
            </div>
            <button className="admin-quiet" onClick={onOrders}>
              Ver todos →
            </button>
          </header>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Situação</th>
                  <th>Data</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id.slice(0, 8)}</td>
                    <td>{order.customer}</td>
                    <td>
                      <span className={"admin-status is-" + order.status}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td>
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td>{money(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!orders.length && (
            <div className="admin-empty">
              <div className="star-empty-icon">
                <AdminIcon name="orders" />
              </div>
              <h3>Pronto para o primeiro pedido.</h3>
              <p>
                {connected
                  ? "Registre uma venda para acompanhar seu andamento."
                  : "Após conectar o banco, seus pedidos aparecem aqui."}
              </p>
              <button disabled={!connected} onClick={onNewOrder}>
                Criar pedido
              </button>
            </div>
          )}
          <div className="star-table-bottom">
            <span>
              {connected
                ? orders.length + " pedidos registrados"
                : "Aguardando conexão"}
            </span>
            <span>ZenatoCell · Gestão da loja</span>
          </div>
        </section>
      </div>
    </div>
  );
}
