"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import currentSeason from "@/data/current-season-2025-26.json";
import lastSeason from "@/data/historical-2024-25.json";
import seasons from "@/data/player-seasons.json";

type Mode = "solo" | "versus";
type Mark = "blue" | "red";
type Team = { code: string; name: string; city: string; id: string; aliases: string[] };
type Season = { name: string; team: string; pts: number; reb: number; ast: number; imageUrl?: string };
type CareerExtra = { name: string; teams: string[]; imageUrl?: string; peak?: number };

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

const extraCareers: CareerExtra[] = [
  { name: "Lonzo Ball", teams: ["LAL", "NOP", "CHI", "CLE"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628366.png", peak: 29 },
  { name: "Jrue Holiday", teams: ["PHI", "NOP", "MIL", "BOS"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201950.png", peak: 35 },
  { name: "Anthony Davis", teams: ["NOP", "LAL", "DAL"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203076.png", peak: 45 },
  { name: "LeBron James", teams: ["CLE", "MIA", "LAL"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png", peak: 55 },
  { name: "Russell Westbrook", teams: ["OKC", "HOU", "WAS", "LAL", "LAC", "DEN", "SAC"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201566.png", peak: 50 },
  { name: "Chris Paul", teams: ["NOP", "LAC", "HOU", "OKC", "PHO", "GSW", "SAS"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/101108.png", peak: 43 },
  { name: "James Harden", teams: ["OKC", "HOU", "BRK", "PHI", "LAC"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201935.png", peak: 54 },
  { name: "Kevin Durant", teams: ["OKC", "GSW", "BRK", "PHO", "HOU"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png", peak: 50 },
  { name: "Kyrie Irving", teams: ["CLE", "BOS", "BRK", "DAL"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202681.png", peak: 39 },
  { name: "Jimmy Butler", teams: ["CHI", "MIN", "PHI", "MIA", "GSW"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202710.png", peak: 39 },
  { name: "DeMar DeRozan", teams: ["TOR", "SAS", "CHI", "SAC"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201942.png", peak: 39 },
  { name: "Zach LaVine", teams: ["MIN", "CHI", "SAC"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203897.png", peak: 35 },
  { name: "Brandon Ingram", teams: ["LAL", "NOP", "TOR"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627742.png", peak: 35 },
  { name: "Alex Caruso", teams: ["LAL", "CHI", "OKC"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627936.png", peak: 18 },
  { name: "Kyle Lowry", teams: ["MEM", "HOU", "TOR", "MIA", "PHI"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/200768.png", peak: 34 },
  { name: "Kemba Walker", teams: ["CHA", "BOS", "NYK", "DAL"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202689.png", peak: 35 },
  { name: "Blake Griffin", teams: ["LAC", "DET", "BRK", "BOS"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201933.png", peak: 43 },
  { name: "Carmelo Anthony", teams: ["DEN", "NYK", "OKC", "HOU", "POR", "LAL"], imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/2546.png", peak: 42 },
  { name: "Shaquille O'Neal", teams: ["ORL", "LAL", "MIA", "PHO", "CLE", "BOS"], peak: 52 },
  { name: "Pau Gasol", teams: ["MEM", "LAL", "CHI", "SAS", "MIL"], peak: 38 },
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

function playerTeams() {
  const byPlayer = new Map<string, { name: string; teams: Set<string>; peak: number; imageUrl?: string }>();
  const aliasToCode = new Map(teams.flatMap((team) => team.aliases.map((alias) => [alias, team.code] as const)));
  const allRows = [...(seasons as Season[]), ...(lastSeason as Season[]), ...(currentSeason as Season[])];
  for (const row of allRows) {
    const code = aliasToCode.get(row.team);
    if (!code) continue;
    const item = byPlayer.get(row.name) ?? { name: row.name, teams: new Set<string>(), peak: 0, imageUrl: row.imageUrl };
    item.teams.add(code);
    item.peak = Math.max(item.peak, row.pts + row.reb + row.ast);
    item.imageUrl ||= row.imageUrl;
    byPlayer.set(row.name, item);
  }
  for (const extra of extraCareers) {
    const item = byPlayer.get(extra.name) ?? { name: extra.name, teams: new Set<string>(), peak: 0, imageUrl: extra.imageUrl };
    extra.teams.forEach((team) => item.teams.add(team));
    item.peak = Math.max(item.peak, extra.peak ?? 20);
    item.imageUrl ||= extra.imageUrl;
    byPlayer.set(extra.name, item);
  }
  return [...byPlayer.values()].sort((a, b) => b.peak - a.peak);
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

function winner(board: (Mark | null)[]) {
  const line = lines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
  return line ? { mark: board[line[0]]!, line } : null;
}

export default function TicTacToeGame() {
  const [mode, setMode] = useState<Mode | null>(null);
  const players = useMemo(() => playerTeams(), []);
  const grid = useMemo(() => dailyGrid(players), [players]);
  const [soloBoard, setSoloBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [versusBoard, setVersusBoard] = useState<(Mark | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Mark>("blue");
  const [selectedCell, setSelectedCell] = useState(0);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [surrendered, setSurrendered] = useState(false);
  const result = winner(versusBoard);
  const fullVersus = versusBoard.every(Boolean);
  const currentRow = grid.rows[Math.floor(selectedCell / 3)];
  const currentColumn = grid.columns[selectedCell % 3];
  const currentAnswers = useMemo(() => answersForPair(players, currentRow, currentColumn), [players, currentRow, currentColumn]);
  const suggestions = useMemo(() => {
    const value = clean(query);
    if (!value) return [];
    return players.filter((player) => clean(player.name).includes(value) && !soloBoard.includes(player.name)).slice(0, 9);
  }, [players, query, soloBoard]);

  function chooseSolo(name: string) {
    if (soloBoard[selectedCell] || surrendered) return;
    const isCorrect = currentAnswers.some((player) => clean(player.name) === clean(name));
    if (!isCorrect) {
      setMessage(`${name} no jugó en ${currentRow.name} y ${currentColumn.name}.`);
      return;
    }
    const next = [...soloBoard];
    next[selectedCell] = name;
    setSoloBoard(next);
    setSelectedCell(Math.min(8, next.findIndex((item) => !item) === -1 ? selectedCell : next.findIndex((item) => !item)));
    setQuery("");
    setMessage("");
  }

  function playVersus(index: number) {
    if (versusBoard[index] || result) return;
    const next = [...versusBoard];
    next[index] = turn;
    setVersusBoard(next);
    setTurn(turn === "blue" ? "red" : "blue");
  }

  function surrenderSolo() {
    const solved = grid.rows.flatMap((row) => grid.columns.map((column) => answersForPair(players, row, column)[0]?.name ?? ""));
    setSoloBoard(solved);
    setSurrendered(true);
    setQuery("");
    setMessage("");
  }

  function resetBoard() {
    setSoloBoard(Array(9).fill(null));
    setVersusBoard(Array(9).fill(null));
    setTurn("blue");
    setSelectedCell(0);
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
        <button type="button" className="tic-reset" onClick={resetBoard}>RESET</button>
      </nav>
      <section className="tic-game">
        {mode === "versus" && <header className="tic-head">
          <span>ROJO VS AZUL</span>
          <h1>3 EN RAYA</h1>
          <p>{result ? `${result.mark === "blue" ? "AZUL" : "ROJO"} GANA` : fullVersus ? "EMPATE" : `TURNO ${turn === "blue" ? "AZUL" : "ROJO"}`}</p>
        </header>}
        {mode === "solo" ? <><div className="tic-grid">
          <div className="tic-corner" />
          {grid.columns.map((team) => <div className="tic-team-head" key={team.code}><img src={logo(team)} alt="" /><span>{team.name}</span></div>)}
          {grid.rows.map((row, rowIndex) => <div className="tic-grid-row" key={row.code}>
            <div className="tic-team-head row-head"><img src={logo(row)} alt="" /><span>{row.name}</span></div>
            {grid.columns.map((column, columnIndex) => {
              const index = rowIndex * 3 + columnIndex;
              const name = soloBoard[index];
              return <button type="button" key={`${row.code}-${column.code}`} className={`${selectedCell === index ? "selected" : ""} ${name ? "filled" : ""} ${surrendered ? "surrendered" : ""}`} onClick={() => { setSelectedCell(index); setMessage(""); }}><span>{name ?? ""}</span></button>;
            })}
          </div>)}
        </div><div className="tic-search"><label>{currentRow.name} + {currentColumn.name}</label><div><input value={query} disabled={surrendered} onChange={(event) => setQuery(event.target.value)} placeholder="Escribe un jugador…" onKeyDown={(event) => { if (event.key === "Enter" && suggestions[0]) chooseSolo(suggestions[0].name); }} /><button disabled={!suggestions[0] || Boolean(soloBoard[selectedCell]) || surrendered} onClick={() => suggestions[0] && chooseSolo(suggestions[0].name)}>PROBAR</button><button type="button" className="tic-flag" aria-label="Rendirse" title="Rendirse" onClick={surrenderSolo}>⚑</button></div>{message && <p>{message}</p>}{suggestions.length > 0 && !surrendered && <aside>{suggestions.map((player) => <button type="button" key={player.name} onClick={() => chooseSolo(player.name)}><span>{player.name}</span><small>{[...player.teams].join(" · ")}</small></button>)}</aside>}</div></> : <div className={`tic-board ${mode}`}>
          {Array.from({ length: 9 }).map((_, index) => {
            const mark = versusBoard[index];
            const won = result?.line.includes(index) ?? false;
            return (
              <button
                type="button"
                key={index}
                className={`${mark ? "filled" : ""} ${mark ?? ""} ${won ? "won" : ""}`}
                onClick={() => playVersus(index)}
                disabled={Boolean(mark) || Boolean(result)}
                aria-label={`Casilla ${index + 1}`}
              >
                {mode === "versus" && mark ? <i /> : null}
              </button>
            );
          })}
        </div>}
      </section>
    </main>
  );
}
