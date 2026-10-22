-- READ ONLY. Generates additional SELECT text after inspecting existing columns.
-- No dynamic EXECUTE. Review returned SQL and run selected statements manually.
-- Counts/lengths only; no row names, email addresses, access codes, passwords or tokens.
-- Returned SELECTs must be run in a separate reviewed READ ONLY REPEATABLE READ transaction.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY;
SET LOCAL statement_timeout = '30s';

-- Q01: null counts by existing column. No reference-schema existence assumptions.
WITH target(table_name) AS (VALUES ('audit_logs'),('business_policies'),('contracts'),('daily_tasks'),('facilities'),('handover_records'),('inspection_records'),('invoices'),('login_history'),('payments'),('refund_requests'),('refund_transactions'),('reservations'),('staff_tasks'),('support_tickets'),('units'),('users'))
SELECT format('SELECT %L AS table_name, %L AS column_name, count(*) AS rows_seen, count(*) FILTER (WHERE %I IS NULL) AS null_rows FROM %I.%I;',
              c.table_name,c.column_name,c.column_name,c.table_schema,c.table_name) AS sql_to_review
FROM information_schema.columns c JOIN target t USING(table_name)
WHERE c.table_schema='public' AND c.column_name !~* '(password|secret|token|pin|credential|rfid|physical_lock)'
ORDER BY c.table_name,c.ordinal_position;

-- Q02: length maxima without returning sensitive values. Compare with inventory length hints, not automatic narrowing.
WITH target(table_name) AS (VALUES ('audit_logs'),('business_policies'),('contracts'),('daily_tasks'),('facilities'),('handover_records'),('inspection_records'),('invoices'),('login_history'),('payments'),('refund_requests'),('refund_transactions'),('reservations'),('staff_tasks'),('support_tickets'),('units'),('users'))
SELECT format('SELECT %L AS table_name, %L AS column_name, max(char_length(%I)) AS max_chars FROM %I.%I;',
              c.table_name,c.column_name,c.column_name,c.table_schema,c.table_name) AS sql_to_review
FROM information_schema.columns c JOIN target t USING(table_name)
WHERE c.table_schema='public' AND c.data_type IN ('text','character varying','character')
  AND c.column_name !~* '(password|secret|token|pin|credential|rfid|physical_lock)'
ORDER BY c.table_name,c.ordinal_position;

-- Q03: state frequencies (not account/PII values), including values not yet documented.
WITH target(table_name) AS (VALUES ('audit_logs'),('business_policies'),('contracts'),('daily_tasks'),('facilities'),('handover_records'),('inspection_records'),('invoices'),('login_history'),('payments'),('refund_requests'),('refund_transactions'),('reservations'),('staff_tasks'),('support_tickets'),('units'),('users'))
SELECT format('SELECT %L AS table_name, %L AS column_name, %I AS state_value, count(*) AS rows_seen FROM %I.%I GROUP BY %I;',
              c.table_name,c.column_name,c.column_name,c.table_schema,c.table_name,c.column_name) AS sql_to_review
FROM information_schema.columns c JOIN target t USING(table_name)
WHERE c.table_schema='public' AND c.column_name IN ('status','role','type','unit_type','invoice_type','refund_type','payment_method','priority','task_type','readiness_status');

-- Q04: duplicate groups; no duplicate values are exported.
WITH candidate(table_name,column_name) AS (VALUES
 ('users','username'),('users','email'),('payments','idempotency_key'),
 ('contracts','reservation_id'),('refund_transactions','transfer_reference'),('refund_transactions','refund_request_id'))
SELECT format('SELECT %L AS candidate, count(*) AS duplicate_groups FROM (SELECT %I FROM %I.%I WHERE %I IS NOT NULL GROUP BY %I HAVING count(*) > 1) d;',
              x.table_name||'.'||x.column_name,x.column_name,c.table_schema,x.table_name,x.column_name,x.column_name) AS sql_to_review
FROM candidate x JOIN information_schema.columns c ON c.table_schema='public' AND c.table_name=x.table_name AND c.column_name=x.column_name;
-- Empty-string idempotency keys are a separate defect, not exempted from uniqueness.
SELECT format('SELECT %L AS candidate, count(*) FILTER (WHERE length(btrim(%I)) = 0) AS blank_keys FROM public.%I;',table_name||'.'||column_name,column_name,table_name) AS sql_to_review
FROM information_schema.columns WHERE table_schema='public' AND column_name='idempotency_key';

-- Q05: potential case-folding collisions; does not select usernames/emails.
SELECT format('SELECT %L AS candidate, count(*) AS duplicate_casefold_groups FROM (SELECT lower(%I) FROM public.users GROUP BY lower(%I) HAVING count(*) > 1) d;',column_name,column_name,column_name) AS sql_to_review
FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name IN ('username','email');

-- Q06: orphan counts for candidate links, only where BOTH tables and columns exist.
WITH link(child_table,child_column,parent_table,parent_column) AS (VALUES
 ('users','facility_code','facilities','code'),
 ('units','facility_code','facilities','code'),
 ('units','held_by_reservation_id','reservations','id'),
 ('units','readiness_requested_by','users','id'),
 ('reservations','user_id','users','id'),
 ('reservations','facility_code','facilities','code'),
 ('reservations','unit_code','units','code'),
 ('reservations','schedule_approved_by','users','id'),
 ('contracts','reservation_id','reservations','id'),
 ('contracts','user_id','users','id'),
 ('contracts','unit_code','units','code'),
 ('contracts','facility_code','facilities','code'),
 ('invoices','reservation_id','reservations','id'),
 ('invoices','contract_id','contracts','id'),
 ('invoices','user_id','users','id'),
 ('invoices','facility_code','facilities','code'),
 ('payments','invoice_id','invoices','id'),
 ('payments','reservation_id','reservations','id'),
 ('payments','contract_id','contracts','id'),
 ('payments','user_id','users','id'),
 ('payments','facility_code','facilities','code'),
 ('refund_requests','payment_id','payments','id'),
 ('refund_requests','reservation_id','reservations','id'),
 ('refund_requests','contract_id','contracts','id'),
 ('refund_requests','inspection_id','inspection_records','id'),
 ('refund_requests','facility_code','facilities','code'),
 ('refund_requests','user_id','users','id'),
 ('refund_requests','requested_by','users','id'),
 ('refund_requests','approved_by','users','id'),
 ('refund_transactions','refund_request_id','refund_requests','id'),
 ('refund_transactions','performed_by','users','id'),
 ('refund_transactions','confirmed_by','users','id'),
 ('handover_records','contract_id','contracts','id'),
 ('handover_records','reservation_id','reservations','id'),
 ('handover_records','staff_id','users','id'),
 ('inspection_records','contract_id','contracts','id'),
 ('inspection_records','staff_id','users','id'),
 ('daily_tasks','staff_id','users','id'),
 ('daily_tasks','facility_code','facilities','code'),
 ('daily_tasks','unit_code','units','code'),
 ('daily_tasks','reservation_id','reservations','id'),
 ('daily_tasks','contract_id','contracts','id'),
 ('support_tickets','user_id','users','id'),
 ('support_tickets','facility_code','facilities','code'),
 ('support_tickets','unit_code','units','code'),
 ('support_tickets','staff_assigned','users','id'),
 ('business_policies','updated_by','users','id'),
 ('audit_logs','user_id','users','id'),
 ('audit_logs','facility_code','facilities','code'))
SELECT format('SELECT %L AS candidate, count(*) AS orphan_rows FROM public.%I c LEFT JOIN public.%I p ON c.%I = p.%I WHERE c.%I IS NOT NULL AND p.%I IS NULL;',
              l.child_table||'.'||l.child_column,l.child_table,l.parent_table,l.child_column,l.parent_column,l.child_column,l.parent_column) AS sql_to_review
FROM link l
JOIN information_schema.columns c ON c.table_schema='public' AND c.table_name=l.child_table AND c.column_name=l.child_column
JOIN information_schema.columns p ON p.table_schema='public' AND p.table_name=l.parent_table AND p.column_name=l.parent_column;

-- Q07: numeric ranges and fractional rows; do not round monetary history.
WITH target(table_name) AS (VALUES ('audit_logs'),('business_policies'),('contracts'),('daily_tasks'),('facilities'),('handover_records'),('inspection_records'),('invoices'),('login_history'),('payments'),('refund_requests'),('refund_transactions'),('reservations'),('staff_tasks'),('support_tickets'),('units'),('users'))
SELECT format('SELECT %L AS candidate, count(*) FILTER (WHERE %I < 0) AS negative_rows, count(*) FILTER (WHERE %I <> trunc(%I)) AS fractional_rows, min(%I) AS minimum_value, max(%I) AS maximum_value FROM public.%I;',
              c.table_name||'.'||c.column_name,c.column_name,c.column_name,c.column_name,c.column_name,c.column_name,c.table_name) AS sql_to_review
FROM information_schema.columns c JOIN target t USING(table_name)
WHERE c.table_schema='public' AND c.data_type IN ('numeric','decimal');

-- Q08: conditional compound quality/ledger checks.
SELECT 'invoice initial uniqueness' AS check_name, CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='reservation_id') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='invoice_type') THEN 'SELECT count(*) AS duplicate_initial_invoice_groups FROM (SELECT reservation_id,invoice_type FROM public.invoices WHERE reservation_id IS NOT NULL AND invoice_type IN (''DEPOSIT'',''RENT'') GROUP BY reservation_id,invoice_type HAVING count(*)>1) x;' ELSE 'BLOCKED: required live tables/columns not present or not visible' END AS sql_to_review;

SELECT 'refund key per original payment' AS check_name, CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_requests' AND column_name='payment_id') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_requests' AND column_name='idempotency_key') THEN 'SELECT count(*) AS duplicate_refund_key_groups FROM (SELECT payment_id,idempotency_key FROM public.refund_requests WHERE idempotency_key IS NOT NULL GROUP BY payment_id,idempotency_key HAVING count(*)>1) x;' ELSE 'BLOCKED: required live tables/columns not present or not visible' END AS sql_to_review;

SELECT 'legacy audit alias coverage' AS check_name, CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='time_str') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='time_display') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='ip') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='ip_address') THEN 'SELECT count(*) AS total_rows, count(*) FILTER (WHERE time_str IS NULL AND time_display IS NOT NULL) AS legacy_time_only, count(*) FILTER (WHERE ip IS NULL AND ip_address IS NOT NULL) AS legacy_ip_only FROM public.audit_logs;' ELSE 'BLOCKED: required live tables/columns not present or not visible' END AS sql_to_review;

SELECT 'audit max existing id' AS check_name, CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='id') THEN 'SELECT max(id) AS maximum_existing_audit_id FROM public.audit_logs;' ELSE 'BLOCKED: required live tables/columns not present or not visible' END AS sql_to_review;

SELECT 'active rental timestamp completeness' AS check_name, CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contracts' AND column_name='status') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contracts' AND column_name='start_at') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contracts' AND column_name='end_at') THEN 'SELECT count(*) FILTER (WHERE status IN (''ACTIVE'',''EXPIRING_SOON'',''OVERDUE'') AND (start_at IS NULL OR end_at IS NULL)) AS active_missing_timestamps, count(*) FILTER (WHERE end_at < start_at) AS inverted_intervals FROM public.contracts;' ELSE 'BLOCKED: required live tables/columns not present or not visible' END AS sql_to_review;

SELECT 'reservation cutover readiness' AS check_name, CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='status') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='appointment_at') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='rental_start_at') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations' AND column_name='monthly_price_snapshot') THEN 'SELECT count(*) AS active_unreconciled_reservations FROM public.reservations WHERE status IN (''PENDING_PAYMENT'',''RESERVED'') AND (appointment_at IS NULL OR rental_start_at IS NULL OR monthly_price_snapshot IS NULL);' ELSE 'BLOCKED: required live tables/columns not present or not visible' END AS sql_to_review;

SELECT 'ownership and money visibility' AS check_name, CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='status') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='amount') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='user_id') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='facility_code') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='invoice_id') THEN 'SELECT count(*) AS unresolved_paid_rows, sum(amount) AS unresolved_paid_total FROM public.payments WHERE status IN (''PAID'',''REFUNDED'') AND (user_id IS NULL OR facility_code IS NULL OR invoice_id IS NULL);' ELSE 'BLOCKED: required live tables/columns not present or not visible' END AS sql_to_review;

SELECT 'refund execution separation' AS check_name, CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_transactions' AND column_name='performed_by') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_transactions' AND column_name='confirmed_by') THEN 'SELECT count(*) AS same_actor_confirmations FROM public.refund_transactions WHERE confirmed_by IS NOT NULL AND performed_by=confirmed_by;' ELSE 'BLOCKED: required live tables/columns not present or not visible' END AS sql_to_review;

SELECT 'refund limit conservation' AS check_name, CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='id') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='amount') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_requests' AND column_name='payment_id') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_requests' AND column_name='status') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_requests' AND column_name='requested_amount') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_requests' AND column_name='approved_amount') THEN 'SELECT count(*) AS payments_over_refund_limit FROM (SELECT p.id,p.amount FROM public.payments p JOIN public.refund_requests r ON r.payment_id=p.id GROUP BY p.id,p.amount HAVING sum(CASE WHEN r.status=''PENDING'' THEN r.requested_amount WHEN r.status IN (''APPROVED'',''EVIDENCE_SUBMITTED'',''COMPLETED'') THEN r.approved_amount ELSE 0 END)>p.amount) x;' ELSE 'BLOCKED: required live tables/columns not present or not visible' END AS sql_to_review;


-- Counts are subject to current role/RLS. Zero visible rows does not prove zero physical defects.
-- No nextval/setval, EXPLAIN ANALYZE writes, automatic repairs or DDL are used.
ROLLBACK;
