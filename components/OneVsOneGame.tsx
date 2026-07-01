"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PlayerCard from "@/components/PlayerCard";
import { createDailyGame, DailyGame, DIFFICULTIES, Difficulty, GAME_MODES, GameMode, getDateKey, getPlayer, nextChallenger, nextPair, STAT_META } from "@/lib/game";

type ChallengeKey = "historical" | "current_easy" | "current_medium" | "current_hard";
type ModeSave = { dateKey: string; attemptsUsed: number; best: number; game: DailyGame | null };
type SaveMap = Record<ChallengeKey, ModeSave>;
const keys: ChallengeKey[] = ["historical", "current_easy", "current_medium", "current_hard"];
const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const emptyMode = (): ModeSave => ({ dateKey: getDateKey(), attemptsUsed: 0, best: 0, game: null });
const storageKey = (key: ChallengeKey) => `court-inside-${key}-v7`;
function readSaves(): SaveMap { return Object.fromEntries(keys.map((key) => { try { const value = JSON.parse(localStorage.getItem(storageKey(key)) ?? "null") as ModeSave | null; if (value?.dateKey === getDateKey()) { if (value.game && value.game.survivorWins === undefined) value.game.survivorWins = 0; if (value.game && value.game.revealedIds === undefined) value.game.revealedIds = []; return [key, value]; } } catch {} return [key, emptyMode()]; })) as SaveMap; }
function timeLeft() { const now = new Date(); const end = new Date(now); end.setHours(24, 0, 0, 0); const ms = end.getTime() - now.getTime(); return `${String(Math.floor(ms / 3600000)).padStart(2,"0")}:${String(Math.floor(ms % 3600000 / 60000)).padStart(2,"0")}:${String(Math.floor(ms % 60000 / 1000)).padStart(2,"0")}`; }
function details(key: ChallengeKey) { if (key === "historical") return { mode: "historical" as GameMode, difficulty: undefined }; return { mode: "current" as GameMode, difficulty: key.replace("current_", "") as Difficulty }; }

export default function OneVsOneGame() {
  const [saved, setSaved] = useState<SaveMap | null>(null);
  const [active, setActive] = useState<ChallengeKey | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [refreshingPair, setRefreshingPair] = useState(false);
  const [countdown, setCountdown] = useState("--:--:--");
  useEffect(() => { const timer = setTimeout(() => setSaved(readSaves()), 0); return () => clearTimeout(timer); }, []);
  useEffect(() => { const update = () => setCountdown(timeLeft()); update(); const timer = setInterval(update, 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (saved) keys.forEach((key) => localStorage.setItem(storageKey(key), JSON.stringify(saved[key]))); }, [saved]);

  const modeSave = active && saved ? saved[active] : null; const game = modeSave?.game ?? null;
  const current = useMemo(() => game ? getPlayer(game.currentId) : null, [game]); const challenger = useMemo(() => game ? getPlayer(game.challengerId) : null, [game]);
  function openChallenge(key: ChallengeKey) { if (!saved || saved[key].attemptsUsed >= 2) return; const existing = saved[key]; const config = details(key); if (!existing.game || existing.game.status !== "playing") { const fresh = createDailyGame(getDateKey(), config.mode, existing.attemptsUsed, config.difficulty); fresh.best = existing.best; setSaved({ ...saved, [key]: { ...existing, game: fresh } }); } setActive(key); setSelectedId(null); setFeedback(""); }
  function finish(updated: DailyGame) { if (!active || !saved) return; const previous = saved[active]; setSaved({ ...saved, [active]: { ...previous, attemptsUsed: Math.min(2, previous.attemptsUsed + 1), best: Math.max(previous.best, updated.score), game: updated } }); }
  function choose(playerId: number) { if (!game || !current || !challenger || !active || !saved || game.status !== "playing" || selectedId !== null) return; const winner = current[game.stat] > challenger[game.stat] ? current : challenger; const correct = playerId === winner.id; setSelectedId(playerId); setFeedback(correct ? `${winner.name} · ${winner.season} · ${winner[game.stat].toFixed(1)}` : `No. Era ${winner.name} (${winner.season}) con ${winner[game.stat].toFixed(1)}.`); setTimeout(() => { if (!correct) { finish({ ...game, best: Math.max(game.best, game.score), status: "lost" }); return; }
    const survivorWins = winner.id === game.currentId ? game.survivorWins + 1 : 1;
    const refreshBoth = survivorWins >= 3;
    const pair = refreshBoth ? nextPair(game) : null;
    const next = refreshBoth ? null : nextChallenger(game, winner);
    if ((refreshBoth && !pair) || (!refreshBoth && !next)) { finish({ ...game, score: game.score + 1, best: Math.max(game.best, game.score + 1), status: "exhausted" }); return; }
    const newIds = pair ? [pair.current.id, pair.challenger.id] : [next!.id];
    const updated: DailyGame = { ...game, currentId: pair?.current.id ?? winner.id, challengerId: pair?.challenger.id ?? next!.id, usedIds: [...game.usedIds, ...newIds], revealedIds: refreshBoth ? [] : [winner.id], score: game.score + 1, best: Math.max(game.best, game.score + 1), survivorWins: refreshBoth ? 0 : survivorWins };
    if (refreshBoth) setRefreshingPair(true);
    setSaved({ ...saved, [active]: { ...saved[active], best: updated.best, game: updated } }); setSelectedId(null); setFeedback("");
    if (refreshBoth) setTimeout(() => setRefreshingPair(false), 700);
  }, 900); }

  if (!saved) return <main className="game-loading">OPENING THE GYM…</main>;
  if (!active || !modeSave || !game || !current || !challenger) return <main className="mode-shell">
    <nav className="site-nav"><Link className="wordmark" href="/"><span className="mark">CI</span><b>COURT INSIDE</b></Link><Link href="/" className="back-link">← GAMES</Link></nav>
    {!showCurrent && <section className="mode-intro"><div className="mode-copy"><span>GAME 01</span><h1>1VS1</h1><p>1vs1 enfrenta a dos jugadores en una estadística desconocida. Tú decides quién gana entre historia NBA y temporada actual.</p></div><div className="reset-inline"><small>RESET</small><b>{countdown}</b></div></section>}
    {!showCurrent ? <section className="mode-select mode-select-two">
      <button className={`mode-card mode-historical ${saved.historical.attemptsUsed >= 2 ? "locked" : ""}`} disabled={saved.historical.attemptsUsed >= 2} onClick={() => openChallenge("historical")}><h2>HISTÓRICO</h2></button>
      <button className="mode-card mode-current" onClick={() => setShowCurrent(true)}><h2>ACTUAL</h2></button>
    </section> : <div className="level-screen"><section className="level-frame"><div className="mode-select">{difficulties.map((difficulty) => { const key = `current_${difficulty}` as ChallengeKey; const item = saved[key]; const locked = item.attemptsUsed >= 2; return <button type="button" key={key} disabled={locked} className={`mode-card mode-${difficulty} ${locked ? "locked" : ""}`} onClick={() => openChallenge(key)}><span className="attempts-pill">{locked ? "BLOQUEADO" : `${2-item.attemptsUsed} ${2-item.attemptsUsed === 1 ? "INTENTO" : "INTENTOS"}`}</span><h2>{DIFFICULTIES[difficulty].label.toUpperCase()}</h2><i aria-hidden="true">→</i></button>; })}</div></section></div>}
  </main>;

  const winnerId = current[game.stat] > challenger[game.stat] ? current.id : challenger.id; const finished = game.status !== "playing"; const label = active === "historical" ? GAME_MODES.historical.label : `${GAME_MODES.current.label} · ${DIFFICULTIES[game.difficulty!].label}`;
  return <main className="game-shell"><nav className="site-nav"><button type="button" className="back-button" onClick={() => setActive(null)}>← MODES</button><div className="wordmark"><span className="mark">CI</span><b>COURT INSIDE</b></div><div className="live-reset">RESET {countdown}</div></nav><header className="match-head"><div><span>{label.toUpperCase()} · TRY {modeSave.attemptsUsed+1}/2</span><h1>WHO HAS MORE <b>{STAT_META[game.stat].short}?</b></h1></div><div className="match-score"><span>STREAK</span><b>{game.score}</b><i/><span>BEST</span><b>{Math.max(game.best,modeSave.best)}</b></div></header><section className="duel-area"><div className={`duel-cards ${refreshingPair ? "refresh-pair" : ""}`}><PlayerCard player={current} hiddenStat={game.stat} onClick={() => choose(current.id)} disabled={finished||selectedId!==null} revealed={game.revealedIds.includes(current.id)||selectedId!==null||finished} result={selectedId!==null?(current.id===winnerId?"winner":"loser"):undefined}/><div className="vs-chip">VS</div><PlayerCard player={challenger} hiddenStat={game.stat} onClick={() => choose(challenger.id)} disabled={finished||selectedId!==null} revealed={game.revealedIds.includes(challenger.id)||selectedId!==null||finished} result={selectedId!==null?(challenger.id===winnerId?"winner":"loser"):undefined}/></div><p className="game-feedback">{feedback}</p>{finished&&<div className="finished"><b>RUN OVER</b><h2>{game.score} IN A ROW</h2><button onClick={() => setActive(null)}>{modeSave.attemptsUsed>=2?"MODES →":"USE NEXT TRY →"}</button></div>}</section></main>;
}
