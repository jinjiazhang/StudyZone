-- LeagueGroup: capacity + settledAt, drop the odd composite unique, refine index.
ALTER TABLE "LeagueGroup" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "LeagueGroup" ADD COLUMN "settledAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "LeagueGroup_tier_weekStart_id_key";
DROP INDEX IF EXISTS "LeagueGroup_weekStart_tier_idx";
CREATE INDEX "LeagueGroup_weekStart_tier_status_idx" ON "LeagueGroup"("weekStart", "tier", "status");

-- LeaderboardEntry: joinedAt + updatedAt + per-user index.
ALTER TABLE "LeaderboardEntry" ADD COLUMN "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "LeaderboardEntry" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "LeaderboardEntry_userId_idx" ON "LeaderboardEntry"("userId");

-- LeagueHistory: one row per user per settled week.
CREATE TABLE "LeagueHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "tier" TEXT NOT NULL,
    "finalRank" INTEGER NOT NULL,
    "weeklyXp" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "nextTier" TEXT NOT NULL,
    "gemsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeagueHistory_userId_weekStart_key" ON "LeagueHistory"("userId", "weekStart");
CREATE INDEX "LeagueHistory_userId_createdAt_idx" ON "LeagueHistory"("userId", "createdAt");

ALTER TABLE "LeagueHistory" ADD CONSTRAINT "LeagueHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
