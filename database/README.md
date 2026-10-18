# Database

reference/current-schema-as-is.sql is the supplied 15-table reference, not an executable migration. Runtime migrations belong to backend/src/main/resources/db/migration. The application uses ddl-auto=validate; no automatic update of Supabase.
