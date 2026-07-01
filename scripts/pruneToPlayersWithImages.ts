import fs from "node:fs";
import path from "node:path";

type Card = { pool: "historical" | "current"; imageUrl?: string };

const file = path.join(process.cwd(), "data/player-seasons.json");
const cards = JSON.parse(fs.readFileSync(file, "utf8")) as Card[];
const complete = cards.filter((card) => card.pool === "current" || Boolean(card.imageUrl));

fs.writeFileSync(file, `${JSON.stringify(complete, null, 2)}\n`);
console.log(`Base visual: ${complete.filter((card) => card.pool === "historical").length} temporadas históricas + ${complete.filter((card) => card.pool === "current").length} jugadores actuales.`);
