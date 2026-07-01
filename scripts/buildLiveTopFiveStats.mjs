import fs from "node:fs";
import readline from "node:readline";

const source = process.argv.find((value) => value.startsWith("--source="))?.slice(9) ?? "data/raw/PlayerStatistics.csv";
const output = "data/live-top-five-stats.json";
const teamCodes = { Hawks:"ATL", Celtics:"BOS", Nets:"BRK", Hornets:"CHO", Bulls:"CHI", Cavaliers:"CLE", Mavericks:"DAL", Nuggets:"DEN", Pistons:"DET", Warriors:"GSW", Rockets:"HOU", Pacers:"IND", Clippers:"LAC", Lakers:"LAL", Grizzlies:"MEM", Heat:"MIA", Bucks:"MIL", Timberwolves:"MIN", Pelicans:"NOP", Knicks:"NYK", Thunder:"OKC", Magic:"ORL", "76ers":"PHI", Suns:"PHO", "Trail Blazers":"POR", Kings:"SAC", Spurs:"SAS", Raptors:"TOR", Jazz:"UTA", Wizards:"WAS" };
function csv(line) { const out=[]; let value="", quoted=false; for(let i=0;i<line.length;i+=1){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i+=1;}else quoted=!quoted;}else if(c===","&&!quoted){out.push(value);value="";}else value+=c;}out.push(value);return out; }
function number(value) { const parsed=Number(value); return Number.isFinite(parsed)?parsed:0; }
function seasonFromDate(date) { const [year,month]=date.split("-").map(Number); const end=month>=7?year+1:year; return `${end-1}-${String(end).slice(-2)}`; }
if (!fs.existsSync(source)) throw new Error(`No existe ${source}`);
const input=readline.createInterface({input:fs.createReadStream(source),crlfDelay:Infinity}); let headers=[]; const totals=new Map();
for await (const line of input) {
  if(!headers.length){headers=csv(line);continue;} const values=csv(line);if(values.length!==headers.length)continue;
  const row=Object.fromEntries(headers.map((header,index)=>[header,values[index]])); const date=(row.gameDate??"").slice(0,10);
  if(row.gameType!=="Regular Season"||date<"2024-10-01"||!row.personId)continue;
  const team=teamCodes[row.playerteamName]; if(!team)continue; const season=seasonFromDate(date); const key=`${season}|${row.personId}|${team}`;
  const item=totals.get(key)??{season,personId:row.personId,name:`${row.firstName} ${row.lastName}`.trim(),team,games:new Set(),minutes:0,points:0,assists:0};
  if(item.games.has(row.gameId))continue; item.games.add(row.gameId); item.minutes+=number(row.numMinutes); item.points+=number(row.points); item.assists+=number(row.assists); totals.set(key,item);
}
const entries=[...totals.values()].map(({games,...item})=>({...item,games:games.size,minutes:Number(item.minutes.toFixed(1)),points:item.points,assists:item.assists}));
const seasons=[...new Set(entries.map((item)=>item.season))].sort(); if(!seasons.length)throw new Error("La descarga no contiene temporadas recientes");
fs.writeFileSync(output,`${JSON.stringify({updatedAt:new Date().toISOString(),hasMinutes:true,seasons,entries},null,2)}\n`);
console.log(`${entries.length} registros recientes de ${seasons.join(", ")}.`);
