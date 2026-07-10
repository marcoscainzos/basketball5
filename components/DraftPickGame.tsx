"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { draftPicks } from "@/data/draft-picks";
import { clean, dayKey, pickDaily, shuffleDaily } from "@/lib/daily";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";

type Mode = "pickToPlayer" | "playerToPick";
const names = draftPicks.map((item) => item.player).sort();

export default function DraftPickGame() {
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState<Mode | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const challenge = useMemo(() => pickDaily(draftPicks, `draft-pick-${mode ?? "base"}`), [mode]);
  const pickOptions = useMemo(() => shuffleDaily([challenge.pick, ...draftPicks.filter((item) => item.year === challenge.year && item.player !== challenge.player).map((item) => item.pick), 1, 2, 3, 5, 7, 13, 15, 41].filter((pick, index, array) => array.indexOf(pick) === index), `pick-options-${challenge.player}`).slice(0, 4).sort((a, b) => a - b), [challenge]);
  const value = clean(query);
  const suggestions = value ? names.filter((name) => clean(name).includes(value)).slice(0, 8) : [];

  function answerPlayer(name: string) {
    if (finished) return;
    setQuery("");
    const right = clean(name) === clean(challenge.player);
    setFinished(true);
    setMessage(right ? (lang === "es" ? "Correcto." : "Correct.") : (lang === "es" ? `Era ${challenge.player}.` : `It was ${challenge.player}.`));
  }

  function answerPick(pick: number) {
    if (finished) return;
    const right = pick === challenge.pick;
    setFinished(true);
    setMessage(right ? (lang === "es" ? "Correcto." : "Correct.") : (lang === "es" ? `Fue el pick #${challenge.pick}.` : `He was pick #${challenge.pick}.`));
  }

  if (!mode) {
    return <main className="mini-shell"><nav className="site-nav"><SiteBrand /><Link href="/" className="back-link">← {t("games")}</Link></nav><section className="mode-intro"><div className="mode-copy"><h1>DRAFT PICK</h1><p>{lang === "es" ? "Dos formas: te damos pick y adivinas jugador, o te damos jugador y adivinas pick." : "Two ways: get the pick and guess the player, or get the player and guess the pick."}</p></div></section><section className="mode-select mode-select-two"><button className="mode-card mode-historical" onClick={() => setMode("pickToPlayer")}><h2>{lang === "es" ? "PICK → JUGADOR" : "PICK → PLAYER"}</h2></button><button className="mode-card mode-current" onClick={() => setMode("playerToPick")}><h2>{lang === "es" ? "JUGADOR → PICK" : "PLAYER → PICK"}</h2></button></section></main>;
  }

  return (
    <main className="mini-shell">
      <nav className="site-nav draft-top-nav"><button className="back-button" onClick={() => { setMode(null); setFinished(false); setMessage(""); }}>← {t("modes")}</button><SiteBrand link={false} /><span className="live-reset">{dayKey()}</span></nav>
      <section className="mini-game">
        <header className="mini-head"><span>{mode === "pickToPlayer" ? "PICK → PLAYER" : "PLAYER → PICK"}</span><h1>DRAFT PICK</h1></header>
        <div className="draft-pick-card">
          {mode === "pickToPlayer" ? <><span>{challenge.year} NBA DRAFT</span><b>#{challenge.pick}</b><p>{challenge.team}</p></> : <><span>{challenge.year} NBA DRAFT</span><b>{challenge.player}</b><p>{lang === "es" ? "¿En qué pick salió?" : "Which pick was he?"}</p></>}
        </div>
        {mode === "pickToPlayer" && !finished && <div className="mini-search"><div><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") answerPlayer(query || suggestions[0]); }} placeholder={t("typeName")} /><button disabled={!query && !suggestions[0]} onClick={() => answerPlayer(query || suggestions[0])}>{t("test")}</button></div>{suggestions.length > 0 && <aside>{suggestions.map((name) => <button key={name} onClick={() => answerPlayer(name)}>{name}</button>)}</aside>}</div>}
        {mode === "playerToPick" && !finished && <div className="pick-options">{pickOptions.map((pick) => <button key={pick} onClick={() => answerPick(pick)}>#{pick}</button>)}</div>}
        {finished && <div className="mini-answer compact"><div><span>{message}</span><h2>{challenge.player}</h2><p>#{challenge.pick} · {challenge.team} · {challenge.year}</p></div></div>}
      </section>
    </main>
  );
}
