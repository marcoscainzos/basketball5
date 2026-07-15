"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SiteBrand } from "@/components/SiteBrand";
import { SiteFooter } from "@/components/SiteFooter";
import { useLanguage } from "@/components/LanguageProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

type League = {
  id?: string;
  code: string;
  name: string;
  ownerEmail: string;
  createdAt: string;
  standings: Array<{ email: string; name: string; points: number; today: number }>;
};
type LocalProfile = {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  password: string;
  city: string;
  country: string;
  createdAt: string;
};

const STORAGE_KEY = "court-inside-leagues-v1";
const PROFILE_KEY = "court-inside-profile-v1";
const DAILY_GAMES = [
  { id: "1vs1", name: "1VS1", href: "/1vs1", points: 120 },
  { id: "top5", name: "TOP 5", href: "/top5", points: 150 },
  { id: "who", name: "WHO AM I?", href: "/who-am-i", points: 130 },
  { id: "tic", name: "3 EN RAYA", href: "/tres-en-raya", points: 110 },
  { id: "stat", name: "STAT LINE", href: "/stat-line", points: 140 },
  { id: "six", name: "PYRAMID", href: "/six-order", points: 125 },
];

function readLeagues(): League[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as League[];
  } catch {
    return [];
  }
}

function writeLeagues(leagues: League[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leagues));
}
function readProfile(): LocalProfile | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null") as LocalProfile | null;
  } catch {
    return null;
  }
}
async function readRemoteProfile(): Promise<LocalProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle();
  if (!data) {
    const meta = userData.user.user_metadata || {};
    return {
      firstName: String(meta.first_name || userData.user.email?.split("@")[0] || "Player"),
      lastName: String(meta.last_name || ""),
      birthDate: String(meta.birth_date || ""),
      email: String(userData.user.email || ""),
      password: "",
      city: String(meta.city || ""),
      country: String(meta.country || ""),
      createdAt: String(userData.user.created_at || new Date().toISOString()),
    };
  }
  return {
    firstName: String(data.first_name || ""),
    lastName: String(data.last_name || ""),
    birthDate: String(data.birth_date || ""),
    email: String(data.email || userData.user.email || ""),
    password: "",
    city: String(data.city || ""),
    country: String(data.country || ""),
    createdAt: String(data.created_at || userData.user.created_at || new Date().toISOString()),
  };
}
function profileName(profile: LocalProfile) {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.email;
}
async function readRemoteLeagues(): Promise<League[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, points, today_points, display_name, leagues(id, code, name, owner_id, created_at)")
    .eq("user_id", userData.user.id);

  const rows = (memberships || []) as unknown as Array<{
    league_id: string;
    leagues: { id: string; code: string; name: string; owner_id: string; created_at: string } | null;
  }>;

  const client = supabase;
  if (!client) return [];
  const leagues = await Promise.all(rows.filter((row) => row.leagues).map(async (row) => {
    const league = row.leagues!;
    const { data: standings } = await client
      .from("league_members")
      .select("display_name, points, today_points")
      .eq("league_id", league.id)
      .order("points", { ascending: false });
    return {
      id: league.id,
      code: league.code,
      name: league.name,
      ownerEmail: league.owner_id,
      createdAt: league.created_at,
      standings: ((standings || []) as Array<{ display_name: string; points: number; today_points: number }>).map((member, index) => ({
        email: `${league.id}-${index}`,
        name: member.display_name,
        points: member.points,
        today: member.today_points,
      })),
    } satisfies League;
  }));
  return leagues;
}

function makeCode(name: string) {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "CI";
  return `${clean}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function hash(input: string) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) value = (value * 31 + input.charCodeAt(i)) >>> 0;
  return value;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dailyLeagueGames(code: string) {
  const start = hash(`${todayKey()}-${code}`) % DAILY_GAMES.length;
  const second = (start + 2 + (hash(code) % (DAILY_GAMES.length - 1))) % DAILY_GAMES.length;
  return [DAILY_GAMES[start], DAILY_GAMES[second === start ? (second + 1) % DAILY_GAMES.length : second]];
}

export default function LeaguesPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [leagueName, setLeagueName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeCode, setActiveCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const syncProfile = async () => {
      const remote = await readRemoteProfile();
      setProfile(remote || readProfile());
      if (remote) localStorage.setItem(PROFILE_KEY, JSON.stringify(remote));
    };
    syncProfile();
    window.addEventListener("court-inside-profile-updated", syncProfile);
    window.addEventListener("focus", syncProfile);
    const loadLeagues = async () => {
      const remoteLeagues = await readRemoteLeagues();
      const saved = remoteLeagues.length ? remoteLeagues : readLeagues();
      setLeagues(saved);
      setActiveCode(saved[0]?.code || "");
    };
    loadLeagues();
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("join");
    if (invite) setJoinCode(invite.toUpperCase());
    return () => {
      window.removeEventListener("court-inside-profile-updated", syncProfile);
      window.removeEventListener("focus", syncProfile);
    };
  }, []);

  const activeLeague = leagues.find((league) => league.code === activeCode);
  const inviteUrl = activeLeague && typeof window !== "undefined" ? `${window.location.origin}/leagues?join=${activeLeague.code}` : "";
  const dailyGames = useMemo(() => activeLeague ? dailyLeagueGames(activeLeague.code) : [], [activeLeague]);

  const persist = (next: League[], nextActive: string) => {
    setLeagues(next);
    setActiveCode(nextActive);
    writeLeagues(next);
  };

  const profileReady = Boolean(profile?.email);

  const createLeague = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileReady || !leagueName.trim() || !profile) return;
    const code = makeCode(leagueName);
    if (isSupabaseConfigured && supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: created, error } = await supabase
        .from("leagues")
        .insert({ code, name: leagueName.trim(), owner_id: userData.user.id })
        .select("*")
        .single();
      if (error || !created) return;
      await supabase.from("league_members").insert({
        league_id: created.id,
        user_id: userData.user.id,
        display_name: profileName(profile),
      });
      const remoteLeagues = await readRemoteLeagues();
      persist(remoteLeagues, code);
      setLeagueName("");
      return;
    }
    const league: League = {
      code,
      name: leagueName.trim(),
      ownerEmail: profile.email.trim(),
      createdAt: new Date().toISOString(),
      standings: [{ email: profile.email.trim(), name: profileName(profile), points: 0, today: 0 }],
    };
    persist([league, ...leagues], code);
    setLeagueName("");
  };

  const joinLeague = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileReady || !joinCode.trim() || !profile) return;
    const code = joinCode.trim().toUpperCase();
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc("join_league_by_code", {
        join_code: code,
        member_name: profileName(profile),
      });
      if (!error) {
        const remoteLeagues = await readRemoteLeagues();
        persist(remoteLeagues, code);
        setJoinCode("");
      }
      return;
    }
    const existing = leagues.find((league) => league.code === code);
    const nextLeague = existing || {
      code,
      name: `Liga ${code}`,
      ownerEmail: "",
      createdAt: new Date().toISOString(),
      standings: [],
    };
    const standings = nextLeague.standings.some((row) => row.email === profile.email.trim())
      ? nextLeague.standings
      : [...nextLeague.standings, { email: profile.email.trim(), name: profileName(profile), points: 0, today: 0 }];
    const updated = { ...nextLeague, standings };
    const next = existing ? leagues.map((league) => league.code === code ? updated : league) : [updated, ...leagues];
    persist(next, code);
    setJoinCode("");
  };

  const addDemoPoints = async () => {
    if (!activeLeague || !profileReady || !profile) return;
    const earned = dailyGames.reduce((sum, game) => sum + Math.round(game.points / 2), 0);
    if (isSupabaseConfigured && supabase && activeLeague.id) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      await supabase
        .from("league_members")
        .update({ points: earned, today_points: earned })
        .eq("league_id", activeLeague.id)
        .eq("user_id", userData.user.id);
      const remoteLeagues = await readRemoteLeagues();
      persist(remoteLeagues, activeLeague.code);
      return;
    }
    const next = leagues.map((league) => {
      if (league.code !== activeLeague.code) return league;
      const standings = league.standings.map((row) => row.email === profile.email.trim() ? { ...row, points: row.points + earned, today: earned } : row);
      return { ...league, standings };
    });
    persist(next, activeLeague.code);
  };

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
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
        <p>Crea una liga, comparte el enlace y compite con 2 minijuegos aleatorios cada día.</p>
      </header>

      <section className="league-dashboard">
        {!profileReady ? <p className="league-login-note">Para crear o unirte a una liga, regístrate o inicia sesión desde el icono de perfil de arriba.</p> : null}

        <div className="league-actions">
          <article className="league-action create-league">
            <div><h2>CREAR<br />LIGA</h2></div>
            <p>Elige nombre y genera un enlace para invitar a tus amigos.</p>
            <form onSubmit={createLeague}>
              <label htmlFor="new-league">NOMBRE DE LIGA</label>
              <div><input id="new-league" value={leagueName} onChange={(event) => setLeagueName(event.target.value)} placeholder="Ej. Peña NBA" /><button disabled={!profileReady || !leagueName.trim()} type="submit">CREAR →</button></div>
            </form>
          </article>

          <article className="league-action join-league">
            <div><h2>UNIRME A<br />UNA LIGA</h2></div>
            <p>Pega el código o abre un enlace de invitación.</p>
            <form onSubmit={joinLeague}>
              <label htmlFor="league-code">{t("leagueCode")}</label>
              <div><input id="league-code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="EJ. CI-23MJ" autoComplete="off" /><button disabled={!profileReady || !joinCode.trim()} type="submit">{t("enter")}</button></div>
            </form>
          </article>
        </div>

        {activeLeague ? (
          <section className="league-room">
            <header>
              <div>
                <span>LIGA ACTIVA</span>
                <h2>{activeLeague.name}</h2>
                <p>{activeLeague.code}</p>
              </div>
              <button type="button" onClick={copyInvite}>{copied ? "COPIADO" : "COPIAR ENLACE"}</button>
            </header>
            <div className="league-room-grid">
              <article className="league-daily">
                <span>HOY SE JUEGA</span>
                {dailyGames.map((game) => <Link key={game.id} href={game.href}><b>{game.name}</b><small>{game.points} PTS MAX</small></Link>)}
                <button type="button" onClick={addDemoPoints}>SIMULAR PUNTOS DE HOY</button>
              </article>
              <article className="league-table">
                <span>CLASIFICACIÓN</span>
                {[...activeLeague.standings].sort((a, b) => b.points - a.points).map((row, index) => (
                  <div key={row.email}><b>{index + 1}</b><strong>{row.name}</strong><small>{row.today} hoy</small><span>{row.points}</span></div>
                ))}
              </article>
            </div>
          </section>
        ) : (
          <p className="league-empty">Crea o únete a una liga para ver retos diarios y clasificación.</p>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
