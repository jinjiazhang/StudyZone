-- Anchor for timed heart regeneration.
ALTER TABLE "UserWallet" ADD COLUMN "heartsUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
