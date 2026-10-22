-- Preserve every previously accepted state and add the approved NO_SHOW state.
-- Runner verifies the exact old CHECK definition from live before executing this file.
-- Do not use this file to discover/drop arbitrary checks.
ALTER TABLE public.reservations DROP CONSTRAINT reservations_status_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('PENDING_PAYMENT', 'RESERVED', 'CHECKED_IN', 'CANCELLED', 'EXPIRED', 'NO_SHOW'));
