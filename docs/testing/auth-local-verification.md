# Auth verification — 2026-10-19

> Current staging checkpoint: migrations002/003/004 APPLIED_COMMITTED, all216mapped fields present, Hibernate16entities and full Spring Boot startup succeeded. HTTP smoke5assertions passed, real email OTP blocked by SMTP authentication525/5.7.1. See [execution report](D:/SWP/storage-rental/docs/testing/schema-migration-execution-20261019.md). Earlier connection/schema blockers below are historical; local unit evidence is unchanged.

## Evidence actually obtained

| Check | Actual result | Scope |
|---|---|---|
| TypeScript tsc, noEmit/incremental=false | Exit0 | Type-check entire frontend; no Vite bundle or app startup |
| Frontend Vitest, two auth files | 7tests passed,0failed | auth-validation(5), session(2); no browser E2E/network/database |
| Backend Maven targeted six auth unit classes | BUILD SUCCESS,23tests,0failures,0errors,0skipped | javac110 main +8test sources; no Spring context/JPA/DB/SMTP or application startup |
| Local setup-form generator | Synthetic assertions passed | Java Properties escaping/config guard checks; no real secret supplied |
| Setup form static page at localhost8767 | HTTP200 + CSP/no-store headers | Helper assets only; not Storage Rental API or Supabase |

Backend scope: AuthServiceTest10, JwtLifetimeTest1, OtpDeliveryServiceTest2,
PasswordPolicyTest5, RegistrationAccountServiceTest2, RegistrationValidatorTest3.
Selected explicitly with Maven -Dtest; RentalLifecycleTest and BusinessRulesTest were not executed.
Forked JVM has spring.profiles.active=unit-test, invalid JDBC URL guard and scheduler=false.
An initial offline Maven attempt could not resolve starter-mail; after authorized dependency download,
the same isolated scope compiled and passed. No credentials were used for these tests.

Surefire reports are under backend/target/surefire-reports for those six class names only.
Do not aggregate old reports from other classes into this run. Do not share raw environment/config/report
contents containing secrets. No actual registration/login HTTP request was made in this checkpoint.

## Staging target and connection evidence

- Project: xnerbsgbwdpemvnatvuy.
- Initial host: db.xnerbsgbwdpemvnatvuy.supabase.co; direct failed before authentication.
- User then supplied Session pooler aws-0-ap-northeast-1.pooler.supabase.com:5432;
  database postgres; schema public; routing username postgres.xnerbsgbwdpemvnatvuy; SSL require.
- User authorized staging test accounts and auth/business writes.
- User supplied private config path: `D:/SWP/storage-rental/storage-rental-secrets/backend.env`.
  It is Java Properties content despite the `.env` suffix; it is ignored by Git. No secret values are documented.
- Config inspection selected real SMTP email; user explicitly designated a controlled OTP inbox.

These are trusted user-provided target details, not FACT-LIVE metadata. A JDBC connection was attempted
at 2026-10-19T05:02:25.592725600Z and failed before authentication with UnknownHostException / SQLSTATE08001.
Subsequent OS DNS inspection resolved only an AAAA address for the direct host, with no A address;
the machine has no IPv6 default route. No database session, catalog/data query, migration/DDL,
RLS/privilege modification, auth API/Postman run or SMTP send occurred.
The user supplied Session pooler details after that failure. Capture beginning
2026-10-19T05:05:57.772671400Z connected successfully: PostgreSQL17.11, effective database postgres,
schema public, current_user postgres, timezone UTC; repeatable read/read_only=on and rollback.
All19 catalog groups succeeded, with no business rows read. Source hashes for all16 Entity files
match the mapping baseline. Live has two missing mapped tables and37 missing columns in existing tables.
Spring Boot startup was then attempted with validate, SQL init disabled, read-only Hikari,
scheduler off and schema-reviewed=false. It connected but exited1 with
`Schema-validation: missing column [entity_id] in table [audit_logs]`; the application did not start.
No DDL/DML or SMTP/API/Postman/browser execution occurred. G0/G4 remain BLOCKED pending schema,
auth constraints, time mapping review and scoped runtime. The earlier statement about no session
applies only to the failed direct attempt.
See [staging connection evidence](D:/SWP/storage-rental/docs/testing/auth-staging-verification.md).

## Next step

Session pooler connection and catalog collection are complete. Review
[the live schema diff](D:/SWP/storage-rental/docs/testing/auth-staging-schema-diff.md)
and the staged unblock plan before any schema write. Keep secrets in the ignored private file.
Do not enable AUTH_SCHEMA_REVIEWED or start live registration before constraints/schema are reviewed.
