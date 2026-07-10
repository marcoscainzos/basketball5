"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlayerSeason, players, StatKey } from "@/data/players";
import { dayKey, hash, shuffleDaily } from "@/lib/daily";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";

const stats: StatKey[] = ["pts", "reb", "ast", "stl", "blk"];
const labels: Record<StatKey, string> = { pts: "PTS", reb: "REB", ast: "AST", stl: "STL", blk: "BLK" };

function dailyStat() {
  return stats[hash(`${dayKey()}-blind-stat`) % stats.length];
}

function playerPool(stat: StatKey) {
  return players
    .filter((player) => player.games >= 50 && player.imageUrl && player[stat] > 0)
    .sort((a, b) => b[stat] - a[stat])
    .slice(0, 90);
}

export default function BlindRankingGame() {
  const { lang, t } = useLanguage();
  const stat = useMemo(() => dailyStat(), []);
  const challenge = useMemo(() => shuffleDaily(playerPool(stat), "blind-ranking").slice(0, 5), [stat]);
  const [slots, setSlots] = useState<(PlayerSeason | null)[]>(Array(5).fill(null));
  const current = challenge[slots.filter(Boolean).length];
  const completed = slots.every(Boolean);
  const correctOrder = [...challenge].sort((a, b) => b[stat] - a[stat]);
  const score = completed ? slots.reduce((sum, player, index) => sum + (player?.id === correctOrder[index].id ? 1 : 0), 0) : 0;

  function place(index: number) {
    if (!current || slots[index]) return;
    const next = [...slots];
    next[index] = current;
    setSlots(next);
  }

  function reset() {
    setSlots(Array(5).fill(null));
  }

  return (
    <main className="mini-shell">
      <nav className="site-nav"><SiteBrand /><Link href="/" className="back-link">← {t("games")}</Link></nav>
      <section className="mini-game">
        <header className="mini-head"><span>{labels[stat]}</span><h1>BLIND RANKING</h1><p>{lang === "es" ? "Coloca cada jugador sin saber quién viene después. Orden descendente." : "Place each player before seeing who's next. Highest to lowest."}</p></header>
        {!completed && current && <div className="blind-current">{current.imageUrl && <img src={current.imageUrl} alt="" />}<div><span>{current.season} · {current.team}</span><h2>{current.name}</h2><p>{lang === "es" ? "¿Dónde lo colocas?" : "Where do you place him?"}</p></div></div>}
        <div className="blind-slots">
          {slots.map((player, index) => <button className={player ? "filled" : ""} disabled={Boolean(player) || completed} onClick={() => place(index)} key={index}><strong>{index + 1}</strong>{player ? <><b>{player.name}</b><span>{completed ? `${player[stat].toFixed(1)} ${labels[stat]}` : `${player.season} · ${player.team}`}</span></> : <b>{lang === "es" ? "COLOCAR AQUÍ" : "PLACE HERE"}</b>}</button>)}
        </div>
        {completed && <div className="mini-answer compact"><div><span>{lang === "es" ? "RESULTADO" : "RESULT"}</span><h2>{score}/5</h2><p>{correctOrder.map((player, index) => `${index + 1}. ${player.name} (${player[stat].toFixed(1)})`).join(" / ")}</p><button onClick={reset}>{lang === "es" ? "REINTENTAR" : "TRY AGAIN"}</button></div></div>}
      </section>
    </main>
  );
}
