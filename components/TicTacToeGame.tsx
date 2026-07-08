"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Mode = "solo" | "versus";
type Mark = "blue" | "red";
type Team = { name: string; city: string; id: string };

const teams: Team[] = [
  { name: "Hawks", city: "Atlanta", id: "1610612737" },
  { name: "Celtics", city: "Boston", id: "1610612738" },
  { name: "Nets", city: "Brooklyn", id: "1610612751" },
  { name: "Hornets", city: "Charlotte", id: "1610612766" },
  { name: "Bulls", city: "Chicago", id: "1610612741" },
  { name: "Cavaliers", city: "Cleveland", id: "1610612739" },
  { name: "Mavericks", city: "Dallas", id: "1610612742" },
  { name: "Nuggets", city: "Denver", id: "1610612743" },
  { name: "Pistons", city: "Detroit", id: "1610612765" },
  { name: "Warriors", city: "Golden State", id: "1610612744" },
  { name: "Rockets", city: "Houston", id: "1610612745" },
  { name: "Pacers", city: "Indiana", id: "1610612754" },
  { name: "Clippers", city: "LA", id: "1610612746" },
  { name: "Lakers", city: "Los Angeles", id: "1610612747" },
  { name: "Grizzlies", city: "Memphis", id: "1610612763" },
  { name: "Heat", city: "Miami", id: "1610612748" },
  { name: "Bucks", city: "Milwaukee", id: "1610612749" },
  { name: "Timberwolves", city: "Minnesota", id: "1610612750" },
  { name: "Pelicans", city: "New Orleans", id: "1610612740" },
  { name: "Knicks", city: "New York", id: "1610612752" },
  { name: "Thunder", city: "Oklahoma City", id: "1610612760" },
  { name: "Magic", city: "Orlando", id: "1610612753" },
  { name: "76ers", city: "Philadelphia", id: "1610612755" },
  { name: "Suns", city: "Phoenix", id: "1610612756" },
  { name: "Trail Blazers", city: "Portland", id: "1610612757" },
  { name: "Kings", city: "Sacramento", id: "1610612758" },
  { name: "Spurs", city: "San Antonio", id: "1610612759" },
  { name: "Raptors", city: "Toronto", id: "1610612761" },
  { name: "Jazz", city: "Utah", id: "1610612762" },
  { name: "Wizards", city: "Washington", id: "1610612764" },
];

const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function dayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function hash(value: string) {
  let result = 2166136261;
  for (const char of value) {
    result ^= char.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function logo(team: Team) {
  return `https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg`;
}

function dailyTeams() {
  return [...teams]
    .map((team) => ({ team, score: hash(`${dayKey()}-${team.id}-tic`) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 9)
    .map(({ team }) => team);
}

function winner(board: (Mark | null)[]) {
  const line = lines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
  return line ? { mark: board[line[0]]!, line } : null;
}

export default function TicTacToeGame() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [soloBoard, setSoloBoard] = useState<(Team | null)[]>(Array(9).fill(null));
  const [versusBoard, setVersusBoard] = useState<(Mark | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Mark>("blue");
  const dayTeams = useMemo(() => dailyTeams(), []);
  const result = winner(versusBoard);
  const filledSolo = soloBoard.filter(Boolean).length;
  const fullVersus = versusBoard.every(Boolean);

  function playSolo(index: number) {
    if (soloBoard[index] || filledSolo >= 9) return;
    const next = [...soloBoard];
    next[index] = dayTeams[filledSolo];
    setSoloBoard(next);
  }

  function playVersus(index: number) {
    if (versusBoard[index] || result) return;
    const next = [...versusBoard];
    next[index] = turn;
    setVersusBoard(next);
    setTurn(turn === "blue" ? "red" : "blue");
  }

  function resetBoard() {
    setSoloBoard(Array(9).fill(null));
    setVersusBoard(Array(9).fill(null));
    setTurn("blue");
  }

  if (!mode) {
    return (
      <main className="tic-shell mode-shell">
        <nav className="site-nav">
          <Link className="wordmark" href="/"><span className="mark">CI</span><b>COURT INSIDE</b></Link>
          <Link href="/" className="back-link">← GAMES</Link>
        </nav>
        <section className="mode-intro tic-mode-intro">
          <div className="mode-copy">
            <h1>3 EN RAYA</h1>
            <p>Un tablero rápido: rellena con escudos NBA en individual o juega el tres en raya clásico con turnos rojo y azul.</p>
          </div>
        </section>
        <section className="mode-select mode-select-two">
          <button className="mode-card tic-mode-solo" onClick={() => setMode("solo")}><h2>INDIVIDUAL</h2></button>
          <button className="mode-card tic-mode-versus" onClick={() => setMode("versus")}><h2>COMPETITIVO</h2></button>
        </section>
      </main>
    );
  }

  return (
    <main className="tic-shell">
      <nav className="site-nav draft-top-nav">
        <button type="button" className="back-button" onClick={() => { setMode(null); resetBoard(); }}>← MODES</button>
        <div className="wordmark"><span className="mark">CI</span><b>COURT INSIDE</b></div>
        <button type="button" className="tic-reset" onClick={resetBoard}>RESET</button>
      </nav>
      <section className="tic-game">
        <header className="tic-head">
          <span>{mode === "solo" ? "ESCUDOS NBA" : "ROJO VS AZUL"}</span>
          <h1>3 EN RAYA</h1>
          <p>{mode === "solo" ? `${filledSolo}/9 CASILLAS` : result ? `${result.mark === "blue" ? "AZUL" : "ROJO"} GANA` : fullVersus ? "EMPATE" : `TURNO ${turn === "blue" ? "AZUL" : "ROJO"}`}</p>
        </header>
        <div className={`tic-board ${mode}`}>
          {Array.from({ length: 9 }).map((_, index) => {
            const soloTeam = soloBoard[index];
            const mark = versusBoard[index];
            const won = result?.line.includes(index) ?? false;
            return (
              <button
                type="button"
                key={index}
                className={`${soloTeam || mark ? "filled" : ""} ${mark ?? ""} ${won ? "won" : ""}`}
                onClick={() => mode === "solo" ? playSolo(index) : playVersus(index)}
                disabled={mode === "solo" ? Boolean(soloTeam) || filledSolo >= 9 : Boolean(mark) || Boolean(result)}
                aria-label={`Casilla ${index + 1}`}
              >
                {mode === "solo" && soloTeam ? <><img src={logo(soloTeam)} alt="" /><small>{soloTeam.city}</small></> : null}
                {mode === "versus" && mark ? <i /> : null}
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
