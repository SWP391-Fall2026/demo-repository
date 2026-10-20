# Local configuration form

Serve with Python3: `python -B scripts/auth-setup/serve.py --port 8767`.
Only127.0.0.1 is bound. The helper serves four allowlisted static assets; POST is rejected.
Its CSP blocks connections/form submissions and all remote scripts. No secret is sent to the helper.

The human fills the form and explicitly downloads storage-rental-staging.private.properties outside Git.
Do not inspect their browser fields or upload/read the file contents into chat. Only its path is needed.
The file uses Java Properties escaping for whitespace, backslashes and Unicode, contains plaintext
secrets, and always keeps schema-reviewed=false/validate/scheduler disabled. It does not start Spring,
query Supabase, send SMTP or grant new privileges. Never serve a directory containing private config.

properties.mjs is a pure generator; it does not read files, environment variables or network data.
Secrets containing Spring placeholder syntax are rejected rather than silently interpolated.
If encountered, arrange an opaque secret-loading path before startup; do not alter the actual password.
