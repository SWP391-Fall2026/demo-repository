"""Offline review artifact generator. Writes only beside this file; never opens a DB."""
from pathlib import Path
import re, json, hashlib

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
assert ROOT.name == 'storage-rental' and OUT.is_relative_to(ROOT / 'docs/drafts')

def write(name, value):
    target = (OUT / name).resolve()
    assert target.is_relative_to(OUT)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(value, encoding='utf-8', newline='\n')

def snapshot():
    files = {}
    for f in ROOT.rglob('*'):
        if not f.is_file() or f.is_relative_to(ROOT/'docs/drafts'):
            continue
        if any(x in {'node_modules','target','.git','dist','var','artifacts'} for x in f.relative_to(ROOT).parts) or f.name == '.env':
            continue
        files[f.relative_to(ROOT).as_posix()] = hashlib.sha256(f.read_bytes()).hexdigest()
    return dict(sorted(files.items()))

manifest_path = OUT/'source-snapshot.json'
if not manifest_path.exists():
    write('source-snapshot.json', json.dumps(snapshot(), indent=2)+'\n')

SENSITIVE = re.compile(r'password|secret|token|pin|credential|rfid|physical_lock', re.I)
def safe_default(name, value):
    return '[REDACTED: sensitive default present]' if value and SENSITIVE.search(name) else value

reference_text = (ROOT/'database/reference/current-schema-as-is.sql').read_text(encoding='utf-8')
reference = {}
for table, block in re.findall(r'CREATE TABLE public\.(\w+) \((.*?)\n\);', reference_text, re.S):
    cols = {}
    for col, decl in re.findall(r'^  ([a-z_]+) (.*?)(?:,)?$', block, re.M):
        typ = re.match(r'(character varying(?:\(\d+\))?|timestamp (?:with|without) time zone|numeric(?:\([^)]*\))?|bigint|integer|text|date|boolean)', decl)
        assert typ, (table,col)
        default = re.search(r'\bDEFAULT (.*?)(?= CHECK| NOT NULL| UNIQUE|$)', decl)
        cols[col] = {'type':typ[1], 'nullable':'NOT NULL' not in decl, 'default':safe_default(col, default[1] if default else None), 'unique_inline':' UNIQUE' in decl, 'check_expression':safe_default(col,decl[decl.index('CHECK '):] if 'CHECK ' in decl else None), 'line':reference_text[:reference_text.index('CREATE TABLE public.'+table)].count('\n')+1+block[:block.index('  '+col+' ')].count('\n')}
    pk = re.search(r'PRIMARY KEY \(([^)]+)\)', block)
    if pk:
        for col in pk[1].split(','):
            cols[col.strip()]['nullable'] = False
    reference[table] = {'columns':cols, 'primary_key':pk[1] if pk else None,
        'checks':re.findall(r'^  ([a-z_]+) .*CHECK .*$', block, re.M),
        'foreign_keys':re.findall(r'FOREIGN KEY \(([^)]+)\) REFERENCES public\.(\w+)\(([^)]+)\)',block)}

# Only the metadata supplied in the user's AuditLog investigation is LIVE evidence.
live = {'audit_logs':{}}
for col,typ,nullable,default in [
 ('id','bigint',False,"nextval(sequence)"),('time_display','character varying',True,None),
 ('user_name','character varying',False,None),('role','character varying',False,None),
 ('action','character varying',False,None),('detail','character varying',False,None),
 ('ip_address','character varying',True,"'127.0.0.1'"),('status','character varying',True,"'SUCCESS'"),
 ('created_at','timestamp with time zone',True,'now()'),('ip','character varying',True,None),('time_str','character varying',True,None)]:
    live['audit_logs'][col]={'type':typ,'nullable':nullable,'default':default,'length':'not supplied'}

entities = {}
for f in sorted((ROOT/'backend/src/main/java').rglob('*.java')):
    s=f.read_text(encoding='utf-8'); table=re.search(r'@Table\(name = "(\w+)"\)',s)
    if not re.search(r'@Entity\b',s): continue
    assert table, f
    fields=[]
    pattern=r'((?:\s*@[\w.]+(?:\([^)]*\))?\s*)*)private\s+([\w.<>]+)\s+(\w+)(?:\s*=\s*(.*?))?;'
    for m in re.finditer(pattern,s,re.S):
        ann,jtype,name,initial=m.groups(); column=re.search(r'@Column\((.*?)\)',ann,re.S)
        attrs=column[1] if column else ''
        named=re.search(r'name\s*=\s*"(\w+)"',attrs)
        col=named[1] if named else re.sub(r'(?<!^)([A-Z])',r'_\1',name).lower()
        isid='@Id' in ann
        field={'field':name,'column':col,'java_type':jtype,'id':isid,
            'generation':'IDENTITY' if 'GenerationType.IDENTITY' in ann else 'application assigned',
            'nullable':False if isid else not bool(re.search(r'nullable\s*=\s*false',attrs)),
            'nullable_explicit':bool(re.search(r'nullable\s*=',attrs)),
            'length':int(re.search(r'length\s*=\s*(\d+)',attrs)[1]) if re.search(r'length\s*=\s*(\d+)',attrs) else (255 if jtype=='String' else None),
            'length_explicit':bool(re.search(r'length\s*=',attrs)),
            'precision':int(re.search(r'precision\s*=\s*(\d+)',attrs)[1]) if re.search(r'precision\s*=\s*(\d+)',attrs) else None,
            'scale':int(re.search(r'scale\s*=\s*(\d+)',attrs)[1]) if re.search(r'scale\s*=\s*(\d+)',attrs) else None,
            'unique':bool(re.search(r'unique\s*=\s*true',attrs)),
            'java_initializer':safe_default(col,re.sub(r'\s+',' ',initial).strip() if initial else None),
            'line':s[:m.start()+len(m[0])-len(m[0].lstrip())].count('\n')+1}
        fields.append(field)
    assert fields and len({f['column'] for f in fields})==len(fields),f
    entities[table[1]]={'entity':f.stem,'source':f.relative_to(ROOT).as_posix(),'schema':'unspecified in @Table','fields':fields}

write('mapping-inventory.json',json.dumps({'evidence_scope':'LIVE = user-supplied audit_logs metadata only; no database connection. All other tables UNKNOWN live. REF = repository reference, not live truth.', 'live_metadata':live,'reference':reference,'entities':entities},ensure_ascii=False,indent=2)+'\n')

def code_type(f):
    t=f['java_type'].split('.')[-1]
    return {'String':f"String / VARCHAR({f['length']}) hint",'Long':'Long / BIGINT','Integer':'Integer / INTEGER','Boolean':'Boolean / BOOLEAN','boolean':'boolean / BOOLEAN','LocalDate':'LocalDate / DATE','LocalDateTime':'LocalDateTime / TIMESTAMP (không offset)','BigDecimal':'BigDecimal / NUMERIC (precision, scale không khai báo)'}[t]
def draft_type(f):
    return {'String':f"varchar({f['length']})",'Long':'bigint','Integer':'integer','Boolean':'boolean','boolean':'boolean','LocalDate':'date','LocalDateTime':'timestamp without time zone','BigDecimal':'numeric'}[f['java_type'].split('.')[-1]]

missing={t:[f for f in e['fields'] if f['column'] not in reference.get(t,{}).get('columns',{})] for t,e in entities.items()}
existing_missing={t:v for t,v in missing.items() if t in reference and v}
newtables=[t for t in entities if t not in reference]

def row_analysis(table,f):
    col=f['column']; refcol=reference.get(table,{}).get('columns',{}).get(col)
    lc=live.get(table,{}).get(col)
    schema = lc if lc else refcol
    code=code_type(f)+('; NOT NULL (PK)' if f['id'] else '; NULL' if f['nullable'] else '; NOT NULL')
    if f['id']:code+='; ID '+f['generation']
    if f['unique']:code+='; UNIQUE'
    if f['java_initializer']:code+='; Java init='+f['java_initializer']+' (không phải DB default)'
    flags=[];risk='Trung bình';action='Lấy metadata live; giữ kiểu/dữ liệu hiện có nếu JDBC tương thích, không ép theo DDL hint.'
    if table in live and not lc:
        known='LIVE: cột không tồn tại (snapshot do người dùng cung cấp)';kind='A — thiếu cột đã xác minh từ metadata cung cấp';risk='Cao';action='Draft 10: thêm nullable, không default/backfill giả; xác nhận ý nghĩa facility trước cutover.'
    elif lc:
        known=f"LIVE: {lc['type']}; {'NULL' if lc['nullable'] else 'NOT NULL'}; default={lc['default'] or 'không'}; length chưa cung cấp"
        if f['id']:known+='; PK chưa có metadata constraint riêng'
        kind='A — cấu trúc hiện biết; các thuộc tính chưa cung cấp vẫn C'
    elif refcol:
        known=f"LIVE: chưa biết. REF: {refcol['type']}; {'NULL' if refcol['nullable'] else 'NOT NULL'}; default={refcol['default'] or 'không'}"
        if reference[table]['primary_key']==col:known+='; PK'
        if refcol['unique_inline']:known+='; UNIQUE'
        for fkcol,pt,pc in reference[table]['foreign_keys']:
            if fkcol==col:known+=f'; FK → {pt}.{pc}'
        if refcol['check_expression']:known+='; CHECK (xem state-and-default-review.md)'
        kind='B — chỉ đối chiếu REF; live C'
    else:
        known='LIVE: chưa biết. REF: '+('không có bảng' if table not in reference else 'không có cột')
        kind='B — thiếu theo REF, chưa xác minh live';risk='Cao';action='Chỉ dùng draft additive nếu metadata live xác nhận vắng; NULL và không DB default/backfill.'
    if schema:
        if f['java_type'].endswith('LocalDateTime') and schema['type']=='timestamp with time zone':
            flags.append('khác mô hình thời gian');risk='Cao';action='BLOCK: chốt UTC/instant hay giờ địa phương; kiểm thử PG; chưa ALTER TYPE.'
        if f['java_type']=='String':
            flags.append('length SQL/JDBC chưa xác minh; không thu hẹp TEXT/varchar không giới hạn')
        if schema['nullable']!=f['nullable']:
            flags.append('nullability khác');risk='Cao' if not schema['nullable'] else risk
        if schema.get('default') and not f['java_initializer'] and f['generation']!='IDENTITY':
            flags.append('DB default khác Java init; ORM có thể gửi NULL thay vì dùng default')
    if f['id']:
        action+=' Giữ PK; '+('xác minh sequence/ownership/grants, không gọi nextval/setval.' if f['generation']=='IDENTITY' else 'ID do ứng dụng cấp; không tự chuyển sang UUID/native sequence.')
    if f['unique']:action+=' Kiểm tra trùng, NULL, collation và chữ hoa/thường trước UNIQUE.'
    if col in ('user_id','facility_code','invoice_id','payment_id','staff_id','held_by_reservation_id'):
        action+=' Đối soát liên kết; không backfill từ tên/giá hiện tại.'
    if flags:kind+='; '+', '.join(flags)
    return [f"{entities[table]['entity']}.{f['field']} → `{col}` (L{f['line']})",known,code,kind,risk,action]

header='''# Bảng đối chiếu schema — bản nháp, chưa triển khai

**A/LIVE** chỉ là snapshot metadata `audit_logs` do người dùng cung cấp trong yêu cầu điều tra trước; không truy vấn lại, chưa biết thời điểm thu thập. **B/REF** là khác/tương thích với file 15 bảng, tuyệt đối không chứng minh live. **C** là chưa xác minh. Metadata chỉ ghi `character varying` không xác định được length. JPA default length=255 là hint tạo DDL, không tự chứng minh phải thu hẹp cột đang có. BigDecimal không khai báo precision/scale. NULL trong bảng code là mapping, không phải quyết định nới NOT NULL của dữ liệu đang dùng.

Mỗi mục ghi source tương đối từ root repository; inventory JSON lưu thuộc tính chi tiết và Java initializer. Không có quan hệ JPA, enum Java, version column, converter hay native SQL trong source đã rà.

'''
lines=[header]
for table,e in sorted(entities.items()):
    lines += [f"## {table} — {e['entity']}\n",f"Source: `{e['source']}`. @Table không chỉ rõ schema; phải xác minh search_path/default_schema.\n",'| Entity/field | Schema hiện tại đã biết | Schema code yêu cầu | Loại chênh lệch | Rủi ro | Phương án xử lý |','|---|---|---|---|---|---|']
    for f in e['fields']:lines.append('| '+' | '.join(x.replace('|','/') for x in row_analysis(table,f))+' |')
    mapped={f['column'] for f in e['fields']}
    for col,c in reference.get(table,{}).get('columns',{}).items():
        if col not in mapped:
            known=('LIVE: '+live[table][col]['type']+'; REF: '+c['type']) if table in live and col in live[table] else 'LIVE: C; REF: '+c['type']
            lines.append(f'| Không mapping → `{col}` | {known} | Không đọc/ghi trực tiếp | '+('A' if table in live else 'B/C')+' — cột ngoài entity | Trung bình | Giữ nguyên; kiểm tra producer/consumer, default, trigger và lịch sử. Không xóa hoặc tự sao chép. |')
    lines.append('')
for table,r in reference.items():
    if table in entities:continue
    lines += [f'## {table} — không có Entity\n','| Entity/field | Schema hiện tại đã biết | Schema code yêu cầu | Loại chênh lệch | Rủi ro | Phương án xử lý |','|---|---|---|---|---|---|']
    for col,c in r['columns'].items():lines.append(f'| Không mapping / `{col}` | LIVE C; REF {c["type"]} | Không có Entity; workforce dùng daily_tasks | B/C — bảng legacy/thành phần khác chưa biết | Trung bình | Giữ nguyên, tìm consumer ngoài repo trước khi hợp nhất; không copy/xóa tự động. |')
write('schema-diff.md','\n'.join(lines)+'\n')

newplan=['# Kế hoạch từng cột mới — chỉ là candidate theo REF\n','Mọi cột thêm vào bảng có dữ liệu: **NULL, không default, không UPDATE backfill tự động**. Hai bảng mới: PK NOT NULL; các cột còn lại nullable theo mapping; constraint nghiệp vụ chỉ xét ở giai đoạn sau. VARCHAR dùng đúng hint mapping cho cột mới; NUMERIC không khóa precision/scale để tránh tự quyết định làm tròn VND.\n','| Bảng.cột | PostgreSQL đề xuất | NULL ban đầu | Căn cứ và backfill |','|---|---|---|---|']
for table,fields in missing.items():
    for f in fields:
        col=f['column'];basis='Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực.'
        if table=='audit_logs':basis='record() gán từ principal/ID đối tượng; không suy diễn actor từ user_name. facility hiện là facility của actor, có thể NULL.'
        elif 'appointment' in col or col in ('rental_start_at','start_at','end_at','cancelled_at','hold_until','arrived_at','terminated_at','no_show_alert_at'):
            basis='Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00.'
        elif col=='monthly_price_snapshot':basis='Chứng từ/hợp đồng/giá đã chốt gốc; tuyệt đối không lấy bảng giá hiện hành.'
        elif col in ('extension_used','extension_minutes','incident_open','exception_requested'):basis='Không tự gán false/0 cho lịch sử chưa biết; xác minh hồ sơ nghiệp vụ.'
        elif table in newtables:basis='Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát.'
        elif col=='idempotency_key':basis='Không sinh key ngẫu nhiên hoặc ghép mã cho giao dịch cũ; NULL hợp lệ nếu chưa có key gốc.'
        newplan.append(f'| `{table}.{col}` | `{draft_type(f)}` | {"Không (PK)" if f["id"] else "Có"} | {basis} |')
write('new-column-plan.md','\n'.join(newplan)+'\n')

def draft(name,body,prereq):
    write('sql/'+name, f'''-- REVIEW DRAFT ONLY. Not wired to Flyway/Liquibase/application resources.
-- Gate: {prereq}
BEGIN;
DO $draft_guard$ BEGIN
  RAISE EXCEPTION 'DRAFT BLOCKED: approval and live metadata review required';
END; $draft_guard$;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
{body}
-- Dry-run disposition only. No COMMIT in draft files.
ROLLBACK;
''')

def adds(tables):
    return '\n'.join(f'ALTER TABLE public.{t} ADD COLUMN {f["column"]} {draft_type(f)} NULL;' for t in tables for f in missing[t])
draft('draft_10_audit.sql',adds(['audit_logs']), 'confirm supplied audit metadata still current; approve actor-facility meaning. No IF NOT EXISTS: fail on drift.')
draft('draft_20_rental_inventory.sql',adds(['units','reservations','contracts']), 'LIVE metadata confirms every candidate column absent. Appointment/timezone and legacy reconciliation must be designed before cutover.')
billing=[]
for t in ['invoices']:
    billing.append('CREATE TABLE public.'+t+' (\n'+',\n'.join('  '+f['column']+' '+draft_type(f)+(' PRIMARY KEY' if f['id'] else ' NULL') for f in entities[t]['fields'])+'\n);')
billing.append(adds(['payments','refund_requests']))
t='refund_transactions'
billing.append('CREATE TABLE public.'+t+' (\n'+',\n'.join('  '+f['column']+' '+draft_type(f)+(' PRIMARY KEY' if f['id'] else ' NULL') for f in entities[t]['fields'])+'\n);')
draft('draft_30_billing.sql','\n\n'.join(billing),'confirm LIVE absence/types; no synthetic historic invoices/refunds. Existing owner/payment links must be reconciled.')

# Read source queries, annotations and state writes, rather than inventing database enums.
queries=[];states=[];relationships=[]
for f in sorted((ROOT/'backend/src/main/java').rglob('*.java')):
    s=f.read_text(encoding='utf-8')
    for m in re.finditer(r'@Query\((.*?)\)',s,re.S):queries.append({'source':f.relative_to(ROOT).as_posix(),'line':s[:m.start()].count('\n')+1,'annotation':m[1]})
    for m in re.finditer(r'\bset(Status|Role|Type|TaskType|InvoiceType|RefundType|Priority|ReadinessStatus)\((.*?)\);',s,re.S):
        if '/entity/' in f.as_posix():continue
        states.append({'source':f.relative_to(ROOT).as_posix(),'line':s[:m.start()].count('\n')+1,'setter':m[1],'argument':re.sub(r'\s+',' ',m[2])})
    for m in re.finditer(r'@(ManyToOne|OneToMany|OneToOne|ManyToMany|JoinColumn|JoinTable|Enumerated|Convert|Version|SequenceGenerator)\b',s):relationships.append(f.relative_to(ROOT).as_posix()+':'+m[1])
write('query-and-state-inventory.json',json.dumps({'queries':queries,'state_writes':states,'relationship_enum_converter_version_annotations':relationships,'native_sql_found':False,'note':'Static source inventory; Java initializer/comment is not a DB default/enum. All seven @Query statements are JPQL pessimistic lock reads.'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'entities':len(entities),'mapped_columns':sum(len(e['fields']) for e in entities.values()),'reference_tables':len(reference),'missing_existing_ref_columns':sum(len(v) for v in existing_missing.values()),'new_tables_vs_ref':newtables,'candidate_new_columns_total':sum(len(v) for v in missing.values()),'JPQL_queries':len(queries),'JPA_relationship_enum_converter_version_annotations':relationships},ensure_ascii=False))

if __name__ == '__main__':
    before=json.loads(manifest_path.read_text(encoding='utf-8'))
    assert before==snapshot(), 'Files outside docs/drafts changed; investigate before delivering.'
    print('Protected files unchanged; draft artifacts only. No database operations performed.')
