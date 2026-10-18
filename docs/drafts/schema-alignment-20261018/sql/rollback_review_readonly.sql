-- READ ONLY evidence for rollback review. Not a down migration.
-- Before any deployment, operator records selected object definitions and data aggregates
-- via 00_metadata_readonly.sql and 01_quality_queries_readonly.sql.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY;
SET LOCAL statement_timeout = '30s';
SELECT current_database(), current_schema(), current_setting('transaction_read_only');
SELECT table_name,column_name,data_type,is_nullable,character_maximum_length,
       numeric_precision,numeric_scale,datetime_precision
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN
 ('audit_logs','units','reservations','contracts','invoices','payments','refund_requests','refund_transactions')
ORDER BY table_name,ordinal_position;
SELECT n.nspname,c.relname,con.conname,con.contype,con.convalidated,
       con.condeferrable,con.condeferred
FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
ORDER BY c.relname,con.conname;
SELECT n.nspname,t.relname AS table_name,x.relname AS index_name,
       i.indisunique,i.indisvalid,i.indisready
FROM pg_index i JOIN pg_class t ON t.oid=i.indrelid
JOIN pg_class x ON x.oid=i.indexrelid JOIN pg_namespace n ON n.oid=t.relnamespace
WHERE n.nspname='public' ORDER BY t.relname,x.relname;
SELECT schemaname,sequencename,last_value,cache_size,increment_by
FROM pg_sequences WHERE schemaname='public';
-- Existing expansion objects and new business history are preserved after a rollback of code.
-- No column/table deletion, data rewrites or sequence reset is provided here.
ROLLBACK;
