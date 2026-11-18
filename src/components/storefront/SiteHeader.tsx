"use client";
import { useRef } from "react";
import { instagram } from "@/config/store";
import { Icon, InstagramIcon } from "@/components/ui/Icons";
const categories = ["Todos", "Lacrado", "Seminovo", "Apple Watch"];
export function SiteHeader({
  category,
  query,
  setQuery,
  setCategory,
  filter,
  openCart,
  count,
  scrollCatalog,
}: {
  category: string;
  query: string;
  setQuery: (value: string) => void;
  setCategory: (value: string) => void;
  filter: (value: string) => void;
  openCart: () => void;
  count: number;
  scrollCatalog: () => void;
}) {
  const categoryMenu = useRef<HTMLDetailsElement>(null);
  return (
    <>
      <div className="top">
        <div className="wrap">
          <span className="top-label">
            <Icon kind="bag" /> Loja em Joinville, SC
          </span>
          <span className="top-catalog">
            iPhones e acessórios{" "}
            <a href="#catalogo">
              Ver catálogo <span aria-hidden="true">↗</span>
            </a>
          </span>
          <a
            href={instagram}
            target="_blank"
            rel="noreferrer"
            className="instagram-link"
          >
            <InstagramIcon /> Instagram
          </a>
        </div>
      </div>
      <header className="wrap masthead" id="inicio">
        <a className="brand" href="#inicio">
          <img
            src="/zenatocell/zenatocell.svg"
            alt="Zenato Cell"
            width="76"
            height="76"
          />
        </a>
        <form
          className="search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            scrollCatalog();
          }}
        >
          <input
            aria-label="Buscar produtos"
            placeholder="Busque por produtos ou categorias"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCategory("Todos");
            }}
          />
          <button aria-label="Buscar">
            <Icon kind="search" />
          </button>
        </form>
        <button
          className="cart-button"
          aria-label={"Seu carrinho, " + count + " itens"}
          onClick={() => openCart()}
        >
          <span>
            <Icon kind="bag" />
            <b>{count}</b>
          </span>{" "}
          Seu carrinho
        </button>
      </header>
      <nav className="nav" aria-label="Menu principal">
        <div className="wrap nav-inner">
          <details ref={categoryMenu}>
            <summary>
              <Icon kind="grid" /> Todas as categorias
            </summary>
            <div className="category-menu">
              {categories.map((item) => (
                <button key={item} onClick={() => filter(item)}>
                  {item}
                </button>
              ))}
            </div>
          </details>
          <details className="mobile-menu">
            <summary aria-label="Abrir menu">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </summary>
            <div
              className="category-menu"
              onClick={(event) => {
                const menu = event.currentTarget.closest("details");
                if (menu) menu.open = false;
              }}
            >
              <a href="#inicio">Início</a>
              <button
                aria-pressed={category === "Lacrado"}
                onClick={() => filter("Lacrado")}
              >
                Lacrados
              </button>
              <button
                aria-pressed={category === "Seminovo"}
                onClick={() => filter("Seminovo")}
              >
                Seminovos
              </button>
              <button
                aria-pressed={category === "Apple Watch"}
                onClick={() => filter("Apple Watch")}
              >
                Apple Watch
              </button>
            </div>
          </details>
          <div className="nav-links">
            <a
              href="#inicio"
              aria-current={category === "Todos" ? "page" : undefined}
            >
              Início
            </a>
            <button
              aria-pressed={category === "Lacrado"}
              onClick={() => filter("Lacrado")}
            >
              Lacrados
            </button>
            <button
              aria-pressed={category === "Seminovo"}
              onClick={() => filter("Seminovo")}
            >
              Seminovos
            </button>
            <button
              aria-pressed={category === "Apple Watch"}
              onClick={() => filter("Apple Watch")}
            >
              Apple Watch
            </button>
          </div>
          <a
            className="contact-link nav-phone"
            href="tel:+5547991597258"
            aria-label="Ligar para a ZenatoCell no (47) 99159-7258"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 18 18 0 0 1-7.9-2.8 18 18 0 0 1-5.5-5.5 18 18 0 0 1-2.8-7.9A2 2 0 0 1 5.6 3h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 2L9.2 11a14 14 0 0 0 5.5 5.5l1.3-1.3a2 2 0 0 1 2-.6l2.3.4a2 2 0 0 1 1.7 1.9Z" />
            </svg>
            <span>(47) 99159-7258</span>
          </a>
        </div>
      </nav>
    </>
  );
}
