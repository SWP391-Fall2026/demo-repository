-- REVIEW DRAFT ONLY. Not wired to Flyway/Liquibase/application resources.
-- Gate: only constraints actually selected/installed in approved D40; orphan checks pass; parent keys/types verified; agreed lock/traffic window.
BEGIN;
DO $draft_guard$ BEGIN
  RAISE EXCEPTION 'DRAFT BLOCKED: approval and live metadata review required';
END; $draft_guard$;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- Run per selected FK, not blindly as one large deployment transaction.
ALTER TABLE public.users VALIDATE CONSTRAINT fk_draft_users_facility_code;
ALTER TABLE public.units VALIDATE CONSTRAINT fk_draft_units_held_by_reservation_id;
ALTER TABLE public.units VALIDATE CONSTRAINT fk_draft_units_readiness_requested_by;
ALTER TABLE public.reservations VALIDATE CONSTRAINT fk_draft_reservations_unit_code;
ALTER TABLE public.reservations VALIDATE CONSTRAINT fk_draft_reservations_schedule_approved_by;
ALTER TABLE public.contracts VALIDATE CONSTRAINT fk_draft_contracts_reservation_id;
ALTER TABLE public.contracts VALIDATE CONSTRAINT fk_draft_contracts_facility_code;
ALTER TABLE public.invoices VALIDATE CONSTRAINT fk_draft_invoices_reservation_id;
ALTER TABLE public.invoices VALIDATE CONSTRAINT fk_draft_invoices_contract_id;
ALTER TABLE public.invoices VALIDATE CONSTRAINT fk_draft_invoices_user_id;
ALTER TABLE public.invoices VALIDATE CONSTRAINT fk_draft_invoices_facility_code;
ALTER TABLE public.payments VALIDATE CONSTRAINT fk_draft_payments_invoice_id;
ALTER TABLE public.payments VALIDATE CONSTRAINT fk_draft_payments_reservation_id;
ALTER TABLE public.payments VALIDATE CONSTRAINT fk_draft_payments_contract_id;
ALTER TABLE public.payments VALIDATE CONSTRAINT fk_draft_payments_user_id;
ALTER TABLE public.payments VALIDATE CONSTRAINT fk_draft_payments_facility_code;
ALTER TABLE public.refund_requests VALIDATE CONSTRAINT fk_draft_refund_requests_payment_id;
ALTER TABLE public.refund_requests VALIDATE CONSTRAINT fk_draft_refund_requests_reservation_id;
ALTER TABLE public.refund_requests VALIDATE CONSTRAINT fk_draft_refund_requests_contract_id;
ALTER TABLE public.refund_requests VALIDATE CONSTRAINT fk_draft_refund_requests_inspection_id;
ALTER TABLE public.refund_requests VALIDATE CONSTRAINT fk_draft_refund_requests_facility_code;
ALTER TABLE public.refund_requests VALIDATE CONSTRAINT fk_draft_refund_requests_user_id;
ALTER TABLE public.refund_requests VALIDATE CONSTRAINT fk_draft_refund_requests_requested_by;
ALTER TABLE public.refund_requests VALIDATE CONSTRAINT fk_draft_refund_requests_approved_by;
ALTER TABLE public.refund_transactions VALIDATE CONSTRAINT fk_draft_refund_transactions_refund_request_id;
ALTER TABLE public.refund_transactions VALIDATE CONSTRAINT fk_draft_refund_transactions_performed_by;
ALTER TABLE public.refund_transactions VALIDATE CONSTRAINT fk_draft_refund_transactions_confirmed_by;
ALTER TABLE public.handover_records VALIDATE CONSTRAINT fk_draft_handover_records_contract_id;
ALTER TABLE public.handover_records VALIDATE CONSTRAINT fk_draft_handover_records_reservation_id;
ALTER TABLE public.handover_records VALIDATE CONSTRAINT fk_draft_handover_records_staff_id;
ALTER TABLE public.inspection_records VALIDATE CONSTRAINT fk_draft_inspection_records_contract_id;
ALTER TABLE public.inspection_records VALIDATE CONSTRAINT fk_draft_inspection_records_staff_id;
ALTER TABLE public.daily_tasks VALIDATE CONSTRAINT fk_draft_daily_tasks_staff_id;
ALTER TABLE public.daily_tasks VALIDATE CONSTRAINT fk_draft_daily_tasks_facility_code;
ALTER TABLE public.daily_tasks VALIDATE CONSTRAINT fk_draft_daily_tasks_unit_code;
ALTER TABLE public.daily_tasks VALIDATE CONSTRAINT fk_draft_daily_tasks_reservation_id;
ALTER TABLE public.daily_tasks VALIDATE CONSTRAINT fk_draft_daily_tasks_contract_id;
ALTER TABLE public.support_tickets VALIDATE CONSTRAINT fk_draft_support_tickets_facility_code;
ALTER TABLE public.support_tickets VALIDATE CONSTRAINT fk_draft_support_tickets_unit_code;
ALTER TABLE public.support_tickets VALIDATE CONSTRAINT fk_draft_support_tickets_staff_assigned;
ALTER TABLE public.business_policies VALIDATE CONSTRAINT fk_draft_business_policies_updated_by;
ALTER TABLE public.audit_logs VALIDATE CONSTRAINT fk_draft_audit_logs_user_id;
ALTER TABLE public.audit_logs VALIDATE CONSTRAINT fk_draft_audit_logs_facility_code;
ALTER TABLE public.reservations VALIDATE CONSTRAINT ck_draft_reservation_status;
-- Dry-run disposition only. No COMMIT in draft files.
ROLLBACK;
