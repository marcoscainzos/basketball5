import fs from "fs";

const API_KEY = process.env.BALLDONTLIE_API_KEY;

async function main() {
  if (!API_KEY) {
    throw new Error("Falta BALLDONTLIE_API_KEY en .env.local");
  }

  let cursor: number | undefined = undefined;
  const allPlayers: unknown[] = [];

  while (true) {
    const url = new URL("https://api.balldontlie.io/v1/players");
    url.searchParams.set("per_page", "100");

    if (cursor) {
      url.searchParams.set("cursor", String(cursor));
    }

    const response = await fetch(url, {
      headers: {
        Authorization: API_KEY,
      },
    });

    if (!response.ok) {
        const text = await response.text();
        console.log("Error API:", response.status, text);
        console.log("Esperando 10 segundos...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue;
    }

    const json = (await response.json()) as {
      data: unknown[];
      meta?: { next_cursor?: number };
    };

    allPlayers.push(...json.data);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (!json.meta?.next_cursor) break;

    cursor = json.meta.next_cursor;
  }

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(
    "data/allPlayers.json",
    JSON.stringify(allPlayers, null, 2)
  );

  console.log("Listo: data/allPlayers.json");
}

main();
