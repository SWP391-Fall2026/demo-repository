"""Prepare a BLOCKED G0 report from approved local artifacts only. No DB/network code.

Never discovers credentials or reads .env, application config, shell history, or data rows.
Existing planning artifacts/SQL and application source are read-only inputs.
"""
from pathlib import Path
from datetime import datetime, timezone, timedelta
import json, hashlib, re

ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
ALLOWED_OUTPUTS={'live-schema-verification.md','g0-field-comparison.json','g0-field-comparison.md','g0-evidence-manifest.json'}
INPUTS=['schema-diff.md','mapping-inventory.json','new-column-plan.md','constraints-and-dependencies.md','risks-and-decisions.md','tests-and-rollback.md','sql/00_metadata_readonly.sql','sql/01_quality_queries_readonly.sql','validation-report.md']
def read(rel):
    p=(ROOT/rel).resolve()
    assert p.is_relative_to(ROOT)
    assert not p.name.startswith('.env') and p.suffix not in {'.properties','.yml','.yaml'}
    assert not any(x in {'.git','.aws','node_modules','var'} for x in p.relative_to(ROOT).parts)
    return p.read_text(encoding='utf-8')
def digest(path):
    return hashlib.sha256(read(path.relative_to(ROOT)).encode()).hexdigest()
def write(name,text):
    assert name in ALLOWED_OUTPUTS
    (OUT/name).write_text(text,encoding='utf-8',newline='\n')

artifact_texts={name:read((OUT/name).relative_to(ROOT)) for name in INPUTS}
inv=json.loads(artifact_texts['mapping-inventory.json'])
old_hashes=json.loads(read((OUT/'source-snapshot.json').relative_to(ROOT)))
source_checks=[]
protected={name:digest(OUT/name) for name in INPUTS}
for f in sorted((OUT/'sql').glob('draft_*.sql')):
    protected['sql/'+f.name]=digest(f)
    assert "RAISE EXCEPTION 'DRAFT BLOCKED" in read(f.relative_to(ROOT))

for table,e in inv['entities'].items():
    text=read(e['source']);sha=hashlib.sha256(text.encode()).hexdigest()
    matches=sha==old_hashes.get(e['source'])
    source_checks.append({'entity':e['entity'],'table':table,'source':e['source'],'sha256':sha,'matches_inventory_baseline':matches})
    protected[e['source']]=sha

sources={
 'AUDIT_ACTOR_FACILITY':('backend/src/main/java/com/swp391/selfstorage/modules/audit/service/AuditLogService.java',r'log.setFacilityCode'),
 'RESERVATION_EVENT_FACILITY':('backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java',r'r.setFacilityCode'),
 'SCOPE_BY_ACTOR':('backend/src/main/java/com/swp391/selfstorage/common/security/ActorContext.java',r'boolean visible'),
 'BUSINESS_CLOCK':('backend/src/main/java/com/swp391/selfstorage/config/ClockConfig.java',r'Clock.system'),
 'INVOICE_OPTIONAL_KIND':('backend/src/main/java/com/swp391/selfstorage/modules/billing/repository/InvoiceRepository.java',r'Optional<Invoice> findByReservationIdAndInvoiceType'),
 'INVOICE_RENEWAL_PENDING':('backend/src/main/java/com/swp391/selfstorage/modules/billing/service/InvoiceService.java',r'boolean hasPendingRenewal'),
 'RENEWAL_MULTI_PERIOD':('backend/src/main/java/com/swp391/selfstorage/modules/rental/service/RenewalService.java',r'Invoice confirm'),
 'PAYMENT_KEY_GLOBAL':('backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java',r'findByIdempotencyKey'),
 'REFUND_KEY_PAYMENT_SCOPE':('backend/src/main/java/com/swp391/selfstorage/modules/billing/service/RefundRequestService.java',r'key.equals\(r.getIdempotencyKey'),
 'REFUND_QUOTA':('backend/src/main/java/com/swp391/selfstorage/modules/billing/service/RefundRequestService.java',r'var existing = refunds.findByPaymentId'),
 'REFUND_SINGLE_EVIDENCE':('backend/src/main/java/com/swp391/selfstorage/modules/billing/service/RefundExecutionService.java',r'!"APPROVED".equals'),
 'REFUND_SINGLE_CONFIRM':('backend/src/main/java/com/swp391/selfstorage/modules/billing/service/RefundExecutionService.java',r'!"EVIDENCE_SUBMITTED".equals'),
 'CLIENT_VOLATILE_KEY':('frontend/src/shared/api/idempotent-request.ts',r'new Map<string, string>'),
 'SRS_AUDIT':('docs/requirements/srs.md',r'\*\*AuditLog:'),
 'SRS_INVOICE':('docs/requirements/srs.md',r'\*\*Invoice:'),
 'SRS_ACCOUNTING':('docs/requirements/srs.md',r'\*\*BR-010\*\*'),
 'APPROVED_INVOICE_PAYMENT':('docs/requirements/decision-log.md',r'\| Invoice và Payment \|'),
 'APPROVED_REFUND_QUOTA':('docs/requirements/decision-log.md',r'\| Giữ hạn mức \|')
}
source_evidence=[]
for eid,(file,pattern) in sources.items():
    text=read(file);matches=[n for n,l in enumerate(text.splitlines(),1) if re.search(pattern,l)]
    assert matches,(eid,file)
    protected[file]=hashlib.sha256(text.encode()).hexdigest()
    source_evidence.append({'id':eid,'file':file,'line':matches[0],'evidence_kind':'SOURCE_OR_REQUIREMENT_NOT_LIVE','sha256':protected[file]})

now=datetime.now(timezone.utc)
stamp=now.isoformat(timespec='seconds')
local=now.astimezone(timezone(timedelta(hours=7))).isoformat(timespec='seconds')
rows=[]
source_match={x['table']:x['matches_inventory_baseline'] for x in source_checks}
for table,e in sorted(inv['entities'].items()):
    for f in e['fields']:
        column=f['column'];h=inv.get('live_metadata',{}).get(table,{}).get(column)
        historical=None
        if table=='audit_logs':
            historical={'evidence_id':'HIST-AUDIT-USER-SNAPSHOT','scope_status':'DATABASE_ROLE_VERSION_CAPTURE_TIME_NOT_VERIFIED',
                'column_presence_reported':h is not None,
                'type_reported':h.get('type') if h else None,
                'nullable_reported':h.get('nullable') if h else None,
                'accepted_as_current_g0_evidence':False}
        ref=inv['reference'].get(table,{}).get('columns',{}).get(column)
        question='Q_OPERATOR_SCOPE'
        if table=='audit_logs' and column=='facility_code':question='D1_AUDIT_FACILITY'
        elif f['java_type'].endswith(('LocalDateTime','LocalDate')):question='D2_TIME_MODEL'
        elif table in {'invoices','payments','refund_requests','refund_transactions'}:question='D3_BILLING_REFUND'
        value={k:f.get(k) for k in ['java_type','nullable','nullable_explicit','length','length_explicit','precision','scale','unique','id','generation']}
        value.update({'db_default_declared':'NOT_DECLARED_IN_CURRENT_JPA','has_java_initializer':bool(f.get('java_initializer')),'note':'Java initializer is not an SQL DEFAULT.'})
        rows.append({'entity':e['entity'],'table':table,'column':column,'field':f['field'],
            'source':e['source'],'source_line':f['line'],'source_baseline_matches':source_match[table],
            'source_mapping':value,'expected_schema':'UNSPECIFIED_BY_TABLE_ANNOTATION; public remains a candidate',
            'live_observation_state':'NOT_COLLECTED','live_value':None,'classification':['UNVERIFIED'],
            'live_evidence_ids':[],'historical_context':historical,
            'reference_context':{'present_in_reference':ref is not None,'type':ref.get('type') if ref else None,'nullable':ref.get('nullable') if ref else None,'not_live_evidence':True},
            'risk':'Cao khi triển khai thiếu bằng chứng' if f['id'] or question!='Q_OPERATOR_SCOPE' else 'Chưa định lượng; cần metadata',
            'question_id':question,'next_step':'Operator xác nhận read-only/DB/schema/role và gửi metadata cấu trúc đã làm sạch; đối chiếu type/nullability/default/constraint theo từng thuộc tính, không sửa schema.',
            'evidence_source_ids':[e['source'],'mapping-inventory.json']})

manifest={'offline_reviewed_at_utc':stamp,'offline_reviewed_at_asia_ho_chi_minh':local,
 'g0_status':'BLOCKED_NO_OPERATOR_CONFIRMED_READONLY_CONNECTION',
 'live_query_time':None,'approved_connection_alias':None,'operator_approval':None,
 'verified_database':None,'verified_schema':None,'verified_current_role':None,'verified_session_role':None,
 'verified_postgresql_version':None,'verified_privilege_scope':None,
 'accepted_live_metadata':[],'quality_queries_created':0,'quality_queries_executed':0,'database_queries_executed':0,
 'historical_evidence':{'id':'HIST-AUDIT-USER-SNAPSHOT','source':'Previous user-supplied audit_logs information_schema result, retained in mapping-inventory.json','capture_time':None,'database':None,'role':None,'version':None,'schema_reported_by_user':'public','accepted_as_current_g0_evidence':False},
 'artifact_hashes':{k:v for k,v in protected.items() if not k.startswith(('backend/','frontend/','docs/requirements/'))},
 'source_checks':source_checks,'source_evidence':source_evidence}
write('g0-evidence-manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
write('g0-field-comparison.json',json.dumps({'reviewed_at':stamp,'live_capture_at':None,'status':manifest['g0_status'],
 'classification_counts_assigned':{'UNVERIFIED':len(rows)},'other_classifications':'NOT_EVALUATED; not evidence of zero defects or zero EXTRA_LIVE objects',
 'extra_live_inventory_state':'NOT_COLLECTED','fields':rows},ensure_ascii=False,indent=2)+'\n')

matrix=['# G0 — đối chiếu field khi chưa có bằng chứng live được chấp nhận\n',
 f'Mốc rà soát source/artifact: {local}. Không phải thời điểm truy vấn live. **{len(rows)} mapping UNVERIFIED**; không có MATCH/MISSING_LIVE/EXTRA_LIVE/mismatch live được kết luận. Snapshot audit trước đây được giữ dưới historical_context, không tái gắn là kết quả G0.\n',
 '| Entity / table.column | Mapping source | Metadata live G0 | Bằng chứng / nguồn | Phân loại | Rủi ro | Câu hỏi | Bước tiếp theo |',
 '|---|---|---|---|---|---|---|---|']
for row in rows:
    f=row['source_mapping'];shape=f"{f['java_type']}; nullable={f['nullable']}; length_hint={f['length']}; unique={f['unique']}; id={f['id']}"
    evidence=f"Source L{row['source_line']}; mapping-inventory.json; baseline {'khớp' if row['source_baseline_matches'] else 'DRIFT — cần kiểm kê lại'}"
    if row['historical_context']:evidence+='; HIST-AUDIT-USER-SNAPSHOT chưa xác nhận identity/quyền/thời điểm'
    matrix.append(f"| {row['entity']} / `{row['table']}.{row['column']}` | {shape} | Chưa thu thập | {evidence} | UNVERIFIED | {row['risk']} | {row['question_id']} | Nhận catalog được duyệt, đối chiếu từng thuộc tính; không áp dụng thay đổi. |")
matrix.append('\nKhông có đủ catalog để kiểm kê EXTRA_LIVE. Các cột ngoài entity trong REF hoặc snapshot cũ không tự trở thành EXTRA_LIVE đã xác minh. File JSON chứa source path, line, reference context và historical context của từng field.\n')
write('g0-field-comparison.md','\n'.join(matrix)+'\n')

rules='''| Nhãn | Điều kiện cần trước khi gán |
|---|---|
| MATCH | Đúng target/schema/mapping, đủ visibility và cùng thuộc tính đã kiểm; không dùng để suy ra dữ liệu sạch/round-trip đúng |
| MISSING_LIVE | Catalog xác nhận table/column vắng trong schema mapping đúng, quyền quan sát đầy đủ; information_schema không trả hàng một mình chưa đủ |
| EXTRA_LIVE | Catalog live xác nhận object có nhưng không thuộc mapping/scope đối chiếu; không mặc định là lỗi hoặc đề xuất xóa |
| TYPE_MISMATCH | Type/semantics khác sau chuẩn hóa alias; phân biệt JDBC compatibility với DDL length hint. LocalDateTime/timestamptz khác ngữ nghĩa chưa tự chứng minh validation hỏng |
| NULLABILITY_MISMATCH | Nullability live đã xác minh khác mapping; giữ nguyên DB invariant, kiểm tra đường ghi trước đề xuất |
| DEFAULT_MISMATCH | Có yêu cầu DB generation/default rõ và metadata đủ chứng minh khác; Java initializer không tự là yêu cầu DEFAULT SQL |
| CONSTRAINT_MISMATCH | Definition/scope/validation live đã được review khác invariant đã chốt; 49 logical FK candidates không là 49 FK bắt buộc còn thiếu |
| UNVERIFIED | Thiếu identity/visibility/definition/thời điểm hoặc source drift; không tự đổi thành MISSING |
'''
table_summary=['| Bảng / Entity | Field source | Field live chấp nhận | Trạng thái |','|---|---|---|---|']
for t,e in sorted(inv['entities'].items()):table_summary.append(f"| {t} / {e['entity']} | {len(e['fields'])} | Chưa thu thập | UNVERIFIED |")
evidence_table=['| ID | Source | Dòng | Loại bằng chứng |','|---|---|---|---|']
for e in source_evidence:evidence_table.append(f"| {e['id']} | `{e['file']}` | {e['line']} | Source/SRS/decision log, không phải live |")
report=f'''# Live schema verification — G0 CHƯA ĐẠT / BLOCKED

## 1. Kết luận và thời điểm

**Không thực hiện kết nối hoặc truy vấn database.** Chưa có connection read-only được operator chủ động cấu hình/phê duyệt và chưa xác nhận DB/schema/role/visibility. Theo ràng buộc người dùng, phần live dừng tại đây và chuyển cho operator thu thập thủ công.

- Mốc rà soát artifact/source: **{local}** (UTC: {stamp}).
- Thời điểm truy vấn live: **không có**.
- Database, schema, current_role/session_role, PostgreSQL version đã xác minh: **chưa có**.
- Connection alias/phê duyệt read-only: **chưa được cung cấp**. Không tìm hoặc dùng credential trong .env, application config hoặc lịch sử shell.
- Trạng thái G0: **BLOCKED, không PASS**. Source hợp lệ và SQL draft có guard không thay thế metadata live.

## 2. Đã đọc / phạm vi bằng chứng

Đã đọc đầy đủ schema-diff.md, mapping-inventory.json, new-column-plan.md, constraints-and-dependencies.md, risks-and-decisions.md, tests-and-rollback.md, sql/00_metadata_readonly.sql, sql/01_quality_queries_readonly.sql và validation-report.md. Hash input và source anchors lưu trong [g0-evidence-manifest.json](g0-evidence-manifest.json).

Đã đối chiếu source của {len(inv['entities'])} Entity với fingerprint inventory: **{sum(x['matches_inventory_baseline'] for x in source_checks)}/{len(source_checks)} khớp baseline**. Đây chỉ chứng minh inventory source còn phù hợp, không phải MATCH với database. Không đọc application config/.env/history, không chạy app, test, Maven, psql hay client DB.

Metadata audit từng do người dùng cung cấp còn là bằng chứng lịch sử: báo thiếu user_id/entity_id/facility_code và cho biết một số thuộc tính audit_logs. Không có capture timestamp, DB/role/version và visibility được xác nhận cho lượt G0 này. Vì vậy không nâng nó thành kết quả live mới, cũng không xóa hoặc sửa nhận định lịch sử trong artifact cũ.

REF vẫn chỉ là file tham chiếu. Các 37 cột bổ sung và 2 bảng mới so với REF không được báo là thiếu live. Quyết định business phải phân biệt với cấu trúc thực tế và với code đang triển khai.

## 3. Kết quả kiểm kê cho G0

{chr(10).join(table_summary)}

Tổng **{len(rows)} field = UNVERIFIED**. Không có live metadata được chấp nhận để gán các nhãn còn lại; điều đó không có nghĩa có 0 mismatch hoặc 0 extra object. staff_tasks và mọi object ngoài mapping chưa thể kiểm kê live.

- [Bảng từng field](g0-field-comparison.md): source value, live value chưa thu thập, nguồn, rủi ro, câu hỏi và bước tiếp theo.
- [Inventory JSON](g0-field-comparison.json): 216 record và historical/reference context, accepted live evidence rỗng.

## 4. Quy tắc phân loại sau khi nhận metadata

{rules}

Một field có thể có nhiều nhãn mismatch theo thuộc tính; quyền bị hạn chế phải được ghi kèm, không dùng nhãn MATCH toàn field nếu mới biết type mà thiếu nullability/default/constraint. Không thu hẹp TEXT/varchar không giới hạn chỉ để khớp length hint 255/50; BigDecimal chưa khai precision/scale. Không đổi dữ liệu hoặc kiểu chỉ bằng so tên type.

## 5. Metadata chưa thu thập và giới hạn quyền

| Nhóm | Trạng thái / điều kiện thiếu |
|---|---|
| Identity / version / capture time | Chưa biết đúng database/schema/role/version và snapshot |
| Read-only / role scope | Chưa có operator approval, privilege proof; read_only flag hoặc tên role không tự là phê duyệt |
| Tables / columns / exact types | Chưa có catalog relation/attribute và thông tin information_schema visibility |
| Length / precision / scale / datetime precision | Chưa thu thập; NULL metadata có thể do quyền/không có dòng chứ không tự là unlimited |
| Nullability / default / identity / generated | Chưa có dữ liệu current; default/generation expression có thể chứa secret, không yêu cầu raw dump |
| PK / unique / FK / CHECK | Chưa có definition hiện hành, trạng thái validated/deferrable và mapping cột |
| Indexes | Chưa có scope, predicate/expression, unique/valid/ready được xác nhận |
| Sequences / ownership | Chưa xác minh association/owner/grants; không gọi nextval/setval |
| Trigger / policy / RLS | Chưa biết enabled/forced, roles, semantics và privileges; không lấy secret-bearing body/argument |
| Observability | Chưa biết USAGE/SELECT/catalog visibility, owner/superuser/bypass RLS hoặc phạm vi được ủy quyền |
| Extra objects / dependencies | Chưa có đủ catalog; không kết luận “không tồn tại” |

Không có lỗi permission live nào được tái hiện vì không kết nối; trạng thái đúng là **quyền chưa xác minh**, không khẳng định bị từ chối hoặc được cấp.

## 6. Hướng dẫn operator để tiếp tục G0

Xem [g0-operator-handoff.md](g0-operator-handoff.md). Operator xác nhận target và kết nối read-only có sẵn, chạy SELECT nhận diện trước; sau khi đúng scope mới thu catalog đã được duyệt. Không gửi credential/DSN/token. Trả batch đã làm sạch, thời điểm và mục chạy/lỗi/bị hạn chế.

Các snippet tối thiểu không xuất default/expression literal, trigger argument hoặc function body; vì vậy một số mục sẽ còn UNVERIFIED đến khi operator cung cấp mô tả/definition an toàn. Không chạy/export nguyên sql/00_metadata_readonly.sql chưa review: redaction theo tên cột không bảo đảm mọi literal không chứa secret.

Chưa có dữ liệu chất lượng được phép kiểm tra. **Không chạy sql/01_quality_queries_readonly.sql và không tạo/chạy query aggregate trên bảng/cột chưa xác minh.** Sau metadata và phê duyệt scope dữ liệu riêng, chỉ tạo SELECT có điều kiện tồn tại/type; không kết luận sạch từ 0 nếu RLS có thể che hàng.

## 7. Ba quyết định — đề xuất để duyệt, không tự chốt

Phân tích chi tiết source + SRS + phần chứng cứ còn thiếu ở [g0-business-decisions.md](g0-business-decisions.md).

| Chủ đề | Hiện trạng source | Hướng đề xuất | Điều kiện còn thiếu |
|---|---|---|---|
| Audit facility | record() lấy facility của actor | Ưu tiên event/target facility cho truy vết cơ sở; snapshot actor facility riêng nếu cần | User chọn semantics; lịch sử/producer/consumer chưa xác minh; đổi nghĩa cần task code riêng |
| Thời gian | LocalDateTime và nhiều nguồn now()/Clock; snapshot audit có timestamptz | Thời điểm theo instant UTC, lịch hẹn có zone cơ sở rõ, giữ nghĩa LocalDate | Metadata types/precision/session + rehearsal driver/Hibernate/round-trip và nguồn lịch sử |
| Billing/refund | Invoice → nhiều attempt; refund request theo payment; execution hiện chỉ một bằng chứng được xử lý | Invoice theo nghĩa vụ/kỳ; retry execution 1:N nếu được chốt; key theo đúng operation scope | Cardinality lịch sử, split payout hay một completed, namespace reference, payload replay, UNIQUE/FK live |

Không đủ dữ liệu thực tế hoặc hành vi PostgreSQL để xác nhận ba quyết định cuối cùng. Source review thấy replay khác payload chưa được backend kiểm fingerprint đầy đủ, client key chỉ lưu trong RAM và chưa có workflow retry refund thực sự; không coi việc thêm unique/FK là giải pháp thay các hành vi đó.

## 8. Bằng chứng source có thể kiểm tra lại

{chr(10).join(evidence_table)}

Các khoảng source không có thông tin đăng nhập được đọc để phân tích. Không lấy dữ liệu khách, chi tiết chuyển tiền hoặc credential runtime. Các kết quả test logic/H2 trước đây chỉ là lịch sử, không được ghi như test G0 mới hoặc chứng minh PostgreSQL hiện tại.

## 9. Phạm vi thay đổi trong lượt này

Chỉ tạo tài liệu G0: báo cáo này, handoff operator, phân tích quyết định, field comparison JSON/Markdown và evidence manifest. Không sửa source, application config, ddl-auto, runtime SQL, migration/candidate SQL hoặc guard. Không kết nối DB, không chạy SQL/data quality/test app, không thay RLS/privilege/trigger/sequence/constraint, không commit/push. Input/source fingerprints được kiểm lại sau khi tạo báo cáo; kiểm tra này không truy vấn DB.

## 10. Câu hỏi cần operator/người dùng quyết định

1. **Kết nối G0:** operator sẽ gửi metadata đã làm sạch hay cung cấp connection handle read-only được phê duyệt sẵn? DB/schema/role mục tiêu, người phê duyệt, thời điểm và scope quan sát là gì (không gửi credential)?
2. **Audit facility:** chọn event/target facility và lưu actor facility riêng khi cần, hay tiếp tục actor-facility? Scope toàn chuỗi và chuyển nhân sự được biểu diễn thế nào?
3. **Thời gian:** chốt instant UTC + timezone cơ sở cho lịch hẹn không? Ai xác nhận timezone lịch sử và phạm vi rehearsal PostgreSQL riêng trước khi thay mapping?
4. **Billing/refund:** Invoice theo nghĩa vụ/kỳ, nhiều Payment attempt; refund execution cho retry 1:N với tối đa một completed hay được chia nhiều đợt chi? Chốt scope key/reference và replay khác payload trả 409 trước khi duyệt constraint.
5. **Dữ liệu thực tế:** sau metadata, có cho phép một scope aggregate kiểm tra lịch sử/duplicate/quota riêng không? Role đó có quan sát đầy đủ hay bị RLS giới hạn?
'''
write('live-schema-verification.md',report)

# Never invoke prior generator/validator (which reads config hashes); protect only explicit safe inputs.
for rel,sha in protected.items():
    path=OUT/rel if rel in INPUTS or rel.startswith('sql/') else ROOT/rel
    assert hashlib.sha256(read(path.relative_to(ROOT)).encode()).hexdigest()==sha, 'Protected input changed: '+rel
assert len(rows)==216 and len(source_checks)==16
print(json.dumps({'g0_status':manifest['g0_status'],'offline_review_time':local,
 'source_entities_baseline_match':sum(x['matches_inventory_baseline'] for x in source_checks),
 'fields_unverified':len(rows),'live_queries':0,'quality_queries':0,'approved_connection':False,
 'prior_artifacts_and_guarded_sql_unchanged':True},ensure_ascii=False))
