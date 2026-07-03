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
const essentialPlayers = new Set([
  "Bill Russell", "Wilt Chamberlain", "Oscar Robertson", "Jerry West", "Kareem Abdul-Jabbar", "Bob Cousy", "Elgin Baylor", "Bob Pettit", "Jerry Lucas", "Walt Frazier", "John Havlicek", "Elvin Hayes", "Bob Lanier", "Pete Maravich", "Julius Erving", "Dave Bing", "Nate Archibald", "Rick Barry", "Dave Cowens", "Bob McAdoo", "George McGinnis", "Spencer Haywood", "Artis Gilmore", "Dan Issel", "Moses Malone", "Maurice Cheeks", "Jack Sikma", "Marques Johnson", "Norm Nixon", "Adrian Dantley", "Alex English", "Bernard King", "World B. Free", "Magic Johnson", "Larry Bird", "Isiah Thomas", "Charles Barkley", "Karl Malone", "John Stockton", "Hakeem Olajuwon", "David Robinson", "Patrick Ewing", "Clyde Drexler", "Dennis Rodman", "Scottie Pippen", "Michael Jordan", "Mitch Richmond", "Penny Hardaway", "Grant Hill", "Alonzo Mourning", "Dikembe Mutombo", "Chris Webber", "Shawn Kemp", "Latrell Sprewell", "Vince Carter", "Reggie Miller", "Kevin Johnson", "Mark Price", "John Starks", "Horace Grant", "Toni Kukoc", "Detlef Schrempf", "Glen Rice", "Muggsy Bogues", "Spud Webb", "Shaquille O'Neal", "Kobe Bryant", "Tim Duncan", "Allen Iverson", "Dirk Nowitzki", "Steve Nash", "Kevin Garnett", "Paul Pierce", "Ray Allen", "Tracy McGrady", "Dwyane Wade", "LeBron James", "Carmelo Anthony", "Chris Paul", "Manu Ginobili", "Tony Parker", "Pau Gasol", "Yao Ming", "Peja Stojakovic", "Andrei Kirilenko", "Chauncey Billups", "Ben Wallace", "Elton Brand", "Baron Davis", "Gilbert Arenas", "Caron Butler", "Lamar Odom", "Mike Bibby", "Hedo Turkoglu", "Deron Williams", "Joe Johnson", "Antawn Jamison", "Amar'e Stoudemire", "Kyrie Irving", "Blake Griffin", "Derrick Rose", "Kevin Love", "Marc Gasol", "Joakim Noah", "Luol Deng", "Paul George", "Victor Oladipo", "DeMarcus Cousins", "Kemba Walker", "Andre Drummond", "Kevin Durant", "Russell Westbrook", "James Harden", "Stephen Curry", "Klay Thompson", "Kawhi Leonard", "Damian Lillard", "Anthony Davis", "Joel Embiid", "Giannis Antetokounmpo", "Nikola Jokic", "Luka Doncic", "Jimmy Butler", "Bradley Beal", "Zach LaVine", "Devin Booker", "Trae Young", "Jayson Tatum", "Jaylen Brown", "Bam Adebayo", "Karl-Anthony Towns", "Donovan Mitchell", "Khris Middleton", "Jrue Holiday", "DeMar DeRozan", "Eric Bledsoe", "Rudy Gobert", "Nicolas Batum", "Shai Gilgeous-Alexander", "Victor Wembanyama", "Anthony Edwards", "Ja Morant", "Tyrese Haliburton", "Evan Mobley", "Paolo Banchero", "Cade Cunningham", "Franz Wagner", "Scottie Barnes", "Jalen Brunson", "Vlade Divac", "Drazen Petrovic", "Sarunas Marciulionis", "Arvydas Sabonis", "Leandro Barbosa", "Luis Scola", "Jose Calderon", "Jamaal Magloire", "James Worthy"
]);
function normalizedName(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘]/g, "'").toLowerCase(); }
const essentialNames = new Set([...essentialPlayers].map(normalizedName));
function isEssential(name: string) { return essentialNames.has(normalizedName(name)); }
const legendHeadshots: Record<string, string> = {
  "Michael Jordan": "893", "Pau Gasol": "2200", "Manu Ginóbili": "1938", "Dwyane Wade": "2548",
  "Allen Iverson": "947", "Magic Johnson": "77142", "Larry Bird": "1449", "Kobe Bryant": "977",
  "Kevin Garnett": "708", "Dirk Nowitzki": "1717", "Steve Nash": "959", "Jason Kidd": "467",
  "Charles Barkley": "787", "Hakeem Olajuwon": "165", "David Robinson": "764", "Scottie Pippen": "937",
  "John Stockton": "304", "Karl Malone": "252", "Shaquille O'Neal": "406", "Tim Duncan": "1495",
  "LeBron James": "2544", "Kevin Durant": "201142", "Stephen Curry": "201939", "Chris Paul": "101108",
  "Carmelo Anthony": "2546", "James Harden": "201935", "Russell Westbrook": "201566", "Kawhi Leonard": "202695"
};

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
    if (year < 1950 || numeric(row, "g") < 20 || row.lg !== "NBA") continue;
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

  // Los rankings por temporada dan variedad, pero podían dejar fuera leyendas
  // muy completas que no entraban en un Top 20 concreto. Conservamos sus tres
  // mejores versiones para Draft y 1vs1.
  const impact = (card: Omit<Card, "id">) => card.pts + card.reb * 1.2 + card.ast * 1.5 + card.stl * 3 + card.blk * 3;
  for (const name of essentialPlayers) {
    for (const card of allCards.filter((item) => normalizedName(item.name) === normalizedName(name)).sort((a, b) => impact(b) - impact(a)).slice(0, 3)) {
      selected.set(`${card.season}|${card.name}`, card);
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
  const currentImages = new Map([...selected.values()].filter((card) => card.pool === "current" && card.imageUrl).map((card) => [normalizedName(card.name), card.imageUrl!]));
  const visualSelection = [...selected.values()].filter((card) => card.pool === "current" || Boolean(credits[card.name]?.imageUrl) || isEssential(card.name));
  const output = visualSelection.sort((a, b) => a.season.localeCompare(b.season) || a.name.localeCompare(b.name)).map((card, index) => {
    const imageUrl = card.imageUrl ?? currentImages.get(normalizedName(card.name)) ?? credits[card.name]?.imageUrl ?? (legendHeadshots[card.name] ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${legendHeadshots[card.name]}.png` : undefined);
    return { ...card, id: index + 1, ...(imageUrl ? { imageUrl } : {}) };
  });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Generadas ${output.length} cartas de ${new Set(output.map((card) => card.name)).size} jugadores (${bySeason.size} temporadas).`);
}

main();
