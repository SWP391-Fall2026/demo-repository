-- One facility may have only one Facility Manager, including legacy role alias.
-- Preflight duplicates before applying; do not silently reassign existing users.
CREATE UNIQUE INDEX IF NOT EXISTS users_one_facility_manager_per_facility
  ON public.users (facility_code)
  WHERE upper(role) IN ('FMANAGER', 'FACILITY_MANAGER')
    AND facility_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_single_admin
  ON public.users ((upper(role)))
  WHERE upper(role) IN ('ADMIN', 'SYSTEM_ADMIN');

CREATE UNIQUE INDEX IF NOT EXISTS users_single_operations_manager
  ON public.users ((upper(role)))
  WHERE upper(role) IN ('OPS_MGR', 'OPS_MANAGER');
