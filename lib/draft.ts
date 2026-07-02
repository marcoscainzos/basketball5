import { PlayerSeason, players } from "@/data/players";

export type DraftMode = "career" | "season";
export type DraftRestriction = "positions" | "balanced" | "noThirty";

export type DraftOption = PlayerSeason & { label: string; search: string };

function impact(player: PlayerSeason) {
  return player.pts + player.reb * 1.12 + player.ast * 1.42 + player.stl * 2.25 + player.blk * 2.1;
}

function clean(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hash(value: string) {
  let result = 2166136261;
  for (const char of value) { result ^= char.charCodeAt(0); result = Math.imul(result, 16777619); }
  return result >>> 0;
}

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function dailyRestriction(day = dateKey()): DraftRestriction {
  const options: DraftRestriction[] = ["positions", "balanced", "noThirty"];
  return options[hash(`${day}-draft-rule`) % options.length];
}

export const RESTRICTIONS: Record<DraftRestriction, { title: string; description: string }> = {
  positions: { title: "QUINTETO CLÁSICO", description: "Escoge un base, un escolta, un alero, un ala-pívot y un pívot." },
  balanced: { title: "SIN SOBRECARGAR", description: "No puedes elegir más de dos jugadores de la misma posición." },
  noThirty: { title: "SIN 30 PUNTOS", description: "Ningún jugador o temporada puede superar los 29,9 puntos por partido." },
};

const byName = new Map<string, PlayerSeason[]>();
for (const player of players) {
  const list = byName.get(player.name) ?? [];
  list.push(player);
  byName.set(player.name, list);
}

export function optionsFor(mode: DraftMode): DraftOption[] {
  if (mode === "season") {
    return players.map((player) => ({ ...player, label: `${player.name} · ${player.season}`, search: clean(`${player.name} ${player.season} ${player.team}`) }));
  }
  return [...byName.entries()].map(([name, seasons]) => {
    const ordered = [...seasons].sort((a, b) => impact(b) - impact(a));
    const sample = ordered.slice(0, Math.min(3, ordered.length));
    const peak = ordered[0];
    const average = (key: "pts" | "reb" | "ast" | "stl" | "blk") => Number((sample.reduce((sum, item) => sum + item[key], 0) / sample.length).toFixed(1));
    return { ...peak, pts: average("pts"), reb: average("reb"), ast: average("ast"), stl: average("stl"), blk: average("blk"), season: "Carrera", label: name, search: clean(`${name} ${peak.team} ${peak.position}`) };
  });
}

export function canAdd(player: DraftOption, lineup: DraftOption[], rule: DraftRestriction) {
  if (lineup.some((item) => item.name === player.name)) return "Ese jugador ya está en tu quinteto.";
  if (rule === "noThirty" && player.pts >= 30) return "No cumple la restricción de hoy.";
  const samePosition = lineup.filter((item) => item.position === player.position).length;
  if (rule === "positions" && samePosition >= 1) return `Ya tienes cubierta la posición ${player.position}.`;
  if (rule === "balanced" && samePosition >= 2) return `Ya tienes dos jugadores en ${player.position}.`;
  return null;
}

export function estimateWins(lineup: DraftOption[]) {
  if (lineup.length !== 5) return null;
  const totals = lineup.reduce((acc, player) => ({
    pts: acc.pts + player.pts, reb: acc.reb + player.reb, ast: acc.ast + player.ast,
    stl: acc.stl + player.stl, blk: acc.blk + player.blk,
  }), { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 });
  const positions = new Set(lineup.map((player) => player.position));
  const creation = Math.min(1, totals.ast / 34);
  const scoring = Math.min(1, totals.pts / 126);
  const rebounding = Math.min(1, totals.reb / 52);
  const defense = Math.min(1, (totals.stl + totals.blk) / 13);
  const balance = 0.72 + positions.size * 0.056;
  const strength = (scoring * .36 + creation * .23 + rebounding * .18 + defense * .23) * balance;
  return Math.max(12, Math.min(82, Math.round(8 + strength * 74)));
}
