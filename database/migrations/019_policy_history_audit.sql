-- Policy history support for FR-027 (GET /api/policies/history reads audit_logs).
-- MANUAL migration, not a Spring Boot init script. Run atomically via the staging runner.
-- Backend default ddl-auto=validate; profile local/test use H2 create-drop separately.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigserial PRIMARY KEY,
  time_str varchar(255) NULL,
  user_name varchar(255) NULL,
  role varchar(255) NULL,
  action varchar(255) NULL,
  detail varchar(1000) NULL,
  ip varchar(255) NULL,
  status varchar(255) NULL,
  created_at timestamp NULL,
  user_id varchar(255) NULL,
  entity_id varchar(255) NULL,
  facility_code varchar(255) NULL
);

-- Existing CHECKs, columns, timestamps, RLS policies, sequences and grants are preserved.
