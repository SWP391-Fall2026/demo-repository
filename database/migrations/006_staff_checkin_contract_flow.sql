-- Additive fields for owner-visible contract offer acceptance and facility check-in PINs.
-- Review target catalog before applying. Existing records remain NULL and are not backfilled.
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS checkin_pin_hash character varying(100);

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS identity_verified_by character varying(255),
  ADD COLUMN IF NOT EXISTS contract_terms_accepted_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS contract_terms_version character varying(100),
  ADD COLUMN IF NOT EXISTS contract_terms_snapshot text;
