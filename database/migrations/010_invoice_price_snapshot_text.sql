-- Contract terms snapshot is JSON and can exceed 255 characters.
ALTER TABLE public.invoices
  ALTER COLUMN price_snapshot TYPE text;
