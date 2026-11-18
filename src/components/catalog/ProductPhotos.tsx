"use client";
import { useRef, useState } from "react";
import type { Product } from "@/data/catalog";

export function ProductPhotos({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const length = product.photos.length;
  function move(step: number) {
    setIndex((previous) => (previous + step + length) % length);
  }

  return (
    <div
      className="product-thumbnail"
      onPointerDown={(event) => {
        if (
          length < 2 ||
          !event.isPrimary ||
          event.button !== 0 ||
          (event.target as HTMLElement).closest("button")
        )
          return;
        gesture.current = {
          x: event.clientX,
          y: event.clientY,
          id: event.pointerId,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => {
        const start = gesture.current;
        gesture.current = null;
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.25)
          move(dx < 0 ? 1 : -1);
      }}
      onPointerCancel={() => {
        gesture.current = null;
      }}
      onLostPointerCapture={() => {
        gesture.current = null;
      }}
    >
      <img
        key={index}
        src={product.photos[index]}
        alt={product.name}
        width="704"
        height="704"
        loading="lazy"
        draggable={false}
      />
      {length > 1 && (
        <>
          <button
            className="hero-arrow hero-arrow-prev product-photo-arrow"
            type="button"
            onClick={() => move(-1)}
            aria-label={"Foto anterior de " + product.name}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              aria-hidden="true"
            >
              <path d="m14 6-6 6 6 6" />
            </svg>
          </button>
          <button
            className="hero-arrow hero-arrow-next product-photo-arrow"
            type="button"
            onClick={() => move(1)}
            aria-label={"Próxima foto de " + product.name}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
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
  );
}
