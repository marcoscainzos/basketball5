import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "data/raw/nba-player-per-game-1947-2024.csv");
const visualPlayers = JSON.parse(fs.readFileSync(path.join(root, "data/player-seasons.json"), "utf8"));

function parseCsv(input) {
  const rows=[]; let row=[]; let value=""; let quoted=false;
  for (let i=0;i<input.length;i+=1) { const char=input[i];
    if(char==='"'){ if(quoted&&input[i+1]==='"'){value+='"';i+=1;}else quoted=!quoted; }
    else if(char===","&&!quoted){row.push(value);value="";}
    else if((char==="\n"||char==="\r")&&!quoted){if(char==="\r"&&input[i+1]==="\n")i+=1;row.push(value);value="";if(row.some(Boolean))rows.push(row);row=[];}
    else value+=char;
  }
  const headers=rows.shift(); return rows.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??""])));
}
const clean=name=>name.replace(/\*/g,"").trim();
const normalized=value=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const rows=parseCsv(fs.readFileSync(source,"utf8")).filter(row=>row.lg==="NBA"&&Number(row.season)>=1985&&Number(row.g)>=5&&row.tm!=="TOT");
const byPlayer=new Map(); const rosters=new Map(); const peak=new Map();
for(const row of rows){const name=clean(row.player);const season=Number(row.season);const key=`${season}|${row.tm}`;byPlayer.set(name,[...(byPlayer.get(name)??[]),{season,team:row.tm,games:Number(row.g)}]);rosters.set(key,[...(rosters.get(key)??[]),name]);peak.set(name,Math.max(peak.get(name)??0,Number(row.pts_per_game)||0));}
const visualByName=new Map();
for(const player of visualPlayers){if(player.imageUrl&&!visualByName.has(normalized(player.name)))visualByName.set(normalized(player.name),player);}
const teamIds={ATL:"1610612737",BOS:"1610612738",BKN:"1610612751",NJN:"1610612751",CHA:"1610612766",CHH:"1610612766",CHI:"1610612741",CLE:"1610612739",DAL:"1610612742",DEN:"1610612743",DET:"1610612765",GSW:"1610612744",HOU:"1610612745",IND:"1610612754",LAC:"1610612746",LAL:"1610612747",MEM:"1610612763",VAN:"1610612763",MIA:"1610612748",MIL:"1610612749",MIN:"1610612750",NOP:"1610612740",NOH:"1610612740",NOK:"1610612740",NYK:"1610612752",OKC:"1610612760",SEA:"1610612760",ORL:"1610612753",PHI:"1610612755",PHX:"1610612756",POR:"1610612757",SAC:"1610612758",KCK:"1610612758",SAS:"1610612759",TOR:"1610612761",UTA:"1610612762",WAS:"1610612764",WSB:"1610612764"};
const teamClue=team=>({name:team,imageUrl:teamIds[team]?`https://cdn.nba.com/logos/nba/${teamIds[team]}/primary/L/logo.svg`:""});
const challenges=[];
for(const [name,seasons] of byPlayer){const visual=visualByName.get(normalized(name));if(!visual||(peak.get(name)??0)<15)continue;
  const ordered=[...seasons].sort((a,b)=>a.season-b.season);const teams=[];
  for(const item of ordered){if(teams.at(-1)!==item.team)teams.push(item.team);}
  const shared=new Map();
  for(const item of ordered){for(const mate of rosters.get(`${item.season}|${item.team}`)??[]){if(mate!==name)shared.set(mate,(shared.get(mate)??0)+1);}}
  const teammates=[...shared].filter(([mate])=>(peak.get(mate)??0)>=8&&visualByName.get(normalized(mate))?.imageUrl).sort((a,b)=>((b[1]*4)+(peak.get(b[0])??0))-((a[1]*4)+(peak.get(a[0])??0))).slice(0,5).reverse().map(([mate])=>({name:mate,imageUrl:visualByName.get(normalized(mate)).imageUrl}));
  if(teammates.length===5){const journey=teams.length>=5?Array.from({length:5},(_,index)=>teamClue(teams[Math.round(index*(teams.length-1)/4)])):[];challenges.push({name,imageUrl:visual.imageUrl,teammates,teams:journey});}
}
const names=[...new Set(visualPlayers.map(player=>player.name))].sort((a,b)=>a.localeCompare(b));
fs.writeFileSync(path.join(root,"data/who-am-i.json"),`${JSON.stringify({challenges,names},null,2)}\n`);
console.log(`Who Am I: ${challenges.length} jugadores, ${names.length} nombres buscables.`);
