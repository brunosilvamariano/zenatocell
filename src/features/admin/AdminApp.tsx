"use client";
import AdminSelect from "./AdminSelect";
import { useCallback, useEffect, useState } from "react";
import { products as initialCatalog } from "@/data/catalog";
import { money } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/browser";
import { loadAdmin, mutate } from "./service";
import type { AdminProduct, Order } from "./types";
import Login from "./Login";
import BrandSettings from "./branding/BrandSettings";
import BrandIdentity from "./branding/BrandIdentity";
import Dashboard from "./Dashboard";
import AdminShell, {
  adminNavigation as navigation,
  type AdminTab as Tab,
} from "./AdminShell";
import ProductEditor from "./ProductEditor";
import ProductsPanel from "./ProductsPanel";
import StockMovementEditor from "./StockMovementEditor";
import ProductHistory from "./ProductHistory";
import FinancialEntryEditor from "./FinancialEntryEditor";
import OrderEditor from "./OrderEditor";
import OrderDetails from "./OrderDetails";

type Snapshot = Awaited<ReturnType<typeof loadAdmin>>;
const titles: Record<Tab, string> = {
  overview: "Sua loja, em perspectiva.",
  products: "Catálogo de produtos",
  orders: "Central de pedidos",
  finance: "Movimentação financeira",
  members: "Acessos da equipe",
  settings: "Configuração da operação",
};
const statuses: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  paid: "Pago",
  cancelled: "Cancelado",
};
export default function AdminApp() {
  const client = getSupabase(),
    configured = Boolean(client);
  const [phase, setPhase] = useState<"loading" | "login" | "ready" | "denied">(
    configured ? "loading" : "ready",
  );
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [tab, setTab] = useState<Tab>("overview"),
    [search, setSearch] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [editor, setEditor] = useState<AdminProduct | null | undefined>(undefined),
    [action, setAction] = useState<"finance" | "order" | null>(null);
  const [stockProduct, setStockProduct] = useState<
    AdminProduct | null | undefined
  >(undefined);
  const [historyProduct, setHistoryProduct] = useState<AdminProduct | null>(
    null,
  );
  const [productSearchRevision, setProductSearchRevision] = useState(0);
  const refresh = useCallback(async () => {
    try {
      const data = await loadAdmin();
      setSnapshot(data);
      setPhase("ready");
      setMessage("");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível carregar os dados.",
      );
      setPhase("denied");
    }
  }, []);
  useEffect(() => {
    if (!client) return;
    void client.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) void refresh();
        else setPhase("login");
      })
      .catch(() => {
        setMessage("Não foi possível verificar sua sessão. Entre novamente.");
        setPhase("login");
      });
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setSnapshot(null);
        setPhase("login");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [client, refresh]);
  async function run<
    N extends
      keyof import("@/lib/supabase/database").Database["public"]["Functions"],
  >(
    name: N,
    values: import("@/lib/supabase/database").Database["public"]["Functions"][N]["Args"],
  ) {
    setBusy(true);
    setMessage("");
    try {
      await mutate(name, values);
      await refresh();
      setMessage("Alteração salva.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const role = snapshot?.member.role;
  const canManage = Boolean(snapshot && role !== "staff"),
    canOperate = Boolean(snapshot);
  const rows =
    snapshot?.products ||
    initialCatalog.map((product) => ({
      ...product,
      description: "",
      stock: 0,
      cost: 0,
      active: true,
    }));
  const orders = snapshot?.orders || [],
    entries = snapshot?.entries || [];
  const revenue = entries
    .filter((entry) => entry.kind === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = entries
    .filter((entry) => entry.kind === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  if (phase === "loading")
    return (
      <main className="auth-boot">
        <BrandIdentity />
        <div role="status">
          <span className="auth-spinner" aria-hidden="true" />
          Preparando seu painel…
        </div>
      </main>
    );
  if (phase === "login") return <Login onSuccess={refresh} />;
  if (phase === "denied")
    return (
      <main className="admin-login">
        <h1>Acesso administrativo</h1>
        <p role="alert">{message}</p>
        <button onClick={() => void refresh()}>Tentar novamente</button>
        <button
          className="admin-quiet"
          onClick={() => void client?.auth.signOut()}
        >
          Voltar ao login
        </button>
      </main>
    );
  return (
    <AdminShell
      tab={tab}
      member={snapshot?.member || null}
      pending={orders.filter((order) => order.status === "pending").length}
      onTab={(next) => {
        setTab(next);
        setSearch("");
      }}
      onSearch={(query) => {
        setTab("products");
        setSearch(query);
        setProductSearchRevision((value) => value + 1);
      }}
      onLogout={() => void client?.auth.signOut()}
    >
      {!snapshot && (
        <div className="admin-setup">
          <div>
            <strong>Vamos conectar sua operação.</strong>
            <p>
              Configure o Supabase para ativar login, estoque, pedidos e
              financeiro. Os produtos abaixo vêm do catálogo atual; as
              alterações serão liberadas após a conexão.
            </p>
          </div>
          <button onClick={() => setTab("settings")}>Ver configuração</button>
        </div>
      )}
      <div
        className={
          "admin-page-heading" +
          (tab === "overview" ? " star-overview-heading" : "")
        }
      >
        <div>
          <span className="admin-eyebrow">
            {navigation.find((item) => item.id === tab)?.label}
          </span>
          <h1>{titles[tab]}</h1>
          <p>
            {tab === "overview"
              ? "Acompanhe os dados da operação e as próximas ações."
              : tab === "products"
                ? "Cadastro, preços, estoque e movimentações de cada produto."
                : "Informações organizadas para o dia a dia da loja."}
          </p>
        </div>
        {tab === "products" && (
          <div className="admin-product-heading-actions">
            <button
              className="admin-quiet"
              disabled={!canOperate}
              onClick={() => setStockProduct(null)}
            >
              Registrar movimentação
            </button>
            <button disabled={!canManage} onClick={() => setEditor(null)}>
              + Novo produto
            </button>
          </div>
        )}
        {tab === "finance" && (
          <button disabled={!canManage} onClick={() => setAction("finance")}>
            Novo lançamento
          </button>
        )}
        {tab === "orders" && (
          <button disabled={!canOperate} onClick={() => setAction("order")}>
            Criar pedido
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="admin-message">
          {message}
        </p>
      )}
      {tab === "overview" && (
        <Dashboard
          products={rows}
          orders={orders}
          entries={entries}
          member={snapshot?.member || null}
          onOrders={() => setTab("orders")}
          onProducts={() => setTab("products")}
          onNewOrder={() => setAction("order")}
          onFinance={() => setTab("finance")}
        />
      )}{" "}
      {tab === "products" && (
        <ProductsPanel
          key={productSearchRevision}
          products={rows}
          movements={snapshot?.movements || []}
          search={search}
          onSearch={setSearch}
          connected={canOperate}
          canManage={canManage}
          onEdit={setEditor}
          onMove={setStockProduct}
          onHistory={setHistoryProduct}
        />
      )}
      {tab === "orders" && (
        <section className="admin-panel">
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pedido / cliente</th>
                  <th>Data</th>
                  <th>Situação</th>
                  <th>Total</th>
                  <th>Próxima ação</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.customer}</strong>
                      <small className="admin-code">
                        {order.id.slice(0, 8)}
                      </small>
                      {order.contact}
                    </td>
                    <td>
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td>
                      <span className="admin-status">
                        {statuses[order.status]}
                      </span>
                    </td>
                    <td>{money(order.total)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="admin-quiet"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Ver itens
                        </button>
                        {order.status === "pending" && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run("transition_order", {
                                p_id: order.id,
                                p_status: "confirmed",
                              })
                            }
                          >
                            Confirmar
                          </button>
                        )}
                        {order.status === "confirmed" && canManage && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              void run("transition_order", {
                                p_id: order.id,
                                p_status: "paid",
                              })
                            }
                          >
                            Registrar pagamento
                          </button>
                        )}
                        {order.status !== "cancelled" &&
                          (order.status !== "paid" || canManage) && (
                            <button
                              className="admin-quiet"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Cancelar este pedido? O estoque será restituído e, se pago, o estorno será registrado.",
                                  )
                                )
                                  void run("transition_order", {
                                    p_id: order.id,
                                    p_status: "cancelled",
                                  });
                              }}
                            >
                              Cancelar
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!orders.length && (
            <div className="admin-empty">
              <h3>Nenhum pedido registrado.</h3>
              <p>Acompanhe o atendimento e confirme cada venda no painel.</p>
            </div>
          )}
        </section>
      )}
      {tab === "finance" && (
        <>
          <div className="admin-metrics">
            <article>
              <span>Entradas</span>
              <strong>{snapshot ? money(revenue) : "—"}</strong>
            </article>
            <article>
              <span>Saídas</span>
              <strong>{snapshot ? money(expenses) : "—"}</strong>
            </article>
            <article>
              <span>Saldo dos lançamentos</span>
              <strong>{snapshot ? money(revenue - expenses) : "—"}</strong>
              <small>Entradas menos saídas registradas</small>
            </article>
          </div>
          <section className="admin-panel">
            <header>
              <h2>Histórico financeiro</h2>
            </header>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.description}</td>
                      <td>
                        {entry.occurred_on.split("-").reverse().join("/")}
                      </td>
                      <td>{entry.kind === "income" ? "Entrada" : "Saída"}</td>
                      <td>{money(entry.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!entries.length && (
              <div className="admin-empty">
                <h3>Seus lançamentos ficam aqui.</h3>
                <p>
                  Pagamentos confirmados geram uma entrada vinculada ao pedido.
                </p>
              </div>
            )}
          </section>
        </>
      )}
      {tab === "members" && (
        <section className="admin-panel">
          <header>
            <h2>Permissões por pessoa</h2>
          </header>
          <p className="admin-panel-copy">
            O primeiro superadmin é vinculado pelo responsável pela instalação.
            Novos acessos exigem uma conta de autenticação previamente criada no
            Supabase.
          </p>
          {snapshot?.members.map((member) => (
            <div className="admin-member" key={member.user_id}>
              <div>
                <strong>{member.email}</strong>
                <small>
                  {member.role} · {member.active ? "Ativo" : "Suspenso"}
                </small>
              </div>
              {member.user_id !== snapshot.member.user_id && (
                <button
                  disabled={busy}
                  className="admin-quiet"
                  onClick={() =>
                    void run("set_member", {
                      p_user_id: member.user_id,
                      p_role: member.role,
                      p_active: !member.active,
                    })
                  }
                >
                  {member.active ? "Suspender" : "Ativar"}
                </button>
              )}
            </div>
          ))}
          {role === "superadmin" && (
            <form
              className="admin-inline-form"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                await run("set_member", {
                  p_user_id: String(form.get("user_id")),
                  p_role: String(form.get("role")),
                  p_active: true,
                });
              }}
            >
              <label>
                ID do usuário no Supabase
                <input name="user_id" required pattern="[0-9a-fA-F-]{36}" />
              </label>
              <label>
                Perfil
                <AdminSelect name="role">
                  <option value="owner">Proprietário</option>
                  <option value="staff">Funcionário</option>
                  <option value="superadmin">Superadmin</option>
                </AdminSelect>
              </label>
              <button disabled={busy}>Liberar acesso</button>
            </form>
          )}
        </section>
      )}
      {tab === "settings" &&
        (snapshot ? (
          <BrandSettings />
        ) : (
          <section className="admin-panel admin-settings">
            <h2>Ativação do painel</h2>
            <ol>
              <li>
                Crie um projeto Supabase e desative o cadastro público em Auth.
              </li>
              <li>
                Execute a migração de banco em{" "}
                <code>supabase/migrations/001_admin.sql</code>.
              </li>
              <li>
                Execute <code>supabase/seed.sql</code> para importar o catálogo.
              </li>
              <li>
                Crie seu usuário no Supabase Auth e vincule-o como superadmin
                conforme o guia em <code>docs/admin.md</code>.
              </li>
              <li>
                Configure as variáveis do arquivo <code>.env.example</code> e
                reinicie o site.
              </li>
            </ol>
            <p>
              O painel identifica o usuário pelo login e o banco confere as
              permissões a cada leitura ou alteração.
            </p>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
            >
              Abrir Supabase ↗
            </a>
          </section>
        ))}
      {selectedOrder && snapshot && (
        <OrderDetails
          order={selectedOrder}
          items={snapshot.items.filter(
            (item) => item.order_id === selectedOrder.id,
          )}
          onClose={() => setSelectedOrder(null)}
        />
      )}
      {editor !== undefined && (
        <ProductEditor
          product={editor}
          onClose={() => setEditor(undefined)}
          onSaved={refresh}
        />
      )}
      {action === "order" && (
        <OrderEditor
          products={rows}
          onClose={() => setAction(null)}
          onSaved={refresh}
        />
      )}
      {stockProduct !== undefined && (
        <StockMovementEditor
          products={rows}
          product={stockProduct}
          onClose={() => setStockProduct(undefined)}
          onSaved={refresh}
        />
      )}
      {historyProduct && (
        <ProductHistory
          product={historyProduct}
          onClose={() => setHistoryProduct(null)}
        />
      )}
      {action === "finance" && (
        <FinancialEntryEditor
          onClose={() => setAction(null)}
          onSaved={refresh}
        />
      )}
    </AdminShell>
  );
}
