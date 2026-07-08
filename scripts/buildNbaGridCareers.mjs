import fs from "fs";
import path from "path";

const root = process.cwd();
const output = path.join(root, "data/nba-grid-careers.json");
const sources = [
  { file: "data/raw/nba-player-per-game-1947-2024.csv", player: "player", team: "tm", pts: "pts_per_game", reb: "trb_per_game", ast: "ast_per_game" },
  { file: "data/raw/nba-player-stats-1950-2022.csv", player: "Player", team: "Tm", pts: "PTS", reb: "TRB", ast: "AST" },
  { file: "data/player-seasons.json", json: true },
  { file: "data/historical-2024-25.json", json: true },
  { file: "data/current-season-2025-26.json", json: true },
];

const aliasGroups = {
  ATL: ["ATL", "HAW"],
  BOS: ["BOS", "CEL"],
  BRK: ["BRK", "NJN", "NET", "NYN"],
  CHA: ["CHA", "CHO", "CHH", "HOR"],
  CHI: ["CHI", "BUL"],
  CLE: ["CLE", "CAV"],
  DAL: ["DAL", "MAV"],
  DEN: ["DEN", "NUG"],
  DET: ["DET", "PIS"],
  GSW: ["GSW", "SFW", "WAR", "PHW"],
  HOU: ["HOU"],
  IND: ["IND", "PAC"],
  LAC: ["LAC", "SDC", "BUF", "CLI"],
  LAL: ["LAL", "LAK", "MNL"],
  MEM: ["MEM", "VAN", "GRI"],
  MIA: ["MIA", "HEA"],
  MIL: ["MIL", "BUC"],
  MIN: ["MIN", "TIM"],
  NOP: ["NOP", "NOH", "NOK", "NOJ", "PEL"],
  NYK: ["NYK", "KNI"],
  OKC: ["OKC", "SEA", "THU"],
  ORL: ["ORL", "MAG"],
  PHI: ["PHI", "76E", "SYR"],
  PHO: ["PHO", "SUN"],
  POR: ["POR", "TRA"],
  SAC: ["SAC", "KCK", "KCO", "CIN", "ROC", "KIN"],
  SAS: ["SAS", "SPU"],
  TOR: ["TOR", "RAP"],
  UTA: ["UTA", "JAZ"],
  WAS: ["WAS", "WSB", "WIZ", "BAL", "CAP"],
};

const aliasToCode = new Map(Object.entries(aliasGroups).flatMap(([code, aliases]) => aliases.map((alias) => [alias, code])));
const extras = [
  { name: "Lonzo Ball", teams: ["LAL", "NOP", "CHI", "CLE"], peak: 29 },
  { name: "Jrue Holiday", teams: ["PHI", "NOP", "MIL", "BOS"], peak: 35 },
  { name: "Anthony Davis", teams: ["NOP", "LAL", "DAL"], peak: 45 },
  { name: "LeBron James", teams: ["CLE", "MIA", "LAL"], peak: 55 },
  { name: "Russell Westbrook", teams: ["OKC", "HOU", "WAS", "LAL", "LAC", "DEN", "SAC"], peak: 50 },
  { name: "Chris Paul", teams: ["NOP", "LAC", "HOU", "OKC", "PHO", "GSW", "SAS"], peak: 43 },
  { name: "James Harden", teams: ["OKC", "HOU", "BRK", "PHI", "LAC"], peak: 54 },
  { name: "Kevin Durant", teams: ["OKC", "GSW", "BRK", "PHO", "HOU"], peak: 50 },
  { name: "Kyrie Irving", teams: ["CLE", "BOS", "BRK", "DAL"], peak: 39 },
  { name: "Jimmy Butler", teams: ["CHI", "MIN", "PHI", "MIA", "GSW"], peak: 39 },
  { name: "DeMar DeRozan", teams: ["TOR", "SAS", "CHI", "SAC"], peak: 39 },
  { name: "Zach LaVine", teams: ["MIN", "CHI", "SAC"], peak: 35 },
  { name: "Brandon Ingram", teams: ["LAL", "NOP", "TOR"], peak: 35 },
  { name: "Alex Caruso", teams: ["LAL", "CHI", "OKC"], peak: 18 },
  { name: "Kyle Lowry", teams: ["MEM", "HOU", "TOR", "MIA", "PHI"], peak: 34 },
  { name: "Kemba Walker", teams: ["CHA", "BOS", "NYK", "DAL"], peak: 35 },
  { name: "Blake Griffin", teams: ["LAC", "DET", "BRK", "BOS"], peak: 43 },
  { name: "Carmelo Anthony", teams: ["DEN", "NYK", "OKC", "HOU", "POR", "LAL"], peak: 42 },
  { name: "Shaquille O'Neal", teams: ["ORL", "LAL", "MIA", "PHO", "CLE", "BOS"], peak: 52 },
  { name: "Pau Gasol", teams: ["MEM", "LAL", "CHI", "SAS", "MIL"], peak: 38 },
];

function csv(line) {
  const out = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (quoted && line[i + 1] === "\"") { value += "\""; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      out.push(value);
      value = "";
    } else value += char;
  }
  out.push(value);
  return out;
}

function cleanName(name) {
  return name.replace(/\*/g, "").replace(/\s+/g, " ").trim();
}

function add(map, name, team, score = 0, imageUrl) {
  const code = aliasToCode.get(team);
  if (!name || !code || code === "TOT") return;
  const item = map.get(name) ?? { name, teams: new Set(), peak: 0, imageUrl };
  item.teams.add(code);
  item.peak = Math.max(item.peak, Number.isFinite(score) ? score : 0);
  item.imageUrl ||= imageUrl;
  map.set(name, item);
}

const map = new Map();
for (const source of sources) {
  const file = path.join(root, source.file);
  if (!fs.existsSync(file)) continue;
  if (source.json) {
    for (const row of JSON.parse(fs.readFileSync(file, "utf8"))) add(map, cleanName(row.name), row.team, (row.pts ?? 0) + (row.reb ?? 0) + (row.ast ?? 0), row.imageUrl);
    continue;
  }
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const headers = csv(lines.shift());
  for (const line of lines) {
    const values = csv(line);
    const row = Object.fromEntries(headers.map((key, index) => [key, values[index]]));
    add(map, cleanName(row[source.player]), row[source.team], Number(row[source.pts] ?? 0) + Number(row[source.reb] ?? 0) + Number(row[source.ast] ?? 0));
  }
}
for (const extra of extras) for (const team of extra.teams) add(map, extra.name, team, extra.peak);

const careers = [...map.values()]
  .filter((player) => player.teams.size > 0)
  .map((player) => ({ name: player.name, teams: [...player.teams].sort(), peak: Math.round(player.peak * 10) / 10, ...(player.imageUrl ? { imageUrl: player.imageUrl } : {}) }))
  .sort((a, b) => b.peak - a.peak || a.name.localeCompare(b.name));

fs.writeFileSync(output, `${JSON.stringify(careers, null, 2)}\n`);
console.log(`Built ${careers.length} NBA grid careers at ${output}`);
