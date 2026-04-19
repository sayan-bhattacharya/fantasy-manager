import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
import db from "#database";
import { sql } from "kysely";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);

  if (req.method === "GET") {
    const { type, status = "open", page = "1" } = req.query;
    const limit = 12;
    const offset = (parseInt(String(page)) - 1) * limit;

    let query = db
      .selectFrom("contests")
      .selectAll()
      .where("status", "=", String(status))
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset);

    if (type && type !== "all") {
      query = query.where("type", "=", String(type));
    }

    const contests = await query.execute().catch(() => []);
    const total = await db
      .selectFrom("contests")
      .select(sql<number>`count(*)`.as("count"))
      .where("status", "=", String(status))
      .executeTakeFirst()
      .catch(() => ({ count: 0 }));

    return res.status(200).json({ contests, total: total?.count ?? 0 });
  }

  if (req.method === "POST") {
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    const { name, description, type, leagueType, entryFee, maxEntries } =
      req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const inviteCode =
      type === "private"
        ? Math.random().toString(36).substring(2, 10).toUpperCase()
        : null;

    const contest = await db
      .insertInto("contests")
      .values({
        name,
        description: description ?? "",
        type: type ?? "public",
        leagueType: leagueType ?? "EPL",
        entryFee: entryFee ?? 0,
        prizePool: (entryFee ?? 0) * (maxEntries ?? 100) * 0.9,
        maxEntries: maxEntries ?? 100,
        matchday: 1,
        status: "open",
        createdBy: session.user.id,
        inviteCode,
      })
      .returningAll()
      .executeTakeFirst()
      .catch(() => null);

    if (!contest)
      return res.status(500).json({ error: "Failed to create contest" });
    return res.status(201).json(contest);
  }

  res.status(405).json({ error: "Method not allowed" });
}
