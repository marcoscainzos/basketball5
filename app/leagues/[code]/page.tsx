"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { dailyLeagueGames, findLeagueByCode, League, LocalProfile, profileName, readLeagues, readProfile, readRemoteLeagues, readRemoteProfile, writeLeagues } from "@/lib/leagues";

export default function LeagueDetailPage() {
  const { t } = useLanguage();
  const params = useParams<{ code: string }>();
  const code = String(params.code || "").toUpperCase();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [view, setView] = useState<"home" | "games" | "standings" | "stats">("home");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [checked, setChecked] = useState(false);

  const dailyGames = useMemo(() => league ? dailyLeagueGames(league.code) : [], [league]);
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/leagues?join=${code}` : "";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Únete a mi liga de Court Inside: ${inviteUrl}`)}`;

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
    if (!checked || league) return;
    const timer = window.setTimeout(() => {
      window.location.replace(`/leagues?join=${encodeURIComponent(code)}`);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [checked, league, code]);

  const copyInvite = async () => {
    await navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const addDemoPoints = async () => {
    if (!league || !profile) return;
    const earned = dailyGames.reduce((sum, game) => sum + Math.round(game.points / 2), 0);
    if (isSupabaseConfigured && supabase && league.id) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return setMessage("Inicia sesión para sumar puntos.");
      const current = league.standings.find((row) => row.email === userData.user.id);
      const { error } = await supabase
        .from("league_members")
        .update({ points: (current?.points || 0) + earned, today_points: earned })
        .eq("league_id", league.id)
        .eq("user_id", userData.user.id);
      if (error) return setMessage(error.message);
      await load();
      return;
    }
    const leagues = readLeagues();
    const next = leagues.map((item) => item.code === league.code ? {
      ...item,
      standings: item.standings.map((row) => row.email === profile.email ? { ...row, points: row.points + earned, today: earned } : row),
    } : item);
    writeLeagues(next);
    setLeague(findLeagueByCode(next, league.code) || league);
  };

  const myStanding = league?.standings.find((row) => profile?.email && (row.email === profile.email || row.name === profileName(profile))) || league?.standings[0];

  return (
    <main className="game-shell league-detail-shell">
      <nav className="site-nav daily-game-nav">
        <Link href="/leagues" className="back-link">← LIGAS</Link>
        <SiteBrand />
        <span className="live-reset">LIGA</span>
      </nav>

      {!league ? (
        <section className="league-detail-empty">
          <span>COURT INSIDE LEAGUES</span>
          <h1>ENTRANDO</h1>
          <p>Estamos preparando tu invitación a la liga.</p>
        </section>
      ) : (
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
              {dailyGames.map((game) => (
                <Link key={game.id} href={game.href} className="league-game-card">
                  <span>{game.points} PTS MAX</span>
                  <b>{game.name}</b>
                  <small>JUGAR →</small>
                </Link>
              ))}
              <button type="button" onClick={addDemoPoints}>SIMULAR PUNTOS DE HOY</button>
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
