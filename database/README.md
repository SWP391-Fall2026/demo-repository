# Database

reference/current-schema-as-is.sql is a historical reference, not live truth or an executable migration.
The application uses ddl-auto=validate; there is no automatic Flyway/Liquibase or SQL-init deployment.

Manual 002/003/004 migrations align the backend with the catalog verified on 2026-10-19.
Use the explicit transaction runner and read [the rollout and rollback guide](../docs/guides/schema-alignment-20261019.md).
Do not chain 001_scope_extensions.sql or guarded docs/drafts SQL into that group.
Actual rehearsal/commit/startup evidence is recorded separately under docs/testing.

Migration `005_unit_image_metadata.sql` adds nullable `units.image_url` and `units.image_alt_text`. Unit images are externally hosted HTTPS URLs; application stores URL and alt text only, never downloads or persists image binaries. Apply migration before deploying the matching backend because Hibernate uses `ddl-auto=validate`.

Migration `006_staff_checkin_contract_flow.sql` adds facility `checkin_pin` and reservation identity/contract-acceptance metadata for the staff assignment, check-in verification and owner-accepted contract workflow. Review and apply it on the target database before updating backend; it does not create demo logins or assign shared passwords.

Migration `007_one_facility_manager_per_facility.sql` enforces at most one Facility Manager per facility, one Admin and one Business Operation Manager (including legacy role aliases). Check role/facility duplicates before applying. Resolve any duplicates explicitly; do not silently reassign or delete users.

Migration `008_facility_pin_demo_visibility.sql` adds `facilities.checkin_pin` so the current PIN can be displayed to authenticated Staff and the Facility Manager of that same facility. The application retains BCrypt hash verification. This plaintext PIN exposure is intended for the requested demo; restrict database and API access accordingly.

Migration `009_contract_payment_and_handover_states.sql` extends the existing contract status CHECK constraint with `PENDING_PAYMENT` and `PENDING_HANDOVER`. Apply before running the updated backend; it preserves all existing statuses and rows.

Migration `010_invoice_price_snapshot_text.sql` widens `invoices.price_snapshot` to `text` for contract terms JSON. Migration `011_customer_confirmed_handover.sql` records pending/completed handover state and customer confirmation time. Apply both before deploying the matching backend; existing completed handovers remain completed.

Migration `012_handover_evidence.sql` adds handover condition status and optional evidence path for Staff's physical handover record.

Migration `013_handover_customer_confirmation.sql` records the authenticated customer, accepted confirmation version, and customer issue report on the separate handover confirmation step.

Migration `014_handover_issue_reporter.sql` records the authenticated customer and server timestamp for a handover issue report.

Migration `017_module4_return_detail.sql` adds return/inspection detail columns (`contracts.checkout_reason`, `inspection_records.goods_cleared/repair_fee`). Migration `018_module5_facility_profile.sql` adds facility profile columns. Migration `019_policy_history_audit.sql` ensures `audit_logs` exists (CREATE TABLE IF NOT EXISTS) so `GET /api/policies/history` never 500 on a database missing the table. Migration `020_inspection_confirm.sql` adds inspection `status`/`customer_confirmed_at` and `contracts.inspection_confirmed_at` so staff can draft a return inspection for customer confirmation before terminate.

Migration `021_return_inspection_negotiation.sql` adds inspection photo evidence and the append-only customer dispute/Manager fee-offer records. It was applied to the configured staging PostgreSQL database on 2026-10-31 after confirming none of its columns, table, or indexes were partially present. The transaction completed and all three inspection columns, the dispute table, and its three indexes were verified. SHA-256: `a56461d004a464137021897fc21fed76f64e244c81f82adf005b7b84e0953277`. Existing inspection rows are preserved and their original deductions are backfilled from the current penalty fee.

Migration `022_flow4_policy_reporting.sql` adds the facility's total site area in square meters, reservation policy snapshots and expiry timestamp, and the inspection completion timestamp used for financial reporting. Apply it before deploying the matching Flow 4 changes. Existing facilities keep a NULL area until Ops records it; historical reservations retain the former 24-hour cancellation rule and do not receive a new paid-hold expiry.

Execution record: migration 022 was applied to the configured staging PostgreSQL database on 2026-10-31. The runner reported `APPLIED_COMMITTED_AND_RECHECKED` (`committed=true`) for SHA-256 `ceda4cb35f2d6fb2cf5d64009dae6dc57cca8d53a8035abfb2e7c829f6d55e66`; post-commit schema checks passed, legacy data hashes and row counts were unchanged, and 37 historical reservations received the 24-hour cancellation-policy snapshot. Evidence: `artifacts/flow4-migration-022/apply.json`. This run did not apply or verify migration 021; verify that migration before deploying the Flow 3 return-inspection negotiation changes.

Idempotency relies on `CREATE UNIQUE INDEX payments_idempotency_key_uq ON public.payments(idempotency_key) WHERE idempotency_key IS NOT NULL` in `001_scope_extensions.sql`. Keep this partial index; the backend pre-checks the key and replays the existing payment on race (code-level fallback, no entity-level unique constraint to avoid diverging local create-drop schema from prod validate schema).

For startup error `Schema-validation: missing column [image_alt_text] in table [units]`, connect to the exact PostgreSQL database/schema configured by `DB_URL` and run:

```sql
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS image_url character varying,
  ADD COLUMN IF NOT EXISTS image_alt_text character varying(255);
```

Equivalent migration: `database/migrations/005_unit_image_metadata.sql`. Verify both columns exist before restarting Spring Boot:

```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'units'
  AND column_name IN ('image_url', 'image_alt_text')
ORDER BY column_name;
```

Expected: two rows. This additive change preserves existing units. Do not change `spring.jpa.hibernate.ddl-auto=validate` to `update` as workaround.
