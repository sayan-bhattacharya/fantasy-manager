import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "#/pages/api/auth/[...nextauth]";
import db from "#database";

export const ALL_ACHIEVEMENTS = [
  {
    type: "first_league",
    title: "Pioneer",
    description: "Created your first league",
    icon: "🌟",
    rarity: "common",
  },
  {
    type: "first_win",
    title: "Winner",
    description: "Won your first matchday",
    icon: "🏆",
    rarity: "rare",
  },
  {
    type: "streak_7",
    title: "On Fire",
    description: "Logged in 7 days in a row",
    icon: "🔥",
    rarity: "rare",
  },
  {
    type: "streak_30",
    title: "Dedicated",
    description: "Logged in 30 days in a row",
    icon: "💎",
    rarity: "epic",
  },
  {
    type: "top_scorer",
    title: "Top Scorer",
    description: "Finished #1 in a public contest",
    icon: "⚡",
    rarity: "legendary",
  },
  {
    type: "first_transfer",
    title: "Transfer Expert",
    description: "Made your first player transfer",
    icon: "🔄",
    rarity: "common",
  },
  {
    type: "prediction_ace",
    title: "Prediction Ace",
    description: "Got 5 exact scoreline predictions",
    icon: "🎯",
    rarity: "epic",
  },
  {
    type: "full_squad",
    title: "Squad Ready",
    description: "Filled all 11 positions in your squad",
    icon: "👥",
    rarity: "common",
  },
  {
    type: "contest_10",
    title: "Contest Veteran",
    description: "Entered 10 contests",
    icon: "🎖️",
    rarity: "rare",
  },
  {
    type: "big_win",
    title: "Big Win",
    description: "Won over 5,000 FC in a single contest",
    icon: "💰",
    rarity: "legendary",
  },
];

export async function grantAchievement(userId: number, type: string) {
  const def = ALL_ACHIEVEMENTS.find((a) => a.type === type);
  if (!def) return;

  const exists = await db
    .selectFrom("achievements")
    .selectAll()
    .where("userId", "=", userId)
    .where("type", "=", type)
    .executeTakeFirst()
    .catch(() => null);

  if (exists) return;

  await db
    .insertInto("achievements")
    .values({ userId, ...def })
    .execute()
    .catch(() => null);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);

  if (req.method === "GET") {
    const userId = req.query.userId
      ? parseInt(String(req.query.userId))
      : session?.user.id;

    if (!userId) return res.status(400).json({ error: "userId required" });

    const earned = await db
      .selectFrom("achievements")
      .selectAll()
      .where("userId", "=", userId)
      .orderBy("earnedAt", "desc")
      .execute()
      .catch(() => []);

    return res.status(200).json({
      earned,
      all: ALL_ACHIEVEMENTS,
      progress: ALL_ACHIEVEMENTS.map((a) => ({
        ...a,
        unlocked: earned.some((e) => e.type === a.type),
      })),
    });
  }

  res.status(405).json({ error: "Method not allowed" });
}
