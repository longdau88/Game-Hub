CREATE TABLE "creator_follows" (
    "follower_id" INTEGER NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "creator_follows_pkey" PRIMARY KEY ("follower_id", "creator_id")
);

CREATE INDEX "creator_follows_creator_id_idx" ON "creator_follows"("creator_id");

ALTER TABLE "creator_follows"
  ADD CONSTRAINT "creator_follows_follower_id_fkey"
  FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creator_follows"
  ADD CONSTRAINT "creator_follows_creator_id_fkey"
  FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
