"use client";

import { useEffect, useMemo, useState } from "react";
import data from "@/data/top-five.json";

type Answer = { name:string; value:number };
type Challenge = { id:string; type:string; prompt:string; detail:string; unit:string; answers:Answer[] };
const challenges = data.challenges as Challenge[];
const types = ["season-points", "season-assists", "career-minutes", "team-season-minutes", "team-points"];
function dateKey() { const date = new Date(); return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`; }
function hash(value:string) { let result=2166136261; for (const char of value) { result^=char.charCodeAt(0); result=Math.imul(result,16777619); } return result>>>0; }
function dailyChallenge() { const day=dateKey(); const type=types[hash(`${day}-type`)%types.length]; const pool=challenges.filter((item)=>item.type===type); return pool[hash(`${day}-challenge`)%pool.length]; }
function clean(value:string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }

export default function TopFiveGame() {
  const challenge=useMemo(()=>dailyChallenge(),[]);
  const [query,setQuery]=useState("");
  const [guessed,setGuessed]=useState<string[]>([]);
  const [surrendered,setSurrendered]=useState(false);
  const [message,setMessage]=useState("");
  const [ready,setReady]=useState(false);
  useEffect(()=>{ const timer=setTimeout(()=>{ try { const saved=JSON.parse(localStorage.getItem(`court-inside-top5-${dateKey()}`)??"[]") as string[]; setGuessed(saved.filter((name)=>challenge.answers.some((answer)=>answer.name===name))); setSurrendered(localStorage.getItem(`court-inside-top5-surrendered-${dateKey()}`)==="1"); } catch {} setReady(true); },0); return ()=>clearTimeout(timer); },[challenge]);
  useEffect(()=>{ if (ready) localStorage.setItem(`court-inside-top5-${dateKey()}`,JSON.stringify(guessed)); },[guessed,ready]);
  useEffect(()=>{ if (ready) localStorage.setItem(`court-inside-top5-surrendered-${dateKey()}`,surrendered?"1":"0"); },[surrendered,ready]);
  const suggestions=useMemo(()=>{ const value=clean(query); if (!value) return []; return data.names.filter((name)=>!guessed.includes(name)&&clean(name).includes(value)).sort((a,b)=>{ const aa=clean(a).startsWith(value)?0:1; const bb=clean(b).startsWith(value)?0:1; return aa-bb||a.localeCompare(b); }).slice(0,7); },[query,guessed]);
  const completed=guessed.length===5||surrendered;
  function submit(name:string) { const answer=challenge.answers.find((item)=>clean(item.name)===clean(name)); setQuery(""); if (!answer) { setMessage(`${name} no está en este Top 5.`); return; } if (guessed.includes(answer.name)) { setMessage("Ese jugador ya está colocado."); return; } setGuessed([...guessed,answer.name]); setMessage(guessed.length===4?"Top 5 completado.":"Correcto."); }
  if (!ready) return <div className="top5-loading">PREPARANDO EL RANKING…</div>;
  return <section className="top5-game">
    <header className="top5-head"><div><span>RETO DE HOY</span><h1>{challenge.prompt}</h1><p>{challenge.detail}</p></div><div className="top5-progress"><b>{guessed.length}</b><span>/ 5</span></div></header>
    <div className="top5-board">{challenge.answers.map((answer,index)=>{ const found=guessed.includes(answer.name); const visible=found||surrendered; return <article className={found?"found":surrendered?"revealed":""} key={answer.name}><strong>0{index+1}</strong><div>{visible?<><b>{answer.name}</b><span>{answer.value.toLocaleString("es-ES")} {challenge.unit}</span></>:<b>?</b>}</div></article>; })}</div>
    <div className="player-search"><label htmlFor="top5-player">BUSCA UN JUGADOR</label><div className="search-box"><input id="top5-player" autoComplete="off" disabled={completed} value={query} onChange={(event)=>{setQuery(event.target.value);setMessage("");}} onKeyDown={(event)=>{if(event.key==="Enter"&&suggestions[0])submit(suggestions[0]);}} placeholder={surrendered?"RESPUESTAS REVELADAS":completed?"RANKING COMPLETADO":"Escribe un nombre…"}/><button type="button" disabled={!suggestions[0]||completed} onClick={()=>suggestions[0]&&submit(suggestions[0])}>AÑADIR</button></div>{suggestions.length>0&&!completed&&<div className="search-options">{suggestions.map((name)=><button type="button" key={name} onClick={()=>submit(name)}>{name}<span>＋</span></button>)}</div>}<div className="top5-search-footer"><p className={completed&&!surrendered?"success":""}>{surrendered?`Te faltaban ${5-guessed.length}. Mañana hay un Top 5 nuevo.`:message}</p>{!completed&&<button type="button" className="top5-surrender" onClick={()=>{setQuery("");setSurrendered(true);setMessage("");}}>RENDIRSE</button>}</div></div>
  </section>;
}
