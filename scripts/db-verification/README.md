# Staging metadata verification

The metadata probe/report helpers do not migrate or repair the database. The metadata SQL remains in
`docs/drafts/schema-alignment-20261018/sql/00_metadata_readonly.sql`.

`SupabaseMetadataProbe.java` uses the cached PostgreSQL JDBC driver and reads Java
Properties from the exact private path supplied by the user. Despite its `.env`
suffix, that selected file is Java Properties. Never source it in a shell, print
it, pass credential values in command arguments or add it to Git.

The probe pins the operator-approved Session pooler host, port, database and
routing username. It also verifies the effective PostgreSQL role separately:
the pooler's `.project-reference` suffix is not part of `current_user`.
There is no automatic fallback or regional endpoint discovery.

- `inspect`: validates config and writes a redacted summary, without connecting.
- `metadata`: connects with SSL required, sets a read-only repeatable-read
  transaction, collects the reviewed catalog SELECTs, and rolls back. It does
  not read auth/business rows, execute a draft migration or change privileges.
- Outputs go only under Git-ignored `artifacts/auth-staging/`. The earlier
  `live-metadata.json` is the failed direct attempt; the successful pooler
  capture is `session-pooler-metadata.json`. Do not confuse them.
- Policy expressions and sensitive defaults are redacted. Error output includes
  exception classes/SQLSTATE, not provider messages or stack traces.
- `sslmode=require` config and backend `pg_stat_ssl` are separate observations
  through a pooler; the latter does not measure the client-to-pooler segment.

`build_auth_schema_report.py` is offline. It checks the successful capture,
cross-checks pg_catalog and information_schema, verifies all 16 Entity SHA-256
fingerprints against the baseline, normalizes fully qualified Java type names,
and writes `docs/testing/auth-staging-schema-diff.md` plus an ignored JSON
comparison. It never reads the private config or connects to a database.

The generated MATCH label is limited to the compared column attributes, not a
runtime PASS or a claim that constraints, defaults, RLS or data quality are all
correct. LocalDateTime/timestamptz needs a round-trip test; a shorter varchar
than a JPA hint is a declared difference, not proof of truncation or startup
failure. Java initializers are not SQL DEFAULT requirements.

Actual connection evidence, blockers and next review gates are recorded in
`docs/testing/auth-staging-verification.md`. Neither these helpers nor the
existing guarded SQL drafts authorize schema changes.

`SchemaAlignmentRunner.java` is a separate, explicit manual writer added after
the user approved additive migration while keeping the backend mappings. It only
runs the pinned 002/003/004 group. Rehearsal rolls back; apply requires a successful
rehearsal with identical SQL hashes and rechecks source/catalog before COMMIT.
It is never loaded by Spring or invoked by the metadata probe. See
`docs/guides/schema-alignment-20261019.md` and the execution report for scope,
transaction/fixture protection, evidence and non-destructive rollback rules.
