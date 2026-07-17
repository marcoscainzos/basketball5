"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import data from "@/data/who-am-i.json";
import { useLanguage } from "@/components/LanguageProvider";
import { SiteBrand } from "@/components/SiteBrand";
import { getLeagueContext, LeagueContext, LeagueResult, recordLeagueResult } from "@/lib/leagueScoring";

type Mode="teammates"|"journey";
type Clue={name:string;imageUrl:string};
type Challenge={name:string;imageUrl:string;teammates:Clue[];teams:Clue[]};
type Save={mode:Mode;revealed:number;guesses:string[];status:"playing"|"won"|"surrendered"};
const challenges=data.challenges as Challenge[];
const clean=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
function dayKey(){const date=new Date();return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;}
function hash(value:string){let result=2166136261;for(const char of value){result^=char.charCodeAt(0);result=Math.imul(result,16777619);}return result>>>0;}
function daily(mode:Mode){const eligible=challenges.filter(item=>mode==="teammates"?item.teammates.length===5:item.teams.length>=1);return eligible[hash(`${dayKey()}-${mode}-who`)%eligible.length];}
function timeLeft(){const now=new Date();const end=new Date(now);end.setHours(24,0,0,0);const ms=end.getTime()-now.getTime();return `${String(Math.floor(ms/3600000)).padStart(2,"0")}:${String(Math.floor(ms%3600000/60000)).padStart(2,"0")}:${String(Math.floor(ms%60000/1000)).padStart(2,"0")}`;}

export default function WhoAmIGame(){
  const { t } = useLanguage();
  const [mode,setMode]=useState<Mode|null>(null);const [save,setSave]=useState<Save|null>(null);const [query,setQuery]=useState("");const [countdown,setCountdown]=useState("--:--:--");
  const [leagueContext,setLeagueContext]=useState<LeagueContext|null>(null);
  const [leagueResult,setLeagueResult]=useState<LeagueResult|null>(null);
  const challenge=useMemo(()=>mode?daily(mode):null,[mode]);
  const clues=challenge?(mode==="teammates"?challenge.teammates:challenge.teams):[];
  const suggestions=useMemo(()=>{const value=clean(query);if(!value)return[];return data.names.filter(name=>clean(name).includes(value)&&!save?.guesses.includes(name)).sort((a,b)=>(clean(a).startsWith(value)?-1:0)-(clean(b).startsWith(value)?-1:0)||a.localeCompare(b)).slice(0,8);},[query,save]);
  useEffect(()=>{const update=()=>setCountdown(timeLeft());update();const timer=setInterval(update,1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{setLeagueContext(getLeagueContext());},[]);
  useEffect(()=>{if(leagueContext?.modeId&&(leagueContext.modeId==="teammates"||leagueContext.modeId==="journey")&&!mode) openMode(leagueContext.modeId);},[leagueContext,mode]);
  function openMode(next:Mode){setMode(next);try{const stored=JSON.parse(localStorage.getItem(`court-inside-who-${dayKey()}-${next}`)??"null") as Save|null;setSave(stored??{mode:next,revealed:1,guesses:[],status:"playing"});}catch{setSave({mode:next,revealed:1,guesses:[],status:"playing"});}}
  useEffect(()=>{if(save)localStorage.setItem(`court-inside-who-${dayKey()}-${save.mode}`,JSON.stringify(save));},[save]);
  useEffect(()=>{if(!leagueContext||!save||!challenge||save.status==="playing"||leagueResult)return; const rawScore=save.status==="won"?Math.max(1,clues.length-(save.revealed-1)):Math.max(0,clues.length-(save.revealed-1)-1); recordLeagueResult(leagueContext,{rawScore,maxRawScore:clues.length,outcome:save.status==="won"?"won":"surrendered"}).then(setLeagueResult);},[save,challenge,clues.length,leagueContext,leagueResult]);
  function guess(name:string){if(!challenge||!save||save.status!=="playing")return;setQuery("");const guesses=[...save.guesses,name];if(clean(name)===clean(challenge.name)){setSave({...save,guesses,status:"won"});return;}if(guesses.length>=5){setSave({...save,guesses,status:"surrendered",revealed:clues.length});return;}setSave({...save,guesses,revealed:Math.min(clues.length,save.revealed+1)});}
  function backToLeagueOrModes(){if(leagueContext)window.location.href=`/leagues/${leagueContext.leagueCode}`;else{setMode(null);setSave(null);}}
  if(!mode||!save||!challenge)return <main className="who-shell mode-shell"><nav className="site-nav"><SiteBrand /><Link href="/" className="back-link">← {t("games")}</Link></nav><section className="mode-intro"><div className="mode-copy"><h1>WHO AM I?</h1><p>{t("whoIntro")}</p></div><div className="reset-inline"><small>{t("reset")}</small><b>{countdown}</b></div></section><section className="mode-select mode-select-two"><button className="mode-card mode-historical" onClick={()=>openMode("teammates")}><h2>{t("teammates")}</h2></button><button className="mode-card mode-current" onClick={()=>openMode("journey")}><h2>{t("journey")}</h2></button></section></main>;
  const finished=save.status!=="playing";
  return <main className="who-shell"><nav className="site-nav draft-top-nav"><button className="back-button" onClick={backToLeagueOrModes}>← {leagueContext?"LIGA":t("modes")}</button><SiteBrand link={false} /><span className="live-reset">{t("reset")} {countdown}</span></nav><section className="who-game"><header><span>{mode==="teammates"?t("teammates"):t("journey")}</span><h1>WHO AM I?</h1></header>{leagueResult&&<div className="league-result-pill"><span>LIGA</span><b>+{leagueResult.points}</b><small>{leagueResult.points}/{leagueResult.maxPoints} PTS</small></div>}<div className={`who-clues ${mode}`}>{clues.map((clue,index)=><div className={index<save.revealed?"visible":"hidden"} key={`${clue.name}-${index}`}><strong>{String(index+1).padStart(2,"0")}</strong>{index<save.revealed?<><img src={clue.imageUrl} alt=""/><span>{clue.name}</span></>:<span>?</span>}</div>)}</div>{finished?<div className="who-answer"><img src={challenge.imageUrl} alt=""/><div><span>{save.status==="won"?t("correct"):t("was")}</span><h2>{challenge.name}</h2><p>{save.guesses.length} {save.guesses.length===1?t("guessOne"):t("guesses")}</p></div></div>:<div className="who-search"><label htmlFor="who-player">{t("searchPlayer")}</label><div><input id="who-player" value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&suggestions[0])guess(suggestions[0]);}} placeholder={t("typeName")}/><button disabled={!suggestions[0]} onClick={()=>suggestions[0]&&guess(suggestions[0])}>{t("test")}</button><button className="who-flag" aria-label={t("surrender")} title={t("surrender")} onClick={()=>setSave({...save,status:"surrendered",revealed:clues.length})}>⚑</button></div>{suggestions.length>0&&<aside>{suggestions.map(name=><button key={name} onClick={()=>guess(name)}>{name}<span>＋</span></button>)}</aside>}</div>}</section></main>;
}
