-- Apply to a verified database copy first. Do not invent settlement times for historical rows.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at timestamp without time zone NULL;
CREATE INDEX IF NOT EXISTS payments_paid_at_idx ON public.payments(paid_at) WHERE status = 'PAID';
