"use client";

import Link from "next/link";
import credits from "@/data/image-credits.json";
import { SiteBrand } from "@/components/SiteBrand";
import { SiteFooter } from "@/components/SiteFooter";
import { useLanguage } from "@/components/LanguageProvider";

export default function CreditsPage() {
  const { t } = useLanguage();
  const entries = Object.entries(credits).filter(([, credit]) => credit.imageUrl);
  return (
    <main className="credits-page">
      <nav className="site-nav"><SiteBrand /><Link href="/" className="back-link">← {t("home")}</Link></nav>
      <section className="credits-content">
        <span>{t("imageAttribution")}</span><h1>{t("creditsTitle")}</h1>
        <p>{t("creditsText")}</p>
        <div className="credits-list">{entries.map(([name, credit]) => <article key={name}><strong>{name}</strong><span>{credit.author || t("authorFallback")}</span><a href={credit.source} target="_blank" rel="noreferrer">{credit.license || t("licenseFallback")} ↗</a></article>)}</div>
      </section>
      <SiteFooter />
    </main>
  );
}
