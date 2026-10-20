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
