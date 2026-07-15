"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export function SiteFooter() {
  const { lang } = useLanguage();
  const copy = lang === "es" ? {
    rights: "© 2026 Court Inside",
    disclaimer: "Web independiente de juegos de baloncesto. No está afiliada, patrocinada ni avalada por la NBA, sus equipos, ligas o jugadores. Las marcas pertenecen a sus propietarios.",
    about: "Sobre Court Inside",
    privacy: "Privacidad",
    terms: "Términos",
    contact: "Contacto",
    credits: "Créditos",
  } : {
    rights: "© 2026 Court Inside",
    disclaimer: "Independent basketball games website. Not affiliated with, sponsored by, or endorsed by the NBA, its teams, leagues, or players. Trademarks belong to their owners.",
    about: "About Court Inside",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    credits: "Credits",
  };

  return (
    <footer className="site-footer">
      <div>
        <strong>{copy.rights}</strong>
        <p>{copy.disclaimer}</p>
      </div>
      <nav aria-label={lang === "es" ? "Enlaces legales" : "Legal links"}>
        <Link href="/about">{copy.about}</Link>
        <Link href="/privacy">{copy.privacy}</Link>
        <Link href="/terms">{copy.terms}</Link>
        <Link href="/contact">{copy.contact}</Link>
        <Link href="/credits">{copy.credits}</Link>
      </nav>
    </footer>
  );
}
