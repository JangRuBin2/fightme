-- Remove varchar limits for premium support (unlimited text for premium users)
-- varchar -> text conversion (no data loss)

ALTER TABLE fights ALTER COLUMN user_claim TYPE text;
ALTER TABLE fights ALTER COLUMN opponent_claim TYPE text;
ALTER TABLE fights ALTER COLUMN comment TYPE text;
ALTER TABLE judges ALTER COLUMN description TYPE text;
