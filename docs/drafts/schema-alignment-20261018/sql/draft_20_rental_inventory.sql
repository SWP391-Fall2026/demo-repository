-- REVIEW DRAFT ONLY. Not wired to Flyway/Liquibase/application resources.
-- Gate: LIVE metadata confirms every candidate column absent. Appointment/timezone and legacy reconciliation must be designed before cutover.
BEGIN;
DO $draft_guard$ BEGIN
  RAISE EXCEPTION 'DRAFT BLOCKED: approval and live metadata review required';
END; $draft_guard$;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE public.units ADD COLUMN held_by_reservation_id varchar(255) NULL;
ALTER TABLE public.units ADD COLUMN readiness_status varchar(255) NULL;
ALTER TABLE public.units ADD COLUMN readiness_requested_by varchar(255) NULL;
ALTER TABLE public.units ADD COLUMN readiness_notes varchar(255) NULL;
ALTER TABLE public.reservations ADD COLUMN appointment_at timestamp without time zone NULL;
ALTER TABLE public.reservations ADD COLUMN approved_appointment_at timestamp without time zone NULL;
ALTER TABLE public.reservations ADD COLUMN hold_until timestamp without time zone NULL;
ALTER TABLE public.reservations ADD COLUMN arrived_at timestamp without time zone NULL;
ALTER TABLE public.reservations ADD COLUMN no_show_alert_at timestamp without time zone NULL;
ALTER TABLE public.reservations ADD COLUMN extension_minutes integer NULL;
ALTER TABLE public.reservations ADD COLUMN extension_used boolean NULL;
ALTER TABLE public.reservations ADD COLUMN incident_open boolean NULL;
ALTER TABLE public.reservations ADD COLUMN exception_reason varchar(255) NULL;
ALTER TABLE public.reservations ADD COLUMN monthly_price_snapshot numeric NULL;
ALTER TABLE public.reservations ADD COLUMN schedule_approved_by varchar(255) NULL;
ALTER TABLE public.reservations ADD COLUMN rental_start_at timestamp without time zone NULL;
ALTER TABLE public.reservations ADD COLUMN cancelled_at timestamp without time zone NULL;
ALTER TABLE public.contracts ADD COLUMN start_at timestamp without time zone NULL;
ALTER TABLE public.contracts ADD COLUMN end_at timestamp without time zone NULL;
ALTER TABLE public.contracts ADD COLUMN terminated_at timestamp without time zone NULL;
-- Dry-run disposition only. No COMMIT in draft files.
ROLLBACK;
