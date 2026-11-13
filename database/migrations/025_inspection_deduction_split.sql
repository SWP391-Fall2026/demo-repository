ALTER TABLE public.inspection_records ADD COLUMN IF NOT EXISTS deposit_deduction_amount numeric NULL;
ALTER TABLE public.inspection_records ADD COLUMN IF NOT EXISTS outstanding_fee_amount numeric NULL;
-- Historical deductions require review against deposit receipts. Do not infer settled balances.
