/**
 * Scrapes EPL player data from the public Fantasy Premier League API and
 * populates the local SQLite database.  Player images are AI-generated on
 * demand via Pollinations.ai (no API key required, no local downloads).
 *
 * Usage:
 *   npm run scrape
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import db from "../Modules/database";
import noAccents from "../Modules/normalize";

const LEAGUE = "EPL";
const EPL_API = "https://fantasy.premierleague.com/api/bootstrap-static/";

/** Map FPL element_type → internal position key */
const POSITION_MAP: Record<number, string> = {
  1: "gk",
  2: "def",
  3: "mid",
  4: "att",
};

/** Friendly position label used inside the AI image prompt */
const POSITION_LABEL: Record<string, string> = {
  gk: "goalkeeper",
  def: "defender",
  mid: "midfielder",
  att: "forward",
};

/**
 * Builds a Pollinations.ai URL that generates a unique AI portrait for the
 * given player.  Seed is derived from the numeric uid so the same player
 * always gets the same generated image, but different players differ.
 */
function aiImageUrl(name: string, position: string, uid: string): string {
  const posLabel = POSITION_LABEL[position] ?? "footballer";
  // Use the first 8 digits of uid as seed (uid is the FPL player code)
  const seed = uid.replace(/\D/g, "").slice(0, 8) || "1";
  const prompt = encodeURIComponent(
    `portrait of a professional ${posLabel} football player ` +
      `${name} wearing a colorful jersey ` +
      `studio lighting photorealistic high quality`,
  );
  return (
    `https://image.pollinations.ai/prompt/${prompt}` +
    `?width=110&height=140&nologo=true&seed=${seed}&model=flux`
  );
}

/** Strip accents the same way the rest of the codebase does */
function toAscii(name: string): string {
  return noAccents(name);
}

interface EPLTeam {
  id: number;
  short_name: string;
  name: string;
}

interface EPLElement {
  id: number;
  code: number;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  status: string;
  now_cost: number;
  total_points: number;
  points_per_game: string;
  event_points: number;
}

interface EPLBootstrap {
  teams: EPLTeam[];
  elements: EPLElement[];
}

async function scrape(): Promise<void> {
  console.log("Fetching EPL data from FPL API …");
  const data: EPLBootstrap = await fetch(EPL_API).then((r) => {
    if (!r.ok) throw new Error(`FPL API returned ${r.status}`);
    return r.json() as Promise<EPLBootstrap>;
  });

  console.log(
    `  ${data.teams.length} clubs, ${data.elements.length} players found.`,
  );

  // ── 1. Disable local picture downloads so images are proxied from URL ──────
  await db
    .insertInto("data")
    .values({ value1: "configDownloadPicture", value2: "no" })
    .onConflict((oc) =>
      oc.column("value1").doUpdateSet({ value2: "no" }),
    )
    .execute();

  // ── 2. Build a lookup: FPL team id → short_name ───────────────────────────
  const teamMap = new Map<number, EPLTeam>(data.teams.map((t) => [t.id, t]));

  // ── 3. Upsert clubs ────────────────────────────────────────────────────────
  console.log("Upserting clubs …");
  for (const team of data.teams) {
    await db
      .insertInto("clubs")
      .values({
        club: team.short_name,
        fullName: team.name,
        gameStart: 0,
        gameEnd: 0,
        opponent: "",
        home: 0,
        league: LEAGUE,
        exists: 1,
        teamScore: null,
        opponentScore: null,
      })
      .onConflict((oc) =>
        oc.columns(["club", "league"]).doUpdateSet({
          fullName: team.name,
          exists: 1,
        }),
      )
      .execute();
  }

  // ── 4. Upsert players ──────────────────────────────────────────────────────
  console.log("Upserting players …");
  let inserted = 0;
  let updated = 0;

  for (const el of data.elements) {
    // Skip players who have been permanently transferred out
    if (el.status === "u") continue;

    const team = teamMap.get(el.team);
    if (!team) continue;

    const uid = String(el.code);
    const name = `${el.first_name} ${el.second_name}`;
    const position = POSITION_MAP[el.element_type] ?? "gk";
    const aiUrl = aiImageUrl(name, position, uid);

    // Map FPL status → forecast
    let forecast = "a";
    if (el.status === "i" || el.status === "n" || el.status === "s") {
      forecast = "m";
    } else if (el.status === "d") {
      forecast = "u";
    }

    // Upsert picture record (keyed by URL)
    let pictureRecord = await db
      .selectFrom("pictures")
      .select(["id"])
      .where("url", "=", aiUrl)
      .executeTakeFirst();

    if (!pictureRecord) {
      await db
        .insertInto("pictures")
        .values({ url: aiUrl, height: 140, width: 110, downloaded: 0, downloading: 0 })
        .execute();
      pictureRecord = await db
        .selectFrom("pictures")
        .select(["id"])
        .where("url", "=", aiUrl)
        .executeTakeFirstOrThrow();
    }

    const existing = await db
      .selectFrom("players")
      .select(["uid"])
      .where("uid", "=", uid)
      .where("league", "=", LEAGUE)
      .executeTakeFirst();

    if (!existing) {
      await db
        .insertInto("players")
        .values({
          uid,
          name,
          nameAscii: toAscii(name),
          club: team.short_name,
          pictureID: pictureRecord.id,
          value: el.now_cost * 100_000,
          sale_price: el.now_cost * 100_000,
          position,
          forecast,
          total_points: el.total_points,
          average_points: parseFloat(el.points_per_game),
          last_match: el.event_points,
          locked: 0,
          exists: 1,
          league: LEAGUE,
        })
        .execute();
      inserted++;
    } else {
      await db
        .updateTable("players")
        .set({
          name,
          nameAscii: toAscii(name),
          club: team.short_name,
          pictureID: pictureRecord.id,
          value: el.now_cost * 100_000,
          sale_price: el.now_cost * 100_000,
          position,
          forecast,
          total_points: el.total_points,
          average_points: parseFloat(el.points_per_game),
          last_match: el.event_points,
          exists: 1,
        })
        .where("uid", "=", uid)
        .where("league", "=", LEAGUE)
        .execute();
      updated++;
    }
  }

  console.log(
    `Done.  Inserted ${inserted} new players, updated ${updated} existing.`,
  );
  console.log(
    "AI-generated images will be fetched from Pollinations.ai on first view.",
  );

  await db.destroy();
}

scrape().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});
