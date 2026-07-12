"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlayerSeason, players } from "@/data/players";
import { dayKey, hash, shuffleDaily } from "@/lib/daily";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";

type Candidate = {
  key: string;
  name: string;
  value: number;
  displayValue: string;
};

type Challenge = {
  id: string;
  label: string;
  labelEn: string;
  hint: string;
  hintEn: string;
  build: () => Candidate[];
};

const featuredTeams = ["LAL", "BOS", "CHI", "GSW", "MIA", "SAS", "NYK", "DAL", "PHI", "HOU"];
const formatOne = (value: number) => value.toFixed(1);
const formatWhole = (value: number) => Math.round(value).toLocaleString("en-US");

function bestPerPlayer(metric: keyof Pick<PlayerSeason, "pts" | "reb" | "ast" | "stl" | "blk">, minValue: number) {
  const best = new Map<string, PlayerSeason>();
  for (const season of players) {
    if (!season.imageUrl || season.games < 50 || season[metric] < minValue) continue;
    const current = best.get(season.name);
    if (!current || season[metric] > current[metric]) best.set(season.name, season);
  }
  return [...best.values()].map((season) => ({
    key: `${season.name}-${metric}`,
    name: season.name,
    value: season[metric],
    displayValue: formatOne(season[metric]),
  }));
}

function careerTotals(metric: "pts" | "reb" | "ast") {
  const totals = new Map<string, { name: string; value: number; seasons: number }>();
  for (const season of players) {
    if (!season.imageUrl || season.games < 20) continue;
    const item = totals.get(season.name) ?? { name: season.name, value: 0, seasons: 0 };
    item.value += season[metric] * season.games;
    item.seasons += 1;
    totals.set(season.name, item);
  }
  return [...totals.values()].filter((item) => item.seasons >= 4).map((item) => ({
    key: `${item.name}-career-${metric}`,
    name: item.name,
    value: item.value,
    displayValue: formatWhole(item.value),
  }));
}

function teamTotals(team: string, metric: "pts" | "reb" | "ast") {
  const totals = new Map<string, { name: string; value: number; seasons: number }>();
  for (const season of players) {
    if (!season.imageUrl || season.team !== team || season.games < 20) continue;
    const item = totals.get(season.name) ?? { name: season.name, value: 0, seasons: 0 };
    item.value += season[metric] * season.games;
    item.seasons += 1;
    totals.set(season.name, item);
  }
  return [...totals.values()].map((item) => ({
    key: `${item.name}-${team}-${metric}`,
    name: item.name,
    value: item.value,
    displayValue: formatWhole(item.value),
  }));
}

function seasonCounts(test: (season: PlayerSeason) => boolean, id: string) {
  const totals = new Map<string, number>();
  for (const season of players) {
    if (!season.imageUrl || season.games < 50 || !test(season)) continue;
    totals.set(season.name, (totals.get(season.name) ?? 0) + 1);
  }
  return [...totals.entries()].map(([name, value]) => ({
    key: `${name}-${id}`,
    name,
    value,
    displayValue: formatWhole(value),
  }));
}

function teamChallenge(metric: "pts" | "ast" | "reb"): Challenge {
  const team = featuredTeams[hash(`${dayKey()}-pyramid-team-${metric}`) % featuredTeams.length];
  const statLabel = metric === "pts" ? "PUNTOS" : metric === "ast" ? "ASISTENCIAS" : "REBOTES";
  const statLabelEn = metric === "pts" ? "POINTS" : metric === "ast" ? "ASSISTS" : "REBOUNDS";
  return {
    id: `team-${metric}-${team}`,
    label: `${statLabel} CON ${team}`,
    labelEn: `${statLabelEn} WITH ${team}`,
    hint: `Ordena por ${statLabel.toLowerCase()} totales con ${team}.`,
    hintEn: `Rank by total ${statLabelEn.toLowerCase()} with ${team}.`,
    build: () => teamTotals(team, metric),
  };
}

function challenges(): Challenge[] {
  return [
    { id: "peak-pts", label: "PUNTOS EN UNA TEMPORADA", labelEn: "POINTS IN A SEASON", hint: "Ordena por puntos por partido en su mejor temporada.", hintEn: "Rank by points per game in their best season.", build: () => bestPerPlayer("pts", 20) },
    { id: "peak-ast", label: "ASISTENCIAS EN UNA TEMPORADA", labelEn: "ASSISTS IN A SEASON", hint: "Ordena por asistencias por partido en su mejor temporada.", hintEn: "Rank by assists per game in their best season.", build: () => bestPerPlayer("ast", 5) },
    { id: "career-pts", label: "PUNTOS DE CARRERA", labelEn: "CAREER POINTS", hint: "Ordena por puntos totales acumulados en la base.", hintEn: "Rank by total points in the database.", build: () => careerTotals("pts") },
    { id: "career-ast", label: "ASISTENCIAS DE CARRERA", labelEn: "CAREER ASSISTS", hint: "Ordena por asistencias totales acumuladas en la base.", hintEn: "Rank by total assists in the database.", build: () => careerTotals("ast") },
    { id: "career-reb", label: "REBOTES DE CARRERA", labelEn: "CAREER REBOUNDS", hint: "Ordena por rebotes totales acumulados en la base.", hintEn: "Rank by total rebounds in the database.", build: () => careerTotals("reb") },
    { id: "elite-scoring-years", label: "TEMPORADAS DE 25+ PUNTOS", labelEn: "25+ POINT SEASONS", hint: "Ordena por número de temporadas promediando 25 o más puntos.", hintEn: "Rank by seasons averaging 25+ points.", build: () => seasonCounts((season) => season.pts >= 25, "25ppg") },
    { id: "double-rebound-years", label: "TEMPORADAS DE 10+ REBOTES", labelEn: "10+ REBOUND SEASONS", hint: "Ordena por número de temporadas promediando 10 o más rebotes.", hintEn: "Rank by seasons averaging 10+ rebounds.", build: () => seasonCounts((season) => season.reb >= 10, "10rpg") },
    teamChallenge("pts"),
    teamChallenge("ast"),
    teamChallenge("reb"),
  ];
}

function timeLeft() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const ms = end.getTime() - now.getTime();
  return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms % 3600000 / 60000)).padStart(2, "0")}:${String(Math.floor(ms % 60000 / 1000)).padStart(2, "0")}`;
}

function dailyChallenge() {
  const list = challenges();
  return list[hash(`${dayKey()}-six-order`) % list.length];
}

export default function SixOrderGame() {
  const { lang, t } = useLanguage();
  const challenge = useMemo(() => dailyChallenge(), []);
  const correct = useMemo(() => shuffleDaily(challenge.build().sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, 60), `six-order-${challenge.id}`).slice(0, 10).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)), [challenge]);
  const queue = useMemo(() => shuffleDaily(correct, `six-queue-${challenge.id}`), [correct, challenge.id]);
  const [countdown, setCountdown] = useState("--:--:--");
  const [slots, setSlots] = useState<(Candidate | null)[]>(Array(10).fill(null));
  const [movingIndex, setMovingIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => { const update = () => setCountdown(timeLeft()); update(); const timer = setInterval(update, 1000); return () => clearInterval(timer); }, []);

  const score = checked ? slots.reduce((sum, item, index) => sum + (item?.key === correct[index].key ? 1 : 0), 0) : 0;
  const complete = slots.every(Boolean);
  const placed = slots.filter(Boolean).length;
  const current = queue[placed];

  function swapSlots(from: number, to: number) {
    if (from === to) return;
    const next = [...slots];
    [next[from], next[to]] = [next[to], next[from]];
    setSlots(next);
  }

  function handleSlot(index: number) {
    if (checked) return;
    if (movingIndex !== null) {
      swapSlots(movingIndex, index);
      setMovingIndex(null);
      return;
    }
    if (slots[index]) {
      setMovingIndex(index);
      return;
    }
    if (!current) return;
    const next = [...slots];
    next[index] = current;
    setSlots(next);
  }

  function reset() {
    setSlots(Array(10).fill(null));
    setMovingIndex(null);
    setDragIndex(null);
    setChecked(false);
  }

  return (
    <main className="mini-shell">
      <nav className="site-nav daily-game-nav"><Link href="/" className="back-link">← {t("games")}</Link><SiteBrand link={false} /><span className="live-reset">{t("reset")} {countdown}</span></nav>
      <section className="mini-game six-order-game">
        <header className="six-pyramid-head">
          <b>{lang === "es" ? challenge.label : challenge.labelEn}</b>
          <p>{lang === "es" ? challenge.hint : challenge.hintEn}</p>
        </header>
        <div className="six-hex">
          {slots.map((player, index) => {
            const isRight = checked && player?.key === correct[index].key;
            const isWrong = checked && player && player.key !== correct[index].key;
            return (
              <button
                className={`six-slot six-slot-${index + 1} ${player ? "filled" : ""} ${movingIndex === index ? "moving" : ""} ${isRight ? "right" : ""} ${isWrong ? "wrong" : ""}`}
                draggable={Boolean(player) && !checked}
                key={index}
                onClick={() => handleSlot(index)}
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => { if (dragIndex !== null) swapSlots(dragIndex, index); setDragIndex(null); }}
              >
                <strong>{index + 1}</strong>
                {player ? <><b>{player.name}</b>{checked && <span>{player.displayValue}</span>}</> : <b />}
              </button>
            );
          })}
        </div>
        <div className="six-next-player">
          <span>{complete ? (lang === "es" ? "Pirámide completa" : "Pyramid complete") : (lang === "es" ? "Siguiente jugador:" : "Next player:")}</span>
          <b>{complete ? (lang === "es" ? "comprueba tu orden" : "check your order") : current?.name}</b>
        </div>
        <div className="six-actions">
          {!checked && <button disabled={!complete} onClick={() => setChecked(true)}>{lang === "es" ? "COMPROBAR" : "CHECK"}</button>}
          {!checked && <button className="secondary" onClick={reset}>{lang === "es" ? "LIMPIAR" : "CLEAR"}</button>}
          {checked && <button onClick={reset}>{lang === "es" ? "REINTENTAR" : "TRY AGAIN"}</button>}
        </div>
        {checked && <div className="mini-answer compact"><div><span>{lang === "es" ? "RESULTADO" : "RESULT"}</span><h2>{score}/10</h2><p>{correct.map((player, index) => `${index + 1}. ${player.name} · ${player.displayValue}`).join(" / ")}</p></div></div>}
      </section>
    </main>
  );
}
