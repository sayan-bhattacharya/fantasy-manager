import { Kysely, sql } from "kysely";

// Fantasy Football Revamp — adds contests, wallet, achievements, and streaks
export async function up(db: Kysely<unknown>): Promise<void> {
  // --- Wallet ---
  await db.schema
    .createTable("wallet")
    .addColumn("id", "integer", (col) =>
      col.primaryKey().autoIncrement().notNull(),
    )
    .addColumn("userId", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("balance", "real", (col) => col.defaultTo(10000).notNull())
    .addColumn("currency", "varchar", (col) => col.defaultTo("FC").notNull())
    .addColumn("updatedAt", "integer", (col) =>
      col.defaultTo(sql`(strftime('%s','now'))`).notNull(),
    )
    .execute();

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS wallet_userId ON wallet(userId)`.execute(
    db,
  );

  // --- Transactions ---
  await db.schema
    .createTable("transactions")
    .addColumn("id", "integer", (col) =>
      col.primaryKey().autoIncrement().notNull(),
    )
    .addColumn("userId", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("amount", "real", (col) => col.notNull())
    .addColumn("type", "varchar", (col) => col.notNull()) // 'deposit','withdrawal','contest_entry','contest_win','bonus'
    .addColumn("description", "varchar", (col) => col.defaultTo("").notNull())
    .addColumn("relatedId", "integer") // contest id or null
    .addColumn("createdAt", "integer", (col) =>
      col.defaultTo(sql`(strftime('%s','now'))`).notNull(),
    )
    .execute();

  // --- Contests ---
  await db.schema
    .createTable("contests")
    .addColumn("id", "integer", (col) =>
      col.primaryKey().autoIncrement().notNull(),
    )
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("description", "varchar", (col) => col.defaultTo("").notNull())
    .addColumn("type", "varchar", (col) => col.defaultTo("public").notNull()) // 'public','private','free','mega'
    .addColumn("leagueType", "varchar", (col) => col.defaultTo("EPL").notNull())
    .addColumn("entryFee", "real", (col) => col.defaultTo(0).notNull())
    .addColumn("prizePool", "real", (col) => col.defaultTo(0).notNull())
    .addColumn("maxEntries", "integer", (col) => col.defaultTo(100).notNull())
    .addColumn("currentEntries", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("matchday", "integer", (col) => col.defaultTo(1).notNull())
    .addColumn("status", "varchar", (col) => col.defaultTo("open").notNull()) // 'open','live','closed','settled'
    .addColumn("createdBy", "integer", (col) => col.references("users.id"))
    .addColumn("inviteCode", "varchar")
    .addColumn("startTime", "integer")
    .addColumn("endTime", "integer")
    .addColumn("createdAt", "integer", (col) =>
      col.defaultTo(sql`(strftime('%s','now'))`).notNull(),
    )
    .execute();

  // --- Contest Entries ---
  await db.schema
    .createTable("contestEntries")
    .addColumn("id", "integer", (col) =>
      col.primaryKey().autoIncrement().notNull(),
    )
    .addColumn("contestId", "integer", (col) =>
      col.notNull().references("contests.id").onDelete("cascade"),
    )
    .addColumn("userId", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("teamName", "varchar", (col) =>
      col.defaultTo("My Team").notNull(),
    )
    .addColumn("score", "real", (col) => col.defaultTo(0).notNull())
    .addColumn("rank", "integer")
    .addColumn("prizeWon", "real", (col) => col.defaultTo(0).notNull())
    .addColumn("enteredAt", "integer", (col) =>
      col.defaultTo(sql`(strftime('%s','now'))`).notNull(),
    )
    .execute();

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS contestEntries_unique ON contestEntries(contestId, userId)`.execute(
    db,
  );

  // --- Achievements ---
  await db.schema
    .createTable("achievements")
    .addColumn("id", "integer", (col) =>
      col.primaryKey().autoIncrement().notNull(),
    )
    .addColumn("userId", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("type", "varchar", (col) => col.notNull()) // 'first_league','first_win','streak_7','top_scorer',etc.
    .addColumn("title", "varchar", (col) => col.notNull())
    .addColumn("description", "varchar", (col) => col.defaultTo("").notNull())
    .addColumn("icon", "varchar", (col) => col.defaultTo("🏆").notNull())
    .addColumn("rarity", "varchar", (col) => col.defaultTo("common").notNull()) // 'common','rare','epic','legendary'
    .addColumn("earnedAt", "integer", (col) =>
      col.defaultTo(sql`(strftime('%s','now'))`).notNull(),
    )
    .execute();

  // --- User Streaks ---
  await db.schema
    .createTable("userStreaks")
    .addColumn("userId", "integer", (col) =>
      col.primaryKey().notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("currentStreak", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("longestStreak", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("lastActiveDate", "varchar", (col) =>
      col.defaultTo("").notNull(),
    )
    .addColumn("totalLogins", "integer", (col) => col.defaultTo(0).notNull())
    .execute();

  // --- Seed 3 default public contests ---
  const now = Math.floor(Date.now() / 1000);
  await sql`
    INSERT INTO contests (name, description, type, leagueType, entryFee, prizePool, maxEntries, matchday, status, startTime)
    VALUES
      ('Premier League Mega Contest', 'The biggest weekly fantasy football contest. Top 20% win prizes!', 'mega', 'EPL', 500, 50000, 10000, 1, 'open', ${now}),
      ('Free Kick Challenge', 'Free to enter. Build your best 11 and climb the leaderboard!', 'free', 'EPL', 0, 1000, 5000, 1, 'open', ${now}),
      ('Bundesliga Blitz', 'Fast-paced Bundesliga fantasy with instant scoring.', 'public', 'Bundesliga', 250, 10000, 500, 1, 'open', ${now})
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("userStreaks").ifExists().execute();
  await db.schema.dropTable("achievements").ifExists().execute();
  await db.schema.dropTable("contestEntries").ifExists().execute();
  await db.schema.dropTable("contests").ifExists().execute();
  await db.schema.dropTable("transactions").ifExists().execute();
  await db.schema.dropTable("wallet").ifExists().execute();
}
