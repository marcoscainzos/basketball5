"use client";

import Link from "next/link";
import TopFiveGame from "@/components/TopFiveGame";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";

export default function TopFivePage() {
  const { t } = useLanguage();
  return <main className="top5-shell"><nav className="site-nav"><SiteBrand /><Link href="/" className="back-link">← {t("games")}</Link></nav><TopFiveGame/></main>;
}
