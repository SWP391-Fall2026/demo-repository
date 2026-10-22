-- Approved direction: preserve backend mappings; add the missing live schema.
-- MANUAL migration, not a Spring Boot init script. Run atomically via the staging runner.
-- Expected pre-state: 2026-10-19 live catalog. Fail on drift; no IF NOT EXISTS.
-- Nullable historical additions deliberately have no fabricated defaults/backfill.

ALTER TABLE public.audit_logs ADD COLUMN user_id varchar(255) NULL;
ALTER TABLE public.audit_logs ADD COLUMN entity_id varchar(255) NULL;
ALTER TABLE public.audit_logs ADD COLUMN facility_code varchar(255) NULL;

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

CREATE TABLE public.invoices (
  id varchar(255) PRIMARY KEY,
  reservation_id varchar(255) NULL,
  contract_id varchar(255) NULL,
  user_id varchar(255) NULL,
  facility_code varchar(255) NULL,
  invoice_type varchar(255) NULL,
  amount numeric NULL,
  status varchar(255) NULL,
  issued_at timestamp without time zone NULL,
  due_at timestamp without time zone NULL,
  description varchar(255) NULL,
  price_snapshot varchar(255) NULL
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.invoices FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE public.payments ADD COLUMN invoice_id varchar(255) NULL;
ALTER TABLE public.payments ADD COLUMN user_id varchar(255) NULL;
ALTER TABLE public.payments ADD COLUMN facility_code varchar(255) NULL;
ALTER TABLE public.payments ADD COLUMN idempotency_key varchar(255) NULL;

ALTER TABLE public.refund_requests ADD COLUMN user_id varchar(255) NULL;
ALTER TABLE public.refund_requests ADD COLUMN requested_by varchar(255) NULL;
ALTER TABLE public.refund_requests ADD COLUMN on_behalf_basis varchar(255) NULL;
ALTER TABLE public.refund_requests ADD COLUMN refund_type varchar(255) NULL;
ALTER TABLE public.refund_requests ADD COLUMN requested_amount numeric NULL;
ALTER TABLE public.refund_requests ADD COLUMN reason varchar(255) NULL;
ALTER TABLE public.refund_requests ADD COLUMN decision_reason varchar(255) NULL;
ALTER TABLE public.refund_requests ADD COLUMN approved_by varchar(255) NULL;
ALTER TABLE public.refund_requests ADD COLUMN exception_requested boolean NULL;
ALTER TABLE public.refund_requests ADD COLUMN idempotency_key varchar(255) NULL;

CREATE TABLE public.refund_transactions (
  id varchar(255) PRIMARY KEY,
  refund_request_id varchar(255) NULL,
  performed_by varchar(255) NULL,
  confirmed_by varchar(255) NULL,
  transfer_reference varchar(255) NULL,
  evidence_path varchar(255) NULL,
  original_name varchar(255) NULL,
  content_type varchar(255) NULL,
  status varchar(255) NULL,
  created_at timestamp without time zone NULL,
  confirmed_at timestamp without time zone NULL
);
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.refund_transactions FROM PUBLIC, anon, authenticated, service_role;

-- No new FK/cardinality constraints: scalar JPA IDs are not evidence for those invariants.
-- Existing CHECKs, columns, timestamps, RLS policies, sequences and grants are preserved.
