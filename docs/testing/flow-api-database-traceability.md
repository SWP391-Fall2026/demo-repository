# Truy vết API → backend → database — Phase A/B

> **Checkpoint implementation 2026-10-19:** phần FACT-SOURCE của Phase A/B dưới đây ghi snapshot trước đợt sửa auth, không là bằng chứng source/runtime hiện tại. Xem [delta implementation](D:/SWP/storage-rental/docs/testing/auth-implementation-status.md) và contract mới. Người dùng đã chốt tối đa72 byte UTF-8, giữ nguyên whitespace. Checkpoint mới:23unit backend +7unit frontend và TypeScript check đã đạt LOCAL; chưa chạy ứng dụng/API/Supabase, G0–G4 chưa đạt. Xem auth-local-verification.md.

[NOT-TESTED] Chỉ đọc source/tài liệu; không gọi API, chạy test, startup, SQL hoặc database. HTTP/response/state dưới đây là nhánh dự kiến từ code, không phải kết quả thực thi. Mọi bảng/cột live trong G0 hiện UNVERIFIED; không coi schema REF là live.

## 1. Định nghĩa flow và ranh giới

| Luồng | Nguồn và actor | Bắt đầu → kết thúc |
|---|---|---|
| Đăng ký | [FACT-SOURCE] [AUTH-CTRL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/controller/AuthController.java:12), AUTH-OTP (snapshot AuthService.java:322; xem delta implementation), AUTH-VERIFY (snapshot AuthService.java:353; xem delta implementation) | Guest gửi dữ liệu hợp lệ → pending OTP trong memory → verify → User CUSTOMER + cố gắng ghi LoginHistory + JWT |
| Đăng nhập | [FACT-SOURCE] AUTH-LOGIN (snapshot AuthService.java:113; xem delta implementation) | Guest username/email + credential đầu vào → User lookup + BCrypt matches + status → history + JWT/UserDto; lỗi trả theo handler |
| Đăng xuất | [FACT-DOC] [SRS-LOGOUT](D:/SWP/storage-rental/docs/requirements/srs.md:143); [FACT-SOURCE] [UI-LOGOUT](D:/SWP/storage-rental/frontend/src/app/layouts/AppShell.tsx:51) | Click xóa session client; yêu cầu SRS thu hồi token ở server chưa có implementation được tìm thấy |
| Flow 1 — Storage Unit Reservation Flow (Quy trình Đặt giữ chỗ kho) | [FACT-DOC] [SRS-F1](D:/SWP/storage-rental/docs/requirements/srs.md:228); FR-007–FR-012; Scope module 2 | Customer/Guest xem catalog → Customer tạo Reservation PENDING_PAYMENT + Invoice → nộp cọc thành công → RESERVED/lịch hẹn. Hủy/hết hạn là nhánh thay thế |
| Flow 2 — Storage Check-in and Handover Flow (Quy trình Tiếp đón, Check-in & Bàn giao) | [FACT-DOC] [SRS-F2](D:/SWP/storage-rental/docs/requirements/srs.md:255); FR-013–FR-017; Scope module 3 | Manager gán Unit trước giờ hẹn → Staff tiếp nhận/tra cứu → tiền thuê kỳ đầu PAID → biên bản → Contract ACTIVE, Unit occupied, Reservation CHECKED_IN và PIN mô phỏng |

[FACT-DOC] Không tự hợp nhất Flow 1/2. Gán Unit là bước chuẩn bị Flow 2 theo SRS, sau khi Flow 1 đã có cọc. Login là tiền điều kiện có thể diễn ra trước mỗi flow, không mặc định mọi request đều tạo login_history.

[FACT-DOC] Người dùng đã trả lời trong task này: **giữ SRS FR-003 và ghi gap thu hồi server**. Không giảm tiêu chí xuống logout client-only. HTTP route/DTO logout server vẫn TBD — cần thiết kế/phê duyệt riêng, không tự đặt endpoint.

## 2. Kiến trúc và quy ước đọc bảng

[FACT-SOURCE] React/Vite: app/router + RoleGuard/AppShell, identity/session, API adapters, shared HTTP client. Spring Boot: controllers → module service hoặc application/workflow → repository/entity; security JWT filter + ActorContext. Không có association JPA khai báo trong inventory 16 entity; liên kết qua scalar ID. Không có native query được tìm thấy trong source đã kiểm kê; 7 @Query dùng JPQL và pessimistic lock.

[FACT-SOURCE] Prefix REST là /api. Response thường ApiResponse<T>, có success/message/data, token ở root khi login/verify; null fields bị loại theo JsonInclude. Không có Response DTO riêng cho Reservation/Contract/Invoice/Payment; nhiều controller trả entity/map trực tiếp. DTO auth không có Bean Validation annotation; CreateReservationRequest có @Valid + constraints. Tham chiếu [ENVELOPE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/web/ApiResponse.java:6), [ERROR](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/exception/GlobalExceptionHandler.java:10).

[FACT-SOURCE] Error contract trong controller/service: IllegalArgumentException → 400; ResponseStatusException → mã tương ứng; DataIntegrityViolationException → 409; binding/Bean Validation → 400; Exception khác → 500. Security authentication entry point → 401. Exception xảy ra trước DispatcherServlet trong JWT filter có đường xử lý khác: exact response của user mất/exception loadUser là UNKNOWN, không tự gán 401/500.

[FACT-SOURCE] W dưới đây là cột bị setter nghiệp vụ tác động. INSERT/UPDATE SQL thực tế của ORM có thể chứa thêm mapped columns/default/NULL; chưa capture SQL nên không khẳng định danh sách SET thực tế chỉ gồm các setter. Trigger, RLS, constraint live và side effect ngoài source đều UNKNOWN. Không tìm thấy lời gọi xóa hàng DB trong các path được truy vết; xóa OTP/session là thao tác bộ nhớ/client.

## 3. Đăng ký

### REG-01 — yêu cầu OTP
[FACT-SOURCE] Step → POST /api/auth/register **hoặc** /api/auth/send-otp → AuthController.register(RegisterRequest) → AuthService.generateAndSendOtp → validateRegistrationData → UserRepository.existsByUsername/existsByEmail → users. Nguồn [AUTH-CTRL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/controller/AuthController.java:12), AUTH-VALIDATE (snapshot AuthService.java:198; xem delta implementation), AUTH-OTP (snapshot AuthService.java:322; xem delta implementation), [USER-REPO](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/repository/UserRepository.java:9).

- Request DTO: name, dob, gender, phone, email, cccd, username, password, confirmPassword, facility, facilityCode. Không khai báo role trong DTO.
- Validation: name 2–50 và regex chữ; dob LocalDate, tuổi 18–100, không tương lai; gender Nam/Nữ/Khác; phone bỏ khoảng trắng/dấu chấm/gạch ngang để kiểm prefix/độ dài; email lowercase/format/denylist domain; CCCD 12 số + province code; username lowercase 4–20, không bắt đầu số; kiểm username/email tồn tại; credential input tối thiểu 6 ký tự; confirmPassword chỉ so nếu khác null. Không sao chép credential hoặc CCCD literal vào fixture/tài liệu.
- Authentication: permitAll, không principal bắt buộc. Read: users.username/email. Write DB: không tại bước này.
- Memory side effect: ConcurrentHashMap email → PendingOtpData(code, RegisterRequest, expiresAt); timeout 5 phút theo System.currentTimeMillis. Source phát mã mô phỏng, in thông tin xác minh ra console và trả code/email trong response; không thấy email provider được gọi. Không ghi mã thực vào báo cáo.
- Transaction: không @Transactional outer service. Các query repository riêng; chưa có atomic uniqueness giữa send và verify.
- Response dự kiến: 200 ApiResponse<Map> với data.email/data.code và root code/email; validation/duplicate → 400. Uniqueness này là precheck, constraint DB live vẫn UNVERIFIED.
- UNKNOWN: rate limit/attempt limit/distributed OTP/retention theo business chưa chốt; memory map không phải bảng OTP.
- Frontend: AuthPage trên /register gọi sendOtp, giữ pending trong component state, hiện OTP mô phỏng. [UI-AUTH](D:/SWP/storage-rental/frontend/src/features/identity/pages/AuthPage.tsx:14).

### REG-02 — verify và tạo tài khoản
[FACT-SOURCE] POST /api/auth/verify-otp → AuthController.verify(VerifyOtpRequest) → verifyOtpAndRegister(email,code,remoteAddr) → registerUser → UserRepository.save(User) → recordLogin → LoginHistoryRepository.save(LoginHistory) → JwtUtil.generateToken. AUTH-VERIFY (snapshot AuthService.java:353; xem delta implementation), AUTH-SAVE (snapshot AuthService.java:392; xem delta implementation), AUTH-HISTORY (snapshot AuthService.java:442; xem delta implementation).

- Fields email/code; thiếu hoặc không có pending → 400; expired khi now > expiresAt → xóa pending memory + 400; sai mã → 400, chưa thấy bộ đếm lockout. Không có Bean Validation DTO riêng.
- R: pending map, users.count và dữ liệu cần save; W users: id chuỗi có prefix + UUID, name chỉ trim; username/email trim + lowercase, encoded credential, phone/cccd, role CUSTOMER, role_title, facility/facility_code (từ DTO hoặc default trong source), status ACTIVE, created_at.
- [FACT-SOURCE] Credential được validate/so confirm trước khi trim, nhưng registerUser encode giá trị đã trim; login matches input nguyên gốc. Normalization phone/CCCD để validate cũng không đồng nghĩa persistence đã loại mọi khoảng trắng bên trong. [FACT-DOC] P-PWD-20261018 đã chốt giữ nguyên password/confirmPassword, so sánh chuỗi gốc, từ chối whitespace-only; đây là GAP source ở bước encode, không còn là câu hỏi có được trim password hay không. Normalization phone/CCCD có quy tắc riêng; không dùng credential/CCCD thật.
- dob/gender được validate nhưng User entity không có mapping persist hai field đó. facility/facilityCode trong DTO chưa được kiểm bằng FacilityRepository trong path đăng ký; không tự coi là branch được tin cậy.
- W login_history: id chuỗi do constructor cấp, username/name/role/time_str/ip/device/status/created_at. Không có audit_logs.record trong path auth này.
- Không có outer @Transactional giữa save User và LoginHistory; recordLogin bắt Exception rồi chỉ log lỗi. [INFERENCE] User có thể commit trong khi history không ghi được. Không hứa rollback User nếu history lỗi.
- Sau registerUser thành công, pending bị xóa rồi phát JWT; response 200 ApiResponse<UserDto> + root token. UserDto không có password nhưng có phone/cccd; không log dữ liệu riêng tư trong kế hoạch/test output.
- Nếu DB unique username/email đã có và bị tranh chấp, handler dự kiến 409; metadata constraint live chưa có. Nếu unique thiếu thì kết quả race UNKNOWN, không dựa precheck để tuyên bố an toàn.
- Retry sau pending đã xóa → 400; hai verify đồng thời cần test trên DB cô lập. Không có Idempotency-Key cho signup/verify.

### REG-03 — resend
[FACT-SOURCE] POST /api/auth/resend-otp body Map email → AuthController.resend → AuthService.getPendingOtp → memory only. AUTH-RESEND (snapshot AuthService.java:432; xem delta implementation).

- Pending không có → 400; có → 200 ApiResponse data.email/code.
- Source trả mã pending hiện có; không tạo mã mới, không kéo dài TTL, getPendingOtp không kiểm expiresAt. Verify vẫn kiểm expiry. Không gọi email service hay DB trong method này.
- [UNKNOWN] “Resend” có phải phát lại/tạo mã mới/gia hạn TTL theo yêu cầu business chưa được chốt; giữ expected hiện trạng source và target TBD riêng.

## 4. Đăng nhập và đăng xuất

### LOGIN-01 — login
[FACT-SOURCE] POST /api/auth/login → AuthController.login(LoginRequest, HttpServletRequest) → AuthService.login → UserRepository.findByUsernameOrEmail → User → users → BCrypt.matches → recordLogin → login_history → generateToken → UserDto. AUTH-LOGIN (snapshot AuthService.java:113; xem delta implementation), [USER-REPO](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/repository/UserRepository.java:9), AUTH-HISTORY (snapshot AuthService.java:442; xem delta implementation).

- username có thể là email, trim/lowercase; credential không được log/ghi vào tài liệu. Thiếu/blank → 400; không có user/sai credential → history FAILED rồi 400; LOCKED/DISABLED → history BLOCKED rồi 400; nhánh thành công → history SUCCESS, 200 + root token.
- users được ORM đọc gồm mapping identity, credential hash, role/facility/status; không có ghi User trong path login. History là write riêng, lỗi bị bắt; không có transaction toàn login.
- JwtUtil được gọi với username, role, facilityCode; code public methods xây iat/exp từ thời gian và expiration được inject. Signing material không đọc/xuất trong điều tra. Không tự khẳng định TTL/algorithm runtime vì config override chưa xác minh.
- UserDto chuẩn hóa role alias. Không nên assert token claim role và DTO role luôn cùng chuỗi khi alias được lưu.
- Source login chỉ loại LOCKED/DISABLED, trong khi CustomUserDetailsService cho enabled khi ACTIVE. [FACT-DOC] BR-001 đã yêu cầu chỉ ACTIVE được đăng nhập; status khác/NULL phải bị từ chối theo acceptance. Chỉ khả năng dữ liệu này tồn tại và response runtime còn UNKNOWN; không tự gán ACTIVE.
- UI sau login/verify lưu session và navigate về /, không phải một dashboard role-specific cố định như mô tả SRS. [UI-AUTH](D:/SWP/storage-rental/frontend/src/features/identity/pages/AuthPage.tsx:14).

### AUTH-REQUEST — bảo vệ các request
[FACT-SOURCE] [JWT-FILTER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/JwtAuthenticationFilter.java:30) đọc Bearer header → JwtUtil extract/validate → [USER-DETAILS](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/CustomUserDetailsService.java:22) query User đang tồn tại/enabled → SecurityContext; [ACTOR](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/security/ActorContext.java:20) lại lấy principal và User ACTIVE cho business scope.

- Missing/invalid/expired JWT khi truy cập protected route không tạo authenticated principal: dự kiến 401 entry point nếu không có exception filter khác.
- Role/facility/user do client gửi không thay principal. ActorContext.visible cho Customer theo owner, Staff/Manager theo facility; Ops/Admin là global nhưng caller require() có thể cấm role trước đó.
- Không có audit/history cho mọi Bearer request; không suy ra gọi GET làm ghi LoginHistory.
- Frontend HTTP client gắn token, timeout 15s và xóa client session khi nhận 401. [UI-HTTP](D:/SWP/storage-rental/frontend/src/shared/api/http-client.ts:12). Không đọc browser storage hay token đang có trong điều tra.

### LOGOUT-01 — client hiện có; LOGOUT-SERVER — gap đã xác nhận
[FACT-SOURCE] Click AppShell → sessionStore.set(null) → xóa localStorage key của ứng dụng + notify listeners; RoleGuard đưa protected page về /login khi session mất. Không gọi HTTP logout, không cập nhật bảng nào. Trên trang public, không có navigate bắt buộc về /login. [UI-LOGOUT](D:/SWP/storage-rental/frontend/src/app/layouts/AppShell.tsx:51), [UI-SESSION](D:/SWP/storage-rental/frontend/src/features/identity/session.ts:16), [UI-GUARD](D:/SWP/storage-rental/frontend/src/app/guards/RoleGuard.tsx:13).

[FACT-DOC] SRS FR-003 đòi hủy token client/server và chuyển trang đăng nhập; người dùng xác nhận giữ yêu cầu này. [INFERENCE] Token cũ còn hạn và User ACTIVE có thể tiếp tục được chấp nhận nếu được gửi lại, do chưa tìm thấy revocation check/endpoint trong path. [NOT-TESTED] Chưa replay token.

[UNKNOWN] Route/DTO/HTTP status của server logout, cơ chế revoke và phạm vi một phiên hay mọi thiết bị chưa có thiết kế được duyệt. Không tự đặt POST /logout hoặc status 204. Case server logout/revocation phải BLOCKED, target deny theo SRS; không giảm xuống client-only.

## 5. Flow 1 — API trace

| ID / Step | HTTP → Controller → DTO → Validation → Service → Repository → Entity / DB | Auth / response / transaction / side effect |
|---|---|---|
| F1-01 Xem cơ sở | GET /api/facilities → FacilityController.list → không request DTO → FacilityService.facilities → FacilityRepository.findAll → Facility/facilities | [FACT-SOURCE] Public; 200 ApiResponse<List<Facility>>; R facilities mapping; không W/audit; [FACILITY-CTRL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/facility/controller/FacilityController.java:10), [FACILITY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/facility/service/FacilityService.java:37) |
| F1-02 Xem/lọc kho | GET /api/facilities/units with optional facilityCode/minSize/maxSize/minPrice/maxPrice → FacilityController.units → FacilityService.catalog → UnitRepository.findAvailableForCatalog → Unit/units → map công khai | [FACT-SOURCE] Public; chỉ `available`; range inclusive; 400 nếu range âm hoặc min>max; 200 list code/facility/type/size/price/status, không PIN; không W; [CATALOG](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/facility/service/FacilityService.java:41) |
| F1-03 Báo giá | POST /api/reservations/calculate → quote(Map) → Inputs.text + parseInt months + bounds 1–36/type → ReservationService.quote → UnitRepository.findByFacilityCode, PolicyService/BusinessPolicyRepository → units/business_policies | [FACT-SOURCE] Security yêu cầu authenticated, method quote không require role riêng; 200 monthlyRate/durationMonths/depositAmount/payNowAmount/totalRent/discountRate; 400 invalid, 409 hết loại kho; không W; [QUOTE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java:52), [POLICY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/policy/service/PolicyService.java:57) |
| F1-04 Tạo đơn | POST /api/reservations → create(@Valid CreateReservationRequest) → CreateReservationWorkflow → ActorContext/UserRepository; FacilityRepository.lockByCode; UnitRepository; ReservationRepository; quote/policy; InvoiceService/InvoiceRepository; AuditLogService/AuditLogRepository | [FACT-SOURCE] CUSTOMER; 200 Reservation; thiếu/sai input 400, không có facility 404, hết sức chứa 409, sai role 403. @Transactional toàn workflow; R users/facilities/units/reservations/policies, W Reservation + 2 Invoice + Audit; [RESERVATION-CTRL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/controller/ReservationController.java:13) |
| F1-05 Hóa đơn | GET /api/invoices → InvoiceController.list → InvoiceService.list → findAll + actor.visible → Invoice/invoices | [FACT-SOURCE] CUSTOMER/STAFF/FMANAGER, owner/branch scope; 200 list; R users/invoices, không W; [INVOICE-READ](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/billing/service/InvoiceService.java:32) |
| F1-06 Nộp cọc | POST /api/payments/simulate → PaymentController.pay(Map, optional Idempotency-Key) → PayInvoiceWorkflow → InvoiceRepository.lockById; ReservationRepository.lockById; PaymentRepository; AuditLogRepository | [FACT-SOURCE] CUSTOMER hoặc STAFF đúng owner/branch; 200 Payment PAID/FAILED; 400 method, 404 ngoài scope, 409 invoice/state/24h/key conflict, 403 role. @Transactional; các W chi tiết bên dưới; [PAY-CTRL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/billing/controller/PaymentController.java:11), [PAY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:50) |
| F1-07 Lịch sử đơn | GET /api/reservations → ReservationController.list → ReservationService.list → findByUserId hoặc findByFacilityCode → reservations | [FACT-SOURCE] CUSTOMER/STAFF/FMANAGER; 200 list scoped; không W; [RESERVATION-READ](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java:36) |
| F1-08 Chi tiết | GET /api/reservations/{id} → get → ReservationService.get → ActorContext.current + repo.findById + visible → reservations | [FACT-SOURCE] Bất kỳ authenticated actor theo visible(); Customer khác owner hoặc Staff khác branch → 404. Ops/Admin global visible có thể đọc single dù list require() không cho; không áp một rule cho mọi endpoint. Không W |
| F1-09 Lịch sử thanh toán | GET /api/payments/transactions → PaymentService.list → PaymentRepository.findAll + visible → payments | [FACT-SOURCE] CUSTOMER/STAFF/FMANAGER/OPS_MGR; 200 scoped; không W; [PAY-READ](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/billing/service/PaymentService.java:25) |
| F1-10 Thông tin QR mô phỏng | GET /api/payments/bank-info → PaymentService.bank → map mô phỏng | [FACT-SOURCE] Authenticated qua Security; không truy cập provider/bank/DB trong method bank; 200 ApiResponse map; không xuất thông tin tài khoản vào tài liệu |
| F1-11 Hủy | POST /api/reservations/{id}/cancel → cancel(Map reason) → CancelReservationWorkflow → Reservation/Unit lock + AuditRepository | [FACT-SOURCE] CUSTOMER/STAFF/FMANAGER trong visible scope; 200 CANCELLED, thiếu reason 400, ngoài scope 404, trạng thái khác 409; @Transactional; không tự tạo refund/Invoice cancellation; [CANCEL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CancelReservationWorkflow.java:40) |

### F1-04 — dữ liệu, điều kiện và giá
[FACT-SOURCE] [RESERVATION-DTO](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/dto/CreateReservationRequest.java:6), [CREATE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java:52):

- Fields bắt buộc: facilityCode/unitType không blank; startDate/rentalStartAt/appointmentAt không null; durationMonths integer 1–36. startDate phải bằng ngày của rentalStartAt; các mốc không ở quá khứ theo Clock.
- Server lấy customer identity từ actor; quote theo facility/type, monthly min của Unit available và policy/discount. Không tin giá/customer gửi trong body. Quote-only khác tạo đơn vì create có khóa/kiểm sức chứa.
- Facility row bị khóa; số Unit available theo type trừ reservation chưa gán Unit đang RESERVED hoặc PENDING_PAYMENT còn <24h. Đây là đếm sức chứa hiện tại theo type, chưa phải thuật toán interval overlap theo toàn lịch thuê.
- W reservations: id/user/customer/facility/type/duration/start_date/rental_start_at/appointment/appointment_at/deposit_amount/monthly_price_snapshot/status PENDING_PAYMENT/created_at/extension flags/incident flag.
- W invoices: DEPOSIT + RENT ban đầu, snapshot giá/cọc/server amount, owner/facility/reservation link, status PENDING; contract_id NULL hợp lệ tại bước này.
- W audit_logs: CREATE_RESERVATION, actor metadata hiện tại. Không cập nhật Unit cụ thể tại create.
- Không có outer idempotency tạo Reservation; double-submit khác request có thể tạo nhiều đơn hợp lệ nếu còn sức chứa. Không gọi đó là duplicate được ngăn sẵn.

### F1-06 — thanh toán và retry
[FACT-SOURCE] PayInvoiceWorkflow khóa Invoice, kiểm visibility trước key; key tìm toàn cục, cùng key khác invoice → 409, cùng invoice trả attempt cũ. Chưa fingerprint payload đầy đủ. Khi không còn PENDING thì 409.

- DEPOSIT yêu cầu Reservation PENDING_PAYMENT và now < created_at+24h; đúng 24h bị từ chối.
- Methods mock/card/QR/cash chỉ là mô phỏng; Staff chỉ ghi CASH_AT_COUNTER. Amount lấy Invoice; client amount không dùng.
- W Payment mỗi attempt: id/invoice/reservation/contract/user/facility/type/amount/method/code/status/time/key. simulateFailure=true vẫn trả 200, Payment FAILED, Invoice/Reservation chưa chuyển PAID/RESERVED.
- Thành công: Invoice PAID, Reservation RESERVED; audit action PAYMENT_PAID. Lỗi mô phỏng: action PAYMENT_FAILED, audit.status hiện vẫn SUCCESS. Không có provider webhook hoặc chuyển tiền thật trong path.
- Retry cùng key là cùng logical attempt; attempt mới sau thất bại dùng key mới. Transport helper chỉ giữ key trong RAM. Không tuyên bố unique index/key live hiện có.
- Outer transaction phải bao trùm Payment/Invoice/Reservation/Audit; cần G4 fault injection để xác minh thực tế, không kết luận rollback bằng annotation một mình.

### F1 nhánh hủy/hết hạn và chênh lệch tài liệu
[FACT-SOURCE] Hủy chỉ cho PENDING_PAYMENT/RESERVED; W reservation.status/cancelled_at và chỉ giải phóng Unit khi status reserved + held_by_reservation_id đúng. Không tự refund và không đổi invoice status trong cancel path.

[FACT-SOURCE] [EXPIRY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/job/ReservationMonitoringJob.java:33) chạy định kỳ (source default 60s), hết 24h unpaid → EXPIRED và Invoice PENDING → CANCELLED; tạo no_show_alert_at theo NoShowRules khi đủ điều kiện, không tự xác nhận NO_SHOW. Không gọi audit.record trong job này. Không chạy scheduler trong Phase A/B.

[FACT-DOC] User đã chốt giữ giá 24h chờ cọc, hủy đủ 24h trước rental start được hoàn theo policy. Scope cũ nói giữ phòng 24h sau cọc và SRS sơ đồ dùng POST /api/payments/deposit, GET /unit-types; các route/diễn đạt này không khớp source hiện tại. Quyết định mới hơn ưu tiên nhưng tài liệu cần cập nhật có phê duyệt.

[UNKNOWN] Chính sách hủy sau giờ hẹn nhưng chưa check-in (code chỉ gate status); cách liệt kê khả dụng khi còn holds chưa gán Unit và interval availability cần owner xác nhận. [FACT-DOC] FR-008 structured filters đã được triển khai và kiểm tra ở catalog; calendar availability/holds theo kỳ vẫn chưa được triển khai. Không tự tạo target rule cho các tình huống này.

## 6. Flow 2 — API trace

| ID / Step | HTTP → Controller → DTO → Validation → Service → Repository → Entity / DB | Auth / response / transaction / side effect |
|---|---|---|
| F2-01 Gán Unit | PATCH /api/reservations/{id}/assign-unit → ReservationController.assign(Map unitCode) → AssignUnitWorkflow → Facility/Reservation/Unit lock, InvoiceService.requirePaid, TaskService.system, Audit service | [FACT-SOURCE] FMANAGER own branch; 200 Reservation, 400 thiếu field, 404 missing, 403 wrong branch/role, 409 chưa cọc/đã gán/type/status; @Transactional; [ASSIGN](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/AssignUnitWorkflow.java:48) |
| F2-02 Công việc | GET /api/tasks hoặc /api/tasks/daily → TaskController.list → TaskService.list → DailyTaskRepository.findByStaffId hoặc findByFacilityCode → daily_tasks | [FACT-SOURCE] STAFF chỉ task được gán; FMANAGER branch; 200 list; không W; source không lọc due_date hôm nay; [TASKS](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/workforce/service/TaskService.java:35) |
| F2-03 Tra cứu | GET /api/reservations và /api/reservations/{id} như F1-07/08 → ReservationService → reservations | [FACT-SOURCE] UI ReservationLookupPage tải list và tìm trong ResourcePage; không có server lookup endpoint bằng CCCD trong code này; scope theo rule từng endpoint; [UI-LOOKUP](D:/SWP/storage-rental/frontend/src/features/reservation/pages/ReservationLookupPage.tsx:3) |
| F2-04 Ghi nhận đã đến | POST /api/reservations/{id}/arrived → ReservationController.arrived → NoShowWorkflow.arrived → lock Reservation + Audit | [FACT-SOURCE] STAFF đúng branch, RESERVED; 200 Reservation.arrived_at, 403 wrong branch/role, 409 state; @Transactional; W arrived_at + CUSTOMER_ARRIVED audit; [ARRIVAL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/NoShowWorkflow.java:53) |
| F2-05 Thu kỳ đầu | POST /api/payments/simulate body invoiceId của RENT + paymentMethod → cùng PayInvoiceWorkflow | [FACT-SOURCE] CUSTOMER/STAFF scoped, Staff cash-only; RENT yêu cầu reservation RESERVED và có unit_code; 200 PAID/FAILED; 409 chưa gán; W Payment/Invoice/Audit, Reservation vẫn RESERVED trước handover; [PAY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:50) |
| F2-06 Bàn giao | POST /api/contracts/handover → ContractController.handover(Map) → HandoverWorkflow → Reservation/Unit lock; InvoiceService.requirePaid(DEPOSIT,RENT); ContractRepository/HandoverRecordRepository/AuditRepository | [FACT-SOURCE] STAFF đúng branch; 200 Contract, 400 signature false/notes thiếu, 409 state/billing/hold/contract duplicate, 404 missing, 403 scope; @Transactional; [CONTRACT-CTRL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/controller/ContractController.java:11), [HANDOVER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:52) |
| F2-07 Xem kho thuê/PIN | GET /api/contracts → ContractService.list → ContractRepository.findAll + visible → contracts | [FACT-SOURCE] CUSTOMER/STAFF/FMANAGER owner/branch; 200 List<Contract> (entity có pinCode); không W. Không log PIN thực trong test/report; [CONTRACT-READ](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/ContractService.java:25) |
| F2-08 Mô phỏng access | POST /api/contracts/verify-pin → AccessCodeService.verify(Map unitCode,pin) → ContractRepository.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc | [FACT-SOURCE] CUSTOMER/STAFF/FMANAGER; 200 {authorized,mode}; sai PIN/scope/không có active contract/hết hạn → authorized=false, không tự gán 403/404. Thiếu input →400; không W/audit; [PIN-VERIFY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) |

### F2-01 — bảng và side effect
[FACT-SOURCE] Khóa facility của Manager trước Reservation/Unit. Reservation phải RESERVED và chưa unit_code, DEPOSIT invoice PAID; Unit cùng branch/type và available. W units.status=reserved/held_by_reservation_id/tenant_name; reservations.unit_code; daily_tasks CHECKIN với reservation/unit/facility, staff_id được tìm từ Staff active của cơ sở hoặc NULL/chưa phân công; audit ASSIGN_UNIT.

[FACT-SOURCE] [TASKS-SYSTEM](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/workforce/service/TaskService.java:85) tạo due_date bằng LocalDate.now(), deadline cố định trong source; TaskService.list không lọc ngày. [FACT-DOC] FR-013 yêu cầu công việc trong ngày, AC-05 yêu cầu task xuất hiện cho đúng người được Manager phân công; today-only không còn TBD. [UNKNOWN] Cách đồng bộ lịch/task khi đổi hẹn, timezone của ngày nghiệp vụ và thời điểm task hoàn thành còn cần thiết kế. Handover không cập nhật DailyTask trong path hiện tại. Không tự suy ra auto-complete.

### F2-06 — bàn giao nguyên tử theo ý định code
[FACT-SOURCE] Fields: reservationId, customerSignatureConfirmed phải Boolean true, unitConditionNotes không blank. Reservation phải RESERVED, có unit_code; invoice DEPOSIT/RENT PAID; chưa có Contract; Unit phải reserved và held_by_reservation_id khớp.

W contracts: id/reservation/user/facility/unit/customer/duration/monthly_fee từ snapshot/deposit_fee, start_at=now Clock, end_at=now+duration months, start_date/end_date tương ứng, PIN 6 số ngẫu nhiên, ACTIVE, created_at.
W handover_records: id/contract_id/reservation_id/staff_id/handover_date/customer_signature_confirmed/unit_condition_notes.
W units: occupied và PIN mới; W reservations: CHECKED_IN + arrived_at; W audit_logs: COMPLETE_HANDOVER. Không gửi email/IoT thật, không tạo Payment trong handover.

[FACT-SOURCE] Flag signature được Staff gửi; chưa thấy customer-authenticated signature endpoint riêng. [FACT-DOC] FR-016/BR-005 bắt buộc có bằng chứng khách xác nhận hợp lệ, không bắt buộc endpoint Customer riêng. B-SIGNATURE BLOCKED: chưa phê duyệt cơ chế/bản ghi chứng minh người xác nhận, thời điểm và liên kết đúng khách/handover/contract; Staff flag đơn lẻ chưa đủ nếu không có thiết kế chứng minh được phê duyệt.

[FACT-SOURCE] Không thấy gate bắt buộc arrived_at, current time >= lịch hẹn hoặc current time >= rental_start_at trong handover; các rule đó nếu cần phải được owner chốt. Start/end contract theo thực tế bàn giao như source, không lấy rentalStartAt của reservation trong method này.

## 7. Bảng/cột liên quan và constraint

[FACT-SOURCE] ORM đọc có thể lấy toàn bộ mapped field. Bảng này liệt kê nhóm cột cần theo dõi cho 5 flow; mapping-inventory.json trong docs/drafts/schema-alignment-20261018 lưu đầy đủ 216 field. Không đưa giá trị credential/PIN/CCCD/token vào báo cáo.

| Entity / Table | R / W theo flow | Cột nghiệp vụ trực tiếp | Constraint nguồn REF (không phải LIVE) |
|---|---|---|---|
| User / users | AUTH R/W; mọi flow đọc principal; gán kho đọc Staff | id, username/email, encoded credential, name/phone/cccd, role/status/facility_code/created_at | [FACT-DOC] PK id, UNIQUE username/email, NOT NULL identity/role, CHECK role/status; không FK facility trong REF |
| LoginHistory / login_history | AUTH ghi best-effort; logout không ghi | id,username,name,role,time_str,ip,device,status,created_at | [FACT-DOC] PK id varchar, username/name/role NOT NULL; login_time/ip_address legacy/default ngoài entity |
| Facility / facilities | F1 public read; create/assign row lock read | code,name/address/city/status và thống kê mapping | [FACT-DOC] PK code, name/address/city NOT NULL; stats/status defaults |
| Unit / units | F1 read; cancel/assign/handover update | code,facility_code,type,size_sqm,price_per_month,status,held_by_reservation_id,tenant_name,pin_code | [FACT-DOC] PK code, FK facility_code→facilities, CHECK type/status, NOT NULL size/price/type/status; hold/readiness mới chỉ theo source |
| BusinessPolicy / business_policies | F1 quote read | policy_key,policy_value; fallback không ghi DB | [FACT-DOC] PK key, value/updated_at NOT NULL; value TEXT khác String hint |
| Reservation / reservations | F1 insert/read/cancel/expiry; F2 assign/arrival/checkin update | id,user/facility/type/unit,duration,start_date,rental_start_at,appointment/appointment_at,monthly_price_snapshot,deposit_amount,status,created_at,arrived/cancelled/NO_SHOW flags | [FACT-DOC] PK, FK user/facility, start_date/deposit NOT NULL; REF CHECK không có NO_SHOW; nhiều cột mới chỉ có source |
| Invoice / invoices | F1 insert/read/expiry; deposit/rent payment update | id,reservation/contract,user/facility,invoice_type,amount,status,issued/due_at,description,price_snapshot | [FACT-DOC] Bảng không có trong REF 15 bảng; không được suy ra thiếu LIVE |
| Payment / payments | F1/F2 insert attempts/read | id,invoice/reservation/contract,user/facility,invoice_type,amount,payment_method,transaction_code,status,time_str,created_at,idempotency_key | [FACT-DOC] PK, invoice_type/status CHECK, amount/type NOT NULL; REF chưa có invoice/user/facility/key mới |
| DailyTask / daily_tasks | assign insert; Staff/Manager read | id,staff/staff_id,facility/unit/reservation/contract,task_type,title,status,due_date,deadline,created_at | [FACT-DOC] PK, staff/title NOT NULL; không tự copy constraint từ staff_tasks |
| Contract / contracts | handover insert; Customer/Staff/Manager read; verify read | id,reservation/user/unit/facility,customer,dates/start_at/end_at,duration,monthly_fee/deposit_fee,pin_code,status,created_at | [FACT-DOC] PK, FK user/unit; date/fees/customer NOT NULL; status CHECK; timestamp mới chưa có trong REF |
| HandoverRecord / handover_records | handover insert | id,contract_id,reservation_id,staff_id,handover_date,customer_signature_confirmed,unit_condition_notes | [FACT-DOC] PK, contract/reservation/staff/date/signature NOT NULL; không FK được khai trong REF |
| AuditLog / audit_logs | create/pay/assign/arrival/handover/cancel insert | id,user_id,entity_id,facility_code,user_name,role,action,detail,ip,status,time_str,created_at | [FACT-LIVE] Snapshot người dùng trước đây thiếu 3 metadata columns; timestamp/DB-role-capture chưa có. [FACT-DOC] REF PK bigint/sequence, required actor/action/detail; không FK/index mới được xác minh |

[UNKNOWN] Unique/FK/CHECK/index/default/trigger/RLS hiện hành của các bảng trên chưa được operator cung cấp cho đúng DB/schema/role. Không đề xuất constraint mới chỉ vì repository dùng Optional. Metadata readonly cũ M01–M12 chỉ được operator cân nhắc sau phê duyệt; không chạy trong task này.

## 8. Gap và giới hạn cần đưa vào ma trận

- [FACT-SOURCE + FACT-DOC] Logout server gap giữ nguyên theo xác nhận người dùng; xem blockers.
- [FACT-SOURCE + FACT-DOC] Các route legacy trong sơ đồ SRS không phải controller hiện tại. Không khẳng định HTTP 404 cho route không mapping vì global error/static-resource/filter handling chưa chạy; exact response UNKNOWN.
- [FACT-SOURCE] OTP và payment/access là mô phỏng; không có bằng chứng email/bank/IoT thật hoạt động.
- [FACT-SOURCE] Daily list không lọc today; handover không tự complete task; Staff gửi signature flag.
- [UNKNOWN] Clock/zone/JDBC/live types, dữ liệu legacy/snapshot/owner/hold, RLS, unique/index và PostgreSQL concurrency cần G0–G4 thật.
- [NOT-TESTED] Không có API hoặc DB state nào được quan sát trong Phase A/B.

## 9. Chỉ mục bằng chứng

| ID | File / dòng | Nhãn |
|---|---|---|
| AUTH-CTRL | [backend/src/main/java/com/swp391/selfstorage/modules/identity/controller/AuthController.java: 12](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/controller/AuthController.java:12) | FACT-SOURCE |
| AUTH-LOGIN | backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java: 113 (snapshot AuthService.java:113; xem delta implementation) | FACT-SOURCE |
| AUTH-VALIDATE | backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java: 198 (snapshot AuthService.java:198; xem delta implementation) | FACT-SOURCE |
| AUTH-OTP | backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java: 322 (snapshot AuthService.java:322; xem delta implementation) | FACT-SOURCE |
| AUTH-VERIFY | backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java: 353 (snapshot AuthService.java:353; xem delta implementation) | FACT-SOURCE |
| AUTH-SAVE | backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java: 392 (snapshot AuthService.java:392; xem delta implementation) | FACT-SOURCE |
| AUTH-RESEND | backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java: 432 (snapshot AuthService.java:432; xem delta implementation) | FACT-SOURCE |
| AUTH-HISTORY | backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java: 442 (snapshot AuthService.java:442; xem delta implementation) | FACT-SOURCE |
| AUTH-DTO | [backend/src/main/java/com/swp391/selfstorage/modules/identity/dto/RegisterRequest.java: 3](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/dto/RegisterRequest.java:3) | FACT-SOURCE |
| USER-DTO | [backend/src/main/java/com/swp391/selfstorage/modules/identity/dto/UserDto.java: 21](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/dto/UserDto.java:21) | FACT-SOURCE |
| USER-REPO | [backend/src/main/java/com/swp391/selfstorage/modules/identity/repository/UserRepository.java: 9](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/repository/UserRepository.java:9) | FACT-SOURCE |
| LOGIN-REPO | [backend/src/main/java/com/swp391/selfstorage/modules/identity/repository/LoginHistoryRepository.java: 9](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/repository/LoginHistoryRepository.java:9) | FACT-SOURCE |
| SECURITY | [backend/src/main/java/com/swp391/selfstorage/security/SecurityConfig.java: 34](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/SecurityConfig.java:34) | FACT-SOURCE |
| JWT-FILTER | [backend/src/main/java/com/swp391/selfstorage/security/JwtAuthenticationFilter.java: 30](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/JwtAuthenticationFilter.java:30) | FACT-SOURCE |
| USER-DETAILS | [backend/src/main/java/com/swp391/selfstorage/security/CustomUserDetailsService.java: 22](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/CustomUserDetailsService.java:22) | FACT-SOURCE |
| ACTOR | [backend/src/main/java/com/swp391/selfstorage/common/security/ActorContext.java: 20](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/security/ActorContext.java:20) | FACT-SOURCE |
| ERROR | [backend/src/main/java/com/swp391/selfstorage/common/exception/GlobalExceptionHandler.java: 10](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/exception/GlobalExceptionHandler.java:10) | FACT-SOURCE |
| ENVELOPE | [backend/src/main/java/com/swp391/selfstorage/common/web/ApiResponse.java: 6](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/web/ApiResponse.java:6) | FACT-SOURCE |
| FACILITY-CTRL | [backend/src/main/java/com/swp391/selfstorage/modules/facility/controller/FacilityController.java: 10](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/facility/controller/FacilityController.java:10) | FACT-SOURCE |
| FACILITY | [backend/src/main/java/com/swp391/selfstorage/modules/facility/service/FacilityService.java: 37](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/facility/service/FacilityService.java:37) | FACT-SOURCE |
| CATALOG | [backend/src/main/java/com/swp391/selfstorage/modules/facility/service/FacilityService.java: 41](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/facility/service/FacilityService.java:41) | FACT-SOURCE |
| RESERVATION-CTRL | [backend/src/main/java/com/swp391/selfstorage/modules/reservation/controller/ReservationController.java: 13](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/controller/ReservationController.java:13) | FACT-SOURCE |
| RESERVATION-DTO | [backend/src/main/java/com/swp391/selfstorage/modules/reservation/dto/CreateReservationRequest.java: 6](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/dto/CreateReservationRequest.java:6) | FACT-SOURCE |
| RESERVATION-READ | [backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java: 36](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java:36) | FACT-SOURCE |
| QUOTE | [backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java: 52](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java:52) | FACT-SOURCE |
| CREATE | [backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java: 52](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java:52) | FACT-SOURCE |
| ASSIGN | [backend/src/main/java/com/swp391/selfstorage/application/workflow/AssignUnitWorkflow.java: 48](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/AssignUnitWorkflow.java:48) | FACT-SOURCE |
| CANCEL | [backend/src/main/java/com/swp391/selfstorage/application/workflow/CancelReservationWorkflow.java: 40](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CancelReservationWorkflow.java:40) | FACT-SOURCE |
| ARRIVAL | [backend/src/main/java/com/swp391/selfstorage/application/workflow/NoShowWorkflow.java: 53](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/NoShowWorkflow.java:53) | FACT-SOURCE |
| NOSHOW | [backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/NoShowRules.java: 32](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/NoShowRules.java:32) | FACT-SOURCE |
| EXPIRY | [backend/src/main/java/com/swp391/selfstorage/modules/reservation/job/ReservationMonitoringJob.java: 33](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/job/ReservationMonitoringJob.java:33) | FACT-SOURCE |
| POLICY | [backend/src/main/java/com/swp391/selfstorage/modules/policy/service/PolicyService.java: 57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/policy/service/PolicyService.java:57) | FACT-SOURCE |
| INVOICE | [backend/src/main/java/com/swp391/selfstorage/modules/billing/service/InvoiceService.java: 41](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/billing/service/InvoiceService.java:41) | FACT-SOURCE |
| INVOICE-READ | [backend/src/main/java/com/swp391/selfstorage/modules/billing/service/InvoiceService.java: 32](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/billing/service/InvoiceService.java:32) | FACT-SOURCE |
| PAY | [backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java: 50](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:50) | FACT-SOURCE |
| PAY-CTRL | [backend/src/main/java/com/swp391/selfstorage/modules/billing/controller/PaymentController.java: 11](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/billing/controller/PaymentController.java:11) | FACT-SOURCE |
| PAY-READ | [backend/src/main/java/com/swp391/selfstorage/modules/billing/service/PaymentService.java: 25](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/billing/service/PaymentService.java:25) | FACT-SOURCE |
| HANDOVER | [backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java: 52](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:52) | FACT-SOURCE |
| CONTRACT-CTRL | [backend/src/main/java/com/swp391/selfstorage/modules/rental/controller/ContractController.java: 11](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/controller/ContractController.java:11) | FACT-SOURCE |
| CONTRACT-READ | [backend/src/main/java/com/swp391/selfstorage/modules/rental/service/ContractService.java: 25](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/ContractService.java:25) | FACT-SOURCE |
| PIN-VERIFY | [backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java: 37](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) | FACT-SOURCE |
| TASKS | [backend/src/main/java/com/swp391/selfstorage/modules/workforce/service/TaskService.java: 35](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/workforce/service/TaskService.java:35) | FACT-SOURCE |
| TASKS-SYSTEM | [backend/src/main/java/com/swp391/selfstorage/modules/workforce/service/TaskService.java: 85](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/workforce/service/TaskService.java:85) | FACT-SOURCE |
| AUDIT | [backend/src/main/java/com/swp391/selfstorage/modules/audit/service/AuditLogService.java: 26](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/audit/service/AuditLogService.java:26) | FACT-SOURCE |
| UI-AUTH | [frontend/src/features/identity/pages/AuthPage.tsx: 14](D:/SWP/storage-rental/frontend/src/features/identity/pages/AuthPage.tsx:14) | FACT-SOURCE |
| UI-SESSION | [frontend/src/features/identity/session.ts: 16](D:/SWP/storage-rental/frontend/src/features/identity/session.ts:16) | FACT-SOURCE |
| UI-LOGOUT | [frontend/src/app/layouts/AppShell.tsx: 51](D:/SWP/storage-rental/frontend/src/app/layouts/AppShell.tsx:51) | FACT-SOURCE |
| UI-GUARD | [frontend/src/app/guards/RoleGuard.tsx: 13](D:/SWP/storage-rental/frontend/src/app/guards/RoleGuard.tsx:13) | FACT-SOURCE |
| UI-HTTP | [frontend/src/shared/api/http-client.ts: 12](D:/SWP/storage-rental/frontend/src/shared/api/http-client.ts:12) | FACT-SOURCE |
| UI-RETRY | [frontend/src/shared/api/idempotent-request.ts: 6](D:/SWP/storage-rental/frontend/src/shared/api/idempotent-request.ts:6) | FACT-SOURCE |
| UI-RESERVATION | [frontend/src/features/reservation/pages/CreateReservationPage.tsx: 5](D:/SWP/storage-rental/frontend/src/features/reservation/pages/CreateReservationPage.tsx:5) | FACT-SOURCE |
| UI-HANDOVER | [frontend/src/features/rental/pages/HandoverPage.tsx: 3](D:/SWP/storage-rental/frontend/src/features/rental/pages/HandoverPage.tsx:3) | FACT-SOURCE |
| UI-LOOKUP | [frontend/src/features/reservation/pages/ReservationLookupPage.tsx: 3](D:/SWP/storage-rental/frontend/src/features/reservation/pages/ReservationLookupPage.tsx:3) | FACT-SOURCE |
| UI-CATALOG | [frontend/src/features/facility/pages/CatalogPage.tsx: 3](D:/SWP/storage-rental/frontend/src/features/facility/pages/CatalogPage.tsx:3) | FACT-SOURCE |
| SRS-F1 | [docs/requirements/srs.md: 228](D:/SWP/storage-rental/docs/requirements/srs.md:228) | FACT-SOURCE / FACT-DOC |
| SRS-F2 | [docs/requirements/srs.md: 255](D:/SWP/storage-rental/docs/requirements/srs.md:255) | FACT-SOURCE / FACT-DOC |
| SRS-LOGOUT | [docs/requirements/srs.md: 143](D:/SWP/storage-rental/docs/requirements/srs.md:143) | FACT-SOURCE / FACT-DOC |
| SRS-AUTH | [docs/requirements/srs.md: 141](D:/SWP/storage-rental/docs/requirements/srs.md:141) | FACT-SOURCE / FACT-DOC |
| DECISIONS | [docs/requirements/decision-log.md: 129](D:/SWP/storage-rental/docs/requirements/decision-log.md:129) | FACT-SOURCE / FACT-DOC |


## 10. Billing — Ánh xạ đề xuất, tách hai vòng đời

[FACT-DOC] SRS §7 L400–401, FR-010/FR-015 và BR-010 là yêu cầu tài liệu, không là metadata live. [FACT-SOURCE] InvoiceService.issue và PayInvoiceWorkflow là baseline source. [NOT-TESTED] Không có giao dịch/row/runtime nào được quan sát. B-BILLING-MAP giữ BLOCKED cho ngữ nghĩa chưa duyệt.

| Entity / khía cạnh | SRS v2.0 | Source đã đọc | Phân loại / ý nghĩa cần xác minh | Ca kế hoạch |
|---|---|---|---|---|
| Invoice.invoice_type | FIRST_MONTH_RENT | RENT tạo từ monthlyPriceSnapshot; handover requirePaid(RENT) | INFERENCE: đề xuất ánh xạ phí kỳ đầu; cần xác minh kỳ tính, amount, trường hợp3tháng và invoice cardinality. Chưa tuyên bố tương đương | BILL-TYPE-01 |
| Invoice.status trước thu | UNPAID | PENDING lúc issue | Đề xuất UNPAID↔PENDING; xác minh due/expire/cancel/partial/retry lifecycle trước duyệt | BILL-STATUS-01 |
| Invoice.status sau thu / hủy | PAID / CANCELLED | PAID sau attempt thành công; CANCELLED qua expiry job với invoice PENDING | Cùng tên chưa đủ chứng minh tất cả transition/default live tương đương | BILL-STATUS-01; BILL-ATTEMPT-01 |
| Payment.status mỗi lần trả | SUCCESS / FAILED (§7); BR-010 lại viết Payment PAID | PAID / FAILED | Đề xuất SUCCESS↔PAID cần xác minh; đây còn là bất nhất nội bộ SRS. Không sửa dữ liệu hay tự chọn SRS vocabulary | BILL-STATUS-01 |
| Quan hệ nghĩa vụ / giao dịch | Invoice→nhiều Payment | Mỗi attempt lưu Payment, idempotent replay trả bản cũ; Invoice chỉ chuyển PAID nếu attempt không failed | Đối chiếu độc lập; không coi Invoice.PAID và Payment.PAID cùng vòng đời; failed Payment không biến Invoice thành FAILED | BILL-ATTEMPT-01 |

[FACT-SOURCE] [InvoiceService.java:41](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/billing/service/InvoiceService.java:41): issue PENDING, amount/dueAt/snapshot; [CreateReservationWorkflow.java:123](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java:123): RENT một monthly snapshot; [PayInvoiceWorkflow.java:119](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:119): FAILED/PAID attempt, Invoice.PAID khi success. Hai Invoice khởi tạo trước Contract có contract_id NULL; không tự yêu cầu backfill lịch sử hoặc FK/unique chỉ từ quan hệ SRS. Refund retries/partial/refund-ledger và key scope vẫn cần quyết định riêng.

[FACT-SOURCE] Existing RentalLifecycleTest gửi failed/success attempts và assert HTTP200; chưa assert trực tiếp các Payment.status/Invoice.status/Reservation.status. BILL-ATTEMPT-01 là đề xuất test mới, không coverage đã có và không kết quả thực thi.

## 11. AUTH-PWD — Chuỗi credential xuyên frontend → OTP → encode → login

[FACT-DOC] P-PWD-20261018: người dùng đã chốt password/confirmPassword giữ đúng raw input, không trim/strip/normalize; so sánh raw; từ chối whitespace-only; minimum length trên raw string; không log credential. Đây là quyết định bổ sung, SRS FR-001/FR-002/NFR-004/NFR-006 không tự mô tả toàn bộ policy này. 72 byte UTF-8 đã được người dùng chốt ngày2026-10-19; encoder/runtime còn NOT-TESTED.

| Điểm | Bằng chứng source tĩnh | SOURCE FACT / GAP / giới hạn | Test ID đề xuất |
|---|---|---|---|
| Frontend nhận input | [AuthPage.tsx:14](D:/SWP/storage-rental/frontend/src/features/identity/pages/AuthPage.tsx:14) FormData→Object.fromEntries, password/confirm input L115/L126 | FACT-SOURCE: không transform password trong submit đã đọc; trình duyệt thực tế NOT-TESTED | AUTH-PWD-01/02/05/08/10 |
| Frontend gửi JSON | [identity.api.ts:4](D:/SWP/storage-rental/frontend/src/features/identity/api/identity.api.ts:4) sendOtp/login; [http-client.ts:59](D:/SWP/storage-rental/frontend/src/shared/api/http-client.ts:59) json dùng JSON.stringify | FACT-SOURCE: adapter không trim; gửi raw giá trị từ object. Network runtime NOT-TESTED | AUTH-PWD-09/10 |
| Request DTO / setters | [RegisterRequest.java:79](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/dto/RegisterRequest.java:79) và L87; [LoginRequest.java:27](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/dto/LoginRequest.java:27) | FACT-SOURCE: gán raw password/confirm, không annotation deserializer riêng tại field; không có validation annotation ở DTO | AUTH-PWD-02/05/09 |
| Jackson, filter, binder | Tìm StringTrimmerEditor, @InitBinder, JsonDeserialize/JsonDeserializer, Jackson2ObjectMapperBuilderCustomizer, RequestBodyAdvice/ObjectMapper trong backend/src/main/java; đọc JwtAuthenticationFilter | FACT-SOURCE: không tìm thấy custom trimmer/deserializer trong phạm vi này; JWT filter không đọc/normalize credential body. UNKNOWN: effective runtime/library/global config ngoài phạm vi tìm, không khẳng định toàn bộ stack đã được đo | AUTH-PWD-09 |
| Validate / confirm | AuthService.java:311 (snapshot AuthService.java:311; xem delta implementation) | FACT-SOURCE: String.length>=6 trước trim; confirm raw equals khi nonnull; chưa có whitespace-only/UTF-8 byte bound riêng. Confirm missing hiện được bỏ qua; policy bắt buộc confirm server còn UNKNOWN | AUTH-PWD-01/02/05/06/07 |
| Pending OTP / verify | AuthService.java:331 (snapshot AuthService.java:331; xem delta implementation) và L353 | FACT-SOURCE: map theo cleanEmail giữ RegisterRequest, verify gọi registerUser rồi remove pending; không normalize password tại verify | AUTH-PWD-01/02/09/10; OTP-RACE-01 |
| BCrypt encode / entity | AuthService.java:403 (snapshot AuthService.java:403; xem delta implementation); [User.java:111](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/entity/User.java:111) | GAP-SOURCE: encode(password.trim()) thay đổi chuỗi; User.setPassword gán hash nhận được. Không log/hash plaintext trong tài liệu | AUTH-PWD-02/03/04/06/09/10 |
| Login | AuthService.java:118 (snapshot AuthService.java:118; xem delta implementation) và L143 | FACT-SOURCE: blank guard dùng trim().isEmpty() nhưng matches dùng credential nguyên gốc. INFERENCE: account đăng ký Pedge có thể nhận bản trim và từ chối original, ngược expected; chưa thực thi | AUTH-PWD-03/04/08/10 |
| Encoder/version | [SecurityConfig.java:112](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/SecurityConfig.java:112) new BCryptPasswordEncoder(); pom dùng dependency management Spring Boot | FACT-SOURCE: không explicit byte-bound trong path; UNKNOWN effective resolved version/behavior >72byte. Không chạy dependency resolution/build/test để xác minh | AUTH-PWD-07 NOT-TESTED |
| Seed | LocalDataInitializer.java:87 gọi encoder trực tiếp với literal fixture, không trim; chỉ kiểm đặc tính whitespace đầu/cuối tĩnh, không xuất literal | FACT-SOURCE: literal source đã kiểm không có whitespace ở hai đầu; UNKNOWN dữ liệu seed/runtime/legacy thực tế, không gọi initializer và không đọc DB | Fixture tiền kiểm AUTH-PWD, không proof runtime |

[FACT-DOC] Nhóm đầy đủ AUTH-PWD-01…10 nằm ở integrated plan mục10; tất cả NOT-TESTED, riêng07 thêm BLOCKED. P0/Pedge/Pinner/Pblank là ký hiệu synthetic RAM, không literal credential thật. Không dùng token cấp sau verify để chứng minh explicit login đã thành công.

[FACT-SOURCE] name chỉ trim; username/email trim+lowercase theo code hiện tại. [FACT-DOC] Chính sách cho non-password cần phân biệt từng trường và duyệt theo định danh sản phẩm; không dùng normalize chung cho password. Phone/CCCD validation normalization không tự chứng minh persistence đã normalize.

## 12. PIN — verify và update theo quyết định đã chốt

[FACT-DOC] P-PIN-20261018 là quyết định người dùng trong yêu cầu ngày 2026-10-18, bổ sung BR-006 đang chỉ ghi ACTIVE. Không sửa SRS và không coi quyết định này là source đã triển khai.

| Contract status | Điều kiện thời gian | Expected mở PIN | Expected đổi PIN | Source hiện tại |
|---|---|---|---|---|
| ACTIVE | Theo điều kiện nghiệp vụ hiện hành; fixture còn hạn hoặc đúng endAt | Cho phép khi các guard khác hợp lệ | Cho phép khi các guard khác hợp lệ | verify kiểm endAt; update không kiểm endAt |
| ACTIVE | now > endAt, status chưa đồng bộ | Từ chối theo endAt guard / yêu cầu kiểm hợp đồng hết hạn | TBD nhánh stale ACTIVE; không suy từ EXPIRING_SOON | verify=false; update vẫn có thể ghi |
| EXPIRING_SOON | now <= endAt | Cho phép | Cho phép | verify inclusive; update không time gate |
| EXPIRING_SOON | now > endAt, chưa OVERDUE | Từ chối | Từ chối | GAP-SOURCE: update có thể ghi |
| OVERDUE | Bất kỳ | Từ chối | Từ chối | Query chỉ ACTIVE/EXPIRING_SOON |
| TERMINATED | Bất kỳ | Từ chối | Từ chối | Query chỉ ACTIVE/EXPIRING_SOON |

[UNKNOWN] Chỉ đổi PIN của stale ACTIVE quá endAt, endAt NULL/độ chính xác/timezone và harness còn cần làm rõ. Không còn câu hỏi “EXPIRING_SOON có được dùng/đổi PIN không”. Bằng chứng handover vẫn theo B-SIGNATURE; sinh PIN không chứng minh khách đã xác nhận.

| Operation | Trace source | Authentication / expected side effect |
|---|---|---|
| Mở PIN | POST /api/contracts/verify-pin → ContractController.verify(Map unitCode,pin) → AccessCodeService.verify → ContractRepository.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc → contracts | CUSTOMER owner hoặc STAFF/FMANAGER branch; query ACTIVE/EXPIRING_SOON, endAt nonnull, now<=endAt, PIN đúng; HTTP200 authorized bool; không ghi/audit |
| Đổi PIN | PATCH /api/contracts/{unitCode}/pin → ContractController.pin(Map newPin) → AccessCodeService.update → ContractRepository + UnitRepository.lockByCode + AuditLogRepository | CUSTOMER owner; 6digits; source query ACTIVE/EXPIRING_SOON, không endAt guard; happy200 message/map. @Transactional ghi contracts.pin_code + units.pin_code + UPDATE_PIN audit; wrong owner/missing404, wrong role403, bad PIN400 |

[FACT-SOURCE] [ContractController.java:61](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/controller/ContractController.java:61) và [AccessCodeService.java:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57). B-PIN-STATUS không còn là câu hỏi quyền EXPIRING_SOON; được thay bằng B-PIN-ENDAT (gap implementation) và câu hỏi hẹp B-PIN-ACTIVE-EXPIRED. Source update có thể ghi khi EXPIRING_SOON đã quá endAt nếu guard khác hợp lệ; đây là INFERENCE về HTTP runtime từ source thiếu guard, chưa phải FAIL đã đo.

[FACT-DOC] PIN-OPEN-01…08 và PIN-CHANGE-01…09 kiểm độc lập trạng thái, before/equal/after endAt, actor; PIN-ATOMIC-01 kiểm Contract/Unit nhất quán/rollback. Mọi case NOT-TESTED; chỉ thiết kế/harness hoặc stale ACTIVE còn BLOCKED. Không có câu hỏi mở lại EXPIRING_SOON còn hạn. Contract.endAt NULL và dữ liệu có nhiều active contract cho cùng Unit cần G0/G2, không tạo giả lịch sử.

[FACT-DOC] Handover sinh Contract ACTIVE/PIN không phải bằng chứng consent; SIG-01…04 kiểm yêu cầu FR-016/BR-005 theo B-SIGNATURE. Không bắt buộc một endpoint Customer riêng. Chưa phê duyệt evidence thì acceptance consent BLOCKED, còn baseline Boolean guard hiện tại giữ riêng.

## 13. Truy vết các gap SRS đã biết sang acceptance mới

| Yêu cầu | Source behavior / gap | Oracle và case; execution |
|---|---|---|
| FR-001 trùng SĐT | Precheck chỉ username/email; phone constraint live UNKNOWN | SRS-REG-PHONE: từ chối tạo user trùng phone; status contract TBD, NOT-TESTED |
| FR-001/FR-002/AC-01 | verify auto-session và login đều navigate / | SRS-REG-NAV/SRS-LOGIN-NAV: về login sau register, landing đúng role sau login; route/auto-session detail TBD |
| BR-001 ACTIVE /24h | login loại LOCKED/DISABLED; JwtUtil default86400000ms, runtime UNKNOWN | SRS-LOGIN-ACTIVE/SRS-JWT-24H; chỉ ACTIVE; assert24h với harness/tolerance đã duyệt |
| BR-002/NFR-005/RBAC | Ops list403, get global; Admin RBAC raw— nhưng BR nói aggregate | SRS-RES-OPS/ADMIN/ISOLATION; Ops gap rõ, Admin raw-vs-aggregate BLOCKED |
| FR-013/FR-030/AC-05 | list không lọc ngày; system due now; dispatch chọn Staff, chưa nhận reservationId | SRS-TASK-TODAY/ASSIGNEE; today/đúng người đã rõ, reschedule/timezone/linkage/completion TBD |
| FR-014 | UI local search trên list; có id/phone, không CCCD; chưa lookup validity chuyên biệt | SRS-LOOKUP-ID/CCCD/PHONE: đúng đơn hợp lệ, Unit/branch; không tự tạo endpoint |
| FR-008/AC-02 | substring search không range/facet UI | SRS-CATALOG-FILTERS; không còn hỏi cần filter hay không; inclusive bounds/calendar TBD |
| FR-003 | client clear session; public không redirect; server revoke chưa có | SRS-LOGOUT-TARGET và G1/G4-LOGOUT giữ BLOCKED; không client-only PASS |
| FR-001 / race | map một pending/email; account save và OTP consume không atomic | G4-AUTH-RACE dùng different emails/same username; OTP-RACE-01 dùng một pending/hai verify; loser400/409/khác theo nhánh, không all409 |

[NOT-TESTED] 2026-10-19: chỉ cập nhật tài liệu, không gọi API/DB/SQL/test/build/startup hoặc kiểm mật khẩu thật. Gate G0–G4 không được thông qua từ static review.

## 14. Phần bổ sung 2026-10-19 — không biến minh họa thành kết quả

[FACT-DOC] Attachment bổ sung nhấn mạnh không normalize credential và không dùng normalize chung cho mọi field; AUTH-PWD-01…10 đã truy vết toàn chuỗi. Tài liệu bổ sung nêu max72byte/khuyến nghị NIST như lý do đề xuất, nhưng chưa có xác minh standard/encoder runtime trong scope static-only; không sao chép thành FACT-SOURCE hoặc chính sách72byte đã duyệt.

[UNKNOWN] B-INPUT-EXAMPLE: các dòng bảng minh họa bị mất dấu phân biệt raw/trim và hiển thị cùng chuỗi với outcome khác nhau. Dùng định nghĩa P0/Pedge/Pinner/Pblank không mơ hồ; không xuất credential literal. UX warning chỉ tùy chọn; fallback raw+trim/rehash legacy chỉ phương án tương lai chưa duyệt, không áp dụng vào expected hiện tại. Mã409 ví dụ trùng username không ghi đè source precheck400; race unique DB có thể409 theo nhánh.

## 15. Trace hiện tại sau auth change — nguồn mới, NOT-TESTED

| Bước | Source hiện tại | DB/response |
|---|---|---|
| Send OTP | RegistrationValidator.validateRegistrationData → PasswordPolicy(raw/confirm/72byte) → schema-reviewed/availability → AuthService.generateAndSendOtp | Read users chỉ sau schema guard; hash raw trước staging, không insert User; delivery response code chỉ test mock |
| Verify | AuthService.verifyOtpAndRegister → RegistrationAccountService.create @Transactional/saveAndFlush → consume challenge | users CUSTOMER/ACTIVE, phone/identity canonical, không trust facility từ client; RegistrationResult, không JWT/login history |
| Login | AuthService.login → ignore-case identity → BCrypt.matches(raw,stored) → ACTIVE/known role → history best-effort → JwtUtil | users read; login_history write; JWT24h + UserDto |
| Profile | GET /api/auth/me → JWT filter → ActorContext.current → UserDto | Authenticated ACTIVE profile; không write |
| Frontend | typed identity.api → đăng ký/OTP → /login; login → auth-navigation role page; minimal session/expiry | Không truy cập Supabase trực tiếp, không có DB/JWT/SMTP secret trong Vite |

[FACT-DOC] Contract mới có response riêng; schema Supabase chưa xác minh. Dùng [checkpoint](D:/SWP/storage-rental/docs/testing/auth-implementation-status.md) để phân biệt source mới với trace snapshot ở phần trên.
