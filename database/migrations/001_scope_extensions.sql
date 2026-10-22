-- Reviewed deployment candidate: NOT automatically executed by Spring Boot.

-- Reference: database/reference/current-schema-as-is.sql (15 existing tables).

-- Take a backup and complete docs/guides/database-migration.md before deployment.

BEGIN;

SET LOCAL TIME ZONE 'Asia/Ho_Chi_Minh';

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id varchar(255);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id varchar(255);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS facility_code varchar(255);

CREATE TABLE IF NOT EXISTS public.invoices (
  id varchar(255) PRIMARY KEY,
  reservation_id varchar(255),
  contract_id varchar(255),
  user_id varchar(255),
  facility_code varchar(255),
  invoice_type varchar(255),
  amount numeric(38,2),
  status varchar(255),
  issued_at timestamp without time zone,
  due_at timestamp without time zone,
  description varchar(255),
  price_snapshot varchar(255)
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_id varchar(255);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id varchar(255);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS facility_code varchar(255);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS idempotency_key varchar(255);

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS user_id varchar(255);

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS requested_by varchar(255);

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS on_behalf_basis varchar(255);

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS refund_type varchar(255);

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS requested_amount numeric(38,2);

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS reason varchar(255);

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS decision_reason varchar(255);

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS approved_by varchar(255);

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS exception_requested boolean;

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS idempotency_key varchar(255);

CREATE TABLE IF NOT EXISTS public.refund_transactions (
  id varchar(255) PRIMARY KEY,
  refund_request_id varchar(255),
  performed_by varchar(255),
  confirmed_by varchar(255),
  transfer_reference varchar(255),
  evidence_path varchar(255),
  original_name varchar(255),
  content_type varchar(255),
  status varchar(255),
  created_at timestamp without time zone,
  confirmed_at timestamp without time zone
);

ALTER TABLE public.units ADD COLUMN IF NOT EXISTS held_by_reservation_id varchar(255);

ALTER TABLE public.units ADD COLUMN IF NOT EXISTS readiness_status varchar(255);

ALTER TABLE public.units ADD COLUMN IF NOT EXISTS readiness_requested_by varchar(255);

ALTER TABLE public.units ADD COLUMN IF NOT EXISTS readiness_notes varchar(255);

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS start_at timestamp without time zone;

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS end_at timestamp without time zone;

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS terminated_at timestamp without time zone;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS appointment_at timestamp without time zone;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS approved_appointment_at timestamp without time zone;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS hold_until timestamp without time zone;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS arrived_at timestamp without time zone;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS no_show_alert_at timestamp without time zone;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS extension_minutes integer;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS extension_used boolean;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS incident_open boolean;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS exception_reason varchar(255);

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS monthly_price_snapshot numeric(38,2);

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS schedule_approved_by varchar(255);

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS rental_start_at timestamp without time zone;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS cancelled_at timestamp without time zone;

-- Replace only the status check on reservations, preserving unrelated checks.
DO $$ DECLARE c record; BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public.reservations'::regclass AND contype='c' AND pg_get_constraintdef(oid) ~ '\mstatus\M' LOOP
    EXECUTE format('ALTER TABLE public.reservations DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check_v2 CHECK (status IN ('PENDING_PAYMENT','RESERVED','CHECKED_IN','CANCELLED','EXPIRED','NO_SHOW')) NOT VALID;
ALTER TABLE public.reservations VALIDATE CONSTRAINT reservations_status_check_v2;
ALTER TABLE public.units ALTER COLUMN pin_code DROP DEFAULT;
CREATE UNIQUE INDEX IF NOT EXISTS payments_idempotency_key_uq ON public.payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS refund_transaction_reference_uq ON public.refund_transactions(transfer_reference);
CREATE UNIQUE INDEX IF NOT EXISTS refund_request_execution_uq ON public.refund_transactions(refund_request_id);
CREATE INDEX IF NOT EXISTS refunds_payment_status_idx ON public.refund_requests(payment_id,status);
CREATE INDEX IF NOT EXISTS reservations_facility_type_status_idx ON public.reservations(facility_code,unit_type,status);
CREATE INDEX IF NOT EXISTS invoices_customer_status_idx ON public.invoices(user_id,status);
CREATE UNIQUE INDEX IF NOT EXISTS contracts_reservation_uq ON public.contracts(reservation_id) WHERE reservation_id IS NOT NULL;
COMMIT;
-- No legacy timestamps, balances, appointments or unit holds are guessed here.
-- Required legacy reconciliation is documented separately; validate is not proof of business-data readiness.

