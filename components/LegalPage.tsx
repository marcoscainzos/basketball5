"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { SiteBrand } from "@/components/SiteBrand";
import { SiteFooter } from "@/components/SiteFooter";
import { useLanguage } from "@/components/LanguageProvider";

export type LegalCopy = {
  kicker: string;
  title: string;
  intro: string;
  badge?: string;
  layout?: "solid" | "accordion";
  updated?: string;
  sections: Array<{
    title: string;
    body?: string;
    items?: string[];
  }>;
  extra?: ReactNode;
};

export function LegalPage({ es, en }: { es: LegalCopy; en: LegalCopy }) {
  const { lang, t } = useLanguage();
  const copy = lang === "es" ? es : en;
  const isAccordion = copy.layout === "accordion";

  return (
    <main className="legal-page">
      <nav className="site-nav">
        <SiteBrand />
        <Link href="/" className="back-link">← {t("home")}</Link>
      </nav>
      <section className="legal-content">
        <header className={`legal-hero ${!copy.badge && !copy.updated ? "no-aside" : ""}`}>
          <div>
            <span>{copy.kicker}</span>
            <h1>{copy.title}</h1>
            <p className="legal-intro">{copy.intro}</p>
          </div>
          {(copy.badge || copy.updated) ? (
            <aside>
              <b>{copy.updated ? (lang === "es" ? "ACTUALIZADO" : "UPDATED") : "COURT INSIDE"}</b>
              {copy.badge ? <p>{copy.badge}</p> : null}
              {copy.updated ? <small>{copy.updated}</small> : null}
            </aside>
          ) : null}
        </header>
        <div className={isAccordion ? "legal-card legal-card-accordion" : "legal-card legal-card-solid"}>
          {copy.sections.map((section, index) => isAccordion ? (
            <details key={section.title} className="legal-accordion" open={index === 0}>
              <summary>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.title}</h2>
                <i aria-hidden="true">+</i>
              </summary>
              <div className="legal-answer">
                {section.body ? <p>{section.body}</p> : null}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
              </div>
            </details>
          ) : (
            <article key={section.title} className="legal-solid-row">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2>{section.title}</h2>
                {section.body ? <p>{section.body}</p> : null}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
          {copy.extra}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
