"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { SiteBrand } from "@/components/SiteBrand";
import { SiteFooter } from "@/components/SiteFooter";
import { useLanguage } from "@/components/LanguageProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { League, LocalProfile, makeCode, profileName, readLeagues, readProfile, readRemoteLeagues, readRemoteProfile, writeLeagues } from "@/lib/leagues";

export default function LeaguesPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [leagueName, setLeagueName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueMessage, setLeagueMessage] = useState("");

  useEffect(() => {
    const sync = async () => {
      const remote = await readRemoteProfile();
      setProfile(remote || readProfile());
      if (remote) localStorage.setItem("court-inside-profile-v1", JSON.stringify(remote));
      const remoteLeagues = await readRemoteLeagues();
      setLeagues(remoteLeagues.length ? remoteLeagues : readLeagues());
    };
    sync();
    window.addEventListener("court-inside-profile-updated", sync);
    window.addEventListener("focus", sync);
    const invite = new URLSearchParams(window.location.search).get("join");
    if (invite) setJoinCode(invite.toUpperCase());
    return () => {
      window.removeEventListener("court-inside-profile-updated", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const profileReady = Boolean(profile?.email);
  const getProfileForAction = async () => {
    const remote = await readRemoteProfile();
    const local = remote || profile || readProfile();
    if (remote) {
      setProfile(remote);
      localStorage.setItem("court-inside-profile-v1", JSON.stringify(remote));
    }
    return local;
  };

  const createLeague = async (event: FormEvent) => {
    event.preventDefault();
    setLeagueMessage("");
    if (!leagueName.trim()) return setLeagueMessage("Pon un nombre para la liga.");
    const actionProfile = await getProfileForAction();
    if (!actionProfile?.email) return setLeagueMessage("Inicia sesión desde el icono de perfil para crear una liga.");
    const code = makeCode(leagueName);

    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return setLeagueMessage("Tu sesión no está activa. Inicia sesión de nuevo desde el perfil.");
      const { data: created, error } = await supabase
        .from("leagues")
        .insert({ code, name: leagueName.trim(), owner_id: userData.user.id })
        .select("*")
        .single();
      if (error || !created) return setLeagueMessage(error?.message || "No se pudo crear la liga.");
      const { error: memberError } = await supabase.from("league_members").insert({
        league_id: created.id,
        user_id: userData.user.id,
        display_name: profileName(actionProfile),
      });
      if (memberError) return setLeagueMessage(memberError.message);
      window.location.assign(`/leagues/${code}`);
      return;
    }

    const next: League = {
      code,
      name: leagueName.trim(),
      ownerEmail: actionProfile.email,
      createdAt: new Date().toISOString(),
      standings: [{ email: actionProfile.email, name: profileName(actionProfile), points: 0, today: 0 }],
    };
    writeLeagues([next, ...leagues]);
    window.location.assign(`/leagues/${code}`);
  };

  const joinLeague = async (event: FormEvent) => {
    event.preventDefault();
    setLeagueMessage("");
    if (!joinCode.trim()) return setLeagueMessage("Pega un código de liga.");
    const actionProfile = await getProfileForAction();
    if (!actionProfile?.email) return setLeagueMessage("Inicia sesión desde el icono de perfil para unirte a una liga.");
    const code = joinCode.trim().toUpperCase();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc("join_league_by_code", {
        join_code: code,
        member_name: profileName(actionProfile),
      });
      if (error) return setLeagueMessage(error.message);
      window.location.assign(`/leagues/${code}`);
      return;
    }

    const existing = leagues.find((league) => league.code === code);
    const nextLeague = existing || { code, name: `Liga ${code}`, ownerEmail: "", createdAt: new Date().toISOString(), standings: [] };
    const standings = nextLeague.standings.some((row) => row.email === actionProfile.email)
      ? nextLeague.standings
      : [...nextLeague.standings, { email: actionProfile.email, name: profileName(actionProfile), points: 0, today: 0 }];
    writeLeagues(existing ? leagues.map((league) => league.code === code ? { ...nextLeague, standings } : league) : [{ ...nextLeague, standings }, ...leagues]);
    window.location.assign(`/leagues/${code}`);
  };

  return (
    <main className="home-shell leagues-shell">
      <nav className="site-nav home-nav">
        <SiteBrand />
        <span className="nav-note">{t("dailyHoops")}</span>
      </nav>
      <header className="home-title"><span>{t("dailyBasketballGames")}</span><h1>COURT INSIDE</h1></header>

      <nav className="play-type-switch leagues-switch" aria-label="Modo de juego">
        <Link href="/" scroll={false}><span>01</span><div><b>{t("individual")}</b><i>{t("dailyGames")}</i></div></Link>
        <Link className="active" href="/leagues" scroll={false} aria-current="page"><span>02</span><div><b>{t("leagues")}</b><i>{t("competeFriends")}</i></div></Link>
      </nav>

      <header className="league-section-heading">
        <div><span>{t("courtInsideLeagues")}</span><h2>{t("competeGroup")}</h2></div>
        <p>Crea una liga, comparte el enlace y entra en su propia pantalla.</p>
      </header>

      <section className="league-dashboard">
        {!profileReady ? <p className="league-login-note">Para crear o unirte a una liga, regístrate o inicia sesión desde el icono de perfil de arriba.</p> : null}
        {leagueMessage ? <p className="league-login-note">{leagueMessage}</p> : null}

        <div className="league-actions">
          <article className="league-action create-league">
            <div><h2>CREAR<br />LIGA</h2></div>
            <p>Elige nombre y genera un enlace para invitar a tus amigos.</p>
            <form onSubmit={createLeague}>
              <label htmlFor="new-league">NOMBRE DE LIGA</label>
              <div><input id="new-league" value={leagueName} onChange={(event) => setLeagueName(event.target.value)} placeholder="Ej. Peña NBA" /><button disabled={!leagueName.trim()} type="submit">CREAR →</button></div>
            </form>
          </article>

          <article className="league-action join-league">
            <div><h2>UNIRME A<br />UNA LIGA</h2></div>
            <p>Pega el código o abre un enlace de invitación.</p>
            <form onSubmit={joinLeague}>
              <label htmlFor="league-code">{t("leagueCode")}</label>
              <div><input id="league-code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="EJ. CI-23MJ" autoComplete="off" /><button disabled={!joinCode.trim()} type="submit">{t("enter")}</button></div>
            </form>
          </article>
        </div>

        {leagues.length ? (
          <section className="league-list">
            <span>MIS LIGAS</span>
            <div>
              {leagues.map((league) => (
                <Link key={league.code} href={`/leagues/${league.code}`}>
                  <b>{league.name}</b>
                  <i>{league.standings.length} jugadores · entrar →</i>
                </Link>
              ))}
            </div>
          </section>
        ) : <p className="league-empty">Crea o únete a una liga para verla aquí.</p>}
      </section>
      <SiteFooter />
    </main>
  );
}
