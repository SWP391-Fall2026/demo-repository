-- READ ONLY. Operator collection template; not executed by Codex.
-- Return metadata/aggregates only. Do not export row values or secret-bearing function bodies.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY;
SET LOCAL statement_timeout = '30s';

-- M01: effective database/schema/session; does not show connection strings or passwords.
SELECT current_database() AS database_name, current_user AS database_role,
       current_schema() AS current_schema, current_setting('search_path') AS search_path,
       current_setting('TimeZone') AS session_timezone,
       current_setting('server_version_num') AS server_version_num,
       current_setting('transaction_isolation') AS isolation_level,
       current_setting('transaction_read_only') AS read_only;

-- M02: include extra public tables/views so repository assumptions cannot hide them.
SELECT n.nspname AS schema_name, c.relname AS relation_name, c.relkind,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls,
       pg_get_userbyid(c.relowner) AS owner_role,
       s.n_live_tup AS estimated_live_rows,
       pg_total_relation_size(c.oid) AS total_bytes
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid=c.oid
WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
ORDER BY c.relname;

-- M03: exact length, precision/scale, defaults, generated and identity attributes.
-- Sensitive defaults and generated expressions are deliberately redacted.
SELECT table_schema, table_name, ordinal_position, column_name,
       data_type, udt_schema, udt_name, domain_schema, domain_name,
       character_maximum_length, numeric_precision, numeric_scale,
       datetime_precision, is_nullable, collation_name,
       CASE WHEN column_name ~* '(password|secret|token|pin|credential|rfid|physical_lock)'
            THEN CASE WHEN column_default IS NULL THEN NULL ELSE '[REDACTED DEFAULT PRESENT]' END
            ELSE column_default END AS column_default,
       is_identity, identity_generation, identity_start, identity_increment,
       identity_minimum, identity_maximum, identity_cycle, is_generated,
       CASE WHEN column_name ~* '(password|secret|token|pin|credential|rfid|physical_lock)'
            THEN '[REDACTED]' ELSE generation_expression END AS generation_expression
FROM information_schema.columns
WHERE table_schema='public'
ORDER BY table_name, ordinal_position;

-- M04: catalog type rendering, including varchar(n), numeric(p,s), timestamptz and domains.
SELECT n.nspname AS schema_name, c.relname AS table_name, a.attname AS column_name,
       format_type(a.atttypid,a.atttypmod) AS exact_postgresql_type,
       a.attnotnull, a.attidentity, a.attgenerated
FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped
ORDER BY c.relname,a.attnum;

-- M05: PK/UNIQUE/CHECK/FK definitions, validation and deferrability.
SELECT con.oid, n.nspname AS schema_name, c.relname AS table_name,
       con.conname, con.contype, con.convalidated, con.condeferrable, con.condeferred,
       CASE WHEN EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid=c.oid
                         AND a.attnum=ANY(con.conkey)
                         AND a.attname ~* '(password|secret|token|pin|credential|rfid|physical_lock)')
            THEN '[REDACTED: inspect sensitive-column definition locally]'
            ELSE pg_get_constraintdef(con.oid,true) END AS definition,
       CASE WHEN con.confrelid<>0 THEN con.confrelid::regclass::text END AS referenced_table
FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
ORDER BY c.relname,con.contype,con.conname;

-- M06: ordered FK column pairs and exact actions; no inferred FK is treated as existing.
SELECT ns.nspname AS source_schema, src.relname AS source_table, con.conname,
       a.attname AS source_column, nt.nspname AS target_schema,
       dst.relname AS target_table, b.attname AS target_column, k.ord,
       con.confupdtype AS update_action_code, con.confdeltype AS delete_action_code,
       con.confmatchtype, con.convalidated, con.condeferrable, con.condeferred
FROM pg_constraint con JOIN pg_class src ON src.oid=con.conrelid
JOIN pg_namespace ns ON ns.oid=src.relnamespace
JOIN pg_class dst ON dst.oid=con.confrelid
JOIN pg_namespace nt ON nt.oid=dst.relnamespace
JOIN LATERAL unnest(con.conkey,con.confkey) WITH ORDINALITY AS k(srcnum,dstnum,ord) ON true
JOIN pg_attribute a ON a.attrelid=src.oid AND a.attnum=k.srcnum
JOIN pg_attribute b ON b.attrelid=dst.oid AND b.attnum=k.dstnum
WHERE con.contype='f' AND ns.nspname='public'
ORDER BY src.relname,con.conname,k.ord;

-- M07: indexes: uniqueness, validity, readiness, expressions and predicates.
SELECT n.nspname, t.relname AS table_name, x.relname AS index_name,
       i.indisprimary, i.indisunique, i.indisvalid, i.indisready,
       CASE WHEN pg_get_indexdef(i.indexrelid) ~* '(password|secret|token|pin|credential|rfid|physical_lock)'
            THEN '[REDACTED: inspect locally]' ELSE pg_get_indexdef(i.indexrelid) END AS definition
FROM pg_index i JOIN pg_class t ON t.oid=i.indrelid
JOIN pg_class x ON x.oid=i.indexrelid JOIN pg_namespace n ON n.oid=t.relnamespace
WHERE n.nspname='public' ORDER BY t.relname,x.relname;

-- M08: serial/identity association and sequence state. Never call nextval/setval.
SELECT n.nspname, c.relname AS table_name, a.attname AS id_column,
       pg_get_serial_sequence(format('%I.%I',n.nspname,c.relname),a.attname) AS owned_sequence
FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped
  AND (a.attidentity<>'' OR EXISTS (
      SELECT 1 FROM pg_attrdef d WHERE d.adrelid=c.oid AND d.adnum=a.attnum
      AND pg_get_expr(d.adbin,d.adrelid) LIKE 'nextval(%'))
ORDER BY c.relname,a.attname;
SELECT schemaname,sequencename,sequenceowner,data_type,start_value,min_value,max_value,
       increment_by,cycle,cache_size,last_value
FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename;
-- last_value may be NULL without privilege and is not a reliable prediction of the next ID (cache).

-- M09: database enum/domain definitions; none are declared by current JPA annotations.
SELECT n.nspname,t.typname,e.enumlabel,e.enumsortorder
FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid
WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder;
SELECT n.nspname,t.typname,format_type(t.typbasetype,t.typtypmod) AS base_type,
       t.typnotnull, c.conname,
       CASE WHEN t.typname ~* '(password|secret|token|pin|credential|rfid|physical_lock)'
            THEN '[REDACTED: inspect domain locally]'
            ELSE pg_get_constraintdef(c.oid,true) END AS domain_constraint
FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
LEFT JOIN pg_constraint c ON c.contypid=t.oid
WHERE n.nspname='public' AND t.typtype='d';

-- M10: user triggers and their function names, without secret-bearing function bodies/arguments.
SELECT n.nspname,c.relname AS table_name,t.tgname,t.tgenabled,
       pn.nspname AS function_schema,p.proname AS function_name,
       t.tgtype AS trigger_type_bits
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_namespace pn ON pn.oid=p.pronamespace
WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname;

-- M11: policies / grants / default ACLs. Review locally before sharing any custom expression.
SELECT schemaname,tablename,policyname,permissive,roles,cmd,
       CASE WHEN coalesce(qual,'') ~* '(password|secret|token|credential)' THEN '[REDACTED]' ELSE qual END AS using_expression,
       CASE WHEN coalesce(with_check,'') ~* '(password|secret|token|credential)' THEN '[REDACTED]' ELSE with_check END AS check_expression
FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname;
SELECT table_schema,table_name,grantee,privilege_type,is_grantable
FROM information_schema.role_table_grants WHERE table_schema='public'
ORDER BY table_name,grantee,privilege_type;
SELECT n.nspname AS schema_name,pg_get_userbyid(d.defaclrole) AS owner_role,
       d.defaclobjtype,d.defaclacl
FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
WHERE n.nspname='public' OR d.defaclnamespace=0;
SELECT object_schema,object_name,grantee,privilege_type
FROM information_schema.role_usage_grants
WHERE object_schema='public' AND object_type='SEQUENCE';

-- M12: dependent objects; definitions/bodies are intentionally not exported.
SELECT DISTINCT c.relname AS referenced_table,
       pg_describe_object(d.classid,d.objid,d.objsubid) AS dependent_object,d.deptype
FROM pg_depend d JOIN pg_class c ON c.oid=d.refobjid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE d.refclassid='pg_class'::regclass AND n.nspname='public'
ORDER BY c.relname,dependent_object;

ROLLBACK;
