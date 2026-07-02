"use client";

import { useMemo, useState } from "react";
import { DraftMode, DraftOption, RESTRICTIONS, canAdd, dailyRestriction, estimateWins, optionsFor } from "@/lib/draft";

function clean(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }

export default function DraftGame() {
  const [mode, setMode] = useState<DraftMode | null>(null);
  const [lineup, setLineup] = useState<DraftOption[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const rule = useMemo(() => dailyRestriction(), []);
  const options = useMemo(() => mode ? optionsFor(mode) : [], [mode]);
  const suggestions = useMemo(() => {
    const value = clean(query);
    if (!value) return [];
    return options.filter((player) => player.search.includes(value) && !lineup.some((item) => item.name === player.name))
      .sort((a, b) => (a.search.startsWith(value) ? -1 : 0) - (b.search.startsWith(value) ? -1 : 0) || b.pts - a.pts).slice(0, 7);
  }, [query, options, lineup]);
  const wins = estimateWins(lineup);

  function choose(player: DraftOption) {
    const error = canAdd(player, lineup, rule);
    if (error) { setMessage(error); return; }
    setLineup([...lineup, player]); setQuery(""); setMessage("");
  }

  if (!mode) return <section className="draft-mode-screen">
    <div className="draft-kicker">NUEVO JUEGO</div><h1>BUILD YOUR FIVE</h1>
    <p>Escoge cinco jugadores. Nosotros calculamos cuántos partidos ganaría tu equipo en una temporada de 82.</p>
    <div className="draft-mode-grid">
      <button type="button" onClick={() => setMode("career")}><span>01</span><div><b>CARRERA</b><small>EL JUGADOR EN GENERAL</small></div><i>FÁCIL</i></button>
      <button type="button" onClick={() => setMode("season")}><span>02</span><div><b>TEMPORADAS</b><small>VERSIONES CONCRETAS</small></div><i>DIFÍCIL</i></button>
    </div>
  </section>;

  return <section className="draft-game">
    <header className="draft-head">
      <button type="button" onClick={() => { setMode(null); setLineup([]); setQuery(""); }}>← CAMBIAR MODO</button>
      <div><span>DRAFT DIARIO · {mode === "career" ? "CARRERA" : "TEMPORADAS"}</span><h1>BUILD YOUR FIVE</h1></div>
      <aside><small>RESTRICCIÓN DE HOY</small><b>{RESTRICTIONS[rule].title}</b><p>{RESTRICTIONS[rule].description}</p></aside>
    </header>
    <div className="draft-court">
      <div className="draft-lineup">
        {Array.from({ length: 5 }, (_, index) => { const player = lineup[index]; return <article className={player ? "filled" : ""} key={index}>
          <strong>0{index + 1}</strong>{player ? <><button aria-label={`Quitar a ${player.name}`} onClick={() => setLineup(lineup.filter((_, itemIndex) => itemIndex !== index))}>×</button><div className="draft-photo">{player.imageUrl ? <img src={player.imageUrl} alt="" /> : <span>{player.name.charAt(0)}</span>}</div><h2>{player.name}</h2><p>{mode === "season" ? `${player.season} · ${player.team}` : player.position}</p></> : <><div className="empty-player">+</div><h2>VACANTE</h2><p>ELIGE JUGADOR</p></>}
        </article>; })}
      </div>
      <div className="draft-panel">
        {wins === null ? <><label htmlFor="draft-search">AÑADE TU {lineup.length + 1}.º JUGADOR</label><div className="draft-search"><input id="draft-search" value={query} disabled={lineup.length === 5} onChange={(event) => { setQuery(event.target.value); setMessage(""); }} placeholder={mode === "season" ? "Jugador o temporada…" : "Escribe un jugador…"}/><span>{lineup.length}/5</span></div>
        {suggestions.length > 0 && <div className="draft-suggestions">{suggestions.map((player) => <button type="button" key={`${player.id}-${player.label}`} onClick={() => choose(player)}><div className="suggestion-photo">{player.imageUrl && <img src={player.imageUrl} alt="" />}</div><span><b>{player.name}</b><small>{mode === "season" ? `${player.season} · ${player.team}` : `${player.position} · ${player.team}`}</small></span><i>＋</i></button>)}</div>}<p className="draft-message">{message}</p></> : <div className="wins-result"><span>VICTORIAS ESTIMADAS</span><b>{wins}</b><i>/ 82</i><p>Tu quinteto terminaría aproximadamente con un récord de {wins}-{82 - wins}.</p><button type="button" onClick={() => { setLineup([]); setMessage(""); }}>NUEVO QUINTETO</button></div>}
      </div>
    </div>
  </section>;
}
