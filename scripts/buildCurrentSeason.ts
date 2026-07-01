import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

type Aggregate = {
  personId: string; name: string; team: string; position: string; latestDate: string; games: Set<string>;
  pts: number; reb: number; ast: number; stl: number; blk: number;
};

const sourceArg = process.argv.find((argument) => argument.startsWith("--source="));
const source = sourceArg?.slice("--source=".length) ?? path.join(process.cwd(), "data/raw/PlayerStatistics.csv");
const getArg = (name: string, fallback: string) => process.argv.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const season = getArg("season", "2025-26");
const from = getArg("from", "2025-10-01");
const to = getArg("to", "2026-04-30");
const output = path.join(process.cwd(), getArg("output", "data/current-season-2025-26.json"));

function parseLine(line: string) {
  const values: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') { if (quoted && line[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted; }
    else if (char === "," && !quoted) { values.push(value); value = ""; }
    else value += char;
  }
  values.push(value); return values;
}
function number(value: string) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function position(value: string) { if (value === "G") return "PG"; if (value === "F") return "SF"; if (value === "C") return "C"; return "SF"; }
function accent(team: string) { const colors = ["#17408b", "#c9082a", "#552583", "#006bb6", "#007a33", "#e56020", "#0e2240"]; let hash = 0; for (const char of team) hash = (hash * 31 + char.charCodeAt(0)) >>> 0; return colors[hash % colors.length]; }

async function main() {
  if (!fs.existsSync(source)) throw new Error(`No existe ${source}`);
  const input = readline.createInterface({ input: fs.createReadStream(source), crlfDelay: Infinity });
  let headers: string[] = []; const players = new Map<string, Aggregate>();
  for await (const line of input) {
    if (!headers.length) { headers = parseLine(line); continue; }
    const values = parseLine(line); if (values.length !== headers.length) continue;
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    const date = row.gameDate?.slice(0, 10) ?? "";
    if (row.gameType !== "Regular Season" || date < from || date > to || !row.personId) continue;
    const id = row.personId; const existing = players.get(id) ?? { personId: id, name: `${row.firstName} ${row.lastName}`.trim(), team: "", position: "SF", latestDate: "", games: new Set<string>(), pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 };
    if (existing.games.has(row.gameId)) continue;
    existing.games.add(row.gameId); existing.pts += number(row.points); existing.reb += number(row.reboundsTotal); existing.ast += number(row.assists); existing.stl += number(row.steals); existing.blk += number(row.blocks);
    if (date >= existing.latestDate) { existing.latestDate = date; existing.team = row.playerteamName?.slice(0, 3).toUpperCase() || "NBA"; existing.position = position(row.startingPosition); }
    players.set(id, existing);
  }
  const cards = [...players.values()].map((player) => { const games = player.games.size; return { name: player.name, season, team: player.team, position: player.position, number: 0, accent: accent(player.team), games, imageUrl: `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.personId}.png`, pts: Number((player.pts / games).toFixed(1)), reb: Number((player.reb / games).toFixed(1)), ast: Number((player.ast / games).toFixed(1)), stl: Number((player.stl / games).toFixed(1)), blk: Number((player.blk / games).toFixed(1)), pool: season === "2025-26" ? "current" : "historical" }; }).sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(output, `${JSON.stringify(cards, null, 2)}\n`);
  console.log(`${season}: ${cards.length} jugadores con al menos un partido.`);
}

main();
