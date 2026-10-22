ALTER TABLE public.handover_records
  ADD COLUMN IF NOT EXISTS condition_status character varying(30),
  ADD COLUMN IF NOT EXISTS staff_notes text,
  ADD COLUMN IF NOT EXISTS evidence_path character varying(255);
