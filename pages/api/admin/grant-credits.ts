import type { NextApiRequest, NextApiResponse } from "next";
import db from "#database";

// One-time admin endpoint — protected by secret token
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const { token, username, balance } = req.body;

  if (token !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const user = await db
    .selectFrom("users")
    .select(["id", "username"])
    .where("username", "=", username)
    .executeTakeFirst()
    .catch(() => null);

  if (!user) return res.status(404).json({ error: "User not found" });

  const targetBalance = balance ?? 999999999;

  // Upsert wallet
  const existing = await db
    .selectFrom("wallet")
    .selectAll()
    .where("userId", "=", user.id)
    .executeTakeFirst()
    .catch(() => null);

  if (existing) {
    await db
      .updateTable("wallet")
      .set({ balance: targetBalance })
      .where("userId", "=", user.id)
      .execute();
  } else {
    await db
      .insertInto("wallet")
      .values({ userId: user.id, balance: targetBalance, currency: "FC" })
      .execute();
  }

  await db
    .insertInto("transactions")
    .values({
      userId: user.id,
      amount: targetBalance,
      type: "bonus",
      description: "Admin grant — unlimited MVP testing credits",
    })
    .execute()
    .catch(() => null);

  return res.status(200).json({
    success: true,
    userId: user.id,
    username: user.username,
    balance: targetBalance,
  });
}
