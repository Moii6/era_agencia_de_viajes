-- Tracks which OWNERs have already signed off on a pending create/edit, so
-- consensus (every other active OWNER) can be required instead of just one.
ALTER TABLE "User" ADD COLUMN "approvedByUserIds" TEXT[] NOT NULL DEFAULT '{}';
