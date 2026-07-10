"use client";

import Link from "next/link";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";

export default function LeaguesPage() {
  const { t } = useLanguage();
  return (
    <main className="home-shell leagues-shell">
      <nav className="site-nav home-nav">
        <SiteBrand />
        <span className="nav-note">{t("dailyHoops")}</span>
      </nav>
      <header className="home-title"><span>{t("dailyBasketballGames")}</span><h1>COURT INSIDE</h1></header>

      <nav className="play-type-switch leagues-switch" aria-label="Modo de juego">
        <Link href="/" scroll={false}><span>01</span><div><b>{t("individual")}</b><i>{t("dailyGames")}</i></div></Link>
        <Link className="active" href="/leagues" scroll={false} aria-current="page"><span>02</span><div><b>{t("leagues")}</b><i>{t("competeFriends")}</i></div></Link>
      </nav>

      <header className="league-section-heading">
        <div><span>{t("courtInsideLeagues")}</span><h2>{t("competeGroup")}</h2></div>
        <p>{t("leagueIntro")}</p>
      </header>

      <section className="league-actions">
        <article className="league-action create-league">
          <div><h2>{t("createLeagueTitle").split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h2></div>
          <p>{t("createLeagueText")}</p>
          <button type="button">{t("createLeague")} <b>→</b></button>
        </article>

        <article className="league-action join-league">
          <div><h2>{t("joinLeagueTitle").split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h2></div>
          <p>{t("joinLeagueText")}</p>
          <form>
            <label htmlFor="league-code">{t("leagueCode")}</label>
            <div><input id="league-code" name="league-code" placeholder="EJ. CI-23MJ" autoComplete="off" /><button type="button">{t("enter")}</button></div>
          </form>
        </article>
      </section>
    </main>
  );
}
