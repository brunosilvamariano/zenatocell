"use client";
import type { Product } from "@/data/catalog";
import { phone } from "@/config/store";
import { money } from "@/lib/format";
import { Icon } from "@/components/ui/Icons";
import { ProductPhotos } from "./ProductPhotos";
export function ProductCard({
  product,
  animate = false,
  quantity,
  changeQuantity,
  onAdd,
}: {
  product: Product;
  animate?: boolean;
  quantity: number;
  changeQuantity: (id: string, delta: number) => void;
  onAdd: (product: Product) => void;
}) {
  return (
    <article
      key={product.id}
      style={
        animate
          ? {
              viewTransitionName:
                "catalog-" + product.id.replace(/[^a-z0-9-]/g, ""),
            }
          : undefined
      }
    >
      <ProductPhotos product={product} />
      <div className="product-info">
        <div className="product-identity">
          <span className="product-condition" data-condition={product.category}>
            {product.category}
          </span>
          <h3>{product.name}</h3>
        </div>
        <div className="product-payment">
          <div className="product-prices">
            <strong>
              {product.price === null ? "Sob consulta" : money(product.price)}
            </strong>
            {product.price !== null && (
              <small>
                {product.category === "Apple Watch" ? "no catálogo" : "à vista"}
              </small>
            )}
          </div>
          {product.installment !== null && (
            <p className="installments">
              <strong>
                {product.months}× de {money(product.installment)}
              </strong>
              <span>
                {product.category === "Apple Watch" ? "sem juros" : "no cartão"}
              </span>
            </p>
          )}
        </div>
        {product.warranty && (
          <span className="product-warranty">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M12 3 5 6v5c0 4.5 2.8 7.9 7 10 4.2-2.1 7-5.5 7-10V6l-7-3Z" />
              <path d="m9 11 2 2 4-4" />
            </svg>
            {product.warranty}
          </span>
        )}
        <small className="product-availability">Consulte cor e estoque</small>
        {product.price === null ? (
          <a
            className="red"
            href={
              "https://wa.me/" +
              phone +
              "?text=" +
              encodeURIComponent(
                "Olá, gostaria de confirmar o valor de " + product.name,
              )
            }
            target="_blank"
            rel="noreferrer"
          >
            Consultar valor
          </a>
        ) : null}
        {product.price === null ? null : quantity > 0 ? (
          <div
            className="card-quantity"
            role="group"
            aria-label={"Quantidade de " + product.name + " no carrinho"}
          >
            <button
              aria-label={"Diminuir quantidade de " + product.name}
              onClick={() => changeQuantity(product.id, -1)}
            >
              −
            </button>
            <span>
              <small>No carrinho</small>
              <strong>{quantity}</strong>
            </span>
            <button
              aria-label={"Aumentar quantidade de " + product.name}
              disabled={quantity >= 99}
              onClick={() => changeQuantity(product.id, 1)}
            >
              +
            </button>
          </div>
        ) : (
          <button
            className="red product-add"
            aria-label={"Adicionar " + product.name + " ao carrinho"}
            onClick={() => {
              onAdd(product);
            }}
          >
            <Icon kind="bag" />
            <span>
              Adicionar<span className="add-label-extra"> ao carrinho</span>
            </span>
          </button>
        )}
      </div>
    </article>
  );
}
