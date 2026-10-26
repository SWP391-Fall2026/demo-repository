-- Explicitly approved removal of the legacy table after verifying the backend uses daily_tasks.
-- Run only with a verified backup and dependency preflight. Never use CASCADE.
DROP TABLE public.staff_tasks RESTRICT;
