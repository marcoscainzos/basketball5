import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const source = path.join(process.cwd(), "data/raw/nba-player-per-game-1947-2024.csv");
const output = path.join(process.cwd(), "data/top-five.json");
const franchises = {
  ATL:{ name:"Atlanta Hawks", codes:["TRI","MLH","STL","ATL"] }, BOS:{ name:"Boston Celtics", codes:["BOS"] },
  BRK:{ name:"Brooklyn Nets", codes:["NYN","NJN","BRK"] }, CHO:{ name:"Charlotte Hornets", codes:["CHH","CHA","CHO"] },
  CHI:{ name:"Chicago Bulls", codes:["CHI"] }, CLE:{ name:"Cleveland Cavaliers", codes:["CLE"] }, DAL:{ name:"Dallas Mavericks", codes:["DAL"] },
  DEN:{ name:"Denver Nuggets", codes:["DEN"] }, DET:{ name:"Detroit Pistons", codes:["FTW","DET"] }, GSW:{ name:"Golden State Warriors", codes:["PHW","SFW","GSW"] },
  HOU:{ name:"Houston Rockets", codes:["SDR","HOU"] }, IND:{ name:"Indiana Pacers", codes:["IND"] }, LAC:{ name:"LA Clippers", codes:["BUF","SDC","LAC"] },
  LAL:{ name:"Los Angeles Lakers", codes:["MNL","LAL"] }, MEM:{ name:"Memphis Grizzlies", codes:["VAN","MEM"] }, MIA:{ name:"Miami Heat", codes:["MIA"] },
  MIL:{ name:"Milwaukee Bucks", codes:["MIL"] }, MIN:{ name:"Minnesota Timberwolves", codes:["MIN"] }, NOP:{ name:"New Orleans Pelicans", codes:["NOH","NOK","NOP"] },
  NYK:{ name:"New York Knicks", codes:["NYK"] }, OKC:{ name:"Oklahoma City Thunder", codes:["SEA","OKC"] }, ORL:{ name:"Orlando Magic", codes:["ORL"] },
  PHI:{ name:"Philadelphia 76ers", codes:["SYR","PHI"] }, PHO:{ name:"Phoenix Suns", codes:["PHO"] }, POR:{ name:"Portland Trail Blazers", codes:["POR"] },
  SAC:{ name:"Sacramento Kings", codes:["ROC","CIN","KCO","KCK","SAC"] }, SAS:{ name:"San Antonio Spurs", codes:["SAS"] }, TOR:{ name:"Toronto Raptors", codes:["TOR"] },
  UTA:{ name:"Utah Jazz", codes:["NOJ","UTA"] }, WAS:{ name:"Washington Wizards", codes:["CHP","CHZ","BAL","CAP","WSB","WAS"] },
};

function csv(line) {
  const values = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { values.push(value); value = ""; }
    else value += char;
  }
  values.push(value); return values;
}
function n(value) { const result = Number(value); return Number.isFinite(result) ? result : 0; }
function seasonLabel(year) { return `${year - 1}-${String(year).slice(-2)}`; }
function topFive(rows, value) {
  return rows.map((row) => ({ name: row.player, value: value(row) })).filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, 5);
}

const input = readline.createInterface({ input: fs.createReadStream(source), crlfDelay: Infinity });
let headers = []; const rows = [];
for await (const line of input) {
  if (!headers.length) { headers = csv(line); continue; }
  const values = csv(line); if (values.length !== headers.length) continue;
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  if (row.lg === "NBA" && row.player && row.tm) rows.push(row);
}

const livePath = path.join(process.cwd(), "data/live-top-five-stats.json");
const live = fs.existsSync(livePath) ? JSON.parse(fs.readFileSync(livePath,"utf8")) : { seasons:[], entries:[] };
const nameSet = new Set([...rows.map((row) => row.player), ...live.entries.map((entry) => entry.name)]);
const bySeason = new Map();
for (const row of rows) {
  const season = n(row.season); if (!bySeason.has(season)) bySeason.set(season, []); bySeason.get(season).push(row);
}
const challenges = [];
for (const [season, seasonRows] of bySeason) {
  const totalRows = seasonRows.filter((row) => row.tm === "TOT");
  const traded = new Set(totalRows.map((row) => row.player));
  const leagueRows = [...totalRows, ...seasonRows.filter((row) => row.tm !== "TOT" && !traded.has(row.player))];
  for (const [stat, title] of [["pts_per_game", "anotadores"], ["ast_per_game", "asistentes"]]) {
    const answers = topFive(leagueRows, (row) => n(row[stat]));
    if (answers.length === 5) challenges.push({ id:`${stat}-${season}`, type:stat === "pts_per_game" ? "season-points" : "season-assists", prompt:`Top 5 ${title} de la temporada`, detail:seasonLabel(season), unit:stat === "pts_per_game" ? "PTS" : "AST", answers });
  }
  const teams = [...new Set(seasonRows.map((row) => row.tm).filter((team) => team !== "TOT"))];
  for (const team of teams) {
    const teamRows = seasonRows.filter((row) => row.tm === team);
    const answers = topFive(teamRows, (row) => n(row.g) * n(row.mp_per_game));
    if (answers.length === 5) challenges.push({ id:`minutes-${team}-${season}`, type:"team-season-minutes", prompt:"Top 5 en minutos jugados", detail:`${team} · ${seasonLabel(season)}`, unit:"MIN", answers:answers.map((answer) => ({ ...answer, value:Math.round(answer.value) })) });
  }
}

for (const season of live.seasons) {
  const seasonEntries=live.entries.filter((entry)=>entry.season===season); const players=new Map();
  for(const entry of seasonEntries){const item=players.get(entry.name)??{player:entry.name,games:0,points:0,assists:0};item.games+=entry.games;item.points+=entry.points;item.assists+=entry.assists;players.set(entry.name,item);}
  for(const [stat,title,unit] of [["points","anotadores","PTS"],["assists","asistentes","AST"]]){
    const answers=[...players.values()].filter((item)=>item.games>=5).map((item)=>({name:item.player,value:Number((item[stat]/item.games).toFixed(1))})).sort((a,b)=>b.value-a.value).slice(0,5);
    if(answers.length===5)challenges.push({id:`live-${stat}-${season}`,type:stat==="points"?"season-points":"season-assists",prompt:`Top 5 ${title} de la temporada`,detail:`${season} · actualizado`,unit,answers});
  }
  if(live.hasMinutes)for(const team of [...new Set(seasonEntries.map((entry)=>entry.team))]){const answers=seasonEntries.filter((entry)=>entry.team===team).map((entry)=>({name:entry.name,value:Math.round(entry.minutes)})).sort((a,b)=>b.value-a.value).slice(0,5);if(answers.length===5&&answers[0].value>0)challenges.push({id:`live-minutes-${team}-${season}`,type:"team-season-minutes",prompt:"Top 5 en minutos jugados",detail:`${team} · ${season} · actualizado`,unit:"MIN",answers});}
}

const canonicalRows = [];
for (const seasonRows of bySeason.values()) {
  const totals = seasonRows.filter((row) => row.tm === "TOT"); const traded = new Set(totals.map((row) => row.player));
  canonicalRows.push(...totals, ...seasonRows.filter((row) => row.tm !== "TOT" && !traded.has(row.player)));
}
const cutoffs = [...bySeason.keys()].filter((season) => season >= 1970 && (season % 5 === 0 || season >= 2005)).sort((a,b) => a-b);
for (const cutoff of cutoffs) {
  const careerMinutes = new Map();
  for (const row of canonicalRows.filter((item) => n(item.season) <= cutoff)) careerMinutes.set(row.player, (careerMinutes.get(row.player) ?? 0) + n(row.g) * n(row.mp_per_game));
  const careerAnswers = [...careerMinutes].map(([name, value]) => ({ name, value:Math.round(value) })).sort((a,b) => b.value-a.value).slice(0,5);
  challenges.push({ id:`career-minutes-${cutoff}`, type:"career-minutes", prompt:"Top 5 con más minutos jugados", detail:`Historia NBA · hasta ${seasonLabel(cutoff)}`, unit:"MIN", answers:careerAnswers });
}
if(live.hasMinutes)for(const season of live.seasons){const cutoff=Number(season.slice(0,4))+1;const careerMinutes=new Map();for(const row of canonicalRows)careerMinutes.set(row.player,(careerMinutes.get(row.player)??0)+n(row.g)*n(row.mp_per_game));for(const entry of live.entries.filter((item)=>Number(item.season.slice(0,4))+1<=cutoff))careerMinutes.set(entry.name,(careerMinutes.get(entry.name)??0)+entry.minutes);const answers=[...careerMinutes].map(([name,value])=>({name,value:Math.round(value)})).sort((a,b)=>b.value-a.value).slice(0,5);if(answers[0]?.value>0)challenges.push({id:`career-minutes-live-${cutoff}`,type:"career-minutes",prompt:"Top 5 con más minutos jugados",detail:`Historia NBA · hasta ${season} · actualizado`,unit:"MIN",answers});}

const teamCareer = new Map();
for (const row of rows.filter((item) => item.tm !== "TOT")) {
  const franchise = Object.entries(franchises).find(([,item]) => item.codes.includes(row.tm))?.[0];
  if (!franchise) continue;
  const key = `${franchise}|${row.player}`; teamCareer.set(key, (teamCareer.get(key) ?? 0) + n(row.g) * n(row.pts_per_game));
}
for(const entry of live.entries){const key=`${entry.team}|${entry.name}`;teamCareer.set(key,(teamCareer.get(key)??0)+entry.points);}
const latestSeason=live.seasons.at(-1)??"2023-24";
for (const [team,franchise] of Object.entries(franchises)) {
  const answers = [...teamCareer].filter(([key]) => key.startsWith(`${team}|`)).map(([key,value]) => ({ name:key.split("|")[1], value:Math.round(value) })).sort((a,b) => b.value-a.value).slice(0,5);
  if (answers.length === 5) challenges.push({ id:`team-points-${team}`, type:"team-points", prompt:"Top 5 anotadores históricos", detail:`${franchise.name} · hasta ${latestSeason}`, unit:"PTS", answers });
}

const names=[...nameSet].sort((a,b)=>a.localeCompare(b));
fs.writeFileSync(output, `${JSON.stringify({ names, challenges }, null, 2)}\n`);
console.log(`${challenges.length} retos y ${names.length} jugadores.`);
