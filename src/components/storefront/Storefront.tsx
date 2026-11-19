"use client";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { Hero } from "@/components/storefront/Hero";
import { SiteFooter } from "./SiteFooter";
import { CustomerReviews } from "./CustomerReviews";

import { flushSync } from "react-dom";
import { useEffect, useRef, useState } from "react";

import { type Product } from "@/data/catalog";
import { phone } from "@/config/store";
import { money, normalize } from "@/lib/format";

import { ProductCard } from "@/components/catalog/ProductCard";
const categories = ["Todos", "Lacrado", "Seminovo", "Apple Watch"];
export default function Storefront({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [notice, setNotice] = useState<{ name: string } | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [rememberCart, setRememberCart] = useState(false);
  useEffect(() => {
    const handler = (event: Event) =>
      setRememberCart((event as CustomEvent<boolean>).detail);
    window.addEventListener("zenatocell-privacy", handler);
    return () => window.removeEventListener("zenatocell-privacy", handler);
  }, []);
  const [loaded, setLoaded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const catalog = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      // A persistência do carrinho depende da preferência salva pelo visitante.
      const allowed =
        JSON.parse(localStorage.getItem("zenatocell-privacy-v1") || "null")
          ?.rememberCart === true;
      setRememberCart(allowed);
      const saved = allowed
        ? JSON.parse(localStorage.getItem("zenatocell-cart") || "{}")
        : {};
      setCart(
        Object.fromEntries(
          products.flatMap(({ id }) =>
            Number.isInteger(saved?.[id]) && saved[id] > 0
              ? [[id, Math.min(99, saved[id])]]
              : [],
          ),
        ),
      );
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded && rememberCart) {
      try {
        localStorage.setItem("zenatocell-cart", JSON.stringify(cart));
      } catch {}
    }
  }, [cart, loaded, rememberCart]);

  const visible = products.filter(
    (product) =>
      (category === "Todos" || product.category === category) &&
      normalize(product.name + " " + product.category).includes(
        normalize(query.trim()),
      ),
  );
  const lines = products.filter((product) => cart[product.id] > 0);
  const count = lines.reduce((sum, product) => sum + cart[product.id], 0);
  const offerItems = products
    .filter((product) => product.category === "Lacrado")
    .slice(0, 4);
  const catalogItems = visible;

  function filter(value: string, scroll = true) {
    const update = () => {
      setCategory(value);
      setQuery("");
    };
    if (
      document.startViewTransition &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.startViewTransition(() => flushSync(update));
    } else update();
    if (scroll) catalog.current?.scrollIntoView();
  }
  function changeQuantity(id: string, delta: number) {
    setCart((previous) => ({
      ...previous,
      [id]: Math.min(99, Math.max(0, (previous[id] || 0) + delta)),
    }));
  }
  function addProduct(product: Product) {
    changeQuantity(product.id, 1);
    setNotice({ name: product.name });
  }
  const subtotal = lines.reduce(
    (sum, product) => sum + (product.price ?? 0) * cart[product.id],
    0,
  );
  const message = [
    "Olá, ZenatoCell! Gostaria de confirmar a disponibilidade deste pedido:",
    "",
    ...lines.map(
      (product) =>
        cart[product.id] +
        " × " +
        product.name +
        " (" +
        product.category +
        ") — " +
        money((product.price ?? 0) * cart[product.id]),
    ),
    "",
    "Subtotal estimado: " + money(subtotal),
  ].join("\n");
  const checkout =
    phone && count
      ? "https://wa.me/" + phone + "?text=" + encodeURIComponent(message)
      : undefined;

  return (
    <>
      <a className="skip" href="#catalogo">
        Ir para o catálogo
      </a>
      <SiteHeader
        category={category}
        query={query}
        setQuery={setQuery}
        setCategory={setCategory}
        filter={filter}
        openCart={() => dialog.current?.showModal()}
        count={count}
        scrollCatalog={() => catalog.current?.scrollIntoView()}
      />
      <main>
        <Hero filter={filter} products={products} />
        <section className="wrap catalog offers" id="ofertas">
          <div className="section-heading">
            <div>
              <h2>iPhones lacrados</h2>
            </div>
            <button className="red" onClick={() => filter("Todos")}>
              Ver catálogo →
            </button>
          </div>
          <div className="products">
            {offerItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cart[product.id] || 0}
                changeQuantity={changeQuantity}
                onAdd={addProduct}
              />
            ))}
          </div>
        </section>
        <section className="wrap promos" aria-label="Categorias em destaque">
          <article>
            <img src="/zenatocell/celular.webp" alt="" loading="lazy" />
            <div>
              <h2>Encontre seu próximo celular</h2>
              <p>Compare modelos e opções de armazenamento.</p>
              <button className="red" onClick={() => filter("Lacrado")}>
                Ver celulares →
              </button>
            </div>
          </article>
          <article>
            <img
              src={
                products.find((product) => product.category === "Apple Watch")
                  ?.photos[0]
              }
              alt="Apple Watch do catálogo"
              loading="lazy"
            />
            <div>
              <h2>Apple Watch</h2>
              <p>Compare tamanhos e versões do catálogo.</p>
              <button className="red" onClick={() => filter("Apple Watch")}>
                Ver Apple Watch →
              </button>
            </div>
          </article>
        </section>
        <section className="wrap catalog" ref={catalog} id="catalogo">
          {(query.trim() || category !== "Todos") && (
            <div className="catalog-heading">
              <h2>{query.trim() ? "Resultados da busca" : category}</h2>
            </div>
          )}
          <div
            className="filters collection-tabs"
            aria-label="Categorias do catálogo"
          >
            {categories.map((item) => (
              <button
                key={item}
                aria-pressed={category === item}
                onClick={() => filter(item, false)}
              >
                {item === "Seminovo"
                  ? "Seminovos"
                  : item === "Lacrado"
                    ? "Lacrados"
                    : item}
              </button>
            ))}
          </div>
          {category === "Seminovo" && (
            <p>Até 18× no cartão. Consulte as condições.</p>
          )}
          {category === "Lacrado" && (
            <p>Até 21× no cartão com taxas. Consulte as condições.</p>
          )}
          <div className="products">
            {catalogItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                animate
                quantity={cart[product.id] || 0}
                changeQuantity={changeQuantity}
                onAdd={addProduct}
              />
            ))}
          </div>
          {!catalogItems.length && <p>Nenhum produto encontrado.</p>}
        </section>
        <CustomerReviews />
      </main>
      <SiteFooter category={category} filter={filter} />
      <div className="cart-notice" role="status">
        {notice && (
          <>
            <span className="cart-notice-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 12 4 4 8-8" />
              </svg>
            </span>
            <span className="cart-notice-copy">
              <strong>Adicionado ao carrinho</strong>
              <span>{notice.name}</span>
            </span>
            <button
              className="cart-notice-action"
              onClick={() => {
                setNotice(null);
                dialog.current?.showModal();
              }}
            >
              Ver carrinho <span aria-hidden="true">→</span>
            </button>
            <button
              className="cart-notice-close"
              aria-label="Dispensar aviso"
              onClick={() => setNotice(null)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </>
        )}
      </div>
      <CartDrawer
        dialog={dialog}
        cart={cart}
        lines={lines}
        count={count}
        subtotal={subtotal}
        checkout={checkout}
        changeQuantity={changeQuantity}
        removeProduct={(id) =>
          setCart((previous) => ({ ...previous, [id]: 0 }))
        }
      />
    </>
  );
}
