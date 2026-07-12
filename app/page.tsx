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
        <Link href="/stat-line" className="compact-game stat-line-home"><span>06</span><div className="compact-art stat-line-art"><div className="home-stat-line"><b>27.4</b><b>8.1</b><b>6.9</b></div><div className="home-stat-clues"><i>?</i><i>?</i></div></div><h2>STAT LINE</h2></Link>
        <Link href="/draft-pick" className="compact-game draft-pick-home"><span>07</span><div className="compact-art pick-art"><b>#</b><i>03</i></div><h2>DRAFT PICK</h2></Link>
        <Link href="/timeline" className="compact-game timeline-home"><span>08</span><div className="compact-art timeline-art"><b>↗</b><i>NBA</i></div><h2>TIMELINE</h2></Link>
        <Link href="/blind-ranking" className="compact-game blind-home"><span>09</span><div className="compact-art blind-art"><b>5</b><i>?</i></div><h2>BLIND RANK</h2></Link>
      </section>
      <Link className="credits-link" href="/credits">{t("creditsTitle")} ↗</Link>
    </main>
  );
}
