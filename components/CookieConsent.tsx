"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type Consent = "all" | "essential" | "reject";

export function CookieConsent() {
  const { lang } = useLanguage();
  const [choice, setChoice] = useState<Consent | null>("essential");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("court-inside-cookie-consent") as Consent | null;
    setChoice(saved);
    setReady(true);
  }, []);

  const save = (next: Consent) => {
    localStorage.setItem("court-inside-cookie-consent", next);
    localStorage.setItem("court-inside-cookie-consent-date", new Date().toISOString());
    setChoice(next);
  };

  if (!ready || choice) return null;

  const copy = lang === "es" ? {
    title: "Cookies",
    text: "Usamos cookies imprescindibles para guardar idioma y progreso. Si aceptas, también podremos usar medición y anuncios de Google AdSense.",
    reject: "Rechazar",
    essential: "Solo imprescindibles",
    accept: "Aceptar",
  } : {
    title: "Cookies",
    text: "We use essential cookies to save language and progress. If you accept, we may also use measurement and Google AdSense ads.",
    reject: "Reject",
    essential: "Essential only",
    accept: "Accept",
  };

  return (
    <aside className="cookie-consent" role="dialog" aria-label={copy.title}>
      <div>
        <b>{copy.title}</b>
        <p>{copy.text}</p>
      </div>
      <div className="cookie-actions">
        <button type="button" onClick={() => save("reject")}>{copy.reject}</button>
        <button type="button" onClick={() => save("essential")}>{copy.essential}</button>
        <button type="button" className="primary" onClick={() => save("all")}>{copy.accept}</button>
      </div>
    </aside>
  );
}
