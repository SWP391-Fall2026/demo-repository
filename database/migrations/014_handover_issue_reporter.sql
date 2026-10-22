ALTER TABLE public.handover_records
  ADD COLUMN IF NOT EXISTS customer_issue_reported_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS customer_issue_reported_by character varying(255);
