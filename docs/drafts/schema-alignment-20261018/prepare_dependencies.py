"""Generate review candidates and read-only query text. No DB/client/network code."""
import prepare_review as r
import json

# Semantic links inferred from ID setters/repository lookups; JPA declares NO associations.
links = {
 'users': [('facility_code','facilities','code')],
 'units':[('facility_code','facilities','code'),('held_by_reservation_id','reservations','id'),('readiness_requested_by','users','id')],
 'reservations':[('user_id','users','id'),('facility_code','facilities','code'),('unit_code','units','code'),('schedule_approved_by','users','id')],
 'contracts':[('reservation_id','reservations','id'),('user_id','users','id'),('unit_code','units','code'),('facility_code','facilities','code')],
 'invoices':[('reservation_id','reservations','id'),('contract_id','contracts','id'),('user_id','users','id'),('facility_code','facilities','code')],
 'payments':[('invoice_id','invoices','id'),('reservation_id','reservations','id'),('contract_id','contracts','id'),('user_id','users','id'),('facility_code','facilities','code')],
 'refund_requests':[('payment_id','payments','id'),('reservation_id','reservations','id'),('contract_id','contracts','id'),('inspection_id','inspection_records','id'),('facility_code','facilities','code'),('user_id','users','id'),('requested_by','users','id'),('approved_by','users','id')],
 'refund_transactions':[('refund_request_id','refund_requests','id'),('performed_by','users','id'),('confirmed_by','users','id')],
 'handover_records':[('contract_id','contracts','id'),('reservation_id','reservations','id'),('staff_id','users','id')],
 'inspection_records':[('contract_id','contracts','id'),('staff_id','users','id')],
 'daily_tasks':[('staff_id','users','id'),('facility_code','facilities','code'),('unit_code','units','code'),('reservation_id','reservations','id'),('contract_id','contracts','id')],
 'support_tickets':[('user_id','users','id'),('facility_code','facilities','code'),('unit_code','units','code'),('staff_assigned','users','id')],
 'business_policies':[('updated_by','users','id')],
 'audit_logs':[('user_id','users','id'),('facility_code','facilities','code')]
}
values=',\n'.join(" ('%s','%s','%s','%s')"%(t,c,pt,pc) for t,v in links.items() for c,pt,pc in v)
r.write('dependency-inventory.json',json.dumps(links,indent=2)+'\n')
doc=['# Dependency, constraint và index — bản nháp\n',
'''## Thứ tự

1. M00: metadata live/privileges/timezone và review dữ liệu; xác nhận schema public. Không chạy app/scheduler trên DB thật để thử validate.
2. D10: audit (giữ module mới), chỉ mở rộng nullable.
3. D20: units/reservations/contracts, thêm scalar nullable; chưa bật luồng cũ thiếu timestamp/snapshot.
4. D30: invoices → payment/refund_request columns → refund_transactions. Chỉ tạo bảng nếu LIVE xác nhận vắng. Phải chốt và đưa ACL/RLS vào cùng transaction trước bất kỳ commit triển khai nào; file nháp chưa có vì chưa biết role/default privileges.
5. Đối soát lịch sử có chứng từ (thành kế hoạch riêng được phê duyệt). Không có câu UPDATE tự động trong bộ này.
6. D40: unique/CHECK và FK candidate sau khi kiểm tra duplicates/orphans, quyền truy cập và độ dài. FK về users/facilities cần có trước parent tương ứng, nhưng ADD FK chỉ làm sau khi toàn bộ table/column tồn tại.
7. D50: validate từng FK ở cửa sổ riêng, không gom cả hệ thống vào một transaction dài. Cutover chỉ khi toàn bộ mapping và dữ liệu active sẵn sàng.

Đây là thứ tự review/migration nội bộ, **không phải cho phép chạy app giữa từng bước**. Validate xét tất cả 16 entity cùng lúc.

Chu trình nullable units.held_by_reservation_id → reservations.id và reservations.unit_code → units.code: tạo reservation trước khi gán unit; thêm cả hai FK sau mở rộng. Không tự áp DEFERRABLE; code hiện lưu reservation trước và gán unit sau nên không có bằng chứng cần trì hoãn FK.

Không có @ManyToOne/@OneToMany/@JoinColumn/@Enumerated/@Version/@SequenceGenerator trong code. Các liên kết dưới đây là candidate theo service, không phải FK live đã biết. Không mặc định CASCADE hay SET NULL; draft dùng NO ACTION để giữ lịch sử, vẫn cần duyệt retention/cleanup bên ngoài ứng dụng.

## FK theo từng liên kết

| Child.column | Parent.column | Bằng chứng hiện có | Điều kiện trước khi thêm |
|---|---|---|---|
''']
fkbody=[];validatebody=[]
for table,cols in links.items():
    for col,pt,pc in cols:
        existing=(col,pt,pc) in r.reference.get(table,{}).get('foreign_keys',[])
        evidence='REF có FK; LIVE chưa biết' if existing else 'ID scalar/service lookup; FK LIVE chưa biết'
        condition='So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention'
        if table=='audit_logs' and col=='facility_code':condition+='; xác nhận actor facility, không target facility'
        if col in ('staff_assigned','updated_by'):condition+='; giá trị legacy có thể là tên/nhãn, không phải user ID'
        doc.append(f'| `{table}.{col}` | `{pt}.{pc}` | {evidence} | {condition} |')
        name=f'fk_draft_{table}_{col}'
        assert len(name)<=63,name
        # Existing reference FKs are inspected, not duplicated in DDL.
        if existing:continue
        fkbody.append(f'-- Candidate ONLY: omit if an equivalent live FK already exists.\nALTER TABLE public.{table} ADD CONSTRAINT {name}\n  FOREIGN KEY ({col}) REFERENCES public.{pt} ({pc}) ON UPDATE NO ACTION ON DELETE NO ACTION NOT VALID;')
        validatebody.append(f'ALTER TABLE public.{table} VALIDATE CONSTRAINT {name};')
doc.append('''
Không tạo FK cho audit_logs.entity_id: đối tượng đa hình gồm reservation/contract/payment/refund/unit/facility/user/task/ticket và khóa policy. Không FK login_history.username → users.username: code ghi thất bại với username chưa tồn tại, role UNKNOWN/BLOCKED hợp lệ cho login history. Không hợp nhất staff_tasks với daily_tasks bằng suy đoán.

## Unique/index candidate

| Candidate | Căn cứ | Rủi ro/gate |
|---|---|---|
| users.username, users.email | @Column(unique=true) + kiểm tra tạo tài khoản | LIVE index/constraint chưa biết. Kiểm tra duplicate exact và lower-case; không tự chuyển citext/lower unique hoặc đổi chữ hoa/thường. |
| payments(idempotency_key) WHERE NOT NULL | findByIdempotencyKey trả Optional, truy vấn key toàn cục | Kiểm tra trùng/blank/collation; không chế key cho lịch sử. |
| refund_requests(payment_id,idempotency_key) WHERE NOT NULL | service tìm key trong giao dịch gốc | Scope khác Payment; không unique toàn cục. Không sửa amount/status để hết trùng. |
| contracts(reservation_id) WHERE NOT NULL | findByReservationId Optional, handover chỉ tạo một hợp đồng/reservation | Cần xác nhận lịch sử; không xóa/chọn một hợp đồng tùy tiện. |
| invoices(reservation_id,invoice_type) cho DEPOSIT/RENT | requirePaid dùng Optional | BLOCK nếu lịch sử nhiều invoice tiền thuê theo kỳ; có thể cần sửa query/code sau phê duyệt thay vì siết unique. |
| refund_transactions.transfer_reference | findByReference Optional, mã giao dịch không dùng lại | Phải xác nhận reference có unique toàn hệ thống hay chỉ ngân hàng/ngày; không giả định quá scope. |
| refund_transactions.refund_request_id | flow hiện chỉ nhận một bằng chứng rồi đổi trạng thái | Chỉ chọn nếu không cần nhiều lần thực hiện/thất bại/đính chính. Query hiện trả List, nên đây không phải ràng buộc JPA bắt buộc. |
| Index child FK / scope | tra cứu theo owner/facility/status/payment | Dựa volume/EXPLAIN sau lấy metadata; không tạo trùng index sẵn có hoặc index mọi cột chỉ để validate. |

Draft index thường dùng CREATE INDEX trong transaction (có thể chặn ghi). Không đổi sang CONCURRENTLY trong transaction đó; nếu cần online thì tách script, gate phê duyệt và xử lý invalid index. Chưa chọn chiến lược online khi chưa biết kích thước/table traffic.

## CHECK, NOT NULL và default

- Reservation code ghi NO_SHOW, REF CHECK chưa cho phép. Thêm CHECK rộng hơn mà vẫn giữ CHECK cũ **không** mở được trạng thái này. Chỉ thay chính xác constraint đã review từ M05; placeholder trong draft chặn chạy. Không dùng regex quét rồi xóa tất cả CHECK liên quan status như SQL candidate cũ.
- Giữ các CHECK live khác sau khi so sánh giá trị thực/code; mọi enum hiện là String chứ không có Java @Enumerated. Không ép PostgreSQL enum type vì metadata chưa có.
- Không mở LOW cho support_tickets.priority chỉ vì comment entity có LOW: service hiện luôn tạo NORMAL; REF cho NORMAL/HIGH/URGENT. Đây là drift comment/thiết kế cần chốt, không tự nới constraint.
- Invoice.status phải bao gồm PENDING, PAID, CANCELLED vì ReservationMonitoringJob dùng CANCELLED. RefundRequest dùng PENDING/APPROVED/REJECTED/CANCELLED/EVIDENCE_SUBMITTED/COMPLETED. RefundTransaction dùng SUBMITTED/COMPLETED. Không thu hẹp tập live nếu còn trạng thái lịch sử chưa đối soát.
- NOT NULL của ref audit/user/ticket/handover/inspection/refund phải giữ; không nới chỉ để seed/test qua. Entity phần lớn thiếu nullable=false; validate không thay cho test ghi NULL và xác nhận DB invariant.
- Cột mới trong bảng có lịch sử giữ nullable; thêm NOT NULL chỉ sau chứng từ backfill và xét trường hợp NULL nghiệp vụ hợp lệ. invoices.reservation_id/contract_id và audit.facility_code không được NOT NULL vô điều kiện.
- Java field initializer không phải DEFAULT SQL. Không dùng false/0/giá hiện hành/now() để bịa các sự kiện lịch sử. INSERT ORM gửi NULL có thể không nhận DB default.
- REF có default mã PIN cố định (giá trị không đưa vào tài liệu). Cần xác minh live có default này qua cờ redacted; review việc bỏ default riêng, **không sửa/xóa PIN đang có**, không khởi tạo mã truy cập từ migration.
''')
r.write('constraints-and-dependencies.md','\n'.join(doc)+'\n')

indexes='''-- All UNIQUE candidates below require separate cardinality/scope approval.
-- Declared JPA unique keys: select only when no equivalent live uniqueness exists.
CREATE UNIQUE INDEX ux_draft_users_username ON public.users(username);
CREATE UNIQUE INDEX ux_draft_users_email ON public.users(email);
CREATE UNIQUE INDEX ux_draft_payments_idempotency ON public.payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX ux_draft_refund_payment_key ON public.refund_requests(payment_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX ux_draft_contract_reservation ON public.contracts(reservation_id) WHERE reservation_id IS NOT NULL;
-- Conditional: current API's Optional assumption; may conflict with periodic historic billing.
CREATE UNIQUE INDEX ux_draft_invoice_initial_kind ON public.invoices(reservation_id,invoice_type)
  WHERE reservation_id IS NOT NULL AND invoice_type IN ('DEPOSIT','RENT');
-- Conditional: approve reference namespace and transfer-attempt cardinality first.
CREATE UNIQUE INDEX ux_draft_refund_transfer_reference ON public.refund_transactions(transfer_reference);
CREATE UNIQUE INDEX ux_draft_refund_one_execution ON public.refund_transactions(refund_request_id);
-- Nonunique candidates; inspect existing index definitions and EXPLAIN before selecting.
CREATE INDEX ix_draft_refund_payment_status ON public.refund_requests(payment_id,status);
CREATE INDEX ix_draft_reservation_scope ON public.reservations(facility_code,unit_type,status);
CREATE INDEX ix_draft_invoice_owner_status ON public.invoices(user_id,status);
'''
checks='''-- BLOCKED TEMPLATE: fill exact name AND confirm definition from live M05.
-- Never blanket-drop checks; this placeholder deliberately cannot match a normal live name.
ALTER TABLE public.reservations DROP CONSTRAINT "__REVIEWED_LIVE_STATUS_CONSTRAINT_NAME__";
ALTER TABLE public.reservations ADD CONSTRAINT ck_draft_reservation_status
  CHECK (status IN ('PENDING_PAYMENT','RESERVED','CHECKED_IN','CANCELLED','EXPIRED','NO_SHOW')) NOT VALID;
-- Other CHECK/NOT NULL changes remain deferred: review states, nulls, historical rows first.
'''
r.draft('draft_40_constraints.sql',indexes+'\n'+checks+'\n\n'+'\n\n'.join(fkbody), 'select approved UNIQUE/FK candidates only; remove equivalent existing live constraints; reconcile duplicates/orphans; exact status CHECK definition required. NOT VALID still enforces new writes.')
r.draft('draft_50_validate_constraints.sql','-- Run per selected FK, not blindly as one large deployment transaction.\n'+ '\n'.join(validatebody)+'\nALTER TABLE public.reservations VALIDATE CONSTRAINT ck_draft_reservation_status;', 'only constraints actually selected/installed in approved D40; orphan checks pass; parent keys/types verified; agreed lock/traffic window.')

tables=sorted(set(r.entities)|set(r.reference))
target_values=','.join("('%s')"%t for t in tables)
quality='''-- READ ONLY. Generates additional SELECT text after inspecting existing columns.
-- No dynamic EXECUTE. Review returned SQL and run selected statements manually.
-- Counts/lengths only; no row names, email addresses, access codes, passwords or tokens.
-- Returned SELECTs must be run in a separate reviewed READ ONLY REPEATABLE READ transaction.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY;
SET LOCAL statement_timeout = '30s';
'''
quality+=f'''
-- Q01: null counts by existing column. No reference-schema existence assumptions.
WITH target(table_name) AS (VALUES {target_values})
SELECT format('SELECT %L AS table_name, %L AS column_name, count(*) AS rows_seen, count(*) FILTER (WHERE %I IS NULL) AS null_rows FROM %I.%I;',
              c.table_name,c.column_name,c.column_name,c.table_schema,c.table_name) AS sql_to_review
FROM information_schema.columns c JOIN target t USING(table_name)
WHERE c.table_schema='public' AND c.column_name !~* '(password|secret|token|pin|credential|rfid|physical_lock)'
ORDER BY c.table_name,c.ordinal_position;

-- Q02: length maxima without returning sensitive values. Compare with inventory length hints, not automatic narrowing.
WITH target(table_name) AS (VALUES {target_values})
SELECT format('SELECT %L AS table_name, %L AS column_name, max(char_length(%I)) AS max_chars FROM %I.%I;',
              c.table_name,c.column_name,c.column_name,c.table_schema,c.table_name) AS sql_to_review
FROM information_schema.columns c JOIN target t USING(table_name)
WHERE c.table_schema='public' AND c.data_type IN ('text','character varying','character')
  AND c.column_name !~* '(password|secret|token|pin|credential|rfid|physical_lock)'
ORDER BY c.table_name,c.ordinal_position;

-- Q03: state frequencies (not account/PII values), including values not yet documented.
WITH target(table_name) AS (VALUES {target_values})
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
{values})
SELECT format('SELECT %L AS candidate, count(*) AS orphan_rows FROM public.%I c LEFT JOIN public.%I p ON c.%I = p.%I WHERE c.%I IS NOT NULL AND p.%I IS NULL;',
              l.child_table||'.'||l.child_column,l.child_table,l.parent_table,l.child_column,l.parent_column,l.child_column,l.parent_column) AS sql_to_review
FROM link l
JOIN information_schema.columns c ON c.table_schema='public' AND c.table_name=l.child_table AND c.column_name=l.child_column
JOIN information_schema.columns p ON p.table_schema='public' AND p.table_name=l.parent_table AND p.column_name=l.parent_column;

-- Q07: numeric ranges and fractional rows; do not round monetary history.
WITH target(table_name) AS (VALUES {target_values})
SELECT format('SELECT %L AS candidate, count(*) FILTER (WHERE %I < 0) AS negative_rows, count(*) FILTER (WHERE %I <> trunc(%I)) AS fractional_rows, min(%I) AS minimum_value, max(%I) AS maximum_value FROM public.%I;',
              c.table_name||'.'||c.column_name,c.column_name,c.column_name,c.column_name,c.column_name,c.column_name,c.table_name) AS sql_to_review
FROM information_schema.columns c JOIN target t USING(table_name)
WHERE c.table_schema='public' AND c.data_type IN ('numeric','decimal');
'''

# Optional compound checks are emitted only if all columns they reference exist.
compound=[
 ('invoice initial uniqueness',[('invoices','reservation_id'),('invoices','invoice_type')],"SELECT count(*) AS duplicate_initial_invoice_groups FROM (SELECT reservation_id,invoice_type FROM public.invoices WHERE reservation_id IS NOT NULL AND invoice_type IN ('DEPOSIT','RENT') GROUP BY reservation_id,invoice_type HAVING count(*)>1) x;"),
 ('refund key per original payment',[('refund_requests','payment_id'),('refund_requests','idempotency_key')],"SELECT count(*) AS duplicate_refund_key_groups FROM (SELECT payment_id,idempotency_key FROM public.refund_requests WHERE idempotency_key IS NOT NULL GROUP BY payment_id,idempotency_key HAVING count(*)>1) x;"),
 ('legacy audit alias coverage',[('audit_logs','time_str'),('audit_logs','time_display'),('audit_logs','ip'),('audit_logs','ip_address')],"SELECT count(*) AS total_rows, count(*) FILTER (WHERE time_str IS NULL AND time_display IS NOT NULL) AS legacy_time_only, count(*) FILTER (WHERE ip IS NULL AND ip_address IS NOT NULL) AS legacy_ip_only FROM public.audit_logs;"),
 ('audit max existing id',[('audit_logs','id')],"SELECT max(id) AS maximum_existing_audit_id FROM public.audit_logs;"),
 ('active rental timestamp completeness',[('contracts','status'),('contracts','start_at'),('contracts','end_at')],"SELECT count(*) FILTER (WHERE status IN ('ACTIVE','EXPIRING_SOON','OVERDUE') AND (start_at IS NULL OR end_at IS NULL)) AS active_missing_timestamps, count(*) FILTER (WHERE end_at < start_at) AS inverted_intervals FROM public.contracts;"),
 ('reservation cutover readiness',[('reservations','status'),('reservations','appointment_at'),('reservations','rental_start_at'),('reservations','monthly_price_snapshot')],"SELECT count(*) AS active_unreconciled_reservations FROM public.reservations WHERE status IN ('PENDING_PAYMENT','RESERVED') AND (appointment_at IS NULL OR rental_start_at IS NULL OR monthly_price_snapshot IS NULL);"),
 ('ownership and money visibility',[('payments','status'),('payments','amount'),('payments','user_id'),('payments','facility_code'),('payments','invoice_id')],"SELECT count(*) AS unresolved_paid_rows, sum(amount) AS unresolved_paid_total FROM public.payments WHERE status IN ('PAID','REFUNDED') AND (user_id IS NULL OR facility_code IS NULL OR invoice_id IS NULL);"),
 ('refund execution separation',[('refund_transactions','performed_by'),('refund_transactions','confirmed_by')],"SELECT count(*) AS same_actor_confirmations FROM public.refund_transactions WHERE confirmed_by IS NOT NULL AND performed_by=confirmed_by;"),
 ('refund limit conservation',[('payments','id'),('payments','amount'),('refund_requests','payment_id'),('refund_requests','status'),('refund_requests','requested_amount'),('refund_requests','approved_amount')],"SELECT count(*) AS payments_over_refund_limit FROM (SELECT p.id,p.amount FROM public.payments p JOIN public.refund_requests r ON r.payment_id=p.id GROUP BY p.id,p.amount HAVING sum(CASE WHEN r.status='PENDING' THEN r.requested_amount WHEN r.status IN ('APPROVED','EVIDENCE_SUBMITTED','COMPLETED') THEN r.approved_amount ELSE 0 END)>p.amount) x;")]
quality+='\n-- Q08: conditional compound quality/ledger checks.\n'
for label,cols,sql in compound:
    predicates=' AND '.join("EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='%s' AND column_name='%s')"%c for c in cols)
    quality+="SELECT '"+label+"' AS check_name, CASE WHEN "+predicates+" THEN '"+sql.replace("'","''")+"' ELSE 'BLOCKED: required live tables/columns not present or not visible' END AS sql_to_review;\n\n"
quality+='''
-- Counts are subject to current role/RLS. Zero visible rows does not prove zero physical defects.
-- No nextval/setval, EXPLAIN ANALYZE writes, automatic repairs or DDL are used.
ROLLBACK;
'''
r.write('sql/01_quality_queries_readonly.sql',quality)
print(f'{sum(len(v) for v in links.values())} candidate relationships documented; read-only quality query generator saved.')
