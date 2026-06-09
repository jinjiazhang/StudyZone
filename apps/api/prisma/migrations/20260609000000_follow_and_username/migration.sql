-- Follow system + unique username.
--
-- NOTE: the username uniqueness is enforced by a FUNCTIONAL index on
-- lower("username"). Prisma cannot introspect functional indexes, so it lives
-- only here as raw SQL. When generating future migrations, review the diff with
-- `prisma migrate dev --create-only` and DROP any auto-generated attempt to
-- recreate/replace "User_username_lower_key".

-- 1) Add username (nullable first so we can backfill existing rows).
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- 2) Backfill: derive a base slug from nickname (ASCII alphanumerics/underscore,
--    lowercased, truncated to 18 chars), fall back to 'user', pad to >=3 chars,
--    then disambiguate collisions deterministically with a numeric suffix
--    (first occurrence keeps the bare slug; later ones get 1, 2, …).
WITH base AS (
  SELECT
    "id",
    "createdAt",
    COALESCE(
      NULLIF(LEFT(regexp_replace(lower("nickname"), '[^a-z0-9_]', '', 'g'), 18), ''),
      'user'
    ) AS slug
  FROM "User"
),
padded AS (
  SELECT "id", "createdAt",
    CASE WHEN length(slug) < 3 THEN rpad(slug, 3, '0') ELSE slug END AS slug
  FROM base
),
ranked AS (
  SELECT "id", slug,
    row_number() OVER (PARTITION BY slug ORDER BY "createdAt", "id") AS rn
  FROM padded
)
UPDATE "User" u
SET "username" = CASE
    WHEN r.rn = 1 THEN r.slug
    ELSE LEFT(r.slug, 20 - length((r.rn - 1)::text)) || (r.rn - 1)::text
  END
FROM ranked r
WHERE u."id" = r."id";

-- 3) Now that every row has a value, enforce NOT NULL.
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- 4) Case-insensitive uniqueness via functional index (acts as the safety net
--    should backfill ever produce a collision).
CREATE UNIQUE INDEX "User_username_lower_key" ON "User" (lower("username"));

-- 5) Follow table (asymmetric edges).
CREATE TABLE "Follow" (
    "followerId" TEXT NOT NULL,
    "followeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId","followeeId")
);

CREATE INDEX "Follow_followeeId_idx" ON "Follow"("followeeId");
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followeeId_fkey" FOREIGN KEY ("followeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6) Migrate existing accepted friendships into follow edges. Accept created
--    both directed rows, so this naturally yields mutual follows. pending/blocked
--    rows are dropped (no approval concept in a follow model).
INSERT INTO "Follow" ("followerId", "followeeId", "createdAt")
SELECT "userId", "friendId", "createdAt" FROM "Friendship" WHERE "status" = 'accepted'
ON CONFLICT DO NOTHING;

-- 7) Drop the old mutual-friendship table.
DROP TABLE "Friendship";
