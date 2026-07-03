"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DraftMode, DraftOption, RESTRICTIONS, canAdd, dailyRestriction, estimateWins, optionsFor } from "@/lib/draft";

function clean(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
const COURT_POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
function timeLeft() { const now = new Date(); const end = new Date(now); end.setHours(24, 0, 0, 0); const ms = end.getTime() - now.getTime(); return `${String(Math.floor(ms / 3600000)).padStart(2,"0")}:${String(Math.floor(ms % 3600000 / 60000)).padStart(2,"0")}:${String(Math.floor(ms % 60000 / 1000)).padStart(2,"0")}`; }

export default function DraftGame() {
  const [mode, setMode] = useState<DraftMode | null>(null);
  const [savedMode, setSavedMode] = useState<DraftMode | null>(null);
  const [lineup, setLineup] = useState<DraftOption[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState("--:--:--");
  const rule = useMemo(() => dailyRestriction(), []);
  const options = useMemo(() => mode ? optionsFor(mode) : [], [mode]);
  const suggestions = useMemo(() => {
    const value = clean(query);
    if (!value) return [];
    return options.filter((player) => player.search.includes(value) && !lineup.some((item) => item.name === player.name))
      .sort((a, b) => (a.search.startsWith(value) ? -1 : 0) - (b.search.startsWith(value) ? -1 : 0) || b.pts - a.pts).slice(0, 60);
  }, [query, options, lineup]);
  const wins = estimateWins(lineup);
  const storageKey = `court-inside-draft-${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as { mode: DraftMode; lineup: DraftOption[] } | null;
      if (saved?.mode) { setSavedMode(saved.mode); setLineup(saved.lineup ?? []); }
    } catch {}
    setReady(true);
  }, [storageKey]);
  useEffect(() => { const update = () => setCountdown(timeLeft()); update(); const timer = setInterval(update, 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (ready && mode) localStorage.setItem(storageKey, JSON.stringify({ mode, lineup }));
  }, [ready, mode, lineup, storageKey]);

  function choose(player: DraftOption) {
    const error = canAdd(player, lineup, rule);
    if (error) { setMessage(error); return; }
    setLineup([...lineup, player].sort((a, b) => COURT_POSITIONS.indexOf(a.position) - COURT_POSITIONS.indexOf(b.position))); setQuery(""); setMessage("");
  }
  function openMode(nextMode: DraftMode) {
    const chosenMode = savedMode && lineup.length > 0 ? savedMode : nextMode;
    setSavedMode(chosenMode); setMode(chosenMode);
  }

  if (!ready) return <main className="draft-shell"><div className="top5-loading">PREPARANDO EL DRAFT…</div></main>;
  if (!mode) return <main className="draft-shell"><nav className="site-nav"><Link className="wordmark" href="/"><span className="mark">CI</span><b>COURT INSIDE</b></Link><Link href="/" className="back-link">← GAMES</Link></nav><section className="mode-intro draft-mode-intro"><div className="mode-copy"><span>GAME 04</span><h1>BUILD YOUR FIVE</h1><p>Escoge cinco jugadores. Nosotros calculamos cuántos partidos ganaría tu equipo en una temporada de 82.</p></div><div className="reset-inline"><small>RESET</small><b>{countdown}</b></div></section><section className="draft-mode-screen">
    <div className="draft-mode-grid">
      <button type="button" onClick={() => openMode("career")}><div><b>CARRERA</b><small>EL JUGADOR EN GENERAL</small></div><i>FÁCIL</i></button>
      <button type="button" onClick={() => openMode("season")}><div><b>TEMPORADAS</b><small>VERSIONES CONCRETAS</small></div><i>DIFÍCIL</i></button>
    </div>
  </section></main>;

  return <main className="draft-shell"><nav className="site-nav draft-top-nav"><button type="button" className="back-button" onClick={() => setMode(null)}>← MODES</button><div className="wordmark"><span className="mark">CI</span><b>COURT INSIDE</b></div><span className="live-reset">RESET {countdown}</span></nav><section className="draft-game">
    <div className="draft-court">
      <div className="draft-lineup">
        <div className="three-point-arc" aria-hidden="true" />
        <div className="court-hoop" aria-hidden="true"><i /><span /></div>
        {COURT_POSITIONS.map((position, index) => { const player = lineup.find((item) => item.position === position); return <article className={`court-${position.toLowerCase()} ${player ? "filled" : ""}`} key={position}>
          <strong>{position}</strong>{player ? <><div className="draft-photo">{player.imageUrl ? <img src={player.imageUrl} alt="" /> : <span>{player.name.charAt(0)}</span>}</div><h2>{player.name}</h2><p>{mode === "season" ? `${player.season} · ${player.team}` : player.position}</p></> : <><div className="empty-player">+</div><h2>{position}</h2><p>{["BASE", "ESCOLTA", "ALERO", "ALA-PÍVOT", "PÍVOT"][index]}</p></>}
        </article>; })}
      </div>
      <div className={`draft-panel ${wins !== null ? "draft-completed" : ""}`}>
        {wins === null ? <div className="draft-control-row"><div className="draft-search-side"><label htmlFor="draft-search">AÑADE TU {lineup.length + 1}.º JUGADOR</label><div className="draft-search"><input id="draft-search" value={query} disabled={lineup.length === 5} onChange={(event) => { setQuery(event.target.value); setMessage(""); }} placeholder={mode === "season" ? "Jugador o temporada…" : "Escribe un jugador…"}/><span>{lineup.length}/5</span></div>
        {suggestions.length > 0 && <div className="draft-suggestions">{suggestions.map((player) => <button type="button" key={`${player.id}-${player.label}`} onClick={() => choose(player)}><div className="suggestion-photo">{player.imageUrl && <img src={player.imageUrl} alt="" />}</div><span><b>{player.name}</b><small>{mode === "season" ? `${player.season} · ${player.team}` : `${player.position} · ${player.team}`}</small></span><i>＋</i></button>)}</div>}<p className="draft-message">{message}</p></div><aside className="draft-rule-inline"><small>RESTRICCIÓN DE HOY</small><b>{RESTRICTIONS[rule].title}</b><p>{RESTRICTIONS[rule].description}</p></aside></div> : <div className="wins-result"><span>VICTORIAS ESTIMADAS</span><b>{wins}</b><i>/ 82</i><p>Récord estimado: {wins}-{82 - wins}. Tu intento de hoy queda cerrado.</p><strong>VUELVE MAÑANA</strong></div>}
      </div>
    </div>
  </section></main>;
}
