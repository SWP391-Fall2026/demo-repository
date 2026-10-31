-- Flow 4: facility area and paid-reservation expiry.
-- MANUAL migration. Apply before deploying the matching backend.

ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS total_area_sqm numeric(12, 2) NULL;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS reservation_expires_at timestamp without time zone NULL;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS reservation_hold_days_snapshot integer NULL,
  ADD COLUMN IF NOT EXISTS refund_cancel_hours_snapshot integer NULL;

ALTER TABLE public.inspection_records
  ADD COLUMN IF NOT EXISTS completed_at timestamp without time zone NULL;

-- Existing facility areas remain NULL until Ops records the measured site area.
-- Existing paid reservations remain unchanged and continue under their existing appointment/no-show rules.
-- Preserve the previously hard-coded 24-hour cancellation rule for historical reservations.
UPDATE public.reservations
SET refund_cancel_hours_snapshot = 24
WHERE refund_cancel_hours_snapshot IS NULL;
