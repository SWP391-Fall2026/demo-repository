# Ba quyết định cần chốt — đề xuất có điều kiện, chưa phê duyệt

Phạm vi bằng chứng: source hiện có, SRS và quyết định nghiệp vụ đã ghi nhận. Chưa có metadata live đúng DB/schema/role được xác minh trong G0, chưa đọc dữ liệu nghiệp vụ hay chạy hành vi trên PostgreSQL. Các nhận định “code hiện làm” là phân tích tĩnh, không phải kết quả đo live.

Thứ tự thẩm quyền: quyết định người dùng đã chốt → SRS được điều chỉnh theo quyết định đó → code phản ánh cách triển khai hiện tại. Schema thực tế chứng minh cấu trúc đang tồn tại, không tự chứng minh nghiệp vụ đó đúng. SQL tham chiếu và candidate chưa được phê duyệt không thay thế metadata live.

## D1 — Audit facility

### Bằng chứng

- `modules/audit/service/AuditLogService.java:26–40`: record(action, entity, detail) lấy actor từ principal; dòng 39 gán facility_code từ User của actor.
- `application/workflow/CreateReservationWorkflow.java:98`: reservation lưu facility từ lựa chọn của khách; dòng 133 gọi audit không truyền facility của reservation.
- `common/security/ActorContext.java:60–66`: Customer được lọc theo owner, Staff/Manager theo facility. Do đó không có invariant “facility của actor luôn là facility của đối tượng”.
- `modules/policy/service/PolicyService.java:110,122`: có policy toàn chuỗi và cap theo một cơ sở. Ops có thể sửa policy/đối tượng ngoài một chi nhánh được gán cho chính mình.
- SRS FR-006 (L146), NFR-010 (L457), AuditLog model (L405) yêu cầu truy vết actor/đối tượng/thời điểm; SRS không chốt riêng nghĩa của facility_code. Yêu cầu vận hành/báo cáo theo cơ sở không cho phép tự suy ra hai nghĩa là một.

### Đề xuất để quyết định

**Ưu tiên nghĩa event/target facility cho facility_code khi hoàn thiện audit nghiệp vụ**, còn actor facility là snapshot riêng nếu cần. Đây là khuyến nghị, không phải quyết định đã chốt và **khác code hiện tại**. G0 không sửa record(), entity, schema hoặc draft migration để áp dụng nghĩa mới.

| Sự kiện | Facility của sự kiện được đề xuất | Actor facility |
|---|---|---|
| Reservation/Contract/Payment/Refund | Snapshot facility của đối tượng đã xác thực quyền | Có thể khác/NULL với Customer hoặc actor toàn hệ thống |
| Unit | Facility của Unit | Không dùng để suy ra target nếu actor là Ops/Admin |
| Facility | Code cơ sở được tạo/sửa | Có thể NULL |
| Policy toàn chuỗi | NULL kèm scope toàn hệ thống được định nghĩa rõ | Không tự gán một facility |
| Cap phí theo facility | Facility được cấu hình cap | Snapshot actor chỉ là thông tin tác nhân |
| Chuyển nhân sự giữa cơ sở | Cần quyết định: facility đích + old/new, hoặc hai sự kiện có liên kết | Không đủ một giá trị actor facility để mô tả cả hai cơ sở |

Nếu chọn tiếp tục actor-facility, phải ghi rõ tên/nghĩa đó trong API, báo cáo và tài liệu; không dùng nó để lọc mọi sự kiện thuộc một cơ sở. Nếu chuyển sang target-facility, cần task thay code riêng, nguồn target từ đối tượng và kiểm tra quyền; không tin facility do client tự khai.

Không đổi nghĩa các giá trị lịch sử một cách âm thầm. Metadata chưa cho biết cột đã tồn tại/đã có dữ liệu chưa; không backfill từ facility hiện tại của User vì nhân sự có thể đã chuyển cơ sở. Không thêm NOT NULL cho sự kiện toàn hệ thống. Ba kiểu String/VARCHAR hint trong bản nháp không quyết định được ngữ nghĩa này.

### Dữ liệu/hành vi còn thiếu

Metadata xác nhận cột/type/nullability; sau một phê duyệt kiểm tra dữ liệu riêng mới có thể lấy aggregate coverage theo loại actor/sự kiện, không lấy tên hoặc nội dung riêng tư. Cần các ca operator xác nhận: khách thuê khác cơ sở, Ops tạo/sửa facility, policy toàn chuỗi, chuyển nhân sự. Chưa chạy các kiểm tra đó.

**Câu hỏi quyết định:** chọn target/event facility và giữ actor facility riêng khi cần, hay giữ nghĩa actor-facility hiện tại? Với sự kiện toàn chuỗi/chuyển nhân sự, scope nào được ghi?

## D2 — UTC / instant và LocalDateTime

### Bằng chứng

- AuditLog.createdAt và các trường Contract startAt/endAt/terminatedAt là LocalDateTime; audit gọi LocalDateTime.now() theo JVM. `config/ClockConfig.java:10–11` cấp Clock Asia/Ho_Chi_Minh cho nhiều workflow.
- Snapshot audit trước đây báo created_at là timestamptz, nhưng chưa xác minh lại DB/schema/role và timezone của phiên chạy. Giá trị cấu hình hiệu lực của JVM/JDBC/session không được kiểm tra bằng cách đọc credential/config trong G0.
- Quyết định nghiệp vụ yêu cầu biên đủ 24 giờ để hoàn cọc, lịch NO_SHOW 30/60 phút, 24 giờ gửi yêu cầu theo lịch được duyệt, và phí trễ làm tròn mỗi 24 giờ bắt đầu. Các mốc này cần phép so sánh thời điểm nhất quán.
- Hibernate 6.5 mô tả LocalDateTime → TIMESTAMP, Instant → TIMESTAMP_UTC. PostgreSQL timestamptz lưu thời điểm và hiển thị theo timezone phiên; không giữ nguyên tên timezone đầu vào. Vì vậy cùng chữ “timestamp” hoặc validate thành công không chứng minh round-trip đúng.

### Đề xuất để quyết định

1. Thời điểm sự kiện/hiệu lực thực tế (created, issued, paid, approved, completed, handover, inspection, rental deadline) dùng mô hình instant UTC; Instant hoặc OffsetDateTime kết hợp mapping PostgreSQL đã kiểm chứng.
2. Lịch hẹn nhập theo giờ cơ sở được resolve với timezone business rõ ràng (hiện đề xuất Asia/Ho_Chi_Minh); lưu instant dùng so sánh và giữ timezone/context lịch hẹn cần thiết. Không coi UTC là giờ hiển thị cho khách.
3. Trường LocalDate thật sự là ngày lịch (không phải một instant) không bị đổi thành nửa đêm UTC. Không suy ra start_at/end_at từ start_date/end_date khi thiếu giờ hợp đồng chính thức.
4. Trước khi đổi Java/DDL: rehearsal round-trip bằng đúng driver/Hibernate trên PostgreSQL thử nghiệm, JVM UTC và Asia/Ho_Chi_Minh, session timezone khác nhau; kiểm tra API offset và các biên 24h/30m/60m/ceil24h. Chỉ lập kế hoạch test, không ghi fixture hoặc chạy test DB trong G0.
5. Lịch sử chỉ chuyển khi có nguồn xác định timezone/ý nghĩa từng field; không blanket AT TIME ZONE, cộng/trừ 7 giờ, gán now() hoặc 00:00. Nếu chứng minh mapping hiện tại tương thích đúng thì không đổi schema chỉ vì tên JDBC type khác.

Đây là hướng thống nhất ngữ nghĩa; việc chọn exact Java type/annotation, chuyển dữ liệu và DDL phải được duyệt riêng. Không sửa application config hoặc validate trong giai đoạn này.

**Câu hỏi quyết định:** đồng ý mô hình instant UTC cho thời điểm và timezone cơ sở cho nhập/hiển thị lịch hẹn không? Ai xác nhận timezone lịch sử và cho phép rehearsal PostgreSQL riêng trước khi thay mapping?

Nguồn: [Hibernate ORM 6.5](https://docs.hibernate.org/orm/6.5/userguide/html_single/#basic-datetime), [PostgreSQL timestamp](https://www.postgresql.org/docs/17/datatype-datetime.html).

## D3 — Invoice, retry refund và idempotency

### Nghiệp vụ đã có bằng chứng

- Decision log L129: Invoice lưu khoản phải thu; Payment ghi từng lần thanh toán gồm lỗi/thử lại. L165–177: hoàn toàn bộ/một phần theo giao dịch gốc, pending giữ hạn mức, hủy trước duyệt giải phóng quota. L127/L171: Staff ghi bằng chứng, Manager duyệt và xác nhận kết quả.
- SRS BR-010 (L367): bảo toàn số tiền/chứng từ đã thanh toán. SRS model L400–401 dùng một số tên type/status khác code (FIRST_MONTH_RENT/MONTHLY_RENEWAL/UNPAID/SUCCESS so với RENT/RENEW/PENDING/PAID). Đây là chênh lệch thuật ngữ cần thống nhất, không phải giấy phép tự đổi giá trị lịch sử.

### Hành vi suy ra từ source, chưa đo live

| Quan hệ/quy tắc | Source | Kết quả phân tích tĩnh |
|---|---|---|
| Initial invoice | CreateReservationWorkflow; InvoiceService.requirePaid L67–73; InvoiceRepository L18 | Một DEPOSIT và một RENT ban đầu cho Reservation theo query Optional hiện tại |
| Renewal invoice | RenewalService.confirm L81–110; InvoiceService.hasPendingRenewal L18–22 | Một pending renewal tại một thời điểm/contract; có thể nhiều renewal invoice trong vòng đời |
| Invoice → Payment | PayInvoiceWorkflow L49–68, L114–124 | Nhiều attempt FAILED rồi PAID; mỗi attempt gắn một invoice, hiện thu toàn bộ amount của invoice |
| Payment → RefundRequest | RefundRequestService.create L136–154 | Nhiều yêu cầu hoàn trên cùng payment trong hạn mức; partial refund không có nghĩa partial payment |
| RefundRequest → execution | RefundExecutionService L51–68, L96–99, L109–132 | Chỉ upload khi APPROVED, chuyển EVIDENCE_SUBMITTED; Manager hoàn tất một SUBMITTED. Chưa có API/state retry chuyển tiền thất bại |
| Payment key | PayInvoiceWorkflow L57–63 | Key tìm toàn cục; cùng key khác invoice bị 409; cùng invoice trả attempt cũ |
| Refund request key | RefundRequestService L79–85 | Key tìm trong payment gốc, chưa so payload khi trả request cũ |
| Client retry | frontend/src/shared/api/idempotent-request.ts | Key giữ trong Map khi mất phản hồi/5xx; xóa sau kết quả thành công hoặc 4xx. Không phải kho idempotency bền vững qua reload |

### Đề xuất cardinality để quyết định

```text
Một nghĩa vụ thu / mục đích / kỳ → một Invoice
Một Invoice → nhiều Payment attempts
Một Payment thành công gốc → nhiều RefundRequests có kiểm soát hạn mức
Một RefundRequest đã duyệt → nhiều execution attempts nếu hỗ trợ retry thực sự
```

- Không UNIQUE toàn bộ invoice theo contract: cần các kỳ gia hạn. Không UNIQUE mọi RENT theo reservation nếu lịch sử đã dùng RENT cho nhiều kỳ. Cần chốt khóa nghĩa vụ/kỳ; chỉ xét unique initial DEPOSIT/RENT khi scope initial được biểu diễn rõ.
- Invoice cọc được tạo trước Contract, nên contract_id có trường hợp NULL hợp lệ; reservation_id liên kết receivable ban đầu. Model SRS không có nghĩa phải NOT NULL contract_id cho mọi invoice.
- Nếu yêu cầu retry refund: ưu tiên 1:N execution attempts để giữ dấu vết lỗi/unknown/retry, **nhưng code/state hiện tại chưa hỗ trợ đầy đủ**. Không chỉ bỏ unique(refund_request_id) rồi coi retry đã hoạt động.
- Nếu mỗi approved request được chi một lần: có thể nhiều attempt nhưng tối đa một COMPLETED bằng số đã duyệt. Nếu muốn chia nhiều đợt chi cho cùng request thì cần allocation/sum riêng; không dùng ràng buộc “một completed” khi nghiệp vụ cho phép nhiều đợt.
- Retry do mất phản hồi là cùng logical attempt/key. Một attempt mới sau thất bại đã xác định dùng key mới. Trạng thái ngân hàng chưa rõ phải đối soát trước khi chuyển lại, không tạo hoàn tiền thứ hai. Ứng dụng hiện ghi chứng từ hoàn thủ công, không tự điều khiển ngân hàng.
- Pending/approved/evidence/attempt lỗi chưa kết thúc request vẫn giữ quota theo quy tắc đã chốt; chỉ giải phóng/chuyển sang đã hoàn một lần ở trạng thái đúng. Không tạo payment/invoice/key/proof giả để đối soát lịch sử.

### Đề xuất khóa và kiểm soát retry (chưa phải DDL đã duyệt)

| Loại | Hướng đề xuất | Cần xác nhận trước unique/FK |
|---|---|---|
| Payment submission | Giữ global payment key theo hành vi lookup hiện tại, hoặc đổi cả query và constraint nếu chọn scope khác | Bắt buộc key cho mutation tiền? namespace tenant/operation? Không tạo global unique khi code chuyển sang scope khác |
| Refund request | (payment_id, idempotency_key), phù hợp lookup hiện tại | Logical request identity, blank/null handling và duplicate lịch sử |
| Refund execution | ID/key riêng cho mỗi logical attempt, bền vững khi transport retry | 1:1 hiện tại hay 1:N retry; one completed hay nhiều đợt chi |
| External transfer reference | Scope được xác nhận của provider/account/channel + reference nếu reference không unique toàn hệ thống | Không giả định mã chuyển khoản raw unique toàn cầu hoặc dùng secret/account credential làm namespace |
| Payload replay | Cùng key nhưng payload khác nên trả 409 theo fingerprint canonical được duyệt | Backend hiện chưa so fingerprint đầy đủ (Payment chỉ so invoice; Refund trả old request trước khi so amount/reason) |

Không gắn unique key theo actor để vô tình cho hai Staff tạo cùng nghiệp vụ tiền hai lần. PostgreSQL concurrency/locks cần thử riêng; code hiện khóa Payment gốc rồi RefundRequest, không thay được constraint hoặc kiểm soát thao tác chuyển khoản thực tế ngoài ứng dụng.

### Bằng chứng thực tế còn thiếu

G0 chỉ thu metadata sau khi kết nối được duyệt. Cần một phê duyệt dữ liệu riêng để lấy aggregate: số invoice theo mục đích/kỳ, số successful payment/invoice, duplicate key trong đúng scope, số attempt/completed/refund request, reference collision theo namespace, tổng completed + reserved so với tiền thực thu. Không có kết quả nào trong lần này. Giá trị 0 dưới RLS không chứng minh không có trùng/over-refund.

**Câu hỏi quyết định:** chốt Invoice theo nghĩa vụ/kỳ và Payment 1:N attempts; RefundRequest cho phép retry 1:N với một completed hay nhiều đợt chi? Chốt scope idempotency/reference trước khi chọn unique; cần đồng ý replay khác payload bị 409 và nguồn đối soát lịch sử.
