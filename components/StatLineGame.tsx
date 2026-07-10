"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { players } from "@/data/players";
import { clean, dayKey, pickDaily } from "@/lib/daily";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";

const pool = players.filter((player) => player.games >= 45 && player.pts >= 12 && player.imageUrl);
const names = [...new Set(players.map((player) => player.name))].sort();

export default function StatLineGame() {
  const { lang, t } = useLanguage();
  const challenge = useMemo(() => pickDaily(pool, "stat-line"), []);
  const [query, setQuery] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState("");
  const value = clean(query);
  const suggestions = value ? names.filter((name) => clean(name).includes(value) && !guesses.includes(name)).slice(0, 8) : [];
  const finished = status !== "playing";
  const hints = [
    { label: lang === "es" ? "Equipo" : "Team", value: challenge.team },
    { label: lang === "es" ? "Posición" : "Position", value: challenge.position },
    { label: lang === "es" ? "Temporada" : "Season", value: challenge.season },
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
      <nav className="site-nav"><SiteBrand /><Link href="/" className="back-link">← {t("games")}</Link></nav>
      <section className="mini-game">
        <header className="mini-head"><span>{dayKey()}</span><h1>STAT LINE</h1><p>{lang === "es" ? "Adivina el jugador viendo solo una línea estadística de una temporada." : "Guess the player from one season stat line."}</p></header>
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
        <div className="stat-hint-grid">
          {hints.map((hint, index) => {
            const visible = index < revealedHints || finished;
            return <article className={visible ? "revealed" : ""} key={hint.label}><span>{hint.label}</span><b>{visible ? hint.value : "?"}</b><small>{visible ? (lang === "es" ? "PISTA" : "CLUE") : (lang === "es" ? `FALLO ${index + 1}` : `MISS ${index + 1}`)}</small></article>;
          })}
        </div>
        {finished && <div className="mini-answer">{challenge.imageUrl && <img src={challenge.imageUrl} alt="" />}<div><span>{status === "won" ? t("correct") : t("was")}</span><h2>{challenge.name}</h2><p>{challenge.season} · {challenge.team}</p></div></div>}
        {!finished && <div className="mini-search"><div><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(query || suggestions[0]); }} placeholder={t("typeName")} /><button disabled={!query && !suggestions[0]} onClick={() => submit(query || suggestions[0])}>{t("test")}</button></div>{suggestions.length > 0 && <aside>{suggestions.map((name) => <button key={name} onClick={() => submit(name)}>{name}</button>)}</aside>}</div>}
        <p className="mini-message">{message || `${guesses.length}/5`}</p>
      </section>
    </main>
  );
}
