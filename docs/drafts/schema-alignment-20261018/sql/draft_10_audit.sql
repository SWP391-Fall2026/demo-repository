-- REVIEW DRAFT ONLY. Not wired to Flyway/Liquibase/application resources.
-- Gate: confirm supplied audit metadata still current; approve actor-facility meaning. No IF NOT EXISTS: fail on drift.
BEGIN;
DO $draft_guard$ BEGIN
  RAISE EXCEPTION 'DRAFT BLOCKED: approval and live metadata review required';
END; $draft_guard$;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE public.audit_logs ADD COLUMN user_id varchar(255) NULL;
ALTER TABLE public.audit_logs ADD COLUMN entity_id varchar(255) NULL;
ALTER TABLE public.audit_logs ADD COLUMN facility_code varchar(255) NULL;
-- Dry-run disposition only. No COMMIT in draft files.
ROLLBACK;
