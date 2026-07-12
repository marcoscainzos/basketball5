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
  imageUrl?: string;
  detail: string;
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

const formatOne = (value: number, suffix = "") => `${value.toFixed(1)}${suffix}`;
const formatWhole = (value: number, suffix = "") => `${Math.round(value).toLocaleString("en-US")}${suffix}`;

function bestPerPlayer(metric: keyof Pick<PlayerSeason, "pts" | "reb" | "ast" | "stl" | "blk">, minValue: number) {
  const best = new Map<string, PlayerSeason>();
  for (const season of players) {
    if (!season.imageUrl || season.games < 50 || season[metric] < minValue) continue;
    const current = best.get(season.name);
    if (!current || season[metric] > current[metric]) best.set(season.name, season);
  }
  return [...best.values()].map((season) => ({
    key: `${season.name}-${season.season}-${metric}`,
    name: season.name,
    imageUrl: season.imageUrl,
    detail: `${season.season} · ${season.team}`,
    value: season[metric],
    displayValue: formatOne(season[metric]),
  }));
}

function careerTotals(metric: "pts" | "reb" | "ast") {
  const totals = new Map<string, { name: string; imageUrl?: string; value: number; seasons: number }>();
  for (const season of players) {
    if (!season.imageUrl || season.games < 20) continue;
    const item = totals.get(season.name) ?? { name: season.name, imageUrl: season.imageUrl, value: 0, seasons: 0 };
    item.value += season[metric] * season.games;
    item.seasons += 1;
    if (season.pool === "current" || !item.imageUrl) item.imageUrl = season.imageUrl;
    totals.set(season.name, item);
  }
  return [...totals.values()].filter((item) => item.seasons >= 4).map((item) => ({
    key: `${item.name}-career-${metric}`,
    name: item.name,
    imageUrl: item.imageUrl,
    detail: "CAREER",
    value: item.value,
    displayValue: formatWhole(item.value),
  }));
}

const challenges: Challenge[] = [
  { id: "peak-pts", label: "MÁS PUNTOS EN UNA TEMPORADA", labelEn: "HIGHEST SEASON POINTS", hint: "Ordena por puntos por partido de su mejor temporada.", hintEn: "Rank by points per game in their best season.", build: () => bestPerPlayer("pts", 20) },
  { id: "peak-ast", label: "MÁS ASISTENCIAS", labelEn: "MOST ASSISTS", hint: "Ordena por asistencias por partido de su mejor temporada.", hintEn: "Rank by assists per game in their best season.", build: () => bestPerPlayer("ast", 5) },
  { id: "peak-reb", label: "MÁS REBOTES", labelEn: "MOST REBOUNDS", hint: "Ordena por rebotes por partido de su mejor temporada.", hintEn: "Rank by rebounds per game in their best season.", build: () => bestPerPlayer("reb", 7) },
  { id: "peak-blk", label: "MÁS TAPONES", labelEn: "MOST BLOCKS", hint: "Ordena por tapones por partido de su mejor temporada.", hintEn: "Rank by blocks per game in their best season.", build: () => bestPerPlayer("blk", 1.2) },
  { id: "career-pts", label: "MÁS PUNTOS DE CARRERA", labelEn: "MOST CAREER POINTS", hint: "Ordena por puntos totales acumulados en la base.", hintEn: "Rank by total points in the database.", build: () => careerTotals("pts") },
  { id: "career-ast", label: "MÁS ASISTENCIAS DE CARRERA", labelEn: "MOST CAREER ASSISTS", hint: "Ordena por asistencias totales acumuladas en la base.", hintEn: "Rank by total assists in the database.", build: () => careerTotals("ast") },
];

function timeLeft() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const ms = end.getTime() - now.getTime();
  return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms % 3600000 / 60000)).padStart(2, "0")}:${String(Math.floor(ms % 60000 / 1000)).padStart(2, "0")}`;
}

function dailyChallenge() {
  return challenges[hash(`${dayKey()}-six-order`) % challenges.length];
}

export default function SixOrderGame() {
  const { lang, t } = useLanguage();
  const challenge = useMemo(() => dailyChallenge(), []);
  const correct = useMemo(() => shuffleDaily(challenge.build().sort((a, b) => b.value - a.value).slice(0, 42), `six-order-${challenge.id}`).slice(0, 6).sort((a, b) => b.value - a.value), [challenge]);
  const bank = useMemo(() => shuffleDaily(correct, `six-bank-${challenge.id}`), [correct, challenge.id]);
  const [countdown, setCountdown] = useState("--:--:--");
  const [slots, setSlots] = useState<(Candidate | null)[]>(Array(6).fill(null));
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => { const update = () => setCountdown(timeLeft()); update(); const timer = setInterval(update, 1000); return () => clearInterval(timer); }, []);

  const used = new Set(slots.filter(Boolean).map((item) => item!.key));
  const score = checked ? slots.reduce((sum, item, index) => sum + (item?.key === correct[index].key ? 1 : 0), 0) : 0;
  const complete = slots.every(Boolean);

  function place(index: number) {
    if (checked || !selected) return;
    const player = bank.find((item) => item.key === selected);
    if (!player) return;
    const next = slots.map((slot) => slot?.key === selected ? null : slot);
    next[index] = player;
    setSlots(next);
    setSelected(null);
  }

  function clearSlot(index: number) {
    if (checked) return;
    const next = [...slots];
    next[index] = null;
    setSlots(next);
  }

  function reset() {
    setSlots(Array(6).fill(null));
    setSelected(null);
    setChecked(false);
  }

  return (
    <main className="mini-shell">
      <nav className="site-nav daily-game-nav"><Link href="/" className="back-link">← {t("games")}</Link><SiteBrand link={false} /><span className="live-reset">{t("reset")} {countdown}</span></nav>
      <section className="mini-game six-order-game">
        <header className="six-pyramid-head">
          <span>PYRAMID</span>
          <b>{lang === "es" ? challenge.label : challenge.labelEn}</b>
          <p>{lang === "es" ? challenge.hint : challenge.hintEn}</p>
        </header>
        <div className="six-order-layout">
          <div className="six-hex">
            {slots.map((player, index) => {
              const isRight = checked && player?.key === correct[index].key;
              const isWrong = checked && player && player.key !== correct[index].key;
              return (
                <button className={`six-slot six-slot-${index + 1} ${player ? "filled" : ""} ${isRight ? "right" : ""} ${isWrong ? "wrong" : ""}`} key={index} onClick={() => player ? clearSlot(index) : place(index)}>
                  <strong>{index + 1}</strong>
                  {player ? <><b>{player.name}</b><span>{checked ? player.displayValue : player.detail}</span></> : <b>{selected ? (lang === "es" ? "COLOCAR" : "PLACE") : "—"}</b>}
                </button>
              );
            })}
          </div>
          <div className="six-bank">
            {bank.map((player) => (
              <button className={`${selected === player.key ? "selected" : ""} ${used.has(player.key) ? "used" : ""}`} disabled={checked || used.has(player.key)} key={player.key} onClick={() => setSelected(player.key)}>
                {player.imageUrl && <img src={player.imageUrl} alt="" />}
                <b>{player.name}</b>
                <span>{player.detail}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="six-actions">
          {!checked && <button disabled={!complete} onClick={() => setChecked(true)}>{lang === "es" ? "COMPROBAR" : "CHECK"}</button>}
          {!checked && <button className="secondary" onClick={reset}>{lang === "es" ? "LIMPIAR" : "CLEAR"}</button>}
          {checked && <button onClick={reset}>{lang === "es" ? "REINTENTAR" : "TRY AGAIN"}</button>}
        </div>
        {checked && <div className="mini-answer compact"><div><span>{lang === "es" ? "RESULTADO" : "RESULT"}</span><h2>{score}/6</h2><p>{correct.map((player, index) => `${index + 1}. ${player.name} · ${player.displayValue}`).join(" / ")}</p></div></div>}
      </section>
    </main>
  );
}
