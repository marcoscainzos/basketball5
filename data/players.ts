import playerSeasons from "./player-seasons.json";

export type StatKey = "pts" | "reb" | "ast" | "stl" | "blk";

export interface PlayerSeason {
  id: number;
  name: string;
  season: string;
  team: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  number: number;
  accent: string;
  imageUrl?: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  games: number;
  pool: "historical" | "current";
}

export const players = playerSeasons as PlayerSeason[];
