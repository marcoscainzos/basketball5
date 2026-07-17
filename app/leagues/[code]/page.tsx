"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteBrand } from "@/components/SiteBrand";
import { dailyLeagueGames, findLeagueByCode, League, leagueTodayKey, LocalProfile, profileName, readLeagues, readProfile, readRemoteLeagues, readRemoteProfile } from "@/lib/leagues";
import { LeagueResult, readLeagueResult } from "@/lib/leagueScoring";

export default function LeagueDetailPage() {
  const params = useParams<{ code: string }>();
  const code = String(params.code || "").toUpperCase();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [view, setView] = useState<"home" | "games" | "standings" | "stats">("home");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [checked, setChecked] = useState(false);
  const [modeChoices, setModeChoices] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, LeagueResult>>({});

  const dailyGames = useMemo(() => league ? dailyLeagueGames(league.code) : [], [league]);
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/leagues?join=${code}` : "";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Únete a mi liga de Court Inside: ${inviteUrl}`)}`;
  const modeChoiceKey = (gameId: string) => `court-inside-league-mode-${leagueTodayKey()}-${code}-${gameId}`;
  const leagueHref = (href: string, gameId: string, modeId?: string) => `${href}?league=${encodeURIComponent(code)}&leagueGame=${encodeURIComponent(gameId)}${modeId ? `&leagueMode=${encodeURIComponent(modeId)}` : ""}`;

  const load = async () => {
    setChecked(false);
    const remoteProfile = await readRemoteProfile();
    const nextProfile = remoteProfile || readProfile();
    setProfile(nextProfile);
    const remoteLeagues = await readRemoteLeagues();
    const all = remoteLeagues.length ? remoteLeagues : readLeagues();
    const found = findLeagueByCode(all, code);
    setLeague(found || null);
    setChecked(true);
  };

  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    window.addEventListener("court-inside-profile-updated", load);
    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("court-inside-profile-updated", load);
    };
  }, [code]);

  useEffect(() => {
    const nextChoices: Record<string, string> = {};
    const nextResults: Record<string, LeagueResult> = {};
    dailyGames.forEach((game) => {
      const selected = localStorage.getItem(modeChoiceKey(game.id));
      if (selected) nextChoices[game.id] = selected;
      const result = readLeagueResult({ leagueCode: code, gameId: game.id });
      if (result) nextResults[game.id] = result;
    });
    setModeChoices(nextChoices);
    setResults(nextResults);
  }, [dailyGames, code]);

  useEffect(() => {
    const refreshResults = () => {
      const nextResults: Record<string, LeagueResult> = {};
      dailyGames.forEach((game) => {
        const result = readLeagueResult({ leagueCode: code, gameId: game.id });
        if (result) nextResults[game.id] = result;
      });
      setResults(nextResults);
    };
    window.addEventListener("focus", refreshResults);
    window.addEventListener("court-inside-league-score-updated", refreshResults);
    return () => {
      window.removeEventListener("focus", refreshResults);
      window.removeEventListener("court-inside-league-score-updated", refreshResults);
    };
  }, [dailyGames, code]);

  useEffect(() => {
    if (!checked || league) return;
    window.location.replace(`/leagues?join=${encodeURIComponent(code)}`);
  }, [checked, league, code]);

  const copyInvite = async () => {
    await navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const chooseLeagueMode = (gameId: string, modeId: string) => {
    if (modeChoices[gameId] && modeChoices[gameId] !== modeId) return;
    localStorage.setItem(modeChoiceKey(gameId), modeId);
    setModeChoices((current) => ({ ...current, [gameId]: modeId }));
  };

  const myStanding = league?.standings.find((row) => profile?.email && (row.email === profile.email || row.name === profileName(profile))) || league?.standings[0];

  return (
    <main className="game-shell league-detail-shell">
      <nav className="site-nav daily-game-nav">
        <Link href="/leagues" className="back-link">← LIGAS</Link>
        <SiteBrand />
        <span className="live-reset">LIGA</span>
      </nav>

      {!league ? null : (
        <section className="league-app league-app-page">
          <header>
            <div>
              <span>LIGA</span>
              <h2>{league.name}</h2>
            </div>
            <div className="league-invite-actions">
              <a href={whatsappUrl} target="_blank" rel="noreferrer">WHATSAPP</a>
              <button type="button" onClick={copyInvite}>{copied ? "COPIADO" : "COPIAR ENLACE"}</button>
            </div>
          </header>
          {message ? <p className="league-login-note">{message}</p> : null}
          <nav className="league-tabs">
            <button className={view === "home" ? "active" : ""} type="button" onClick={() => setView("home")}>RESUMEN</button>
            <button className={view === "games" ? "active" : ""} type="button" onClick={() => setView("games")}>JUEGOS DE HOY</button>
            <button className={view === "standings" ? "active" : ""} type="button" onClick={() => setView("standings")}>CLASIFICACIÓN</button>
            <button className={view === "stats" ? "active" : ""} type="button" onClick={() => setView("stats")}>TUS STATS</button>
          </nav>

          {view === "home" ? (
            <div className="league-overview">
              <article><span>HOY</span><b>{dailyGames.length}</b><p>minijuegos activos</p></article>
              <article><span>JUGADORES</span><b>{league.standings.length}</b><p>en la liga</p></article>
              <article><span>TÚ</span><b>{myStanding?.points || 0}</b><p>puntos totales</p></article>
            </div>
          ) : null}

          {view === "games" ? (
            <section className="league-games-grid">
              {dailyGames.map((game) => {
                const selectedMode = modeChoices[game.id];
                const result = results[game.id];
                const hasModes = Boolean(game.modes?.length);
                return (
                  <article key={game.id} className={`league-game-card ${result ? "completed" : ""}`}>
                    <span>{result ? "COMPLETADO" : `${game.points} PTS MAX · 1 INTENTO`}</span>
                    <b>{game.name}</b>
                    {result ? <strong className="league-game-result">+{result.points} PTS</strong> : null}
                    {hasModes ? (
                      <div className="league-mode-list">
                        {game.modes!.map((mode) => {
                          const locked = Boolean(selectedMode && selectedMode !== mode.id);
                          const selected = selectedMode === mode.id;
                          return locked || result ? (
                            <button key={mode.id} className="league-mode-option locked" type="button" disabled>{mode.label}</button>
                          ) : (
                            <Link
                              key={mode.id}
                              className={`league-mode-option ${selected ? "selected" : ""}`}
                              href={leagueHref(mode.href || game.href, game.id, mode.id)}
                              onClick={() => chooseLeagueMode(game.id, mode.id)}
                            >
                              {selected ? `${mode.label} · elegido` : mode.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      result ? <button className="league-mode-option locked single" type="button" disabled>CERRADO</button> : <Link className="league-mode-option single" href={leagueHref(game.href, game.id)} onClick={() => chooseLeagueMode(game.id, "single")}>JUGAR →</Link>
                    )}
                  </article>
                );
              })}
            </section>
          ) : null}

          {view === "standings" ? (
            <article className="league-table full">
              <span>CLASIFICACIÓN</span>
              {[...league.standings].sort((a, b) => b.points - a.points).map((row, index) => (
                <div key={`${row.email}-${row.name}`}><b>{index + 1}</b><strong>{row.name}</strong><small>{row.today} hoy</small><span>{row.points}</span></div>
              ))}
            </article>
          ) : null}

          {view === "stats" ? (
            <section className="league-stats-panel">
              <article><span>PUNTOS</span><b>{myStanding?.points || 0}</b></article>
              <article><span>HOY</span><b>{myStanding?.today || 0}</b></article>
              <article><span>POSICIÓN</span><b>{Math.max(1, [...league.standings].sort((a, b) => b.points - a.points).findIndex((row) => row.email === myStanding?.email) + 1)}</b></article>
            </section>
          ) : null}
        </section>
      )}
    </main>
  );
}
