"use client";

import Link from "next/link";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();
  return (
    <main className="home-shell">
      <nav className="site-nav home-nav">
        <SiteBrand />
        <span className="nav-note">{t("dailyHoops")}</span>
      </nav>
      <header className="home-title"><span>{t("dailyBasketballGames")}</span><h1>COURT INSIDE</h1></header>
      <nav className="play-type-switch" aria-label="Modo de juego">
        <Link className="active" href="/" scroll={false} aria-current="page"><span>01</span><div><b>{t("individual")}</b><i>{t("dailyGames")}</i></div></Link>
        <Link href="/leagues" scroll={false}><span>02</span><div><b>{t("leagues")}</b><i>{t("competeFriends")}</i></div></Link>
      </nav>
      <section className="game-picker" aria-label="Juegos">
        <Link href="/1vs1" className="compact-game red-game"><span>01</span><div className="compact-art one-v-one-logo"><b>1</b><i>VS</i><b>1</b></div><h2>1VS1</h2></Link>
        <Link href="/top5" className="compact-game blue-game"><span>02</span><div className="compact-art top-five-art"><b>5</b><i>TOP</i></div><h2>TOP 5</h2></Link>
        <Link href="/who-am-i" className="compact-game dark-game"><span>03</span><div className="compact-art who-art"><b>?</b></div><h2>WHO AM I?</h2></Link>
        <Link href="/draft" className="compact-game gold-game"><span>04</span><div className="compact-art draft-art"><b>5</b><i>TEAM</i></div><h2>DRAFT</h2></Link>
        <Link href="/tres-en-raya" className="compact-game tic-home-card"><span>05</span><div className="compact-art tic-art"><b>3</b><i>RAYA</i></div><h2>3 EN RAYA</h2></Link>
        <Link href="/stat-line" className="compact-game stat-line-home"><span>06</span><div className="compact-art stat-line-art"><b>27</b><i>PTS</i><em>?</em></div><h2>STAT LINE</h2></Link>
        <Link href="/six-order" className="compact-game six-order-home"><span>07</span><div className="compact-art six-order-art" aria-hidden="true"><svg viewBox="0 0 120 100"><polygon points="60,4 79,35 41,35" /><polygon points="41,38 59,38 59,64 24,64" /><polygon points="61,38 79,38 96,64 61,64" /><polygon points="23,67 47,67 40,96 4,96" /><polygon points="49,67 71,67 78,96 42,96" /><polygon points="73,67 97,67 116,96 80,96" /></svg></div><h2>PYRAMID</h2></Link>
      </section>
      <Link className="credits-link" href="/credits">{t("creditsTitle")} ↗</Link>
    </main>
  );
}
