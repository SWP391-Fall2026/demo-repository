# G0 — bàn giao operator khi chưa có kết nối read-only được xác nhận

**Không có truy vấn nào trong tài liệu này được Codex thực hiện.** Chưa có connection handle, database/schema/role hay quyền read-only được operator chủ động xác nhận. Dừng phần live, không tìm credential trong .env/config/shell history, không đổi privilege hoặc tạo role để tiếp tục.

## Thông tin cần operator xác nhận, không gửi credential

- Định danh connection đã được phê duyệt (nhãn, không phải DSN), đúng project/môi trường, current_database, schema được phép và current_user/session_user.
- Người phê duyệt, thời điểm/phạm vi: chỉ catalog/metadata, không row data, không chất lượng dữ liệu, không function body hoặc secret-bearing definition.
- Kết nối/session read-only đang có sẵn và được phê duyệt, không chỉ tên role có chữ readonly. Transaction read_only=on không thay thế xác nhận privilege/role/mục tiêu.
- Quyền quan sát: schema USAGE, catalog và information_schema visibility; SELECT metadata có bị hạn chế không? Nếu không đọc được một mục, ghi PERMISSION_DENIED/NOT_VISIBLE, không ghi “không tồn tại”.
- Batch metadata lấy cùng snapshot, ghi capture time/timezone và tất cả lỗi. Không gửi connection string, password, token, secret hay giá trị mã truy cập.

## Hai bước thu thập thủ công

1. Operator dùng kết nối read-only **đã được phê duyệt sẵn**, theo quy trình của mình, chạy câu nhận diện dưới đây. Nếu target/role không đúng hoặc transaction_read_only chưa bật: dừng và xác nhận lại ngoài task này, không tự tạo role/GRANT/đổi config.
2. Sau khi đối chiếu nhận diện đúng phạm vi, chạy các SELECT catalog được chọn. Các snippet dưới đây chỉ trả thuộc tính cấu trúc và cờ hiện diện, không trả default/check/index/policy expression literal hay trigger argument/function body.

`public` và danh sách 17 bảng là phạm vi candidate từ repository, **chưa phải schema live được xác nhận**. Nếu operator xác nhận schema khác, không sửa query để đoán; ghi nhận schema thực, xác minh mapping/default_schema/search_path rồi chuẩn bị bản SELECT phù hợp trong phạm vi được duyệt.

### M01 — nhận diện và read-only session

```sql
SELECT clock_timestamp() AS captured_at,
       current_database() AS database_name,
       current_schema() AS current_schema,
       current_user AS current_role,
       session_user AS session_role,
       current_setting('server_version') AS postgres_version,
       current_setting('server_version_num') AS postgres_version_num,
       current_setting('search_path') AS search_path,
       current_setting('TimeZone') AS session_timezone,
       current_setting('transaction_isolation') AS isolation_level,
       current_setting('transaction_read_only') AS transaction_read_only,
       current_setting('default_transaction_read_only') AS default_read_only;

SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolbypassrls
FROM pg_catalog.pg_roles
WHERE rolname IN (current_user, session_user);
```

Không dùng pg_authid, không SELECT * từ role/setting/connection tables, không truy xuất biến môi trường hoặc lịch sử shell. Xác nhận quyền đến từ operator; kết quả M01 không tự cấp thêm quyền cho Codex.

### M02 — relation, owner, visibility và effective privilege (không đọc hàng)

```sql
SELECT n.nspname AS schema_name, c.relname AS relation_name, c.oid AS relation_oid,
       c.relkind, pg_catalog.pg_get_userbyid(c.relowner) AS owner_role,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
       pg_catalog.has_schema_privilege(n.oid, 'USAGE') AS schema_usage,
       pg_catalog.has_table_privilege(c.oid, 'SELECT') AS can_select_table,
       pg_catalog.has_any_column_privilege(c.oid, 'SELECT') AS can_select_some_column,
       pg_catalog.has_table_privilege(c.oid, 'INSERT') AS has_insert_privilege,
       pg_catalog.has_table_privilege(c.oid, 'UPDATE') AS has_update_privilege,
       pg_catalog.has_table_privilege(c.oid, 'DELETE') AS has_delete_privilege
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
ORDER BY c.relname;
```

Các từ INSERT/UPDATE/DELETE trong câu trên chỉ là tên privilege được kiểm tra bởi hàm catalog, không phải lệnh DML. Không có thay đổi privilege. Có quyền ghi nhưng transaction read-only vẫn không đủ để tự coi connection đã được phê duyệt: operator phải xác nhận cơ chế bảo vệ và scope. RLS bypass/superuser/ownership cần ghi rõ, không âm thầm bỏ qua.

### M03 — cột và kiểu, không xuất expression/default value

```sql
SELECT n.nspname AS schema_name, c.relname AS table_name, a.attnum AS ordinal_position,
       a.attname AS column_name, pg_catalog.format_type(a.atttypid,a.atttypmod) AS exact_type,
       i.data_type, i.udt_schema, i.udt_name, i.domain_schema, i.domain_name,
       i.character_maximum_length, i.numeric_precision, i.numeric_scale,
       i.datetime_precision, i.collation_name,
       a.attnotnull AS catalog_not_null, a.attidentity AS identity_kind,
       a.attgenerated AS generated_kind, d.oid IS NOT NULL AS has_default,
       i.column_name IS NOT NULL AS visible_in_information_schema
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
LEFT JOIN information_schema.columns i
  ON i.table_schema=n.nspname AND i.table_name=c.relname AND i.column_name=a.attname
WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND c.relname IN ('users','facilities','units','reservations','contracts','invoices',
    'payments','refund_requests','refund_transactions','support_tickets','daily_tasks',
    'staff_tasks','handover_records','inspection_records','audit_logs','login_history','business_policies')
ORDER BY c.relname,a.attnum;
```

Nếu catalog có cột mà information_schema không thấy, ghi giới hạn quyền; không suy ra column length NULL là varchar không giới hạn khi dòng information_schema không visible. `has_default=true` không chứng minh default cụ thể khớp; `identity_kind` rỗng không tự chứng minh thiếu tự tăng (có thể dùng serial/sequence default).

### M04 — constraint và index cấu trúc, definition còn để operator review an toàn

```sql
SELECT n.nspname AS schema_name, c.relname AS table_name, con.conname, con.contype,
       con.convalidated, con.condeferrable, con.condeferred,
       ARRAY(SELECT a.attname FROM pg_catalog.pg_attribute a
             WHERE a.attrelid=c.oid AND a.attnum=ANY(con.conkey)
             ORDER BY array_position(con.conkey,a.attnum)) AS key_columns,
       rn.nspname AS referenced_schema, rc.relname AS referenced_table,
       ARRAY(SELECT a.attname FROM pg_catalog.pg_attribute a
             WHERE a.attrelid=con.confrelid AND a.attnum=ANY(con.confkey)
             ORDER BY array_position(con.confkey,a.attnum)) AS referenced_columns,
       con.confupdtype, con.confdeltype, con.confmatchtype
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class c ON c.oid=con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_catalog.pg_class rc ON rc.oid=con.confrelid
LEFT JOIN pg_catalog.pg_namespace rn ON rn.oid=rc.relnamespace
WHERE n.nspname='public' ORDER BY c.relname,con.conname;

SELECT n.nspname AS schema_name, t.relname AS table_name, x.relname AS index_name,
       ix.indisprimary, ix.indisunique, ix.indisvalid, ix.indisready,
       ix.indkey::text AS attribute_numbers,
       ix.indpred IS NOT NULL AS has_predicate,
       ix.indexprs IS NOT NULL AS has_expression
FROM pg_catalog.pg_index ix
JOIN pg_catalog.pg_class t ON t.oid=ix.indrelid
JOIN pg_catalog.pg_class x ON x.oid=ix.indexrelid
JOIN pg_catalog.pg_namespace n ON n.oid=t.relnamespace
WHERE n.nspname='public' ORDER BY t.relname,x.relname;
```

Không thể chốt CHECK cho phép NO_SHOW, unique partial scope hoặc definition khớp chỉ bằng những cờ trên. Operator review definition trong phạm vi được phép, gửi lại bản đã loại mọi secret literal nhưng giữ logic/column/predicate cần đối chiếu. Không yêu cầu function body/connection options/raw policy dump. Nếu không thể cung cấp an toàn thì mục tương ứng giữ UNVERIFIED.

### M05 — sequence, trigger và policy không xuất giá trị/definition nhạy cảm

```sql
SELECT schemaname, sequencename, sequenceowner, data_type, start_value,
       min_value, max_value, increment_by, cycle, cache_size
FROM pg_catalog.pg_sequences WHERE schemaname='public' ORDER BY sequencename;

SELECT n.nspname AS schema_name, c.relname AS table_name, a.attname AS column_name,
       pg_catalog.pg_get_serial_sequence(format('%I.%I',n.nspname,c.relname),a.attname) AS associated_sequence
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
WHERE n.nspname='public' AND c.relkind IN ('r','p') AND (a.attname='id' OR a.attidentity<>'');

SELECT n.nspname AS schema_name,c.relname AS table_name,t.tgname,t.tgenabled,t.tgtype,
       fn.nspname AS function_schema,p.proname AS function_name
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
JOIN pg_catalog.pg_namespace fn ON fn.oid=p.pronamespace
WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname;

SELECT n.nspname AS schema_name,c.relname AS table_name,p.polname,p.polcmd,
       p.polpermissive,p.polroles AS role_oids,
       p.polqual IS NOT NULL AS has_using_expression,
       p.polwithcheck IS NOT NULL AS has_check_expression
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON c.oid=p.polrelid
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' ORDER BY c.relname,p.polname;

SELECT table_schema,table_name,grantee,privilege_type,is_grantable
FROM information_schema.role_table_grants WHERE table_schema='public'
ORDER BY table_name,grantee,privilege_type;
```

Không gọi nextval/setval, không đọc sequence contents bằng SELECT * hoặc thay ownership/grants. Sequence association NULL có thể cần operator giải thích ownership/default, không tự sửa. Trigger function name và policy flag chưa chứng minh hành vi; definition nhạy cảm giữ chưa xác minh cho tới khi có mô tả an toàn được operator xác nhận.

## Metadata còn cần ở vòng đầy đủ

Enum/domain definitions, generated/default expressions đã được chuẩn hóa an toàn, CHECK và full FK semantics, partial/functional index definitions, default ACL/inherited role privileges, constraint/index validity, dependencies và các lỗi quyền. File `sql/00_metadata_readonly.sql` cũ có nhiều expression/definition: **không chạy/export nguyên bộ chưa review và không gửi raw output**, vì redaction theo tên cột không bảo đảm mọi literal là không nhạy cảm. Chỉ chọn câu an toàn trong scope được duyệt, hoặc dùng các snippet không xuất literal ở trên rồi bổ sung bản operator đã làm sạch.

## Định dạng bàn giao

Mỗi batch ghi: operator/phê duyệt, connection alias không credential, captured_at, database/schema/current_role/session_role, version, transaction read-only/isolation, quyền quan sát đã xác nhận, câu nào chạy/lỗi/không được phép, redaction nào làm mất khả năng so sánh. Gửi JSON/CSV/Markdown đã làm sạch và gắn nguồn cho từng kết quả; không gửi .env, credential, DSN, token hoặc mật khẩu.

Không tự chạy `sql/01_quality_queries_readonly.sql`, không chạy các SELECT dữ liệu mà file đó sinh ra. G0 hiện chỉ catalog. Kiểm tra chất lượng dữ liệu là một scope phê duyệt riêng; chỉ tạo query sau khi tồn tại/type/role visibility của các bảng/cột liên quan được xác minh. Kết quả 0 dưới RLS không đủ kết luận sạch.

## Câu hỏi cần operator quyết định

1. Kết nối read-only nào đã được phê duyệt sẵn, DB/schema/role mục tiêu là gì, ai xác nhận và được phép quan sát đến mức nào?
2. Operator sẽ chạy bộ metadata tối thiểu và gửi lại bản đã làm sạch, hay cung cấp một connection handle được xác nhận read-only cho lượt tiếp theo (không gửi credential)?
3. Những definition nào có thể cung cấp an toàn, mục nào phải giữ UNVERIFIED vì quyền hoặc secret?
4. Có cho phép một lượt kiểm tra aggregate dữ liệu riêng sau metadata không? Nếu chưa, không tạo/chạy query dữ liệu cho các bảng chưa xác minh.
