import fs from "node:fs";
import path from "node:path";

type RawRow = Record<string, string>;
type StatKey = "pts" | "reb" | "ast" | "stl" | "blk";

type Card = {
  id: number;
  name: string;
  season: string;
  team: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  number: number;
  accent: string;
  imageUrl?: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  games: number;
  pool: "historical" | "current";
};

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "data/raw/nba-player-per-game-1947-2024.csv");
const OUTPUT = path.join(ROOT, "data/player-seasons.json");
const CREDITS = path.join(ROOT, "data/image-credits.json");
const stats: StatKey[] = ["pts", "reb", "ast", "stl", "blk"];

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(value); value = ""; if (row.some(Boolean)) rows.push(row); row = [];
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const headers = rows.shift() ?? [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))) as RawRow[];
}

function cleanName(name: string) { return name.replace(/\*/g, "").trim(); }
function seasonLabel(endYear: number) { return `${endYear - 1}-${String(endYear).slice(-2)}`; }
function numeric(row: RawRow, key: string) { const value = Number(row[key]); return Number.isFinite(value) ? value : 0; }
function position(value: string): Card["position"] {
  const first = value.split("-")[0];
  if (["PG", "SG", "SF", "PF", "C"].includes(first)) return first as Card["position"];
  if (first === "G") return "PG"; if (first === "F") return "SF"; return "C";
}
function accent(team: string) {
  const palette = ["#17408b", "#c9082a", "#552583", "#006bb6", "#007a33", "#e56020", "#0e2240"];
  let hash = 0; for (const char of team) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function main() {
  if (!fs.existsSync(SOURCE)) throw new Error(`No existe ${SOURCE}`);
  const rows = parseCsv(fs.readFileSync(SOURCE, "utf8"));
  const grouped = new Map<string, RawRow[]>();
  for (const row of rows) {
    const year = numeric(row, "season");
    if (year < 1975 || numeric(row, "g") < 20 || row.lg !== "NBA") continue;
    const key = `${year}|${cleanName(row.player)}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  const allCards: Omit<Card, "id">[] = [];
  for (const entries of grouped.values()) {
    const total = entries.find((row) => row.tm === "TOT") ?? entries.sort((a, b) => numeric(b, "g") - numeric(a, "g"))[0];
    const games = numeric(total, "g");
    const perGame = (key: string) => Number(numeric(total, key).toFixed(1));
    allCards.push({
      name: cleanName(total.player), season: seasonLabel(numeric(total, "season")), team: total.tm,
      position: position(total.pos), number: 0, accent: accent(total.tm), games,
      pts: perGame("pts_per_game"), reb: perGame("trb_per_game"), ast: perGame("ast_per_game"), stl: perGame("stl_per_game"), blk: perGame("blk_per_game"), pool: "historical",
    });
  }

  const extraHistoricalPath = path.join(ROOT, "data/historical-2024-25.json");
  if (fs.existsSync(extraHistoricalPath)) {
    const extra = JSON.parse(fs.readFileSync(extraHistoricalPath, "utf8")) as Omit<Card, "id">[];
    allCards.push(...extra.filter((card) => card.games >= 20).map((card) => ({ ...card, pool: "historical" as const })));
  }

  const selected = new Map<string, Omit<Card, "id">>();
  const bySeason = new Map<string, Omit<Card, "id">[]>();
  for (const card of allCards) bySeason.set(card.season, [...(bySeason.get(card.season) ?? []), card]);
  for (const cards of bySeason.values()) {
    for (const stat of stats) {
      // Robos y tapones no fueron estadísticas oficiales antes de 1973-74.
      const eligible = cards.filter((card) => stat === "stl" || stat === "blk" ? card[stat] > 0 : true);
      for (const card of [...eligible].sort((a, b) => b[stat] - a[stat]).slice(0, 20)) selected.set(`${card.season}|${card.name}`, card);
    }
  }

  const currentPath = path.join(ROOT, "data/current-season-2025-26.json");
  if (fs.existsSync(currentPath)) {
    const current = JSON.parse(fs.readFileSync(currentPath, "utf8")) as Omit<Card, "id">[];
    const rating = (card: Omit<Card, "id">) => card.pts + card.reb * 1.2 + card.ast * 1.5 + card.stl * 3 + card.blk * 3;
    for (const card of [...current].filter((card) => card.games >= 5).sort((a, b) => rating(b) - rating(a)).slice(0, 300)) {
      selected.set(`current|${card.name}`, { ...card, pool: "current" });
    }
  }

  const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, "utf8")) as Record<string, { imageUrl?: string }> : {};
  const output = [...selected.values()].sort((a, b) => a.season.localeCompare(b.season) || a.name.localeCompare(b.name)).map((card, index) => ({ ...card, id: index + 1, ...(credits[card.name]?.imageUrl ? { imageUrl: credits[card.name].imageUrl } : {}) }));
  fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Generadas ${output.length} cartas de ${new Set(output.map((card) => card.name)).size} jugadores (${bySeason.size} temporadas).`);
}

main();
