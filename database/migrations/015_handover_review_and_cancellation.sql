-- REVIEW ONLY until explicitly approved for the target environment.
-- Additive migration; do not backfill deadlines or change historical payments.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.handover_records
  ADD COLUMN IF NOT EXISTS confirmation_deadline_at timestamp without time zone;

CREATE TABLE public.handover_reviews (
  id varchar(255) PRIMARY KEY,
  handover_id varchar(255) NOT NULL REFERENCES public.handover_records(id),
  contract_id varchar(255) NOT NULL REFERENCES public.contracts(id),
  reservation_id varchar(255) NOT NULL REFERENCES public.reservations(id),
  facility_code varchar(255) NOT NULL REFERENCES public.facilities(code),
  user_id varchar(255) NOT NULL REFERENCES public.users(id),
  kind varchar(255) NOT NULL CHECK (kind IN ('ISSUE', 'CANCELLATION', 'TIMEOUT')),
  status varchar(255) NOT NULL CHECK (status IN ('RECORDED', 'PENDING', 'APPROVED', 'REJECTED')),
  reason text NOT NULL,
  requested_by varchar(255),
  source varchar(255) NOT NULL CHECK (source IN ('CUSTOMER', 'STAFF', 'SYSTEM')),
  created_at timestamp without time zone NOT NULL,
  confirmation_deadline timestamp without time zone,
  handover_snapshot text NOT NULL,
  decided_by varchar(255),
  decided_at timestamp without time zone,
  decision_reason text,
  conditions text,
  next_steps text,
  new_confirmation_deadline timestamp without time zone,
  customer_response text,
  customer_responded_at timestamp without time zone,
  policy_version varchar(255) NOT NULL,
  paid_rent_amount numeric(38,2),
  refund_amount numeric(38,2)
);
CREATE UNIQUE INDEX handover_one_pending_cancellation ON public.handover_reviews(contract_id) WHERE status = 'PENDING';
CREATE INDEX handover_review_facility_created ON public.handover_reviews(facility_code, created_at DESC);
CREATE INDEX handover_review_customer_created ON public.handover_reviews(user_id, created_at DESC);
CREATE INDEX handover_confirmation_due ON public.handover_records(confirmation_deadline_at)
  WHERE status IN ('PENDING_CUSTOMER_CONFIRMATION', 'ISSUE_REPORTED');

CREATE TABLE public.handover_review_evidence (
  id varchar(255) PRIMARY KEY,
  review_id varchar(255) NOT NULL REFERENCES public.handover_reviews(id),
  note text NOT NULL,
  evidence_path varchar(255),
  content_type varchar(255),
  uploaded_by varchar(255),
  created_at timestamp without time zone NOT NULL
);
CREATE INDEX handover_review_evidence_parent ON public.handover_review_evidence(review_id, created_at);

ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS handover_review_id varchar(255)
  REFERENCES public.handover_reviews(id);
CREATE UNIQUE INDEX handover_refund_per_payment ON public.refund_requests(handover_review_id, payment_id)
  WHERE handover_review_id IS NOT NULL;

-- Backend owns these records. Do not inherit direct browser-role access to evidence/reviews.
REVOKE ALL ON public.handover_reviews, public.handover_review_evidence FROM PUBLIC;
DO $roles$
DECLARE role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON public.handover_reviews, public.handover_review_evidence FROM %I', role_name);
    END IF;
  END LOOP;
END;
$roles$;

COMMIT;
