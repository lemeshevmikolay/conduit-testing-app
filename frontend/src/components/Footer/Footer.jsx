import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpRight, Braces, RefreshCw, Sparkles } from "lucide-react";

const tips = [
  "Перевір happy path, але не забудь про порожні поля, граничні значення та повільну мережу.",
  "Сильний баг-репорт містить середовище, кроки відтворення, фактичний і очікуваний результат.",
  "Для числових полів спробуй 0, 1, максимум і значення на одиницю вище максимуму.",
  "Коли змінюється вимога, онови тест-кейс разом із нею — інакше перевірятимеш старе очікування.",
];

const resources = [
  {
    name: "Попелюха",
    label: "YouTube · українською",
    description: "Відео про тестування, інструменти й розвиток у QA.",
    href: "https://www.youtube.com/@Popeliuha",
    icon: "youtube",
    color: "youtube",
  },
  {
    name: "Suvore QA Community",
    label: "Instagram · спільнота",
    description: "Зустрічі, анонси та розмови української QA-спільноти.",
    href: "https://www.instagram.com/suvore.qa.community/",
    icon: "instagram",
    color: "instagram",
  },
  {
    name: "ISTQB",
    label: "X · сертифікація",
    description: "Новини міжнародної спільноти та сертифікаційної програми.",
    href: "https://x.com/ISTQBORG",
    icon: "x",
    color: "x",
  },
];

function SocialIcon({ name }) {
  if (name === "youtube") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
      </svg>
    );
  }

  if (name === "instagram") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.7" r=".8" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 1.2h3.7l-8 9.2L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.3H4.4l13.2 17.3Z" />
    </svg>
  );
}

function Footer() {
  const [tipIndex, setTipIndex] = useState(0);

  const showNextTip = () => {
    setTipIndex((current) => (current + 1) % tips.length);
  };

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div className="container community-footer__container">
      <div className="community-footer__main">
        <section className="community-footer__intro" aria-labelledby="footer-title">
          <Link to="/" className="community-footer__brand" aria-label="Conduit — на головну">
            <span className="community-footer__brand-icon"><Braces size={19} strokeWidth={2.5} aria-hidden="true" /></span>
            <span>conduit</span>
            <span className="community-footer__brand-suffix">/ qa</span>
          </Link>

          <span className="community-footer__eyebrow">ЯКІСТЬ ПОЧИНАЄТЬСЯ З ЦІКАВОСТІ</span>
          <h2 id="footer-title">Перевіряй припущення. Покращуй досвід.</h2>
          <p className="community-footer__description">
            Корисні голоси, спільноти та ідеї для тих, хто будує надійні цифрові продукти.
          </p>

          <div className="community-footer__topics" aria-label="Теми">
            <span>Manual QA</span>
            <span>Automation</span>
            <span>API &amp; quality</span>
          </div>
        </section>

        <section className="community-footer__resources" aria-labelledby="footer-resources-title">
          <div className="community-footer__section-heading">
            <div>
              <span className="community-footer__eyebrow">ПІДБІРКА СПІЛЬНОТИ</span>
              <h2 id="footer-resources-title">Куди далі?</h2>
            </div>
            <span className="community-footer__resource-count">03 ресурси</span>
          </div>

          <div className="community-footer__resource-grid">
            {resources.map((resource) => (
              <a
                className={`community-resource community-resource--${resource.color}`}
                href={resource.href}
                key={resource.name}
                rel="noreferrer"
                target="_blank"
                aria-label={`${resource.name}: ${resource.description} Відкрити в новій вкладці`}
              >
                <span className="community-resource__icon"><SocialIcon name={resource.icon} /></span>
                <span className="community-resource__body">
                  <span className="community-resource__label">{resource.label}</span>
                  <span className="community-resource__name">{resource.name}</span>
                  <span className="community-resource__description">{resource.description}</span>
                </span>
                <ArrowUpRight className="community-resource__arrow" size={17} aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        <section className="community-footer__tip" aria-label="Порада з тестування">
          <div className="community-footer__tip-icon"><Sparkles size={19} aria-hidden="true" /></div>
          <div className="community-footer__tip-content">
            <span className="community-footer__eyebrow">МАЛЕНЬКА QA-ПІДКАЗКА</span>
            <p className="community-footer__tip-copy" key={tipIndex} role="status">
              {tips[tipIndex]}
            </p>
          </div>
          <button className="community-footer__tip-button" type="button" onClick={showNextTip}>
            <RefreshCw size={15} aria-hidden="true" />
            <span>Ще підказка</span>
          </button>
        </section>
      </div>

      <div className="community-footer__bottom">
        <p>© Conduit · Код і дизайн під ліцензією MIT.</p>
        <div className="community-footer__bottom-links">
          <a href="https://github.com/lemeshevmikolay/conduit-testing-app" target="_blank" rel="noreferrer">
            <Braces size={15} aria-hidden="true" />
            <span>Вихідний код</span>
          </a>
          <button type="button" onClick={scrollToTop} aria-label="Повернутися нагору">
            <ArrowUp size={15} aria-hidden="true" />
            <span>Нагору</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Footer;
