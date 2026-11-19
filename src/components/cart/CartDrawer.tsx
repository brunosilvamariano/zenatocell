"use client";
import type { RefObject } from "react";
import type { Product } from "@/data/catalog";
import { phone } from "@/config/store";
import { money } from "@/lib/format";
import { Icon } from "@/components/ui/Icons";
import "@/styles/cart-drawer.css";

type Props = {
  dialog: RefObject<HTMLDialogElement | null>;
  cart: Record<string, number>;
  lines: Product[];
  count: number;
  subtotal: number;
  checkout: string | undefined;
  changeQuantity: (id: string, delta: number) => void;
  removeProduct: (id: string) => void;
};
function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}
function WhatsApp() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4 20 1-4a9 9 0 1 1 3 3Z" />
      <path d="M9 7c-2 2 3 7 5 7l2-2-3-1-1 1-2-2 1-1Z" />
    </svg>
  );
}
export function CartDrawer({
  dialog,
  cart,
  lines,
  count,
  subtotal,
  checkout,
  changeQuantity,
  removeProduct,
}: Props) {
  const close = () => dialog.current?.close();
  return (
    <dialog
      ref={dialog}
      className="drawer premium-cart"
      aria-labelledby="cart-title"
      aria-describedby="cart-description"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="drawer-content">
        <header className="pc-header">
          <div className="pc-brand">
            <span>
              <Icon kind="bag" />
            </span>
            <div>
              <small>ZENATOCELL</small>
              <p>Sua próxima escolha começa aqui</p>
            </div>
          </div>
          <button
            type="button"
            className="pc-close"
            aria-label="Fechar carrinho"
            onClick={close}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="m7 7 10 10M7 17 17 7" />
            </svg>
          </button>
          <div className="pc-title">
            <h2 id="cart-title">
              Seu carrinho<span>.</span>
            </h2>
            <span
              className="pc-count"
              aria-label={
                count +
                (count === 1 ? " item no carrinho" : " itens no carrinho")
              }
            >
              {count}
            </span>
          </div>
          <p id="cart-description">
            {count
              ? "Suas escolhas, reunidas em um só lugar. Revise os detalhes antes de falar com a loja."
              : "Encontre o próximo produto que vai fazer parte do seu dia."}
          </p>
        </header>
        <div className="pc-body">
          {lines.length ? (
            <>
              <div className="pc-list-heading">
                <span>PRODUTOS SELECIONADOS</span>
                <span>
                  {count} {count === 1 ? "item" : "itens"}
                </span>
              </div>
              <ul className="pc-products" role="list">
                {lines.map((product) => (
                  <li key={product.id}>
                    <div className="pc-product-photo">
                      <img
                        src={product.photos[0]}
                        alt=""
                        width="88"
                        height="100"
                      />
                    </div>
                    <div className="pc-product-info">
                      <small className="pc-condition">{product.category}</small>
                      <h3>{product.name}</h3>
                      <span className="pc-unit">
                        {money(product.price ?? 0)} por unidade
                      </span>
                      <div className="pc-item-bottom">
                        <div className="pc-quantity">
                          <button
                            type="button"
                            aria-label={
                              "Diminuir quantidade de " + product.name
                            }
                            onClick={() => changeQuantity(product.id, -1)}
                          >
                            −
                          </button>
                          <span aria-label="Quantidade">
                            {cart[product.id]}
                          </span>
                          <button
                            type="button"
                            disabled={cart[product.id] >= 99}
                            aria-label={
                              "Aumentar quantidade de " + product.name
                            }
                            onClick={() => changeQuantity(product.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <strong>
                          {money((product.price ?? 0) * cart[product.id])}
                        </strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="pc-remove"
                      aria-label={"Remover " + product.name}
                      onClick={() => removeProduct(product.id)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="pc-support">
                <WhatsApp />
                <p>
                  <strong>Um atendimento para cada escolha.</strong>
                  <span>
                    A equipe confirma cores, disponibilidade e condições com
                    você.
                  </span>
                </p>
              </div>
            </>
          ) : (
            <div className="pc-empty">
              <div className="pc-empty-art">
                <span />
                <Icon kind="bag" />
                <i />
              </div>
              <small>ESPAÇO PARA NOVAS ESCOLHAS</small>
              <h3>
                Seu próximo favorito
                <br />
                ainda está na vitrine.
              </h3>
              <p>
                Explore iPhones lacrados, seminovos e Apple Watch. Adicione os
                seus favoritos e monte o pedido no seu ritmo.
              </p>
              <button type="button" className="pc-explore" onClick={close}>
                Explorar produtos <Arrow />
              </button>
              <div className="pc-empty-tags">
                <span>iPhones</span>
                <i />
                <span>Apple Watch</span>
              </div>
            </div>
          )}
        </div>
        <footer className="pc-footer">
          {count > 0 ? (
            <>
              <div className="pc-total">
                <div>
                  <span>Subtotal estimado</span>
                  <small>
                    {count}{" "}
                    {count === 1 ? "produto no pedido" : "produtos no pedido"}
                  </small>
                </div>
                <strong>{money(subtotal)}</strong>
              </div>
              <p className="pc-disclaimer">
                Valores do catálogo. Disponibilidade e condições confirmadas
                pela loja antes da compra.
              </p>
              {checkout ? (
                <a
                  className="pc-checkout"
                  href={checkout}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsApp />
                  <span>
                    <small>PRÓXIMO PASSO</small>Continuar pelo WhatsApp
                  </span>
                  <Arrow />
                </a>
              ) : (
                <button className="pc-checkout" disabled>
                  WhatsApp indisponível
                </button>
              )}
              <button type="button" className="pc-continue" onClick={close}>
                Continuar comprando <Arrow />
              </button>
              {!phone && <p>WhatsApp da loja ainda não configurado.</p>}
            </>
          ) : (
            <div className="pc-empty-footer">
              <WhatsApp />
              <div>
                <strong>Escolha no site. Combine com a loja.</strong>
                <p>Atendimento e finalização pelo WhatsApp.</p>
              </div>
            </div>
          )}
        </footer>
      </div>
    </dialog>
  );
}
