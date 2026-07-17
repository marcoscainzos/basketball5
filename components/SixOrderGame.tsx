"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlayerSeason, players } from "@/data/players";
import { dayKey, hash, shuffleDaily } from "@/lib/daily";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";
import { useLeagueGameFrame } from "@/components/LeagueGameFrame";
import { recordLeagueResult } from "@/lib/leagueScoring";

type Candidate = {
  key: string;
  name: string;
  imageUrl?: string;
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
const allStarSelections: Record<string, number> = {
  "LeBron James": 22, "Kareem Abdul-Jabbar": 19, "Kobe Bryant": 18, "Tim Duncan": 15,
  "Kevin Garnett": 15, "Shaquille O'Neal": 15, "Michael Jordan": 14, "Karl Malone": 14,
  "Dirk Nowitzki": 14, "Jerry West": 14, "Bob Cousy": 13, "John Havlicek": 13,
  "Dwyane Wade": 13, "Kevin Durant": 16, "Magic Johnson": 12, "Larry Bird": 12,
  "Hakeem Olajuwon": 12, "Oscar Robertson": 12, "Bill Russell": 12, "Stephen Curry": 12,
  "Elvin Hayes": 12, "Moses Malone": 12, "Chris Paul": 12, "Charles Barkley": 11,
  "Julius Erving": 11, "Isiah Thomas": 11, "Allen Iverson": 11, "Elgin Baylor": 11,
  "Carmelo Anthony": 10, "Paul Pierce": 10, "David Robinson": 10, "Jason Kidd": 10,
  "Ray Allen": 10, "Dominique Wilkins": 9, "Gary Payton": 9, "Russell Westbrook": 9,
  "James Harden": 10, "Anthony Davis": 10, "Patrick Ewing": 11, "Kawhi Leonard": 7,
  "Nikola Jokic": 8, "Giannis Antetokounmpo": 10, "Luka Doncic": 6, "Joel Embiid": 7,
  "Damian Lillard": 8, "Kyrie Irving": 8, "Paul George": 9, "Vince Carter": 8,
  "Yao Ming": 8, "Tracy McGrady": 7, "Grant Hill": 7, "Scottie Pippen": 7,
  "Reggie Miller": 5, "Manu Ginobili": 2, "Tony Parker": 6, "Pau Gasol": 6,
  "Marc Gasol": 3, "Klay Thompson": 5, "Draymond Green": 4, "Devin Booker": 5,
  "Jayson Tatum": 7, "Jaylen Brown": 4, "Donovan Mitchell": 7, "Anthony Edwards": 4,
  "Shai Gilgeous-Alexander": 4, "Victor Wembanyama": 2, "Karl-Anthony Towns": 6,
  "Jimmy Butler": 6, "DeMar DeRozan": 6, "Blake Griffin": 6, "Chris Bosh": 11,
};

function imageFor(name: string) {
  return players.find((season) => season.name === name && season.imageUrl && season.pool === "current")?.imageUrl
    ?? players.find((season) => season.name === name && season.imageUrl)?.imageUrl;
}

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
    imageUrl: season.imageUrl,
    value: season[metric],
    displayValue: formatOne(season[metric]),
  }));
}

function careerTotals(metric: "pts" | "reb" | "ast" | "stl" | "blk" | "games") {
  const totals = new Map<string, { name: string; imageUrl?: string; value: number; seasons: number }>();
  for (const season of players) {
    if (!season.imageUrl || season.games < 20) continue;
    const item = totals.get(season.name) ?? { name: season.name, imageUrl: season.imageUrl, value: 0, seasons: 0 };
    item.value += metric === "games" ? season.games : season[metric] * season.games;
    item.seasons += 1;
    if (season.pool === "current") item.imageUrl = season.imageUrl;
    totals.set(season.name, item);
  }
  return [...totals.values()].filter((item) => item.seasons >= 4).map((item) => ({
    key: `${item.name}-career-${metric}`,
    name: item.name,
    imageUrl: item.imageUrl,
    value: item.value,
    displayValue: formatWhole(item.value),
  }));
}

function teamTotals(team: string, metric: "pts" | "reb" | "ast") {
  const totals = new Map<string, { name: string; imageUrl?: string; value: number; seasons: number }>();
  for (const season of players) {
    if (!season.imageUrl || season.team !== team || season.games < 20) continue;
    const item = totals.get(season.name) ?? { name: season.name, imageUrl: season.imageUrl, value: 0, seasons: 0 };
    item.value += season[metric] * season.games;
    item.seasons += 1;
    if (season.pool === "current") item.imageUrl = season.imageUrl;
    totals.set(season.name, item);
  }
  return [...totals.values()].map((item) => ({
    key: `${item.name}-${team}-${metric}`,
    name: item.name,
    imageUrl: item.imageUrl,
    value: item.value,
    displayValue: formatWhole(item.value),
  }));
}

function seasonCounts(test: (season: PlayerSeason) => boolean, id: string) {
  const totals = new Map<string, { imageUrl?: string; value: number }>();
  for (const season of players) {
    if (!season.imageUrl || season.games < 50 || !test(season)) continue;
    const item = totals.get(season.name) ?? { imageUrl: season.imageUrl, value: 0 };
    item.value += 1;
    if (season.pool === "current") item.imageUrl = season.imageUrl;
    totals.set(season.name, item);
  }
  return [...totals.entries()].map(([name, item]) => ({
    key: `${name}-${id}`,
    name,
    imageUrl: item.imageUrl,
    value: item.value,
    displayValue: formatWhole(item.value),
  }));
}

function allStarCandidates() {
  return Object.entries(allStarSelections).map(([name, value]) => ({
    key: `${name}-all-star`,
    name,
    imageUrl: imageFor(name),
    value,
    displayValue: formatWhole(value),
  })).filter((player) => player.imageUrl);
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
    { id: "peak-stl", label: "ROBOS EN UNA TEMPORADA", labelEn: "STEALS IN A SEASON", hint: "Ordena por robos por partido en su mejor temporada.", hintEn: "Rank by steals per game in their best season.", build: () => bestPerPlayer("stl", 1.2) },
    { id: "peak-blk", label: "TAPONES EN UNA TEMPORADA", labelEn: "BLOCKS IN A SEASON", hint: "Ordena por tapones por partido en su mejor temporada.", hintEn: "Rank by blocks per game in their best season.", build: () => bestPerPlayer("blk", 1.2) },
    { id: "career-pts", label: "PUNTOS DE CARRERA", labelEn: "CAREER POINTS", hint: "Ordena por puntos totales acumulados en la base.", hintEn: "Rank by total points in the database.", build: () => careerTotals("pts") },
    { id: "career-ast", label: "ASISTENCIAS DE CARRERA", labelEn: "CAREER ASSISTS", hint: "Ordena por asistencias totales acumuladas en la base.", hintEn: "Rank by total assists in the database.", build: () => careerTotals("ast") },
    { id: "career-reb", label: "REBOTES DE CARRERA", labelEn: "CAREER REBOUNDS", hint: "Ordena por rebotes totales acumulados en la base.", hintEn: "Rank by total rebounds in the database.", build: () => careerTotals("reb") },
    { id: "career-stl", label: "ROBOS DE CARRERA", labelEn: "CAREER STEALS", hint: "Ordena por robos totales acumulados en la base.", hintEn: "Rank by total steals in the database.", build: () => careerTotals("stl") },
    { id: "career-blk", label: "TAPONES DE CARRERA", labelEn: "CAREER BLOCKS", hint: "Ordena por tapones totales acumulados en la base.", hintEn: "Rank by total blocks in the database.", build: () => careerTotals("blk") },
    { id: "career-games", label: "PARTIDOS JUGADOS", labelEn: "GAMES PLAYED", hint: "Ordena por partidos acumulados en la base.", hintEn: "Rank by total games in the database.", build: () => careerTotals("games") },
    { id: "all-star", label: "APARICIONES ALL-STAR", labelEn: "ALL-STAR SELECTIONS", hint: "Ordena por selecciones al All-Star.", hintEn: "Rank by NBA All-Star selections.", build: allStarCandidates },
    { id: "twenty-point-years", label: "TEMPORADAS DE 20+ PUNTOS", labelEn: "20+ POINT SEASONS", hint: "Ordena por número de temporadas promediando 20 o más puntos.", hintEn: "Rank by seasons averaging 20+ points.", build: () => seasonCounts((season) => season.pts >= 20, "20ppg") },
    { id: "elite-scoring-years", label: "TEMPORADAS DE 25+ PUNTOS", labelEn: "25+ POINT SEASONS", hint: "Ordena por número de temporadas promediando 25 o más puntos.", hintEn: "Rank by seasons averaging 25+ points.", build: () => seasonCounts((season) => season.pts >= 25, "25ppg") },
    { id: "playmaking-years", label: "TEMPORADAS DE 7+ ASISTENCIAS", labelEn: "7+ ASSIST SEASONS", hint: "Ordena por número de temporadas promediando 7 o más asistencias.", hintEn: "Rank by seasons averaging 7+ assists.", build: () => seasonCounts((season) => season.ast >= 7, "7apg") },
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
  const leagueFrame = useLeagueGameFrame("PYRAMID");
  const leagueContext = leagueFrame.context;
  const leagueResult = leagueFrame.result;
  const setLeagueResult = leagueFrame.setResult;
  const challenge = useMemo(() => dailyChallenge(), []);
  const correct = useMemo(() => shuffleDaily(challenge.build().sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, 60), `six-order-${challenge.id}`).slice(0, 6).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)), [challenge]);
  const queue = useMemo(() => shuffleDaily(correct, `six-queue-${challenge.id}`), [correct, challenge.id]);
  const [countdown, setCountdown] = useState("--:--:--");
  const [slots, setSlots] = useState<(Candidate | null)[]>(Array(6).fill(null));
  const [movingIndex, setMovingIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => { const update = () => setCountdown(timeLeft()); update(); const timer = setInterval(update, 1000); return () => clearInterval(timer); }, []);

  const score = checked ? slots.reduce((sum, item, index) => sum + (item?.key === correct[index].key ? 1 : 0), 0) : 0;
  const complete = slots.every(Boolean);
  const placed = slots.filter(Boolean).length;
  const current = queue[placed];

  useEffect(() => {
    if (!leagueContext || leagueResult || !checked) return;
    recordLeagueResult(leagueContext, {
      rawScore: score,
      maxRawScore: 6,
      outcome: "completed",
    }).then(setLeagueResult);
  }, [checked, leagueContext, leagueResult, score, setLeagueResult]);

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
    setSlots(Array(6).fill(null));
    setMovingIndex(null);
    setDragIndex(null);
    setChecked(false);
  }

  if (leagueFrame.completedPanel) {
    return (
      <main className="mini-shell">
        {leagueFrame.completedPanel}
      </main>
    );
  }

  return (
    <main className="mini-shell">
      <nav className="site-nav daily-game-nav"><Link href="/" className="back-link">← {t("games")}</Link><SiteBrand link={false} /><span className="live-reset">{t("reset")} {countdown}</span></nav>
      {leagueFrame.banner}
      <section className="mini-game six-order-game">
        <header className="mini-head six-title-head">
          <span>PYRAMID</span>
          <h1>{lang === "es" ? "Ordena la pirámide" : "Build the pyramid"}</h1>
          <p>{lang === "es" ? "Te damos un jugador cada vez. Colócalo donde quieras y reajusta la pirámide arrastrando las cartas." : "You get one player at a time. Place him anywhere and rearrange the pyramid by dragging cards."}</p>
        </header>
        <div className="six-stat-pill"><b>{lang === "es" ? challenge.label : challenge.labelEn}</b></div>
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
                {player ? <>{player.imageUrl && <img src={player.imageUrl} alt="" />}<b>{player.name}</b>{checked && <span>{player.displayValue}</span>}</> : <b />}
              </button>
            );
          })}
        </div>
        {!complete && <div className="six-next-player"><span>{lang === "es" ? "Siguiente jugador:" : "Next player:"}</span><b>{current?.name}</b></div>}
        <div className="six-actions">
          {!checked && <button disabled={!complete} onClick={() => setChecked(true)}>{lang === "es" ? "COMPROBAR" : "CHECK"}</button>}
          {checked && !leagueFrame.context && <button onClick={reset}>{lang === "es" ? "REINTENTAR" : "TRY AGAIN"}</button>}
        </div>
        {checked && <div className="mini-answer compact"><div><span>{lang === "es" ? "RESULTADO" : "RESULT"}</span><h2>{score}/6</h2><p>{correct.map((player, index) => `${index + 1}. ${player.name} · ${player.displayValue}`).join(" / ")}</p></div></div>}
      </section>
    </main>
  );
}
