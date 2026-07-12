"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { players } from "@/data/players";
import { clean, pickDaily } from "@/lib/daily";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";

const pool = players.filter((player) => player.games >= 45 && player.pts >= 12 && player.imageUrl);
const names = [...new Set(players.map((player) => player.name))].sort();
const teamIds: Record<string, string> = {
  ATL: "1610612737", BOS: "1610612738", BRK: "1610612751", BKN: "1610612751", NJN: "1610612751",
  CHA: "1610612766", CHO: "1610612766", CHH: "1610612766", CHI: "1610612741", CLE: "1610612739",
  DAL: "1610612742", DEN: "1610612743", DET: "1610612765", GSW: "1610612744", SFW: "1610612744",
  HOU: "1610612745", IND: "1610612754", LAC: "1610612746", SDC: "1610612746", LAL: "1610612747",
  MNL: "1610612747", MEM: "1610612763", VAN: "1610612763", MIA: "1610612748", MIL: "1610612749",
  MIN: "1610612750", NOP: "1610612740", NOH: "1610612740", NOK: "1610612740", NYK: "1610612752",
  OKC: "1610612760", SEA: "1610612760", ORL: "1610612753", PHI: "1610612755", SYR: "1610612755",
  PHO: "1610612756", POR: "1610612757", SAC: "1610612758", KCK: "1610612758", CIN: "1610612758",
  SAS: "1610612759", TOR: "1610612761", UTA: "1610612762", WAS: "1610612764", WSB: "1610612764",
};

function timeLeft() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const ms = end.getTime() - now.getTime();
  return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms % 3600000 / 60000)).padStart(2, "0")}:${String(Math.floor(ms % 60000 / 1000)).padStart(2, "0")}`;
}

export default function StatLineGame() {
  const { lang, t } = useLanguage();
  const challenge = useMemo(() => pickDaily(pool, "stat-line"), []);
  const [countdown, setCountdown] = useState("--:--:--");
  const [query, setQuery] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState("");
  useEffect(() => { const update = () => setCountdown(timeLeft()); update(); const timer = setInterval(update, 1000); return () => clearInterval(timer); }, []);
  const value = clean(query);
  const suggestions = value ? names.filter((name) => clean(name).includes(value) && !guesses.includes(name)).slice(0, 8) : [];
  const finished = status !== "playing";
  const seasonYear = challenge.season.split("-")[0];
  const logoId = teamIds[challenge.team];
  const hints = [
    { label: lang === "es" ? "Equipo" : "Team", value: challenge.team, kind: "team" },
    { label: lang === "es" ? "Posición" : "Position", value: challenge.position },
    { label: lang === "es" ? "Año" : "Year", value: seasonYear },
    { label: lang === "es" ? "Partidos" : "Games", value: String(challenge.games) },
    { label: lang === "es" ? "Dorsal" : "Number", value: challenge.number ? `#${challenge.number}` : "—" },
    { label: lang === "es" ? "Era" : "Era", value: challenge.pool === "current" ? "2025-26" : lang === "es" ? "HISTÓRICO" : "HISTORIC" },
  ];
  const revealedHints = Math.min(guesses.length, hints.length);

  function submit(name: string) {
    if (!name || finished) return;
    const guess = names.find((item) => clean(item) === clean(name)) ?? name;
    const next = [...guesses, guess];
    setGuesses(next);
    setQuery("");
    if (clean(guess) === clean(challenge.name)) {
      setStatus("won");
      setMessage(lang === "es" ? "Correcto. Esa línea era suya." : "Correct. That stat line was his.");
      return;
    }
    if (next.length >= 5) {
      setStatus("lost");
      setMessage(lang === "es" ? `Era ${challenge.name}.` : `It was ${challenge.name}.`);
      return;
    }
    setMessage(lang === "es" ? "No era. Nueva pista desbloqueada." : "Not him. New clue unlocked.");
  }

  return (
    <main className="mini-shell">
      <nav className="site-nav daily-game-nav"><Link href="/" className="back-link">← {t("games")}</Link><SiteBrand link={false} /><span className="live-reset">{t("reset")} {countdown}</span></nav>
      <section className="mini-game stat-line-game">
        <header className="mini-head stat-play-head">
          <div>
            <h1>STAT LINE</h1>
            <p>{lang === "es" ? "Te damos una línea estadística de una temporada. Adivina qué jugador la firmó antes de gastar los cinco intentos." : "You get one season stat line. Guess the player behind it before five tries are gone."}</p>
          </div>
        </header>
        <div className="stat-hint-grid stat-hint-top">
          {hints.slice(0, 3).map((hint, index) => {
            const visible = index < revealedHints || finished;
            return <article className={visible ? "revealed" : ""} key={hint.label}><span>{hint.label}</span><b>{visible ? (hint.kind === "team" && logoId ? <img src={`https://cdn.nba.com/logos/nba/${logoId}/primary/L/logo.svg`} alt={String(hint.value)} /> : hint.value) : "?"}</b><small>{visible ? (lang === "es" ? "PISTA" : "CLUE") : ""}</small></article>;
          })}
        </div>
        <div className="stat-line-stage">
          <div className="stat-line-meta"><span>{lang === "es" ? "LÍNEA DE TEMPORADA" : "SEASON STAT LINE"}</span><b>{lang === "es" ? "Jugador oculto" : "Hidden player"}</b></div>
          <div className="stat-line-card">
            <article><b>{challenge.pts.toFixed(1)}</b><span>PTS</span></article>
            <article><b>{challenge.reb.toFixed(1)}</b><span>REB</span></article>
            <article><b>{challenge.ast.toFixed(1)}</b><span>AST</span></article>
            <article><b>{challenge.stl.toFixed(1)}</b><span>STL</span></article>
            <article><b>{challenge.blk.toFixed(1)}</b><span>BLK</span></article>
          </div>
        </div>
        <div className="stat-hint-grid stat-hint-bottom">
          {hints.slice(3).map((hint, offset) => {
            const index = offset + 3;
            const visible = index < revealedHints || finished;
            return <article className={visible ? "revealed" : ""} key={hint.label}><span>{hint.label}</span><b>{visible ? hint.value : "?"}</b><small>{visible ? (lang === "es" ? "PISTA" : "CLUE") : ""}</small></article>;
          })}
        </div>
        {finished && <div className="mini-answer">{challenge.imageUrl && <img src={challenge.imageUrl} alt="" />}<div><span>{status === "won" ? t("correct") : t("was")}</span><h2>{challenge.name}</h2><p>{challenge.season} · {challenge.team}</p></div></div>}
        {!finished && <div className="mini-search"><div><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(query || suggestions[0]); }} placeholder={t("typeName")} /><button disabled={!query && !suggestions[0]} onClick={() => submit(query || suggestions[0])}>{t("test")}</button></div>{suggestions.length > 0 && <aside>{suggestions.map((name) => <button key={name} onClick={() => submit(name)}>{name}</button>)}</aside>}</div>}
        <p className="mini-message">{message || `${guesses.length}/5`}</p>
      </section>
    </main>
  );
}
