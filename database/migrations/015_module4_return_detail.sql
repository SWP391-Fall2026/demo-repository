-- Module 4: rented unit checkout/inspection detail columns.
-- MANUAL migration, not a Spring Boot init script. Run atomically via the staging runner.
-- Backend default ddl-auto=validate; profile local/test use H2 create-drop separately.

ALTER TABLE public.contracts ADD COLUMN checkout_reason varchar(255) NULL;

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_status_check
  CHECK (status IN ('PENDING_PAYMENT', 'PENDING_HANDOVER', 'ACTIVE', 'EXPIRING_SOON', 'OVERDUE', 'CHECKOUT_REQUESTED', 'TERMINATED'));

ALTER TABLE public.inspection_records ADD COLUMN goods_cleared boolean NULL;
ALTER TABLE public.inspection_records ADD COLUMN repair_fee numeric NULL;

-- No backfill: historical rows keep NULL until a real return inspection writes them.
-- Existing CHECKs, columns, timestamps, RLS policies, sequences and grants are preserved.
