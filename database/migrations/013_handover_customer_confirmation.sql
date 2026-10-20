ALTER TABLE public.handover_records
  ADD COLUMN IF NOT EXISTS customer_confirmed_by character varying(255),
  ADD COLUMN IF NOT EXISTS confirmation_version character varying(80),
  ADD COLUMN IF NOT EXISTS customer_issue_notes text;
