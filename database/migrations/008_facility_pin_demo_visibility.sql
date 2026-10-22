-- Demo-only visibility for current facility check-in PIN.
-- BCrypt hash remains the verification source; plaintext is returned only by
-- authenticated facility-scoped Manager/assigned Staff workflows.
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS checkin_pin character varying(6);
