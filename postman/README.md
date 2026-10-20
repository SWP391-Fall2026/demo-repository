# Auth API checks — prepared, NOT RUN

> OTP được sinh trong backend rồi gửi qua email; API response không chứa mã. Staging trước đó ghi nhận SMTP bị Brevo chặn IP. **Collection/CLI/GUI Postman vẫn NOT-RUN**.

Source of truth: v3 files under collections/auth. auth.postman_collection.json is the matching GUI import snapshot, generated from the same request definitions. Do not edit the export independently.

No collection lint, API request, backend startup or Supabase connection has been executed. postman.exe found on this machine is a WindowsApps app entry, not evidence that a Postman CLI/session is configured; do not launch the GUI/CLI implicitly. Source contract is contracts/openapi/storage-rental.openapi.json.

## Before running

Return docs/guides/auth-supabase-access-form.md. Confirm test DB/project/schema/role, G0 and write/login-history/SMTP scope first. Backend must pass full Hibernate validate, retain auth schema guard until reviewed. Configure JWT/SMTP/DB secrets locally, never in React/VITE_* or Git.

Import JSON into Postman GUI or use v3 with an explicitly configured CLI later. Copy the environment as a private local environment and provide synthetic test_name/test_username/test_email/test_phone/test_cccd. Optionally set test_facility_code to an active facility code from GET /api/facilities. Email must be a mailbox you control. Use new disposable username/email/phone for a new run; this collection does not delete existing accounts.

Store test password with leading AND trailing spaces in Postman Vault as storage-rental-auth-test-password. Alternatively set test_password only in a private local environment; a masked/secret field still must not be exported/committed. No credential is included in these files. Secret access permission is granted by the human in Postman, never by this task.

Only after explicit approval set auth_run_approved=yes and auth_db_scope_approved=yes in the private environment. Guard accepts localhost backend URLs only; this is not approval to target a real DB behind localhost.

## Sequence

- Run01 to request the OTP email, enter the received code temporarily in Vault as `storage-rental-auth-otp`, then run02→10 without rerunning01. Same raw password must be supplied from Vault/private environment. OTP expires5minutes; choose explicit requests in runner if you need separate phases.
- Request06 intentionally uses raw.trim() as a NEGATIVE input; it never changes the saved raw fixture. Must reject this variant.
- JWT is used on05 in the same run as04; individual manual sends do not guarantee run-local variable persistence. Do not export tokens/OTP in environment or reports.
-09 tests74UTF8bytes, not74characters; expects clear72byte validation.
- These checks prove only their assertions when actually run. They do not prove phone UNIQUE constraints, PostgreSQL transaction races/RLS, browser navigation, SMTP delivery guarantees or all role/status cases. Database state verification requires separate approved scope.
- Collection reports/responses can contain secrets/PII. Review locally and sanitize before sharing; never print Vault/test credentials.

Official CLI lint commands (future, not executed): postman collection lint postman/collections/auth ; postman environment lint postman/environments/auth-local.environment.yaml. Resolve CLI/Vault setup explicitly before execution; no workspace push/publication requested.

For existing approved synthetic Staff/Manager/Ops/Admin fixtures, run04→05 alone with expected_role set to the canonical role and that fixture password in Vault/private environment. Do not run public registration to create privileged roles. Request06 is only applicable when that password deliberately includes edge spaces. No privileged fixture has been created in this task.
