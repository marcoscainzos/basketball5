"use client";

import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export type League = {
  id?: string;
  code: string;
  name: string;
  ownerEmail: string;
  createdAt: string;
  standings: Array<{ email: string; name: string; points: number; today: number }>;
};

export type LocalProfile = {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  password: string;
  city: string;
  country: string;
  createdAt: string;
};

export const STORAGE_KEY = "court-inside-leagues-v1";
export const PROFILE_KEY = "court-inside-profile-v1";
export const DAILY_GAMES = [
  { id: "1vs1", name: "1VS1", href: "/1vs1", points: 120 },
  { id: "top5", name: "TOP 5", href: "/top5", points: 150 },
  { id: "who", name: "WHO AM I?", href: "/who-am-i", points: 130 },
  { id: "tic", name: "3 EN RAYA", href: "/tres-en-raya", points: 110 },
  { id: "stat", name: "STAT LINE", href: "/stat-line", points: 140 },
  { id: "six", name: "PYRAMID", href: "/six-order", points: 125 },
];

export function readLeagues(): League[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as League[];
  } catch {
    return [];
  }
}

export function writeLeagues(leagues: League[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leagues));
}

export function readProfile(): LocalProfile | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null") as LocalProfile | null;
  } catch {
    return null;
  }
}

export async function readRemoteProfile(): Promise<LocalProfile | null> {
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

export function profileName(profile: LocalProfile) {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.email;
}

export async function readRemoteLeagues(): Promise<League[]> {
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
  return Promise.all(rows.filter((row) => row.leagues).map(async (row) => {
    const league = row.leagues!;
    const { data: standings } = await client
      .from("league_members")
      .select("user_id, display_name, points, today_points")
      .eq("league_id", league.id)
      .order("points", { ascending: false });
    return {
      id: league.id,
      code: league.code,
      name: league.name,
      ownerEmail: league.owner_id,
      createdAt: league.created_at,
      standings: ((standings || []) as Array<{ user_id: string; display_name: string; points: number; today_points: number }>).map((member) => ({
        email: member.user_id,
        name: member.display_name,
        points: member.points,
        today: member.today_points,
      })),
    } satisfies League;
  }));
}

export function makeCode(name: string) {
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

export function dailyLeagueGames(code: string) {
  const start = hash(`${todayKey()}-${code}`) % DAILY_GAMES.length;
  const second = (start + 2 + (hash(code) % (DAILY_GAMES.length - 1))) % DAILY_GAMES.length;
  return [DAILY_GAMES[start], DAILY_GAMES[second === start ? (second + 1) % DAILY_GAMES.length : second]];
}

export function findLeagueByCode(leagues: League[], code: string) {
  return leagues.find((league) => league.code.toUpperCase() === code.toUpperCase());
}
