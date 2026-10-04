-- Compatibility entry for the legacy backend/prisma migration history.
-- The root baseline migration 20260326230323_add_user_table already creates
-- these tables, so replaying the legacy CREATE TABLE statements would fail.
SELECT 1;
