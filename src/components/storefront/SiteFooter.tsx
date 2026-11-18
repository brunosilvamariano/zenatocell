"use client";
import PrivacyControls from "@/components/privacy/PrivacyControls";
import { directions, instagram, phone } from "@/config/store";
import { GoogleIcon, InstagramIcon } from "@/components/ui/Icons";

export function SiteFooter({
  category,
  filter,
}: {
  category: string;
  filter: (value: string) => void;
}) {
  return (
    <footer id="contato">
      <div className="wrap footer-banner">
        <div>
          <h2>Visite a ZenatoCell</h2>
          <p>Rua Blumenau, 1934 · América, Joinville–SC</p>
        </div>
        <div className="footer-banner-actions">
          <a className="red" href={directions} target="_blank" rel="noreferrer">
            <GoogleIcon /> Como chegar ↗
          </a>
          <a
            className="instagram-link"
            href={instagram}
            target="_blank"
            rel="noreferrer"
          >
            <InstagramIcon /> Instagram
          </a>
        </div>
      </div>
      <div className="wrap footer-grid">
        <section className="footer-brand">
          <img
            src="/zenatocell/zenatocell.svg"
            alt="Zenato Cell"
            width="100"
            height="100"
          />
          <p>iPhones lacrados, seminovos e Apple Watch em Joinville.</p>
        </section>
        <section>
          <h2>Loja</h2>
          <a href="#inicio">Início</a>
          <button
            aria-pressed={category === "Lacrado"}
            onClick={() => filter("Lacrado")}
          >
            iPhones lacrados
          </button>
          <button
            aria-pressed={category === "Seminovo"}
            onClick={() => filter("Seminovo")}
          >
            iPhones seminovos
          </button>
          <button
            aria-pressed={category === "Apple Watch"}
            onClick={() => filter("Apple Watch")}
          >
            Apple Watch
          </button>
        </section>
        <section>
          <h2>Atendimento</h2>
          <a href="#help-title">Avaliações</a>
          <a
            href={instagram}
            target="_blank"
            rel="noreferrer"
            className="instagram-link"
          >
            <InstagramIcon /> Instagram
          </a>
          {phone && (
            <a href={"https://wa.me/" + phone} target="_blank" rel="noreferrer">
              WhatsApp ↗
            </a>
          )}
        </section>
        <section>
          <h2>Contato</h2>
          <p>Consulte estoque, pagamento e retirada com a loja.</p>
          <a
            href={phone ? "https://wa.me/" + phone : instagram}
            target="_blank"
            rel="noreferrer"
          >
            Fale com a ZenatoCell ↗
          </a>
        </section>
      </div>
      <PrivacyControls />
      <div className="footer-bottom">
        <div className="wrap">
          <span>© ZenatoCell. Todos os direitos reservados.</span>
          <a
            className="developer-credit"
            href="https://brunomarianosilva.com.br/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              width="34"
              height="38"
              viewBox="0 0 38 40"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 2h8v14a11 11 0 1 1-8 10.6V2Zm11 21a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
              />
              <path d="m30 1 1.8 5.2L37 8l-5.2 1.8L30 15l-1.8-5.2L23 8l5.2-1.8L30 1Z" />
            </svg>
            <span>
              <small>Desenvolvido com ❤️ por</small>
              <strong>Bruno Mariano</strong>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
