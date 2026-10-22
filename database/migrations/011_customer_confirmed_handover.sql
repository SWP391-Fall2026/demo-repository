ALTER TABLE public.handover_records
  ADD COLUMN IF NOT EXISTS status character varying(40) NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN IF NOT EXISTS customer_confirmed_at timestamp without time zone;

UPDATE public.handover_records
SET status = 'COMPLETED',
    customer_confirmed_at = NULL;
