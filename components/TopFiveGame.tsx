"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import data from "@/data/top-five.json";
import { Lang, useLanguage } from "@/components/LanguageProvider";
import { SiteBrand } from "@/components/SiteBrand";
import { getLeagueContext, LeagueResult, recordLeagueResult } from "@/lib/leagueScoring";

type Answer = { name:string; value:number };
type Challenge = { id:string; type:string; prompt:string; detail:string; unit:string; answers:Answer[] };
const challenges = data.challenges as Challenge[];
const types = ["season-points", "season-assists", "career-minutes", "team-season-minutes", "team-points"];
function dateKey() { const date = new Date(); return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`; }
function timeLeft() { const now = new Date(); const end = new Date(now); end.setHours(24,0,0,0); const ms=end.getTime()-now.getTime(); return `${String(Math.floor(ms/3600000)).padStart(2,"0")}:${String(Math.floor(ms%3600000/60000)).padStart(2,"0")}:${String(Math.floor(ms%60000/1000)).padStart(2,"0")}`; }
function hash(value:string) { let result=2166136261; for (const char of value) { result^=char.charCodeAt(0); result=Math.imul(result,16777619); } return result>>>0; }
function dailyChallenge() { const day=dateKey(); const type=types[hash(`${day}-type`)%types.length]; const pool=challenges.filter((item)=>item.type===type); return pool[hash(`${day}-challenge`)%pool.length]; }
function clean(value:string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }
function translateChallenge(text:string, lang:Lang) {
  if (lang === "es") return text;
  return text
    .replace("Top 5 anotadores", "Top 5 scorers")
    .replace("Top 5 asistentes", "Top 5 assist leaders")
    .replace("Top 5 con más minutos jugados", "Top 5 minutes played")
    .replace("Top 5 anotadores históricos", "Top 5 all-time scorers")
    .replace("con más minutos", "with the most minutes")
    .replace("Historia NBA", "NBA history")
    .replace("actualizado", "updated")
    .replace("hasta", "through");
}

export default function TopFiveGame() {
  const { lang, t } = useLanguage();
  const challenge=useMemo(()=>dailyChallenge(),[]);
  const [countdown,setCountdown]=useState("--:--:--");
  const [query,setQuery]=useState("");
  const [guessed,setGuessed]=useState<string[]>([]);
  const [surrendered,setSurrendered]=useState(false);
  const [message,setMessage]=useState("");
  const [ready,setReady]=useState(false);
  const [leagueResult,setLeagueResult]=useState<LeagueResult|null>(null);
  useEffect(()=>{ const update=()=>setCountdown(timeLeft()); update(); const timer=setInterval(update,1000); return()=>clearInterval(timer); },[]);
  useEffect(()=>{ const timer=setTimeout(()=>{ try { const saved=JSON.parse(localStorage.getItem(`court-inside-top5-${dateKey()}`)??"[]") as string[]; setGuessed(saved.filter((name)=>challenge.answers.some((answer)=>answer.name===name))); setSurrendered(localStorage.getItem(`court-inside-top5-surrendered-${dateKey()}`)==="1"); } catch {} setReady(true); },0); return ()=>clearTimeout(timer); },[challenge]);
  useEffect(()=>{ if (ready) localStorage.setItem(`court-inside-top5-${dateKey()}`,JSON.stringify(guessed)); },[guessed,ready]);
  useEffect(()=>{ if (ready) localStorage.setItem(`court-inside-top5-surrendered-${dateKey()}`,surrendered?"1":"0"); },[surrendered,ready]);
  const completed=guessed.length===5||surrendered;
  useEffect(()=>{ const context=getLeagueContext(); if(!context||!completed||leagueResult)return; recordLeagueResult(context,{rawScore:surrendered?Math.max(0,guessed.length-1):guessed.length,maxRawScore:5,outcome:surrendered?"surrendered":"won"}).then(setLeagueResult); },[completed,surrendered,guessed.length,leagueResult]);
  const suggestions=useMemo(()=>{ const value=clean(query); if (!value) return []; return data.names.filter((name)=>!guessed.includes(name)&&clean(name).includes(value)).sort((a,b)=>{ const aa=clean(a).startsWith(value)?0:1; const bb=clean(b).startsWith(value)?0:1; return aa-bb||a.localeCompare(b); }).slice(0,7); },[query,guessed]);
  function submit(name:string) { const answer=challenge.answers.find((item)=>clean(item.name)===clean(name)); setQuery(""); if (!answer) { setMessage(`${t("missingTop5Prefix")}${name}${t("missingTop5Suffix")}`); return; } if (guessed.includes(answer.name)) { setMessage(t("alreadyPlaced")); return; } setGuessed([...guessed,answer.name]); setMessage(guessed.length===4?t("completedTop5"):t("right")); }
  if (!ready) return <div className="top5-loading">{t("preparingRanking")}</div>;
  return <><nav className="site-nav daily-game-nav"><Link href="/" className="back-link">← {t("games")}</Link><SiteBrand link={false} /><span className="live-reset">{t("reset")} {countdown}</span></nav><section className="top5-game">
    <header className="top5-head"><div><span>{t("todayChallenge")}</span><h1>{translateChallenge(challenge.prompt, lang)}</h1><p>{translateChallenge(challenge.detail, lang)}</p></div><div className="top5-progress"><b>{guessed.length}</b><span>/ 5</span></div></header>
    {leagueResult&&<div className="league-result-pill"><span>LIGA</span><b>+{leagueResult.points}</b><small>{leagueResult.points}/{leagueResult.maxPoints} PTS</small></div>}
    <div className="top5-board">{challenge.answers.map((answer,index)=>{ const found=guessed.includes(answer.name); const visible=found||surrendered; return <article className={found?"found":surrendered?"revealed":""} key={answer.name}><strong>0{index+1}</strong><div>{visible?<><b>{answer.name}</b><span>{answer.value.toLocaleString(lang==="es"?"es-ES":"en-US")} {challenge.unit}</span></>:<b>?</b>}</div></article>; })}</div>
    <div className="player-search"><label htmlFor="top5-player">{t("searchPlayer")}</label><div className="search-box"><input id="top5-player" autoComplete="off" disabled={completed} value={query} onChange={(event)=>{setQuery(event.target.value);setMessage("");}} onKeyDown={(event)=>{if(event.key==="Enter"&&suggestions[0])submit(suggestions[0]);}} placeholder={surrendered?t("revealedAnswers"):completed?t("rankingCompleted"):t("typeName")}/><button type="button" disabled={!suggestions[0]||completed} onClick={()=>suggestions[0]&&submit(suggestions[0])}>{t("add")}</button></div>{suggestions.length>0&&!completed&&<div className="search-options">{suggestions.map((name)=><button type="button" key={name} onClick={()=>submit(name)}>{name}<span>＋</span></button>)}</div>}<div className="top5-search-footer"><p className={completed&&!surrendered?"success":""}>{surrendered?`${t("missingLeft")} ${5-guessed.length}. ${t("missingRight")}`:message}</p>{!completed&&<button type="button" className="top5-surrender" onClick={()=>{setQuery("");setSurrendered(true);setMessage("");}}>{t("surrender").toUpperCase()}</button>}</div></div>
  </section></>;
}
