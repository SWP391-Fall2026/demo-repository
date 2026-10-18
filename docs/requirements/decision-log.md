# Hiện trạng dự án Self Storage và các quyết định cần chốt

Cập nhật ngày 18/10/2026.

## 1. Nguồn chuẩn đã được người dùng xác nhận

- Mã nguồn chuẩn: demo-repository-main.zip người dùng cung cấp.
- Database chuẩn: schema 15 bảng người dùng đã gửi trước đó; không dùng docs/supabase_schema.sql trong ZIP để thay thế schema này.
- Figma: người dùng xác nhận là thiết kế chính hiện tại và chuẩn giao diện tối thiểu. Frontend đích dùng React + Vite, backend dùng Java Spring Boot. Giao diện cần bao phủ thiết kế Figma tương ứng và bổ sung màn hình/trạng thái cho các nghiệp vụ đã chốt chưa được thể hiện đầy đủ.
- Scope và SRS là tài liệu đối chiếu yêu cầu. Các đề xuất Grey Zone vẫn cần được phân biệt với quyết định đã duyệt.
- Bản D:/SWP/demo-repository có các thay đổi khác ZIP. Các chức năng bổ sung trong thư mục đó KHÔNG được tính là hiện trạng của mã nguồn người dùng vừa xác nhận.

ZIP được giải nén riêng tại D:/SWP/.tmp/project-review-20261017/demo-repository-main. Không sửa mã nguồn trong ZIP hoặc áp dụng SQL vào database.

Nguồn: [ZIP](C:/Users/phuct/Downloads/demo-repository-main.zip), [schema database](<C:/Users/phuct/.codex/attachments/b692b538-356e-4fe4-b70b-b0feb4464bdd/Pasted text.txt>), [Figma](https://www.figma.com/design/ZI2wVoTC5MsWXC07Y7rpsB/Untitled?node-id=0-1).

## 2. Kết luận về hiện trạng

Frontend đang có nhiều màn hình và tương tác phục vụ trình diễn, nhưng phần lớn nghiệp vụ vẫn dùng dữ liệu mock hoặc chỉ hiển thị thông báo thành công. Backend đã có controller, service và repository cơ bản, nhưng chưa nối thành các luồng nghiệp vụ đầy đủ và có nhiều ánh xạ không khớp schema chuẩn.

Do đó, chưa có cơ sở ghi nhận Flow 1–5 hoặc 12 AC là đã nghiệm thu. Việc có bảng trong database, nút trên UI hoặc mô tả hoàn thành trong README không chứng minh tính năng đã chạy xuyên suốt.

## 3. Công nghệ thực tế

| Thành phần | Hiện trạng |
| --- | --- |
| Backend | Java 21, Spring Boot 3.3.4, Spring Security, Spring Data JPA, JWT |
| Database | PostgreSQL; cấu hình ứng dụng hướng tới Supabase |
| Frontend | HTML, CSS, JavaScript thuần; Node.js phục vụ file tĩnh và có proxy API |
| React/Angular/Vue | Chưa được dùng trong bản ZIP; khác ràng buộc frontend trong Scope |
| Phân quyền dự kiến | Năm vai trò CUSTOMER, STAFF, FMANAGER, OPS_MGR, ADMIN; có alias ở phía frontend |
| API frontend đã gọi | Đăng nhập, gửi OTP, xác minh OTP, gửi lại OTP |
| Dữ liệu nghiệp vụ frontend | mockUnits, mockUsers, mockSupportTickets, mockAuditLogs và nhiều giá trị cố định |
| Mapping Java | 10 bảng; trong đó có daily_tasks |
| Schema chuẩn | 15 bảng; có thêm staff_tasks, business_policies, handover_records, inspection_records, refund_requests chưa được bản Java này ánh xạ |

Nguồn: [package và kiến trúc](D:/SWP/.tmp/project-review-20261017/demo-repository-main/README.md), [frontend](D:/SWP/.tmp/project-review-20261017/demo-repository-main/frontend/js/app.js:21), [API đăng nhập](D:/SWP/.tmp/project-review-20261017/demo-repository-main/frontend/js/app.js:245).

## 4. Các lỗi không khớp giữa code và schema chuẩn

| Điểm không khớp | Bằng chứng trong code | Schema yêu cầu | Tác động cần xử lý |
| --- | --- | --- | --- |
| Trạng thái thanh toán | PaymentService gán SUCCESS | payments.status chỉ nhận PENDING, PAID, FAILED, REFUNDED | Không đáp ứng CHECK constraint khi lưu giao dịch |
| Kiểu ngày hợp đồng | Contract.startDate/endDate là String; service ghi dd/MM/yyyy | contracts.start_date/end_date là date | Ánh xạ sai kiểu; cần LocalDate và quy ước ngày thống nhất |
| ID lịch sử đăng nhập | LoginHistory.id là Long, tự tăng IDENTITY | login_history.id là varchar, không khai báo tự tăng | Không tương thích cách sinh và ghi ID |
| Nội dung ticket | Entity/service không có category và description | support_tickets.category và description đều NOT NULL | createTicket không cung cấp các trường bắt buộc của schema |
| Chi nhánh Reservation | Mặc định facilityCode là tên Hà Nội - Cầu Giấy | facility_code phải tham chiếu facilities.code | Giá trị mặc định dạng tên không đáp ứng FK mã chi nhánh |
| Liên kết khách hàng | createReservation không gán userId; handover không gán userId/reservationId/facilityCode cho Contract | Schema có các cột liên kết này | Có thể lưu bản ghi thiếu chủ sở hữu, không đủ cơ sở cách ly dữ liệu |
| Tài liệu SQL trong ZIP | Chỉ định nghĩa 10 bảng, có staff_tasks | Database thực có 15 bảng | Tài liệu SQL chưa đại diện database chuẩn đã xác nhận |

Nguồn code: [PaymentService](D:/SWP/.tmp/project-review-20261017/demo-repository-main/backend/src/main/java/com/swp391/selfstorage/service/PaymentService.java:34), [Contract](D:/SWP/.tmp/project-review-20261017/demo-repository-main/backend/src/main/java/com/swp391/selfstorage/entity/Contract.java:34), [LoginHistory](D:/SWP/.tmp/project-review-20261017/demo-repository-main/backend/src/main/java/com/swp391/selfstorage/entity/LoginHistory.java:10), [SupportTicket](D:/SWP/.tmp/project-review-20261017/demo-repository-main/backend/src/main/java/com/swp391/selfstorage/entity/SupportTicket.java), [ReservationService](D:/SWP/.tmp/project-review-20261017/demo-repository-main/backend/src/main/java/com/swp391/selfstorage/service/ReservationService.java:50).

Các tác động trên được xác định bằng đối chiếu source với schema được cung cấp; chưa kết nối database để tái hiện lỗi runtime.

## 5. Các luồng hiện có và phần còn thiếu

| Luồng | Đã thấy trong bản ZIP | Chưa thể coi là hoàn tất |
| --- | --- | --- |
| Đăng nhập/đăng ký | Có API, JWT và OTP mô phỏng | UI có fallback tài khoản mock; chưa quản lý token cho các API nghiệp vụ |
| Đặt chỗ | Có form, tính cọc và endpoint tạo Reservation | Nút xác nhận frontend chưa gọi API tạo đơn; chưa giữ số lượng, kiểm tra tồn kho và tự hết hạn |
| Thanh toán | Có màn hình và endpoint simulate | Frontend chỉ thông báo; backend không chuyển Reservation sang RESERVED và ghi status không khớp schema |
| Gán kho | Có UI và endpoint assignUnit | UI chỉ sửa mock; backend chưa xác nhận cọc, loại kho, chi nhánh, trạng thái phòng hay cập nhật Unit đồng bộ |
| Phân công | Backend lưu daily_tasks | UI chỉ toast và mock audit; chưa đọc task từ API cho đúng staff_id/facility/date |
| Bàn giao | Có UI và endpoint tạo Contract | Nhiều giá trị cố định; chưa cập nhật Reservation/Unit và lưu HandoverRecord trong transaction |
| Trả kho | Có UI nghiệm thu; service đổi Contract TERMINATED và trả số tiền tính được | Chưa lưu InspectionRecord/RefundRequest, chưa khóa PIN và cập nhật Unit trên DB đồng bộ |
| Chính sách | Có màn hình và map trong bộ nhớ backend | Không dùng business_policies; sửa chính sách chưa tác động đầy đủ tới đơn mới |
| Báo cáo | Có dashboard và tạo CSV | Dữ liệu thống kê và nội dung CSV cố định, chưa tính từ giao dịch thực |
| Hỗ trợ/gia hạn | Có một số màn hình/hàm | Ticket ở UI là mảng mock; gia hạn chủ yếu chuyển sang màn hình thanh toán, chưa cập nhật hợp đồng |
| Quản trị nhân sự | Có tạo/khóa tài khoản trên UI | Chỉ cập nhật mockUsers; chưa tạo nhân sự/gán chi nhánh thực qua API |
| Audit | Có bảng, endpoint và UI | UI thêm vào mảng; API nhận người thao tác từ body, chưa tự ghi theo giao dịch phía server |

Nguồn UI: [đặt chỗ và thanh toán](D:/SWP/.tmp/project-review-20261017/demo-repository-main/frontend/js/app.js:1167), [bàn giao và trả kho](D:/SWP/.tmp/project-review-20261017/demo-repository-main/frontend/js/app.js:1363), [phân công](D:/SWP/.tmp/project-review-20261017/demo-repository-main/frontend/js/app.js:1517), [quản trị](D:/SWP/.tmp/project-review-20261017/demo-repository-main/frontend/js/app.js:1664).

## 6. Bảo mật và tính toàn vẹn cần ưu tiên

1. SecurityConfig có anyRequest().permitAll(). JWT filter đọc token không đồng nghĩa API đã được bảo vệ. Không thấy method guard trong các controller của ZIP.
2. Các hàm lấy Reservation, Contract, Task và Payment dùng findAll hoặc tra ID mà chưa áp dụng chủ sở hữu/chi nhánh từ principal.
3. Không thấy transaction cấp nghiệp vụ cho thanh toán, gán phòng, bàn giao và nghiệm thu; chưa có cơ chế chống tranh chấp giữ kho.
4. verifyPin chấp nhận hai PIN cố định 842916 và 894210 trước khi kiểm tra hợp đồng, nên không đáp ứng quy tắc PIN bị khóa khi OVERDUE/TERMINATED.
5. PIN khi bàn giao cố định; thao tác đổi PIN trên UI chỉ thông báo và không lưu mã mới.
6. Audit API không tự lấy người thao tác từ principal. Bản ghi audit chưa có user_id như yêu cầu baseline.
7. Đăng nhập fallback có thể khiến UI vẫn hoạt động khi backend hoặc việc ghi LoginHistory lỗi; không dùng việc vào được UI làm bằng chứng đã đăng nhập và lưu dữ liệu DB thành công.

Nguồn: [SecurityConfig](D:/SWP/.tmp/project-review-20261017/demo-repository-main/backend/src/main/java/com/swp391/selfstorage/security/SecurityConfig.java:46), [PIN và bàn giao](D:/SWP/.tmp/project-review-20261017/demo-repository-main/backend/src/main/java/com/swp391/selfstorage/service/ContractService.java:30), [fallback đăng nhập](D:/SWP/.tmp/project-review-20261017/demo-repository-main/frontend/js/app.js:245).

## 7. Những yêu cầu đã được SRS làm rõ

| Mục | Nội dung yêu cầu trong tài liệu |
| --- | --- |
| BR-004 | Cọc mặc định một tháng thuê; chưa nộp cọc sau 24 giờ kể từ lúc tạo đơn thì EXPIRED |
| FR-029 | Khách đặt theo loại kho, Manager gán phòng cụ thể trước check-in |
| BR-005/FR-015 | Bàn giao phải có đơn hợp lệ, phòng đã gán, đủ tiền thuê kỳ đầu và xác nhận khách |
| BR-008 | Bàn giao cập nhật Reservation CHECKED_IN, Contract ACTIVE và Unit OCCUPIED đồng bộ |
| BR-006 | PIN không còn hiệu lực khi hợp đồng OVERDUE hoặc TERMINATED |
| FR-020–022 | Khách gửi yêu cầu trả; Staff nghiệm thu; tính khấu trừ cọc và thanh lý hợp đồng |
| FR-031 | Có trách nhiệm Manager duyệt quyết định hoàn cọc |
| BR-009 | Ops ban hành chính sách giá/cọc/phạt toàn chuỗi |
| Phân loại phạm vi | Flow 1–5 bắt buộc; Flow 6–7, đổi PIN cá nhân và xuất Excel/PDF là mở rộng |

Đây là yêu cầu đã đọc được, không phải kết luận rằng code đã đáp ứng hoặc tài liệu đã được ký duyệt.

Nguồn: [FR](D:/SWP/.tmp/project-review-20261017/demo-repository-main/docs/Self_Storage_Detailed_Requirement_Specification_v2.md:155), [BR](D:/SWP/.tmp/project-review-20261017/demo-repository-main/docs/Self_Storage_Detailed_Requirement_Specification_v2.md:354), [phạm vi](D:/SWP/.tmp/project-review-20261017/demo-repository-main/docs/Self_Storage_Detailed_Requirement_Specification_v2.md:480).

## 8. Các quyết định đã xác nhận và phần còn mở

| Mục | Quy tắc hoặc hướng xử lý | Tình trạng |
| --- | --- | --- |
| Nguồn hiện trạng | ZIP đã gửi + schema 15 bảng + Figma hiện tại | Người dùng đã xác nhận |
| Frontend | Chuyển frontend sang React + Vite | Người dùng đã chốt |
| Backend | Java Spring Boot | Người dùng đã chốt |
| Chuẩn giao diện | Figma ZI2wVoTC5MsWXC07Y7rpsB là chuẩn tối thiểu về màn hình, bố cục, thành phần và tương tác. Bổ sung UI cho các nghiệp vụ đã chốt còn thiếu theo cùng phong cách; không xem prototype HTML cũ là phạm vi UI cuối cùng | Người dùng đã chốt |
| Cọc | Mặc định một tháng thuê, Ops cấu hình; lưu số tiền đã xác nhận trên đơn | Mặc định rõ trong SRS; còn phải thống nhất cách cấu hình |
| Giữ chỗ | 24 giờ tính từ lúc tạo, chỉ hết hạn đơn chưa trả cọc; số khả dụng phải trừ các chỗ đang giữ | Theo SRS; chưa triển khai đầy đủ |
| Daily Tasks | Dùng daily_tasks, liên kết staff_id và facility_code; rà soát staff_tasks trước khi chuyển dữ liệu | Đề xuất theo mapping hiện có |
| GZ-01 | Xác thực PIN mô phỏng bằng phần mềm; không tích hợp khóa thật; chặn theo vòng đời hợp đồng | Cần xác nhận cách mô phỏng |
| GZ-02/GZ-06 | Admin tạo nhân sự và gán chi nhánh; Manager chỉ phân công nhân sự đã có | Đề xuất theo ranh giới Actor |
| GZ-04 | Cho phép Customer thuê nhiều kho ở nhiều chi nhánh; quyền dựa trên user_id | Phù hợp mô hình dữ liệu |
| GZ-05 | Chặn hết chỗ ở UI và API, bảo vệ số lượng khi có nhiều yêu cầu | Cần triển khai |
| GZ-07 thời gian | Tính theo thời điểm bắt đầu thuê, kể cả khi khác lịch hẹn check-in. Hủy từ đủ 24 giờ trở lên hoàn 100%; dưới 24 giờ không hoàn cọc | Người dùng đã xác nhận quy tắc biên và mốc tính; tỷ lệ dưới ngưỡng theo bảng người dùng cung cấp |
| Hủy thủ công | Staff thực hiện theo chính sách; Manager duyệt ngoại lệ và hoàn cọc | Người dùng đã xác nhận |
| GZ-03 phí trả trễ | Không có grace period. Phí theo ngày; mỗi 24 giờ bắt đầu tính một ngày, làm tròn lên. Facility Manager cấu hình tỷ lệ trần; mức đã chọn là 50% giá thuê tháng hiện hành tại thời điểm tính phí | Người dùng đã xác nhận rõ cơ sở tính chính thức |
| Giá tại Reservation | Lưu bản chụp giá khi tạo Reservation và bảo lưu suốt 24 giờ chờ cọc; thanh toán xác nhận mức giá đã giữ. Đơn hết hạn phải đặt lại theo giá mới | Người dùng đã xác nhận |
| Quyền chỉnh giá | Facility Manager cấu hình Unit và giá tại chi nhánh trong giới hạn giá/chính sách do Ops quản lý | Người dùng đã nêu rõ |
| Thời điểm kết thúc thuê | Khách gửi yêu cầu trả kho chưa làm ngừng tính tiền hoặc khóa PIN. Cả hai chỉ diễn ra khi Staff hoàn tất nghiệm thu và xác nhận khách đã trả thực tế; việc gửi yêu cầu không tự thay đổi quy tắc quá hạn đang áp dụng | Người dùng đã xác nhận |
| Kho sẵn sàng | Staff xác nhận vệ sinh hoàn tất và gửi yêu cầu; Facility Manager xác nhận chuyển Unit sang AVAILABLE. Kho còn cần kiểm tra/vệ sinh chưa được cho thuê lại | Người dùng đã xác nhận |
| Hoàn cọc | Quy trình hoàn cọc tách khỏi kết thúc thuê; Manager duyệt, theo dõi hoàn tiền thất bại và thử lại an toàn; không đánh dấu đã hoàn khi giao dịch thất bại | Người dùng đã nêu hướng xử lý |
| Hoàn tiền thủ công | Chỉ Facility Manager được phê duyệt hoặc từ chối. Sau phê duyệt, Staff cùng chi nhánh thực hiện ghi nhận và tải bằng chứng; Facility Manager xác nhận hoàn tất. Tách người thực hiện với người xác nhận và tách hoàn tiền thuê với hoàn cọc | Người dùng đã xác nhận |
| Gia hạn hợp đồng | Khách hàng phải xác nhận giá mới trước khi gia hạn có hiệu lực | Người dùng đã xác nhận |
| Invoice và Payment | Invoice riêng lưu khoản phải thu và trạng thái; Payment lưu từng lần thanh toán, bao gồm lịch sử lỗi/thử lại và liên kết đối chiếu hoàn tiền | Người dùng đã xác nhận |
| P1 | RBAC, transaction, audit và chống xử lý giao dịch trùng được triển khai cùng các luồng cốt lõi trong P1 | Người dùng đã xác nhận |
| RBAC | Giữ 5 role cố định; sửa permission động chỉ thêm khi có yêu cầu được duyệt | Đề xuất giới hạn phạm vi |
| Screen Catalog | Lập ánh xạ SCR-01…28 với SCR-C/S/M/O/A và các frame Figma; phân biệt trang và Success/Exception | Cần thực hiện |

Quy tắc hạn yêu cầu hoàn NO_SHOW khi giữ reservation hoặc đổi lịch đã được người dùng chốt tại mục 8.2. Thông tin kế hoạch còn thiếu là hạn nộp/bảo vệ và nhân sự thực tế.

### 8.1. NO_SHOW và theo dõi tiền

| Mục | Nội dung người dùng cung cấp | Trạng thái |
| --- | --- | --- |
| R-NOSHOW-01 | Chờ 30 phút kể từ giờ hẹn nhận kho. Hệ thống kiểm tra điều kiện và tạo cảnh báo để Staff xác nhận; chưa tự giải phóng giữ chỗ tại lúc tạo cảnh báo | Người dùng đã xác nhận cơ chế cảnh báo và Staff xác nhận |
| R-NOSHOW-02 | Staff được gia hạn thêm tối đa 30 phút, tối đa một lần cho mỗi lượt đặt chỗ. Thời gian gia hạn cộng vào hạn chờ cơ bản, không tính từ lúc Staff cấp | Người dùng đã xác nhận |
| R-NOSHOW-03 | Thời gian chờ thông thường, bao gồm gia hạn bởi Staff, không quá 60 phút kể từ giờ hẹn ban đầu. Ngoại lệ sự cố do Manager xử lý theo R-NOSHOW-04 | Người dùng đã xác nhận giới hạn và ngoại lệ |
| R-NOSHOW-04 | Lỗi hệ thống hoặc sự cố cơ sở tạm chặn NO_SHOW; Facility Manager quyết định giữ chỗ hoặc bố trí kho khác. Manager được giữ quá 60 phút nhưng phải đặt hạn giữ mới và ghi lý do | Người dùng đã xác nhận |
| R-NOSHOW-05 | NO_SHOW không tự động hoàn cọc. Customer yêu cầu hoàn ngoại lệ trong vòng 24 giờ sau giờ hẹn áp dụng: giờ hẹn ban đầu nếu không điều chỉnh, hoặc giờ hẹn mới nhất được Manager phê duyệt vì sự cố. Chỉ giữ reservation không tự thay đổi giờ hẹn; muốn giữ vượt hạn gửi yêu cầu hoàn hiện tại phải phê duyệt giờ hẹn mới trước. Staff xác minh/đề xuất, chỉ Facility Manager được phê duyệt hoặc từ chối | Người dùng đã chốt toàn bộ quy tắc mốc hẹn và trường hợp chỉ giữ reservation |
| Khách đã đến quầy | Ghi nhận khách đã đến riêng với việc hoàn tất bàn giao; khách đang làm thủ tục không bị đánh dấu NO_SHOW chỉ vì bàn giao chưa xong | Người dùng đã xác nhận cần ngăn đánh dấu nhầm |
| Giải phóng giữ chỗ | Sau khi Staff xác nhận NO_SHOW, kiểm tra lại trạng thái và quan hệ giữ chỗ; không giải phóng kho đã bàn giao hoặc thuộc lượt thuê khác | Giữ kiểm soát an toàn trong luồng đề xuất |
| Kiểm soát và audit | Lưu người xác nhận/gia hạn/duyệt, lý do, thời điểm, số tiền và kết quả; chống xác nhận hoặc hoàn tiền trùng | Giữ yêu cầu kiểm soát đã đề xuất và nguyên tắc P1 đã xác nhận |
| Chức năng tiền phía Customer | Không sử dụng số dư ví để thanh toán; không nạp hoặc rút tiền từ ví. Theo dõi Invoice, từng Payment, yêu cầu hoàn và bằng chứng giao dịch | Người dùng đã xác nhận giới hạn chức năng ví |
| Theo dõi tiền tại cơ sở | Báo cáo theo chi nhánh cho Manager/Ops, tách tiền thuê, tiền cọc và các khoản hoàn; không thêm khả năng chi tiêu số dư ví | Hướng thiết kế theo các giới hạn vừa được xác nhận |

Chức năng ví để thanh toán, nạp và rút không được triển khai. Phần theo dõi tiền sử dụng lịch sử thanh toán/hoàn tiền gắn với giao dịch gốc; chưa sửa schema hoặc triển khai tính năng.

Ghi chú quản lý đặc tả: bộ mã R-NOSHOW-02 đến R-NOSHOW-04 được người dùng dùng lại với nội dung mới. Bảng hiện tại theo bản mới nhất; nội dung giải phóng giữ chỗ và audit của bản trước vẫn được giữ ở các dòng kiểm soát riêng, chưa tự gán mã yêu cầu chính thức mới.

Ví dụ luồng đã làm rõ: hẹn 14:00, đến 14:30 hệ thống tạo cảnh báo nếu chưa ghi nhận khách đến và không có ngoại lệ. Staff kiểm tra dữ liệu hiện tại trước khi xác nhận NO_SHOW. Nếu khách đã đến hoặc đã check-in hợp lệ, không đánh dấu NO_SHOW và không giải phóng giữ chỗ, kể cả khi cảnh báo đã được tạo.

Ví dụ gia hạn đã xác nhận: hẹn 14:00, hạn cơ bản 14:30; Staff cấp thêm 30 phút lúc 14:10 thì hạn mới là 15:00. Công thức: hạn thông thường = giờ hẹn + 30 phút + số phút gia hạn hợp lệ (tối đa 30). Khi có sự cố hệ thống/cơ sở, hạn giữ mới do Manager đặt thay thế mốc thông thường; phải lưu người duyệt, thời điểm, lý do và hạn mới, không giữ chỗ vô thời hạn chỉ bằng cờ sự cố.

### 8.2. Quy tắc hoàn tiền và phí quá hạn đã xác nhận

| Nội dung | Quy tắc |
| --- | --- |
| Người gửi yêu cầu | Customer tự gửi. Staff chỉ tạo thay khi có đồng ý của khách hoặc khách không thể thao tác do sự cố đặc biệt; phải ghi nhận căn cứ |
| Quyền quyết định | Chỉ Facility Manager được phê duyệt hoặc từ chối yêu cầu hoàn tiền |
| Số tiền | Cho phép hoàn toàn bộ hoặc một phần, bắt buộc ghi lý do |
| Giao dịch gốc | Mỗi khoản hoàn phải đối chiếu với số tiền thực tế đã thanh toán của giao dịch gốc; không hoàn vượt |
| Phân loại | Tách hoàn tiền thuê và hoàn tiền cọc; không dùng hạn mức của khoản này cho khoản khác |
| Giữ hạn mức | Yêu cầu đang chờ duyệt chiếm hạn mức ngay khi tạo; kiểm tra và giữ hạn mức phải chống tranh chấp đồng thời |
| Hủy yêu cầu | Customer chỉ được hủy trước khi phê duyệt; hủy thành công giải phóng hạn mức một lần |
| NO_SHOW | Yêu cầu hoàn ngoại lệ phải gửi trong vòng 24 giờ sau giờ hẹn áp dụng; dùng lịch mới nhất được Manager phê duyệt nếu có điều chỉnh vì sự cố. NO_SHOW không tự động tạo khoản hoàn |
| Thực hiện hoàn | Cho phép hoàn thủ công sau phê duyệt; Staff cùng chi nhánh tải bằng chứng, Facility Manager xác nhận hoàn tất. Lưu cả người thực hiện và người xác nhận; phê duyệt hoặc tải bằng chứng chưa đồng nghĩa đã hoàn tất |
| Không ân hạn | Phí trả kho quá hạn bắt đầu tính khi vượt hạn thuê; không có grace period |
| Làm tròn ngày trễ | Mỗi 24 giờ bắt đầu tính một ngày, làm tròn lên; không trễ thì số ngày là 0 |
| Mức trần | Facility Manager quản lý cấu hình; mức đã chọn 50% tiền thuê tháng hiện hành tại lúc tính phí, kể cả giá đã đổi sau thời điểm bắt đầu quá hạn |
| Giá gia hạn | Customer phải xác nhận giá mới trước khi gia hạn có hiệu lực |

Hệ quả thiết kế cần bảo đảm: hạn mức còn lại của một giao dịch = số tiền thực thu của giao dịch gốc - các khoản hoàn thành công - các khoản đang giữ hạn mức. Khi yêu cầu được duyệt, phần tiền chờ thực hiện vẫn phải được bảo vệ khỏi một yêu cầu hoàn khác; khi hoàn thành, chuyển từ khoản giữ sang khoản đã hoàn mà không trừ hai lần. Mọi chuyển trạng thái cần transaction, audit và chống xử lý trùng như nguyên tắc P1 đã chốt.

Ví dụ ngày trễ: hạn trả 14:00; nghiệm thu lúc 14:01 cùng ngày thì tính 1 ngày, đúng 14:00 ngày hôm sau tính 1 ngày, sau mốc đó bắt đầu ngày thứ hai. Phải lưu mốc hết hạn và mốc hoàn tất nghiệm thu đủ độ chính xác thời gian; chỉ cột date sẽ không đủ để tính các biên này.

Hướng xử lý mốc hẹn người dùng vừa lựa chọn:

| Tình huống | Mốc tính hạn yêu cầu hoàn NO_SHOW |
| --- | --- |
| Không có sự cố, không đổi lịch | Giờ hẹn ban đầu |
| Manager phê duyệt đổi lịch vì sự cố và ghi nhận lịch mới | Giờ hẹn đã điều chỉnh |
| Nhiều lần đổi lịch được phê duyệt | Giờ hẹn mới nhất được Manager phê duyệt |
| Manager chỉ giữ reservation, không đổi lịch | Giữ nguyên mốc hẹn và hạn gửi yêu cầu hoàn hiện tại; không tự dùng thời hạn giữ làm giờ hẹn mới. Nếu muốn giữ vượt hạn gửi yêu cầu hoàn hiện tại, Manager phải phê duyệt giờ hẹn mới trước |

Hạn gửi yêu cầu = giờ hẹn áp dụng + 24 giờ. Ví dụ giờ hẹn ban đầu 10:00 ngày 18/10, Manager phê duyệt lịch mới 15:00 ngày 19/10 do sự cố, hạn gửi yêu cầu là 15:00 ngày 20/10.

Yêu cầu dữ liệu để thể hiện đúng quyết định: phân biệt giờ hẹn ban đầu, giờ hẹn đã phê duyệt và hạn giữ reservation; lưu lịch sử điều chỉnh với người phê duyệt, thời điểm và lý do. Hạn giữ reservation không tự trở thành lịch hẹn nhận kho.

Quy tắc bổ sung ĐÃ ĐƯỢC NGƯỜI DÙNG CHỐT: nếu muốn giữ reservation vượt hạn gửi yêu cầu hoàn hiện tại, Manager phải chính thức phê duyệt giờ hẹn mới trước khi tiếp tục giữ vượt mốc đó. Hạn gửi yêu cầu hoàn mới bằng giờ hẹn mới nhất được phê duyệt + 24 giờ. Quyết định chỉ giữ reservation không tự thay đổi giờ hẹn hoặc hạn gửi yêu cầu hoàn.

### 8.3. Trần phí quá hạn và hoàn thủ công đã chốt

- Gọi R_t là giá thuê tháng hiện hành tại thời điểm tính phí t; F_t là tổng phí quá hạn tích lũy trước trần tại thời điểm t.
- Trần phí tại thời điểm t = R_t × 50%.
- Phí phải thu tại thời điểm t = min(F_t, R_t × 50%).
- Không có thời gian ân hạn. Ngày trễ vẫn tính theo mỗi 24 giờ bắt đầu, làm tròn lên như đã chốt.
- Ví dụ giá lúc bắt đầu quá hạn là 2.000.000 VND, sau đó đổi thành 2.400.000 VND: tại lần tính phí dùng giá mới, trần là 1.200.000 VND.
- Người dùng đã xác nhận chính thức cơ sở tính là giá thuê tháng hiện hành tại thời điểm tính phí. Điểm chưa thống nhất trong bản mô tả trước đã được giải quyết; dùng giá mới khi giá mới đã có hiệu lực ở thời điểm tính.
- Quy tắc giá hiện hành ở đây áp dụng cho trần phí quá hạn; không tự tính lại tiền thuê đã chốt của Reservation/Contract hoặc sửa giao dịch đã thanh toán.
- Mỗi lần tính nên lưu các đầu vào R_t, tỷ lệ trần, số ngày trễ, F_t, mức trần và kết quả để đối chiếu. Invoice đã PAID giữ nguyên theo yêu cầu kiểm toán baseline.
- Sau Manager phê duyệt hoàn tiền, Staff cùng chi nhánh ghi nhận thực hiện và tải bằng chứng. Yêu cầu vẫn chưa COMPLETED chỉ vì đã tải bằng chứng; Facility Manager xác nhận kết quả hoàn tất.
- Phần hạn mức chờ hoàn tiếp tục được giữ trong giai đoạn đã duyệt/chờ bằng chứng/chờ xác nhận, chuyển sang khoản đã hoàn khi xác nhận thành công; không cộng hoặc trừ hai lần.

## 9. Thứ tự hoàn thiện đề xuất

1. Đồng bộ Java entity và dữ liệu ghi với schema 15 bảng: trạng thái Payment, kiểu ngày, ID LoginHistory, trường bắt buộc Ticket và mã chi nhánh.
2. Thiết kế Invoice riêng, lịch sử Payment và bản chụp giá; xác định hợp đồng API cho frontend React + Vite.
3. Triển khai từng luồng P1 cùng RBAC theo người dùng/chi nhánh, transaction, audit phía server và chống xử lý trùng; nối frontend với API thực.
4. Hoàn thiện bàn giao, nghiệm thu, duyệt hoàn cọc và duyệt đưa Unit trở lại AVAILABLE theo các trách nhiệm đã xác nhận.
5. Hoàn thiện policy lưu DB, báo cáo từ dữ liệu thực và quản trị nhân sự; cập nhật Scope, SRS và bảng ánh xạ màn hình theo quyết định mới.
6. Kiểm thử AC-01 đến AC-12 với dữ liệu hai khách và ít nhất hai chi nhánh, rồi mới nghiệm thu phần mở rộng.

## 10. Kiểm tra và giới hạn

- Đã đọc source trong ZIP và đối chiếu schema chuẩn, SRS, Scope và các frame Figma liên quan.
- app.js và server.js trong ZIP đã qua kiểm tra cú pháp Node.js.
- Không có source test tự động trong bản ZIP. Bộ test ở workspace khác không được dùng để chứng minh bản ZIP đạt yêu cầu.
- Chưa khởi động backend của ZIP hay thực hiện giao dịch với Supabase đang dùng. Các nhận định runtime là hệ quả dự kiến từ source và ràng buộc schema, chưa phải kết quả chạy end-to-end.
- Ba file có đuôi .docx trong ZIP thực tế là TAR chứa các phần OOXML. Đã đọc XML để đối chiếu; cần đóng gói thành DOCX chuẩn trước khi bàn giao Word. File Scope gửi riêng trước đó là DOCX ZIP hợp lệ.
