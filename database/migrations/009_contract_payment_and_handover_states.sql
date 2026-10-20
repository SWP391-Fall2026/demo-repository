-- Contracts exist after Staff check-in but remain unpaid until RENT is paid.
-- PIN is NULL in PENDING_PAYMENT; payment transitions to PENDING_HANDOVER and issues PIN.
ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_status_check;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_status_check
  CHECK (status IN ('PENDING_PAYMENT', 'PENDING_HANDOVER', 'ACTIVE', 'EXPIRING_SOON', 'OVERDUE', 'TERMINATED'));
