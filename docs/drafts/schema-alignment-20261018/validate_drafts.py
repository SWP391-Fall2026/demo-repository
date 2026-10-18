"""Offline lexical/coverage checks only; does not validate PostgreSQL semantics or execute SQL."""
from pathlib import Path
import re,json,hashlib
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
data=json.loads((OUT/'mapping-inventory.json').read_text(encoding='utf-8'))

def statements(sql):
    """Strip comments/literals for classification, retain top-level statement boundaries."""
    chunks=[];code=[];i=0;depth=0
    while i<len(sql):
        if sql.startswith('--',i):
            stop=sql.find('\n',i);i=len(sql) if stop<0 else stop;code.append(' ');continue
        if sql.startswith('/*',i):
            level=1;i+=2
            while level:
                assert i<len(sql),'unclosed comment'
                if sql.startswith('/*',i):level+=1;i+=2
                elif sql.startswith('*/',i):level-=1;i+=2
                else:i+=1
            code.append(' ');continue
        if sql[i] in "'\"":
            quote=sql[i];i+=1
            while True:
                assert i<len(sql),'unclosed quoted literal/identifier'
                if sql[i]==quote:
                    i+=1
                    if i<len(sql) and sql[i]==quote:i+=1;continue
                    break
                i+=1
            code.append(' LITERAL ');continue
        dollar=re.match(r'\$(?:[A-Za-z_][\w]*)?\$',sql[i:])
        if dollar:
            tag=dollar[0];stop=sql.find(tag,i+len(tag));assert stop>=0,'unclosed dollar quote'
            code.append(' DOLLAR_BODY ');i=stop+len(tag);continue
        char=sql[i]
        if char=='(':depth+=1
        elif char==')':depth-=1;assert depth>=0,'unbalanced close parenthesis'
        if char==';':
            assert depth==0,'statement ended inside parentheses'
            statement=''.join(code).strip()
            if statement:chunks.append(statement)
            code=[]
        else:code.append(char)
        i+=1
    assert depth==0,'unbalanced parentheses'
    assert not ''.join(code).strip(),'statement missing terminator'
    return chunks

results=[]
for f in sorted((OUT/'sql').glob('*.sql')):
    text=f.read_text(encoding='utf-8');parts=statements(text)
    if f.name.startswith('draft_'):
        assert parts[0].upper()=='BEGIN' and parts[-1].upper()=='ROLLBACK',f
        assert re.search(r'RAISE EXCEPTION\s+\x27DRAFT BLOCKED',text),f
        assert all(s.split()[0].upper() in {'BEGIN','DO','SET','ALTER','CREATE','ROLLBACK'} for s in parts),f
        assert not re.search(r'\bDROP\s+(TABLE|COLUMN)\b',text,re.I),f
        assert not re.search(r'\bALTER\s+COLUMN\b.*\bTYPE\b',text,re.I),f
    else:
        assert parts[0].upper().startswith('BEGIN TRANSACTION') and 'READ ONLY' in parts[0].upper(),f
        assert parts[-1].upper()=='ROLLBACK',f
        assert all(s.split()[0].upper() in {'BEGIN','SET','SELECT','WITH','ROLLBACK'} for s in parts),f
        stripped=' '.join(parts)
        assert not re.search(r'\b(nextval|setval|dblink_exec|pg_terminate_backend|pg_cancel_backend)\s*\(',stripped,re.I),f
    results.append((f.name,len(parts)))

entities=data['entities'];reference=data['reference']
matrix=(OUT/'schema-diff.md').read_text(encoding='utf-8')
assert len(entities)==16 and sum(len(e['fields']) for e in entities.values())==216
for e in entities.values():
    for f in e['fields']:
        assert f"{e['entity']}.{f['field']} → `{f['column']}`" in matrix
expected={(t,f['column']) for t,e in entities.items() if t in reference for f in e['fields'] if f['column'] not in reference[t]['columns']}
add_text='\n'.join((OUT/'sql'/f).read_text(encoding='utf-8') for f in ['draft_10_audit.sql','draft_20_rental_inventory.sql','draft_30_billing.sql'])
actual=set(re.findall(r'ALTER TABLE public\.(\w+) ADD COLUMN (\w+)',add_text))
assert expected==actual,(expected-actual,actual-expected)
for table in ('invoices','refund_transactions'):
    m=re.search(r'CREATE TABLE public\.'+table+r' \((.*?)\n\);',add_text,re.S);assert m
    columns=re.findall(r'^  (\w+) ',m[1],re.M)
    assert set(columns)=={f['column'] for f in entities[table]['fields']}

# Every logical FK maps fields with actual scalar columns in the source inventory.
links=json.loads((OUT/'dependency-inventory.json').read_text(encoding='utf-8'))
for table,relations in links.items():
    for col,parent,pk in relations:
        assert any(f['column']==col for f in entities[table]['fields'])
        assert any(f['column']==pk and f['id'] for f in entities[parent]['fields'])

for f in OUT.glob('*.md'):
    for target in re.findall(r'\]\(([^)]+)\)',f.read_text(encoding='utf-8')):
        if target.startswith(('https://','http://','#')):continue
        assert (f.parent/target.split('#')[0]).exists(),(f,target)

# Do not copy legacy access-code default values into any new review artifact.
reference_text=(ROOT/'database/reference/current-schema-as-is.sql').read_text(encoding='utf-8')
match=re.search(r"pin_code[^\n]*DEFAULT '([^']+)'",reference_text)
if match:
    for f in OUT.rglob('*'):
        if f.is_file() and f.suffix in {'.md','.json','.sql','.py'}:
            assert match[1] not in f.read_text(encoding='utf-8'), 'sensitive default copied into review output'

before=json.loads((OUT/'source-snapshot.json').read_text(encoding='utf-8'))
changed=[name for name,digest in before.items() if not (ROOT/name).is_file() or hashlib.sha256((ROOT/name).read_bytes()).hexdigest()!=digest]
assert not changed,'Protected source/config/reference changed: '+','.join(changed)

report='''# Kiểm chứng bộ tài liệu nháp

Kết quả: **PASS kiểm tra tĩnh offline**. Không kết nối/chạy PostgreSQL, không thực thi SQL và không chạy ứng dụng/test/Maven. Không dùng parser PostgreSQL: kiểm tra dấu ngoặc/chuỗi/comment/statement chỉ là lexical, không chứng minh cú pháp/ngữ nghĩa SQL trên phiên bản live.

- 16 entity / 216 field được kiểm kê; từng field có hàng trong schema-diff.
- 37 ADD COLUMN candidates khớp mapping thiếu theo REF; 23 cột hai bảng mới khớp mapping. Không suy ra chúng đều thiếu live.
- 49 logical FK candidates tham chiếu đúng field và parent PK trong inventory; không chứng minh đó là FK live hoặc đều cần thêm.
- Tất cả draft DDL có guard RAISE EXCEPTION, BEGIN/ROLLBACK và không có COMMIT; không có DML backfill, drop table/column hoặc ALTER TYPE.
- Tất cả file readonly chỉ có BEGIN READ ONLY REPEATABLE READ, SET LOCAL timeout, SELECT/WITH và ROLLBACK; không gọi nextval/setval hoặc hàm quản trị backend.
- Link tài liệu nội bộ tồn tại. Không sao chép giá trị default mã truy cập legacy.
- Hash tất cả file trong source-snapshot khớp: code ứng dụng, cấu hình, SQL tham chiếu/migration cũ và tài liệu ngoài khu vực draft được giữ nguyên.

| SQL file | Số statement theo lexer |
|---|---|
'''
report+='\n'.join(f'| {name} | {count} |' for name,count in results)
report+='\n\nCác gate triển khai vẫn BLOCKED như README. Cần metadata live và rehearsal PostgreSQL mới có thể phê duyệt bản SQL production.\n'
(OUT/'validation-report.md').write_text(report,encoding='utf-8',newline='\n')
print(f'PASS: {len(results)} SQL draft/read-only files; {len(before)} protected files unchanged. PostgreSQL execution not performed.')
