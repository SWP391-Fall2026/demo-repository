-- Module 4: two-step return inspection (staff draft → customer confirm).
-- MANUAL migration, not a Spring Boot init script. Run atomically via the staging runner.
-- Backend default ddl-auto=validate; profile local/test use H2 create-drop separately.

ALTER TABLE public.inspection_records ADD COLUMN IF NOT EXISTS status varchar(40) NULL;
ALTER TABLE public.inspection_records ADD COLUMN IF NOT EXISTS customer_confirmed_at timestamp NULL;

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS inspection_confirmed_at timestamp NULL;

UPDATE public.inspection_records
SET status = 'CONFIRMED'
WHERE status IS NULL;

ALTER TABLE public.inspection_records ALTER COLUMN status SET DEFAULT 'PENDING_CONFIRM';
