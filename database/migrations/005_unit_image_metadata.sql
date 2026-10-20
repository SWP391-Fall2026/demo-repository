-- Add image reference and upload metadata without changing existing unit records.
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS image_url character varying,
  ADD COLUMN IF NOT EXISTS image_alt_text character varying(255);
