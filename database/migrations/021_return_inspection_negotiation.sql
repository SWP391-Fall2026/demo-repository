-- Module 4: return inspection evidence, customer disputes, and manager fee offers.
-- MANUAL migration. Apply before deploying the backend; ddl-auto remains validate.

ALTER TABLE public.inspection_records
  ADD COLUMN IF NOT EXISTS original_penalty_fee numeric NULL,
  ADD COLUMN IF NOT EXISTS evidence_path varchar NULL,
  ADD COLUMN IF NOT EXISTS evidence_content_type varchar NULL;

UPDATE public.inspection_records
SET original_penalty_fee = penalty_fee
WHERE original_penalty_fee IS NULL;

CREATE TABLE IF NOT EXISTS public.return_inspection_disputes (
  id varchar(255) PRIMARY KEY,
  inspection_id varchar(255) NOT NULL,
  contract_id varchar(255) NOT NULL,
  facility_code varchar(255) NOT NULL,
  customer_id varchar(255) NOT NULL,
  reason text NOT NULL,
  evidence_path varchar(255) NOT NULL,
  evidence_content_type varchar(255) NOT NULL,
  status varchar(40) NOT NULL,
  created_at timestamp NOT NULL,
  manager_id varchar(255),
  manager_note text,
  proposed_deduction numeric,
  decided_at timestamp
);

CREATE INDEX IF NOT EXISTS return_inspection_disputes_customer_created_idx
  ON public.return_inspection_disputes (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS return_inspection_disputes_facility_created_idx
  ON public.return_inspection_disputes (facility_code, created_at DESC);
CREATE INDEX IF NOT EXISTS return_inspection_disputes_inspection_created_idx
  ON public.return_inspection_disputes (inspection_id, created_at DESC);
