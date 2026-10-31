-- Module 5: facility profile columns for FR-023 (opening hours, cover image).
-- MANUAL migration, not a Spring Boot init script. Run atomically via the staging runner.
-- Backend default ddl-auto=validate; profile local/test use H2 create-drop separately.

ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS opening_hours varchar(255) NULL;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS image_url varchar(2048) NULL;

-- No backfill: historical rows keep NULL until Ops updates them.
-- Existing CHECKs, columns, timestamps, RLS policies, sequences and grants are preserved.
