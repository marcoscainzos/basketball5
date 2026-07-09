"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import careers from "@/data/nba-grid-careers.json";

type Mode = "solo" | "versus";
type Mark = "blue" | "red";
type Team = { code: string; name: string; city: string; id: string; aliases: string[] };
type Career = { name: string; teams: string[]; peak: number; imageUrl?: string };
type PlayerCareer = { name: string; teams: Set<string>; peak: number; imageUrl?: string };
type Cell = { name: string; mark?: Mark; surrendered?: boolean };
type PendingPick = { player: PlayerCareer; cells: number[] };

const teams: Team[] = [
  { code: "ATL", name: "Hawks", city: "Atlanta", id: "1610612737", aliases: ["ATL", "HAW"] },
  { code: "BOS", name: "Celtics", city: "Boston", id: "1610612738", aliases: ["BOS", "CEL"] },
  { code: "BRK", name: "Nets", city: "Brooklyn", id: "1610612751", aliases: ["BRK", "NJN", "NET", "NYN"] },
  { code: "CHA", name: "Hornets", city: "Charlotte", id: "1610612766", aliases: ["CHA", "CHO", "CHH", "HOR"] },
  { code: "CHI", name: "Bulls", city: "Chicago", id: "1610612741", aliases: ["CHI", "BUL"] },
  { code: "CLE", name: "Cavaliers", city: "Cleveland", id: "1610612739", aliases: ["CLE", "CAV"] },
  { code: "DAL", name: "Mavericks", city: "Dallas", id: "1610612742", aliases: ["DAL", "MAV"] },
  { code: "DEN", name: "Nuggets", city: "Denver", id: "1610612743", aliases: ["DEN", "NUG"] },
  { code: "DET", name: "Pistons", city: "Detroit", id: "1610612765", aliases: ["DET", "PIS"] },
  { code: "GSW", name: "Warriors", city: "Golden State", id: "1610612744", aliases: ["GSW", "SFW", "WAR"] },
  { code: "HOU", name: "Rockets", city: "Houston", id: "1610612745", aliases: ["HOU", "ROC"] },
  { code: "IND", name: "Pacers", city: "Indiana", id: "1610612754", aliases: ["IND", "PAC"] },
  { code: "LAC", name: "Clippers", city: "LA", id: "1610612746", aliases: ["LAC", "SDC", "CLI"] },
  { code: "LAL", name: "Lakers", city: "Los Angeles", id: "1610612747", aliases: ["LAL", "LAK", "MNL"] },
  { code: "MEM", name: "Grizzlies", city: "Memphis", id: "1610612763", aliases: ["MEM", "VAN", "GRI"] },
  { code: "MIA", name: "Heat", city: "Miami", id: "1610612748", aliases: ["MIA", "HEA"] },
  { code: "MIL", name: "Bucks", city: "Milwaukee", id: "1610612749", aliases: ["MIL", "BUC"] },
  { code: "MIN", name: "Timberwolves", city: "Minnesota", id: "1610612750", aliases: ["MIN", "TIM"] },
  { code: "NOP", name: "Pelicans", city: "New Orleans", id: "1610612740", aliases: ["NOP", "NOH", "NOK", "NOJ", "PEL"] },
  { code: "NYK", name: "Knicks", city: "New York", id: "1610612752", aliases: ["NYK", "KNI"] },
  { code: "OKC", name: "Thunder", city: "Oklahoma City", id: "1610612760", aliases: ["OKC", "SEA", "THU"] },
  { code: "ORL", name: "Magic", city: "Orlando", id: "1610612753", aliases: ["ORL", "MAG"] },
  { code: "PHI", name: "76ers", city: "Philadelphia", id: "1610612755", aliases: ["PHI", "76E", "SYR"] },
  { code: "PHO", name: "Suns", city: "Phoenix", id: "1610612756", aliases: ["PHO", "SUN"] },
  { code: "POR", name: "Trail Blazers", city: "Portland", id: "1610612757", aliases: ["POR", "TRA"] },
  { code: "SAC", name: "Kings", city: "Sacramento", id: "1610612758", aliases: ["SAC", "KCK", "CIN", "ROC", "KIN"] },
  { code: "SAS", name: "Spurs", city: "San Antonio", id: "1610612759", aliases: ["SAS", "SPU"] },
  { code: "TOR", name: "Raptors", city: "Toronto", id: "1610612761", aliases: ["TOR", "RAP"] },
  { code: "UTA", name: "Jazz", city: "Utah", id: "1610612762", aliases: ["UTA", "JAZ", "NOJ"] },
  { code: "WAS", name: "Wizards", city: "Washington", id: "1610612764", aliases: ["WAS", "WSB", "WIZ", "BAL", "CAP"] },
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

function clean(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function timeLeft() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const ms = end.getTime() - now.getTime();
  return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms % 3600000 / 60000)).padStart(2, "0")}:${String(Math.floor(ms % 60000 / 1000)).padStart(2, "0")}`;
}

function playerTeams() {
  return (careers as Career[]).map((player) => ({ ...player, teams: new Set(player.teams) }));
}

function answersForPair(players: ReturnType<typeof playerTeams>, a: Team, b: Team) {
  return players.filter((player) => player.teams.has(a.code) && player.teams.has(b.code));
}

function dailyGrid(players: ReturnType<typeof playerTeams>) {
  const sorted = [...teams].sort((a, b) => hash(`${dayKey()}-${a.code}-grid`) - hash(`${dayKey()}-${b.code}-grid`));
  for (let start = 0; start < sorted.length; start++) {
    const rows = sorted.slice(start, start + 3);
    const columns = sorted.filter((team) => !rows.includes(team)).slice(0, 3);
    if (rows.length === 3 && columns.every((column) => rows.every((row) => answersForPair(players, row, column).length > 0))) return { rows, columns };
  }
  return { rows: [teams[13], teams[19], teams[23]], columns: [teams[4], teams[9], teams[15]] };
}

function winner(board: (Cell | null)[]) {
  const line = lines.find(([a, b, c]) => board[a]?.mark && board[a]?.mark === board[b]?.mark && board[a]?.mark === board[c]?.mark);
  return line ? { mark: board[line[0]]!.mark!, line } : null;
}

export default function TicTacToeGame() {
  const [mode, setMode] = useState<Mode | null>(null);
  const players = useMemo(() => playerTeams(), []);
  const grid = useMemo(() => dailyGrid(players), [players]);
  const [board, setBoard] = useState<(Cell | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Mark>("blue");
  const [selectedCell, setSelectedCell] = useState(0);
  const [pending, setPending] = useState<PendingPick | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [surrendered, setSurrendered] = useState(false);
  const [countdown, setCountdown] = useState("--:--:--");
  const result = mode === "versus" ? winner(board) : null;
  const fullVersus = mode === "versus" && board.every(Boolean);
  const currentRow = grid.rows[Math.floor(selectedCell / 3)];
  const currentColumn = grid.columns[selectedCell % 3];
  const suggestions = useMemo(() => {
    const value = clean(query);
    if (!value) return [];
    const used = new Set(board.map((cell) => cell?.name).filter(Boolean));
    return players.filter((player) => clean(player.name).includes(value) && !used.has(player.name)).slice(0, 9);
  }, [players, query, board]);
  useEffect(() => {
    const update = () => setCountdown(timeLeft());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  function cellsFor(player: PlayerCareer) {
    return grid.rows.flatMap((row, rowIndex) => grid.columns.map((column, columnIndex) => ({ row, column, index: rowIndex * 3 + columnIndex })))
      .filter(({ row, column, index }) => !board[index] && player.teams.has(row.code) && player.teams.has(column.code))
      .map(({ index }) => index);
  }

  function findPlayer(name: string) {
    const value = clean(name);
    return players.find((player) => clean(player.name) === value)
      ?? players.find((player) => clean(player.name).startsWith(value))
      ?? players.find((player) => clean(player.name).includes(value));
  }

  function placePlayer(player: PlayerCareer, index: number, revealed = false) {
    const next = [...board];
    next[index] = { name: player.name, mark: mode === "versus" && !revealed ? turn : undefined, surrendered: revealed };
    setBoard(next);
    setSelectedCell(index);
    setPending(null);
    setQuery("");
    setMessage("");
    if (mode === "versus" && !revealed) setTurn(turn === "blue" ? "red" : "blue");
  }

  function submitPlayer(name: string) {
    if (surrendered || result) return;
    const player = findPlayer(name);
    if (!player) {
      setMessage("No lo tengo en la base todavía.");
      return;
    }
    const cells = cellsFor(player);
    if (cells.length === 0) {
      setMessage(`${player.name} no encaja en ninguna casilla libre.`);
      setPending(null);
      return;
    }
    if (cells.length === 1) {
      placePlayer(player, cells[0]);
      return;
    }
    setPending({ player, cells });
    setMessage(`Elige una casilla para ${player.name}.`);
  }

  function surrenderSolo() {
    setBoard(grid.rows.flatMap((row) => grid.columns.map((column) => {
      const answer = answersForPair(players, row, column)[0];
      return answer ? { name: answer.name, surrendered: true } : null;
    })));
    setSurrendered(true);
    setPending(null);
    setQuery("");
    setMessage("");
  }

  function resetBoard() {
    setBoard(Array(9).fill(null));
    setTurn("blue");
    setSelectedCell(0);
    setPending(null);
    setQuery("");
    setMessage("");
    setSurrendered(false);
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
            <p>Te damos equipos NBA y tú tienes que encontrar jugadores que hayan pasado por los dos equipos de cada casilla.</p>
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
        <span className="live-reset">RESET {countdown}</span>
      </nav>
      <section className="tic-game">
        <div className="tic-grid">
          <div className="tic-corner" />
          {grid.columns.map((team) => <div className="tic-team-head" key={team.code}><img src={logo(team)} alt="" /><span>{team.name}</span></div>)}
          {grid.rows.map((row, rowIndex) => <div className="tic-grid-row" key={row.code}>
            <div className="tic-team-head row-head"><img src={logo(row)} alt="" /><span>{row.name}</span></div>
            {grid.columns.map((column, columnIndex) => {
              const index = rowIndex * 3 + columnIndex;
              const cell = board[index];
              const candidate = pending?.cells.includes(index) ?? false;
              const won = result?.line.includes(index) ?? false;
              return <button type="button" key={`${row.code}-${column.code}`} className={`${selectedCell === index ? "selected" : ""} ${cell ? "filled" : ""} ${cell?.mark ?? ""} ${cell?.surrendered ? "surrendered" : ""} ${candidate ? "candidate" : ""} ${won ? "won" : ""}`} onClick={() => { if (pending && candidate) placePlayer(pending.player, index); else { setSelectedCell(index); setMessage(""); } }}><span>{cell?.name ?? ""}</span></button>;
            })}
          </div>)}
        </div>
        <div className="tic-search"><label>{result ? `${result.mark === "blue" ? "AZUL" : "ROJO"} GANA` : fullVersus ? "EMPATE" : pending ? "ELIGE UNA CASILLA MARCADA" : mode === "versus" ? `TURNO ${turn === "blue" ? "AZUL" : "ROJO"}` : `${currentRow.name} + ${currentColumn.name}`}</label><div><input value={query} disabled={surrendered || Boolean(result)} onChange={(event) => { setQuery(event.target.value); setPending(null); }} placeholder="Escribe un jugador…" onKeyDown={(event) => { if (event.key === "Enter") submitPlayer(query || suggestions[0]?.name || ""); }} /><button disabled={(!query.trim() && !suggestions[0]) || surrendered || Boolean(result)} onClick={() => submitPlayer(query || suggestions[0]?.name || "")}>PROBAR</button><button type="button" className="tic-flag" aria-label="Rendirse" title="Rendirse" onClick={surrenderSolo}>⚑</button></div>{message && <p>{message}</p>}{suggestions.length > 0 && !surrendered && !result && <aside>{suggestions.map((player) => <button type="button" key={player.name} onClick={() => submitPlayer(player.name)}><span>{player.name}</span></button>)}</aside>}</div>
      </section>
    </main>
  );
}
