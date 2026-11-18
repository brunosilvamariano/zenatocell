"use client";
import type { RefObject } from "react";
import type { Product } from "@/data/catalog";
import { phone } from "@/config/store";
import { money } from "@/lib/format";
import { Icon } from "@/components/ui/Icons";

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
  return (
    <dialog
      ref={dialog}
      className="drawer"
      aria-labelledby="cart-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <div className="drawer-content">
        <div className="drawer-heading">
          <div>
            <small className="drawer-brand">
              <Icon kind="bag" /> ZenatoCell
            </small>
            <h2 id="cart-title">Seu carrinho</h2>
          </div>
          <button
            aria-label="Fechar carrinho"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <p className="drawer-intro">
          Confira os produtos antes de enviar o pedido pelo WhatsApp.
        </p>
        <div className="drawer-summary">
          <div>
            <small>Total de itens</small>
            <strong>{count}</strong>
          </div>
          <div>
            <small>Subtotal estimado</small>
            <strong>{money(subtotal)}</strong>
          </div>
        </div>
        <div className="drawer-items">
          {lines.length ? (
            <ul>
              {lines.map((product) => (
                <li key={product.id}>
                  <img src={product.photos[0]} alt="" width="68" height="68" />
                  <div>
                    <strong>{product.name}</strong>
                    <p>{money((product.price ?? 0) * cart[product.id])}</p>
                    <div className="quantity">
                      <button
                        aria-label={"Diminuir quantidade de " + product.name}
                        onClick={() => changeQuantity(product.id, -1)}
                      >
                        −
                      </button>
                      {cart[product.id]}
                      <button
                        disabled={cart[product.id] >= 99}
                        aria-label={"Aumentar quantidade de " + product.name}
                        onClick={() => changeQuantity(product.id, 1)}
                      >
                        +
                      </button>
                      <button onClick={() => removeProduct(product.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>Seu carrinho está vazio.</p>
          )}
        </div>
        <div className="drawer-actions">
          <p>
            Valores do catálogo. Confirme disponibilidade, cores e condições com
            a loja.
          </p>
          {checkout ? (
            <a
              className="red"
              href={checkout}
              target="_blank"
              rel="noopener noreferrer"
            >
              Finalizar pelo WhatsApp
            </a>
          ) : (
            <button className="red" disabled>
              Finalizar pelo WhatsApp
            </button>
          )}
          <button
            className="continue-shopping"
            onClick={() => dialog.current?.close()}
          >
            Continuar comprando
          </button>
          {count > 0 && !phone && (
            <p>WhatsApp da loja ainda não configurado.</p>
          )}
        </div>
      </div>
    </dialog>
  );
}
