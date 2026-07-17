"use client";

import { DAILY_GAMES, leagueTodayKey, readLeagues, writeLeagues } from "@/lib/leagues";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export type LeagueContext = {
  leagueCode: string;
  gameId: string;
  modeId?: string;
};

export type LeagueResult = LeagueContext & {
  dateKey: string;
  points: number;
  maxPoints: number;
  rawScore: number;
  maxRawScore: number;
  outcome: "won" | "lost" | "surrendered" | "completed";
  createdAt: string;
};

export function getLeagueContext(): LeagueContext | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const leagueCode = params.get("league")?.toUpperCase();
  const gameId = params.get("leagueGame") || "";
  const modeId = params.get("leagueMode") || undefined;
  if (!leagueCode || !gameId) return null;
  return { leagueCode, gameId, modeId };
}

export function leagueResultKey(context: LeagueContext) {
  return `court-inside-league-result-${leagueTodayKey()}-${context.leagueCode}-${context.gameId}`;
}

export function readLeagueResult(context: LeagueContext): LeagueResult | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(leagueResultKey(context)) || "null") as LeagueResult | null;
  } catch {
    return null;
  }
}

function maxPointsFor(gameId: string, fallback: number) {
  return DAILY_GAMES.find((game) => game.id === gameId)?.points || fallback;
}

function calculatePoints(gameId: string, rawScore: number, maxRawScore: number, outcome: LeagueResult["outcome"]) {
  if (outcome === "lost") return 0;
  const maxPoints = maxPointsFor(gameId, maxRawScore);
  return Math.max(0, Math.min(maxPoints, Math.round(rawScore)));
}

async function addPointsRemote(leagueCode: string, points: number) {
  if (!points || !isSupabaseConfigured || !supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { data: league } = await supabase.from("leagues").select("id").eq("code", leagueCode).maybeSingle();
  if (!league?.id) return;
  const { data: member } = await supabase
    .from("league_members")
    .select("points, today_points")
    .eq("league_id", league.id)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!member) return;
  await supabase
    .from("league_members")
    .update({
      points: Number(member.points || 0) + points,
      today_points: Number(member.today_points || 0) + points,
    })
    .eq("league_id", league.id)
    .eq("user_id", userData.user.id);
}

function addPointsLocal(leagueCode: string, points: number) {
  if (!points) return;
  const leagues = readLeagues();
  const profileRaw = localStorage.getItem("court-inside-profile-v1");
  const profile = profileRaw ? JSON.parse(profileRaw) as { email?: string } : null;
  if (!profile?.email) return;
  writeLeagues(leagues.map((league) => league.code === leagueCode ? {
    ...league,
    standings: league.standings.map((row) => row.email === profile.email ? {
      ...row,
      points: row.points + points,
      today: row.today + points,
    } : row),
  } : league));
}

export async function recordLeagueResult(
  context: LeagueContext,
  result: Pick<LeagueResult, "rawScore" | "maxRawScore" | "outcome">,
) {
  const existing = readLeagueResult(context);
  if (existing) return existing;
  const points = calculatePoints(context.gameId, result.rawScore, result.maxRawScore, result.outcome);
  const maxPoints = maxPointsFor(context.gameId, result.maxRawScore);
  const record: LeagueResult = {
    ...context,
    dateKey: leagueTodayKey(),
    points,
    maxPoints,
    rawScore: result.rawScore,
    maxRawScore: result.maxRawScore,
    outcome: result.outcome,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(leagueResultKey(context), JSON.stringify(record));
  addPointsLocal(context.leagueCode, points);
  await addPointsRemote(context.leagueCode, points);
  window.dispatchEvent(new Event("court-inside-league-score-updated"));
  return record;
}
