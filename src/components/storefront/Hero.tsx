"use client";
import { useEffect, useRef, useState } from "react";
import { type Product } from "@/data/catalog";
import { Icon } from "@/components/ui/Icons";
export function Hero({
  filter,
  products,
}: {
  filter: (value: string) => void;
  products: Product[];
}) {
  const heroPhotos = [
    ...new Set(
      [
        products.find((product) => product.category === "Lacrado")?.photos[0],
        products.find((product) => product.category === "Seminovo")?.photos[0],
        products.find((product) => product.category === "Apple Watch")
          ?.photos[0],
      ].filter((photo): photo is string => Boolean(photo)),
    ),
  ];

  const [slide, setSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const heroGesture = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);

  function moveHero(step: number) {
    setSlide((index) => (index + step + heroPhotos.length) % heroPhotos.length);
  }

  useEffect(() => {
    if (
      heroPaused ||
      heroPhotos.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(
      () => setSlide((index) => (index + 1) % heroPhotos.length),
      5600,
    );
    return () => window.clearInterval(timer);
  }, [heroPaused, heroPhotos.length]);

  return (
    <div className="showcase">
      <div className="wrap">
        <section className="hero" aria-label="Destaques">
          <div
            className="hero-media"
            onMouseEnter={() => setHeroPaused(true)}
            onMouseLeave={() => setHeroPaused(false)}
            onPointerDown={(event) => {
              if (
                !event.isPrimary ||
                event.button !== 0 ||
                (event.target as HTMLElement).closest("button")
              )
                return;
              heroGesture.current = {
                x: event.clientX,
                y: event.clientY,
                pointerId: event.pointerId,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={(event) => {
              const start = heroGesture.current;
              heroGesture.current = null;
              if (!start || start.pointerId !== event.pointerId) return;
              const dx = event.clientX - start.x;
              const dy = event.clientY - start.y;
              if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25)
                moveHero(dx < 0 ? 1 : -1);
            }}
            onPointerCancel={() => {
              heroGesture.current = null;
            }}
            onLostPointerCapture={() => {
              heroGesture.current = null;
            }}
          >
            {heroPhotos.map((photo, index) => (
              <img
                key={photo}
                draggable={false}
                className={slide === index ? "is-current" : ""}
                src={photo}
                alt=""
                fetchPriority={index === 0 ? "high" : "auto"}
              />
            ))}
            {heroPhotos.length > 1 && (
              <>
                <button
                  className="hero-arrow hero-arrow-prev"
                  type="button"
                  aria-label="Produto anterior"
                  onClick={() => moveHero(-1)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    aria-hidden="true"
                  >
                    <path d="m14 6-6 6 6 6" />
                  </svg>
                </button>
                <button
                  className="hero-arrow hero-arrow-next"
                  type="button"
                  aria-label="Próximo produto"
                  onClick={() => moveHero(1)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    aria-hidden="true"
                  >
                    <path d="m10 6 6 6-6 6" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="hero-copy">
            <h1>Celulares para o seu dia a dia</h1>
            <p>
              Escolha seu produto, monte o carrinho e envie o pedido pelo
              WhatsApp.
            </p>
            <button className="red" onClick={() => filter("Todos")}>
              Ver produtos <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
        <div className="benefits">
          <div>
            <Icon kind="bag" />
            <span>
              <strong>Monte seu pedido</strong>Escolha os itens e as
              quantidades.
            </span>
          </div>
          <div>
            <Icon kind="search" />
            <span>
              <strong>Confirme a disponibilidade</strong>Consulte a loja antes
              de comprar.
            </span>
          </div>
          <div>
            <Icon kind="grid" />
            <span>
              <strong>Combine pelo WhatsApp</strong>Acerte pagamento e retirada
              com a loja.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
