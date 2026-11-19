"use client";
import { useEffect, useState, type ReactNode } from "react";
import BrandIdentity from "./branding/BrandIdentity";
import { useBrand } from "./branding/BrandProvider";
import AdminIcon from "./AdminIcon";
import type { Member } from "./types";
export type AdminTab =
  "overview" | "products" | "orders" | "finance" | "members" | "settings";
export const adminNavigation: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "products", label: "Produtos" },
  { id: "orders", label: "Pedidos" },
  { id: "finance", label: "Financeiro" },
  { id: "members", label: "Equipe" },
  { id: "settings", label: "Configuração" },
];
type Props = {
  tab: AdminTab;
  member: Member | null;
  pending: number;
  onTab: (tab: AdminTab) => void;
  onSearch: (query: string) => void;
  onLogout: () => void;
  children: ReactNode;
};
export default function AdminShell({
  tab,
  member,
  pending,
  onTab,
  onSearch,
  onLogout,
  children,
}: Props) {
  const [open, setOpen] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [query, setQuery] = useState("");
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 991px)");
    const change = () => {
      setMobile(media.matches);
      setOpen(false);
    };
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const { brand } = useBrand();
  const role = member?.role;
  const roleName =
    role === "superadmin"
      ? "Superadministrador"
      : role === "owner"
        ? "Proprietário"
        : role === "staff"
          ? "Equipe da loja"
          : "Configuração inicial";
  const name = member?.email.split("@")[0] || "Administração",
    initials = name.slice(0, 2).toUpperCase();
  const navigation = adminNavigation.filter(
    (item) =>
      (!member || item.id !== "members" || role === "superadmin") &&
      (role !== "staff" ||
        !["finance", "settings", "members"].includes(item.id)),
  );
  function selectTab(next: AdminTab) {
    setQuery("");
    document.querySelector(".star-profile-menu")?.removeAttribute("open");
    onTab(next);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const menu = document.getElementById("admin-sidebar");
    const items = () =>
      Array.from(
        menu?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ||
          [],
      ).filter((item) => item.getClientRects().length > 0);
    menu?.querySelector<HTMLButtonElement>(".star-close-menu")?.focus();
    document.body.style.overflow = "hidden";
    function escape(event: KeyboardEvent) {
      if (event.key === "Tab") {
        const controls = items(),
          first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
      if (event.key === "Escape") {
        setOpen(false);
        document.getElementById("admin-menu-toggle")?.focus();
      }
    }
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      document.getElementById("admin-menu-toggle")?.focus();
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div
      className={
        "admin-shell star-shell" +
        (collapsed ? " is-collapsed" : "") +
        (open ? " is-menu-open" : "")
      }
    >
      <aside
        inert={mobile && !open ? true : undefined}
        aria-hidden={mobile && !open ? true : undefined}
        className="admin-sidebar"
        id="admin-sidebar"
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={open ? "Navegação administrativa" : undefined}
      >
        <a
          href="/admin"
          className="admin-wordmark"
          aria-label={brand.displayName + " Administração"}
        >
          <BrandIdentity />
        </a>
        <div className="star-side-profile">
          <span className="star-avatar">
            {initials}
            <i />
          </span>
          <div>
            <strong>{name}</strong>
            <small>{roleName}</small>
          </div>
          <button
            className="star-close-menu"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <AdminIcon name="close" />
          </button>
        </div>
        <span className="admin-sidebar-label">MENU PRINCIPAL</span>
        <nav aria-label="Painel administrativo">
          {navigation.map((item) => (
            <button
              key={item.id}
              title={item.label}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => selectTab(item.id)}
            >
              <AdminIcon name={item.id} />
              <span>{item.label}</span>
              {item.id === "orders" && pending > 0 && (
                <b className="star-nav-count">{pending}</b>
              )}
              <i className="star-nav-arrow" aria-hidden="true">
                ›
              </i>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            <AdminIcon name="external" />
            <span>Abrir loja</span>
          </a>
          <small>{brand.displayName} · Administração</small>
        </div>
      </aside>
      {open && (
        <button
          className="star-menu-scrim"
          aria-label="Fechar navegação"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-workspace" inert={open ? true : undefined}>
        <header className="admin-topbar">
          <div className="star-topbar-leading">
            <button
              id="admin-menu-toggle"
              className="star-icon-button"
              aria-label="Alternar menu"
              aria-expanded={mobile ? open : !collapsed}
              aria-controls="admin-sidebar"
              onClick={() => {
                if (window.matchMedia("(max-width: 991px)").matches)
                  setOpen((value) => !value);
                else setCollapsed((value) => !value);
              }}
            >
              <AdminIcon name="menu" />
            </button>
            <span className="star-topbar-title">Gestão da loja</span>
            <span className="star-language">
              <span>BR</span>Português
            </span>
          </div>
          <form
            className="star-global-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch(query);
            }}
          >
            <AdminIcon name="search" />
            <input
              aria-label="Buscar no catálogo"
              placeholder="Buscar no catálogo"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" aria-label="Pesquisar produtos">
              <AdminIcon name="arrow" />
            </button>
          </form>
          <div className="star-topbar-actions">
            <button
              className="star-icon-button"
              title="Pedidos aguardando"
              aria-label={pending + " pedidos aguardando"}
              onClick={() => selectTab("orders")}
            >
              <AdminIcon name="orders" />
              {pending > 0 && <b>{pending}</b>}
            </button>
            <details className="star-profile-menu">
              <summary aria-label="Menu da conta">
                <span className="star-avatar star-avatar-small">
                  {initials}
                </span>
                <span className="star-profile-chevron">⌄</span>
              </summary>
              <div>
                <strong>{name}</strong>
                <small>{roleName}</small>
                {role !== "staff" && (
                  <button onClick={() => selectTab("settings")}>
                    Configuração
                  </button>
                )}
                <a href="/" target="_blank" rel="noreferrer">
                  Visitar loja ↗
                </a>
                {member && <button onClick={onLogout}>Sair da conta</button>}
              </div>
            </details>
          </div>
        </header>
        <main className="admin-main">
          <div className="star-page-tabs">
            <span>
              {adminNavigation.find((item) => item.id === tab)?.label}
            </span>
            <div>
              <button
                aria-current={tab === "overview" ? "page" : undefined}
                onClick={() => selectTab("overview")}
              >
                Visão geral
              </button>
              <button
                aria-current={tab === "orders" ? "page" : undefined}
                onClick={() => selectTab("orders")}
              >
                Pedidos
              </button>
              <button
                aria-current={tab === "products" ? "page" : undefined}
                onClick={() => selectTab("products")}
              >
                Catálogo
              </button>
            </div>
            <span className="star-connection">
              <i className={member ? "is-connected" : ""} />
              {member ? "Conectado" : "Configuração inicial"}
            </span>
          </div>
          {children}
          <div className="star-admin-footer">
            <span>
              © {new Date().getFullYear()} {brand.displayName}
            </span>
            <span>Gestão de produtos, pedidos e estoque</span>
          </div>
        </main>
      </div>
    </div>
  );
}
