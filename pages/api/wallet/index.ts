import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
import db from "#database";

async function ensureWallet(userId: number) {
  const wallet = await db
    .selectFrom("wallet")
    .selectAll()
    .where("userId", "=", userId)
    .executeTakeFirst()
    .catch(() => null);

  if (!wallet) {
    await db
      .insertInto("wallet")
      .values({ userId, balance: 10000, currency: "FC" })
      .execute()
      .catch(() => null);

    // Record initial bonus transaction
    await db
      .insertInto("transactions")
      .values({
        userId,
        amount: 10000,
        type: "bonus",
        description: "Welcome bonus — 10,000 Fantasy Coins!",
      })
      .execute()
      .catch(() => null);

    return { userId, balance: 10000, currency: "FC" };
  }
  return wallet;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const userId = session.user.id;

  if (req.method === "GET") {
    const wallet = await ensureWallet(userId);
    const transactions = await db
      .selectFrom("transactions")
      .selectAll()
      .where("userId", "=", userId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .execute()
      .catch(() => []);

    return res.status(200).json({ wallet, transactions });
  }

  if (req.method === "POST") {
    const { action, amount } = req.body;
    if (!action || !amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: "action and amount required" });
    }

    const numAmount = parseFloat(amount);
    const wallet = await ensureWallet(userId);

    if (action === "deposit") {
      await db
        .updateTable("wallet")
        .set({ balance: wallet.balance + numAmount })
        .where("userId", "=", userId)
        .execute();

      await db
        .insertInto("transactions")
        .values({ userId, amount: numAmount, type: "deposit", description: "Deposit" })
        .execute();

      return res.status(200).json({ success: true, balance: wallet.balance + numAmount });
    }

    if (action === "withdraw") {
      if (wallet.balance < numAmount) {
        return res.status(402).json({ error: "Insufficient balance" });
      }
      await db
        .updateTable("wallet")
        .set({ balance: wallet.balance - numAmount })
        .where("userId", "=", userId)
        .execute();

      await db
        .insertInto("transactions")
        .values({ userId, amount: -numAmount, type: "withdrawal", description: "Withdrawal" })
        .execute();

      return res.status(200).json({ success: true, balance: wallet.balance - numAmount });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  res.status(405).json({ error: "Method not allowed" });
}
