/**
 * Download Wikimedia Commons thumbnails into public/items (paths from JSON).
 * From apps/testapp: bun scripts/download-commons-items.ts
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

type Item = { commonsTitle: string; filename: string };

type Config = {
  thumbWidth?: number;
  delayMs?: number;
  outputDir?: string;
  userAgent?: string;
  /** Skip re-download if file exists and is larger than this (bytes). */
  skipIfLargerThanBytes?: number;
  items: Item[];
};

const CONFIG_FILE = "download-commons-items.json";

async function thumbUrl(
  fileTitle: string,
  thumbWidth: number,
  userAgent: string,
): Promise<string> {
  const title = `File:${fileTitle}`;
  const api =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      titles: title,
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: String(thumbWidth),
    });

  const res = await fetch(api, { headers: { "User-Agent": userAgent } });
  if (!res.ok) throw new Error(`Commons API HTTP ${res.status}`);
  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        { missing?: boolean; imageinfo?: { thumburl?: string }[] }
      >;
    };
  };

  const pages = data.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    if (page.missing) throw new Error(`Missing on Commons: ${title}`);
    const u = page.imageinfo?.[0]?.thumburl;
    if (!u) throw new Error(`No thumburl for ${title}`);
    return u;
  }
  throw new Error(`No page for ${title}`);
}

async function main() {
  const dir = import.meta.dir;
  const configPath = join(dir, CONFIG_FILE);
  const config = JSON.parse(await readFile(configPath, "utf8")) as Config;

  const thumbWidth = config.thumbWidth ?? 500;
  const delayMs = config.delayMs ?? 2000;
  const userAgent =
    config.userAgent ??
    "GraviolaTestApp/1.0 (https://github.com/gravio-la; local testapp)";
  const skipBytes = config.skipIfLargerThanBytes ?? 1000;
  const outDir = resolve(dir, config.outputDir ?? "../public/items");

  await mkdir(outDir, { recursive: true });

  let downloadedSomething = false;

  for (const { commonsTitle, filename } of config.items) {
    const dest = join(outDir, filename);

    try {
      const st = await stat(dest);
      if (st.size > skipBytes) {
        console.log(`skip ${filename} (exists)`);
        continue;
      }
    } catch {
      /* missing */
    }

    if (downloadedSomething) {
      await new Promise((r) => setTimeout(r, delayMs));
    }

    const url = await thumbUrl(commonsTitle, thumbWidth, userAgent);
    const img = await fetch(url, { headers: { "User-Agent": userAgent } });
    if (!img.ok) throw new Error(`GET ${url} → ${img.status}`);
    await writeFile(dest, new Uint8Array(await img.arrayBuffer()));
    downloadedSomething = true;
    console.log(`OK ${filename} <- ${commonsTitle}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
