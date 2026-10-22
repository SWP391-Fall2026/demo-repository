-- REVIEW DRAFT ONLY. Not wired to Flyway/Liquibase/application resources.
-- Gate: select approved UNIQUE/FK candidates only; remove equivalent existing live constraints; reconcile duplicates/orphans; exact status CHECK definition required. NOT VALID still enforces new writes.
BEGIN;
DO $draft_guard$ BEGIN
  RAISE EXCEPTION 'DRAFT BLOCKED: approval and live metadata review required';
END; $draft_guard$;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- All UNIQUE candidates below require separate cardinality/scope approval.
-- Declared JPA unique keys: select only when no equivalent live uniqueness exists.
CREATE UNIQUE INDEX ux_draft_users_username ON public.users(username);
CREATE UNIQUE INDEX ux_draft_users_email ON public.users(email);
CREATE UNIQUE INDEX ux_draft_payments_idempotency ON public.payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX ux_draft_refund_payment_key ON public.refund_requests(payment_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX ux_draft_contract_reservation ON public.contracts(reservation_id) WHERE reservation_id IS NOT NULL;
-- Conditional: current API's Optional assumption; may conflict with periodic historic billing.
CREATE UNIQUE INDEX ux_draft_invoice_initial_kind ON public.invoices(reservation_id,invoice_type)
  WHERE reservation_id IS NOT NULL AND invoice_type IN ('DEPOSIT','RENT');
-- Conditional: approve reference namespace and transfer-attempt cardinality first.
CREATE UNIQUE INDEX ux_draft_refund_transfer_reference ON public.refund_transactions(transfer_reference);
CREATE UNIQUE INDEX ux_draft_refund_one_execution ON public.refund_transactions(refund_request_id);
-- Nonunique candidates; inspect existing index definitions and EXPLAIN before selecting.
CREATE INDEX ix_draft_refund_payment_status ON public.refund_requests(payment_id,status);
CREATE INDEX ix_draft_reservation_scope ON public.reservations(facility_code,unit_type,status);
CREATE INDEX ix_draft_invoice_owner_status ON public.invoices(user_id,status);

-- BLOCKED TEMPLATE: fill exact name AND confirm definition from live M05.
-- Never blanket-drop checks; this placeholder deliberately cannot match a normal live name.
ALTER TABLE public.reservations DROP CONSTRAINT "__REVIEWED_LIVE_STATUS_CONSTRAINT_NAME__";
ALTER TABLE public.reservations ADD CONSTRAINT ck_draft_reservation_status
  CHECK (status IN ('PENDING_PAYMENT','RESERVED','CHECKED_IN','CANCELLED','EXPIRED','NO_SHOW')) NOT VALID;
-- Other CHECK/NOT NULL changes remain deferred: review states, nulls, historical rows first.


-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.users ADD CONSTRAINT fk_draft_users_facility_code
  FOREIGN KEY (facility_code) REFERENCES public.facilities (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.units ADD CONSTRAINT fk_draft_units_held_by_reservation_id
  FOREIGN KEY (held_by_reservation_id) REFERENCES public.reservations (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.units ADD CONSTRAINT fk_draft_units_readiness_requested_by
  FOREIGN KEY (readiness_requested_by) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.reservations ADD CONSTRAINT fk_draft_reservations_unit_code
  FOREIGN KEY (unit_code) REFERENCES public.units (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.reservations ADD CONSTRAINT fk_draft_reservations_schedule_approved_by
  FOREIGN KEY (schedule_approved_by) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.contracts ADD CONSTRAINT fk_draft_contracts_reservation_id
  FOREIGN KEY (reservation_id) REFERENCES public.reservations (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.contracts ADD CONSTRAINT fk_draft_contracts_facility_code
  FOREIGN KEY (facility_code) REFERENCES public.facilities (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.invoices ADD CONSTRAINT fk_draft_invoices_reservation_id
  FOREIGN KEY (reservation_id) REFERENCES public.reservations (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.invoices ADD CONSTRAINT fk_draft_invoices_contract_id
  FOREIGN KEY (contract_id) REFERENCES public.contracts (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.invoices ADD CONSTRAINT fk_draft_invoices_user_id
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.invoices ADD CONSTRAINT fk_draft_invoices_facility_code
  FOREIGN KEY (facility_code) REFERENCES public.facilities (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.payments ADD CONSTRAINT fk_draft_payments_invoice_id
  FOREIGN KEY (invoice_id) REFERENCES public.invoices (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.payments ADD CONSTRAINT fk_draft_payments_reservation_id
  FOREIGN KEY (reservation_id) REFERENCES public.reservations (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.payments ADD CONSTRAINT fk_draft_payments_contract_id
  FOREIGN KEY (contract_id) REFERENCES public.contracts (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.payments ADD CONSTRAINT fk_draft_payments_user_id
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.payments ADD CONSTRAINT fk_draft_payments_facility_code
  FOREIGN KEY (facility_code) REFERENCES public.facilities (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_requests ADD CONSTRAINT fk_draft_refund_requests_payment_id
  FOREIGN KEY (payment_id) REFERENCES public.payments (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_requests ADD CONSTRAINT fk_draft_refund_requests_reservation_id
  FOREIGN KEY (reservation_id) REFERENCES public.reservations (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_requests ADD CONSTRAINT fk_draft_refund_requests_contract_id
  FOREIGN KEY (contract_id) REFERENCES public.contracts (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_requests ADD CONSTRAINT fk_draft_refund_requests_inspection_id
  FOREIGN KEY (inspection_id) REFERENCES public.inspection_records (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_requests ADD CONSTRAINT fk_draft_refund_requests_facility_code
  FOREIGN KEY (facility_code) REFERENCES public.facilities (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_requests ADD CONSTRAINT fk_draft_refund_requests_user_id
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_requests ADD CONSTRAINT fk_draft_refund_requests_requested_by
  FOREIGN KEY (requested_by) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_requests ADD CONSTRAINT fk_draft_refund_requests_approved_by
  FOREIGN KEY (approved_by) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_transactions ADD CONSTRAINT fk_draft_refund_transactions_refund_request_id
  FOREIGN KEY (refund_request_id) REFERENCES public.refund_requests (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_transactions ADD CONSTRAINT fk_draft_refund_transactions_performed_by
  FOREIGN KEY (performed_by) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.refund_transactions ADD CONSTRAINT fk_draft_refund_transactions_confirmed_by
  FOREIGN KEY (confirmed_by) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.handover_records ADD CONSTRAINT fk_draft_handover_records_contract_id
  FOREIGN KEY (contract_id) REFERENCES public.contracts (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.handover_records ADD CONSTRAINT fk_draft_handover_records_reservation_id
  FOREIGN KEY (reservation_id) REFERENCES public.reservations (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.handover_records ADD CONSTRAINT fk_draft_handover_records_staff_id
  FOREIGN KEY (staff_id) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.inspection_records ADD CONSTRAINT fk_draft_inspection_records_contract_id
  FOREIGN KEY (contract_id) REFERENCES public.contracts (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.inspection_records ADD CONSTRAINT fk_draft_inspection_records_staff_id
  FOREIGN KEY (staff_id) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.daily_tasks ADD CONSTRAINT fk_draft_daily_tasks_staff_id
  FOREIGN KEY (staff_id) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.daily_tasks ADD CONSTRAINT fk_draft_daily_tasks_facility_code
  FOREIGN KEY (facility_code) REFERENCES public.facilities (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.daily_tasks ADD CONSTRAINT fk_draft_daily_tasks_unit_code
  FOREIGN KEY (unit_code) REFERENCES public.units (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.daily_tasks ADD CONSTRAINT fk_draft_daily_tasks_reservation_id
  FOREIGN KEY (reservation_id) REFERENCES public.reservations (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.daily_tasks ADD CONSTRAINT fk_draft_daily_tasks_contract_id
  FOREIGN KEY (contract_id) REFERENCES public.contracts (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.support_tickets ADD CONSTRAINT fk_draft_support_tickets_facility_code
  FOREIGN KEY (facility_code) REFERENCES public.facilities (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.support_tickets ADD CONSTRAINT fk_draft_support_tickets_unit_code
  FOREIGN KEY (unit_code) REFERENCES public.units (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.support_tickets ADD CONSTRAINT fk_draft_support_tickets_staff_assigned
  FOREIGN KEY (staff_assigned) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.business_policies ADD CONSTRAINT fk_draft_business_policies_updated_by
  FOREIGN KEY (updated_by) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.audit_logs ADD CONSTRAINT fk_draft_audit_logs_user_id
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;

-- Candidate ONLY: omit if an equivalent live FK already exists.
ALTER TABLE public.audit_logs ADD CONSTRAINT fk_draft_audit_logs_facility_code
  FOREIGN KEY (facility_code) REFERENCES public.facilities (code) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;
-- Dry-run disposition only. No COMMIT in draft files.
ROLLBACK;
