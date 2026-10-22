-- REVIEW DRAFT ONLY. Not wired to Flyway/Liquibase/application resources.
-- Gate: confirm LIVE absence/types; no synthetic historic invoices/refunds. Existing owner/payment links must be reconciled.
BEGIN;
DO $draft_guard$ BEGIN
  RAISE EXCEPTION 'DRAFT BLOCKED: approval and live metadata review required';
END; $draft_guard$;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
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
-- Dry-run disposition only. No COMMIT in draft files.
ROLLBACK;
