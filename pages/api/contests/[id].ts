import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
import db from "#database";
import { sql } from "kysely";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const contestId = parseInt(String(req.query.id));

  if (isNaN(contestId)) return res.status(400).json({ error: "Invalid id" });

  const contest = await db
    .selectFrom("contests")
    .selectAll()
    .where("id", "=", contestId)
    .executeTakeFirst()
    .catch(() => null);

  if (!contest) return res.status(404).json({ error: "Contest not found" });

  if (req.method === "GET") {
    const entries = await db
      .selectFrom("contestEntries")
      .innerJoin("users", "users.id", "contestEntries.userId")
      .select([
        "contestEntries.id",
        "contestEntries.userId",
        "contestEntries.teamName",
        "contestEntries.score",
        "contestEntries.rank",
        "contestEntries.prizeWon",
        "contestEntries.enteredAt",
        "users.username",
      ])
      .where("contestEntries.contestId", "=", contestId)
      .orderBy("contestEntries.score", "desc")
      .limit(100)
      .execute()
      .catch(() => []);

    return res.status(200).json({ contest, entries, entryCount: entries.length });
  }

  // POST /api/contests/[id] — enter a contest
  if (req.method === "POST") {
    if (!session) return res.status(401).json({ error: "Not authenticated" });

    const { teamName } = req.body;
    const userId = session.user.id;

    // Check already entered
    const existing = await db
      .selectFrom("contestEntries")
      .selectAll()
      .where("contestId", "=", contestId)
      .where("userId", "=", userId)
      .executeTakeFirst()
      .catch(() => null);

    if (existing) return res.status(409).json({ error: "Already entered this contest" });

    // Check capacity
    if (contest.currentEntries >= contest.maxEntries) {
      return res.status(400).json({ error: "Contest is full" });
    }

    if (contest.entryFee > 0) {
      // Deduct from wallet
      const wallet = await db
        .selectFrom("wallet")
        .selectAll()
        .where("userId", "=", userId)
        .executeTakeFirst()
        .catch(() => null);

      if (!wallet || wallet.balance < contest.entryFee) {
        return res.status(402).json({ error: "Insufficient balance" });
      }

      await db
        .updateTable("wallet")
        .set({ balance: wallet.balance - contest.entryFee })
        .where("userId", "=", userId)
        .execute();

      await db
        .insertInto("transactions")
        .values({
          userId,
          amount: -contest.entryFee,
          type: "contest_entry",
          description: `Entered: ${contest.name}`,
          relatedId: contestId,
        })
        .execute();
    }

    // Create entry
    await db
      .insertInto("contestEntries")
      .values({
        contestId,
        userId,
        teamName: teamName ?? "My Team",
        score: 0,
        prizeWon: 0,
      })
      .execute();

    // Increment entry count
    await db
      .updateTable("contests")
      .set(({ eb }) => ({ currentEntries: eb("currentEntries", "+", 1) }))
      .where("id", "=", contestId)
      .execute();

    return res.status(201).json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
