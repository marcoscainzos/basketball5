"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { getLeagueContext, LeagueContext, LeagueResult, readLeagueResult } from "@/lib/leagueScoring";

type LeagueGameFrame = {
  context: LeagueContext | null;
  result: LeagueResult | null;
  setResult: (result: LeagueResult | null) => void;
  banner: ReactNode;
  completedPanel: ReactNode;
};

export function useLeagueGameFrame(gameName: string): LeagueGameFrame {
  const [context, setContext] = useState<LeagueContext | null>(null);
  const [result, setResult] = useState<LeagueResult | null>(null);

  useEffect(() => {
    const nextContext = getLeagueContext();
    setContext(nextContext);
    setResult(nextContext ? readLeagueResult(nextContext) : null);
  }, []);

  return {
    context,
    result,
    setResult,
    banner: context ? <LeagueGameBanner context={context} gameName={gameName} /> : null,
    completedPanel: context && result ? <LeagueGameResultPanel context={context} gameName={gameName} result={result} /> : null,
  };
}

function LeagueGameBanner({ context, gameName }: { context: LeagueContext; gameName: string }) {
  return (
    <div className="league-game-banner">
      <span>LIGA {context.leagueCode}</span>
      <b>{gameName}</b>
      <em>1 intento</em>
    </div>
  );
}

function LeagueGameResultPanel({ context, gameName, result }: { context: LeagueContext; gameName: string; result: LeagueResult }) {
  return (
    <section className="league-completed-panel">
      <span>RETO DE LIGA COMPLETADO</span>
      <h1>{gameName}</h1>
      <div className="league-completed-score">
        <small>PUNTUACIÓN</small>
        <b>+{result.points}</b>
      </div>
      <p>Este reto ya quedó guardado para hoy. Mañana se reinicia con una nueva selección diaria.</p>
      <div className="league-completed-actions">
        <Link href={`/leagues/${context.leagueCode}`}>VOLVER A LA LIGA</Link>
      </div>
    </section>
  );
}
