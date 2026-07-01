import fs from "node:fs";
import path from "node:path";

type Card = { name: string; pool?: "historical" | "current" };
type Credit = { imageUrl: string; source: string; author: string; license: string; licenseUrl: string; missing?: boolean };
type WikiPage = { title: string; pageimage?: string; thumbnail?: { source?: string } };
type CommonsImage = { descriptionurl?: string; extmetadata?: Record<string, { value?: string }> };

const ROOT = process.cwd();
const cards = JSON.parse(fs.readFileSync(path.join(ROOT, "data/player-seasons.json"), "utf8")) as Card[];
const creditsPath = path.join(ROOT, "data/image-credits.json");
const credits = fs.existsSync(creditsPath) ? JSON.parse(fs.readFileSync(creditsPath, "utf8")) as Record<string, Credit> : {};
const limitArg = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 200;
const orderedCards = [...cards].sort((a, b) => Number(b.pool === "current") - Number(a.pool === "current"));
const names = [...new Set(orderedCards.map((card) => card.name))].filter((name) => !credits[name]).slice(0, limit);

function plain(value?: string) { return (value ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"'); }
function chunks<T>(values: T[], size: number) { return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size)); }
async function fetchWithRetry(url: string, attempts = 5) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": "CourtInside/1.0 (Wikimedia attribution downloader; contact: local-project)" } });
    if (response.ok) return response;
    if (response.status !== 429 || attempt === attempts - 1) throw new Error(`${response.status} ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 2500 * (attempt + 1)));
  }
  throw new Error(`No se pudo descargar ${url}`);
}
async function getJson(url: string) { return fetchWithRetry(url).then((response) => response.json()) as Promise<Record<string, unknown>>; }

async function main() {
  fs.mkdirSync(path.join(ROOT, "public/players"), { recursive: true });
  let downloaded = 0;
  for (const batch of chunks(names, 25)) {
    const wikiUrl = new URL("https://en.wikipedia.org/w/api.php");
    wikiUrl.search = new URLSearchParams({ action: "query", titles: batch.join("|"), redirects: "1", prop: "pageimages", piprop: "thumbnail|name", pithumbsize: "600", format: "json", origin: "*" }).toString();
    const wiki = await getJson(wikiUrl.toString()) as { query?: { pages?: Record<string, WikiPage>; redirects?: Array<{ from: string; to: string }> } };
    const redirects = new Map((wiki.query?.redirects ?? []).map((item) => [item.from, item.to]));
    const pages = Object.values(wiki.query?.pages ?? {});
    const pageByTitle = new Map(pages.map((page) => [page.title, page]));
    const files = pages.flatMap((page) => page.pageimage ? [page.pageimage] : []);
    const metadataByFile = new Map<string, CommonsImage>();

    if (files.length) {
      const commonsUrl = new URL("https://commons.wikimedia.org/w/api.php");
      commonsUrl.search = new URLSearchParams({ action: "query", titles: files.map((file) => `File:${file}`).join("|"), prop: "imageinfo", iiprop: "extmetadata|url", format: "json", origin: "*" }).toString();
      const commons = await getJson(commonsUrl.toString()) as { query?: { pages?: Record<string, { title: string; imageinfo?: CommonsImage[] }> } };
      for (const page of Object.values(commons.query?.pages ?? {})) metadataByFile.set(page.title.replace(/^File:/, ""), page.imageinfo?.[0] ?? {});
    }

    for (const name of batch) {
      const page = pageByTitle.get(redirects.get(name) ?? name);
      if (!page?.thumbnail?.source || !page.pageimage) {
        credits[name] = { imageUrl: "", source: "", author: "", license: "", licenseUrl: "", missing: true };
        continue;
      }
      try {
        const metadata = metadataByFile.get(page.pageimage)?.extmetadata ?? {};
        credits[name] = { imageUrl: page.thumbnail.source, source: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`, author: plain(metadata.Artist?.value), license: plain(metadata.LicenseShortName?.value), licenseUrl: metadata.LicenseUrl?.value ?? "" };
        downloaded += 1;
      } catch (error) { console.warn(`Error con ${name}:`, error instanceof Error ? error.message : error); }
    }
    fs.writeFileSync(creditsPath, `${JSON.stringify(credits, null, 2)}\n`);
    console.log(`Procesados ${Math.min(Object.keys(credits).length, 1505)} jugadores; ${downloaded} imágenes nuevas.`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  console.log(`Listo: ${downloaded} imágenes nuevas. Ejecuta de nuevo para procesar el siguiente lote.`);
}

main();
