"use client";
import { useState } from "react";
import { reviews } from "@/data/reviews";
import { googleReviews } from "@/config/store";
import { GoogleIcon } from "@/components/ui/Icons";

export function CustomerReviews() {
  const [tip, setTip] = useState(0);
  return (
    <section className="help" aria-labelledby="help-title">
      <div className="wrap">
        <div className="review-reputation">
          <span className="google-badge">
            <GoogleIcon /> Google
          </span>
          <h2 id="help-title">A confiança de quem já escolheu a ZenatoCell</h2>
          <div className="review-rating">
            <strong>
              4,7<span>/5</span>
            </strong>
            <span className="rating-stars" aria-label="Nota 4,7 de 5">
              <span>★★★★★</span>
              <span className="rating-fill" aria-hidden="true">
                ★★★★★
              </span>
            </span>
          </div>
          <p className="review-count">
            Mais de <strong>129 avaliações</strong>
          </p>
          <a href={googleReviews} target="_blank" rel="noreferrer">
            Conheça as experiências no Google ↗
          </a>
        </div>
        <div className="review-feature">
          <div className="review-slide" aria-live="polite">
            <p className="review-story" key={"story-" + reviews[tip].name}>
              {reviews[tip].summary}
            </p>
            <div className="review-author">
              <span className="review-avatar" key={reviews[tip].name}>
                <span>{reviews[tip].initials}</span>
                <img
                  src={reviews[tip].photo}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              </span>
              <div>
                <strong>{reviews[tip].name}</strong>
                <span className="review-stars" aria-label="5 de 5 estrelas">
                  ★★★★★
                </span>
              </div>
            </div>
          </div>
          <div className="review-navigation">
            <a
              href={googleReviews}
              target="_blank"
              rel="noreferrer"
              className="google-review-link"
            >
              <GoogleIcon /> Ler avaliações no Google{" "}
              <span aria-hidden="true">↗</span>
            </a>
            <div className="carousel-controls">
              <button
                aria-label="Avaliação anterior"
                onClick={() =>
                  setTip((tip + reviews.length - 1) % reviews.length)
                }
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="m14 6-6 6 6 6" />
                </svg>
              </button>
              <button
                aria-label="Próxima avaliação"
                onClick={() => setTip((tip + 1) % reviews.length)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="m10 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
