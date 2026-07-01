import { PlayerSeason, StatKey, players } from "@/data/players";

export type GameMode = "historical" | "current";
export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES = {
  easy: { label: "Fácil", min: 6, max: 10 },
  medium: { label: "Medio", min: 3, max: 5 },
  hard: { label: "Difícil", min: 0.5, max: 2 },
} satisfies Record<Difficulty, { label: string; min: number; max: number }>;
export const GAME_MODES = {
  historical: { label: "Histórico", description: "1974-75 → 2024-25", detail: "Top 20 de cada estadística" },
  current: { label: "Actual", description: "Temporada 2025-26", detail: "Todos los jugadores" },
} satisfies Record<GameMode, { label: string; description: string; detail: string }>;

export const STAT_META: Record<StatKey, { label: string; short: string }> = {
  pts: { label: "puntos por partido", short: "PTS" }, reb: { label: "rebotes por partido", short: "REB" },
  ast: { label: "asistencias por partido", short: "AST" }, stl: { label: "robos por partido", short: "ROB" },
  blk: { label: "tapones por partido", short: "TAP" },
};

export type DailyGame = { dateKey: string; mode: GameMode; difficulty?: Difficulty; stat: StatKey; currentId: number; challengerId: number; usedIds: number[]; revealedIds: number[]; score: number; best: number; survivorWins: number; status: "playing" | "lost" | "exhausted" };

export function getDateKey(date = new Date()) { return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part, index) => index === 0 ? part : String(part).padStart(2, "0")).join("-"); }
function hash(value: string) { let result = 2166136261; for (let index = 0; index < value.length; index += 1) { result ^= value.charCodeAt(index); result = Math.imul(result, 16777619); } return result >>> 0; }
function seededIndex(seed: string, length: number) { return hash(seed) % length; }
function poolFor(mode: GameMode) { return players.filter((player) => player.pool === mode); }
function candidatesFor(player: PlayerSeason, stat: StatKey, mode: GameMode, excluded: number[], difficulty?: Difficulty) {
  return poolFor(mode).filter((candidate) => {
    if (candidate.id === player.id || excluded.includes(candidate.id) || candidate[stat] === player[stat]) return false;
    if (!difficulty) return true;
    const difference = Math.abs(candidate[stat] - player[stat]); const range = DIFFICULTIES[difficulty];
    return difference >= range.min && difference <= range.max;
  });
}

function pickPair(dateKey: string, stat: StatKey, mode: GameMode, run: number, difficulty?: Difficulty) {
  const pool = poolFor(mode); const start = seededIndex(`${dateKey}-${mode}-${run}-first`, pool.length);
  for (let offset = 0; offset < pool.length; offset += 1) {
    const current = pool[(start + offset) % pool.length]; const candidates = candidatesFor(current, stat, mode, [], difficulty);
    if (candidates.length) return { current, challenger: candidates[seededIndex(`${dateKey}-${mode}-${run}-second`, candidates.length)] };
  }
  throw new Error(`No hay parejas para ${stat} en ${mode}`);
}

export function createDailyGame(dateKey: string, mode: GameMode, run = 0, difficulty?: Difficulty): DailyGame {
  const stats: StatKey[] = mode === "current" && difficulty !== "hard" ? ["pts", "reb", "ast"] : ["pts", "reb", "ast", "stl", "blk"];
  const stat = stats[seededIndex(`${dateKey}-${mode}-${difficulty ?? "open"}-stat`, stats.length)]; const pair = pickPair(dateKey, stat, mode, run, difficulty);
  return { dateKey, mode, difficulty, stat, currentId: pair.current.id, challengerId: pair.challenger.id, usedIds: [pair.current.id, pair.challenger.id], revealedIds: [], score: 0, best: 0, survivorWins: 0, status: "playing" };
}

export function getPlayer(id: number) { return players.find((player) => player.id === id) ?? players[0]; }
export function nextChallenger(game: DailyGame, winner: PlayerSeason) {
  let candidates = candidatesFor(winner, game.stat, game.mode, game.usedIds, game.difficulty);
  if (!candidates.length && game.mode === "current") candidates = candidatesFor(winner, game.stat, game.mode, game.usedIds);
  if (!candidates.length) return null;
  return candidates[seededIndex(`${game.dateKey}-${game.mode}-${game.score + 1}-${winner.id}`, candidates.length)];
}

export function nextPair(game: DailyGame) {
  const available = poolFor(game.mode).filter((player) => !game.usedIds.includes(player.id));
  const start = seededIndex(`${game.dateKey}-${game.mode}-${game.score + 1}-refresh`, available.length);
  for (let offset = 0; offset < available.length; offset += 1) {
    const current = available[(start + offset) % available.length];
    let candidates = candidatesFor(current, game.stat, game.mode, game.usedIds, game.difficulty);
    if (!candidates.length && game.mode === "current") candidates = candidatesFor(current, game.stat, game.mode, game.usedIds);
    if (candidates.length) return { current, challenger: candidates[seededIndex(`${game.dateKey}-${game.score}-refresh-second`, candidates.length)] };
  }
  return null;
}
