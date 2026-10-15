1\. Màn hình chờ \& Trải nghiệm xem trước kho trước khi Đăng nhập / Đăng ký

Truy cập ban đầu: Khi mở liên kết trang web, người dùng vào ngay Trang chủ / Màn hình chờ (



SCR-C00

). Khách vãng lai có thể tự do cuộn xem giới thiệu, cơ sở vật chất, bảng giá các loại kho (Kho S, Kho M, Kho L, Kho XL).

Xem trước số lượng kho ở các nơi:

Đã tích hợp bộ công cụ "Xem trước số lượng phòng kho tại các cơ sở" (



index.html:L517

) kèm hàm cập nhật trực tiếp 



renderLandingBranchInventory

.

Người dùng có thể chọn bất kỳ chi nhánh nào: Hà Nội - Cầu Giấy, TP.HCM - Quận 7, Hà Nội - Nam Từ Liêm, TP.HCM - Tân Bình, Đà Nẵng - Hải Châu.

Hệ thống hiển thị số liệu tồn kho theo thời gian thực: Tổng số phòng, 🟢 Còn trống sẵn sàng, 🟡 Đang giữ chỗ, 🔴 Đang thuê cùng danh sách thẻ kho chi tiết theo từng tầng.

Xem chi tiết kho không cần đăng nhập:

Người dùng bấm nút "🔍 Chi tiết kho" trên bất kỳ phòng kho nào để mở Modal 



modalUnitDetail

&#x20;xem diện tích ($m^2$), thể tích ($m^3$), hệ thống khóa PIN điện tử, cảm biến nhiệt ẩm chống mốc và camera an ninh 24/7.

Cơ chế Chuyển sang Đăng Nhập / Đăng Ký khi muốn đặt kho:

Khi người dùng bấm "⚡ Đặt giữ chỗ" hoặc bấm "Đặt giữ chỗ ngay" từ modal chi tiết, hệ thống phát hiện khách chưa đăng nhập và lập tức chuyển sang màn hình Đăng Nhập / Đăng Ký (



SCR-AUTH

), đồng thời hiển thị thông báo hướng dẫn.

Lưu ý tiện ích: Hệ thống tự động ghi nhớ phòng kho mà khách đang định đặt (pendingReservationIntent). Ngay sau khi người dùng đăng nhập hoặc đăng ký xác minh xong, modal đặt giữ chỗ của chính phòng kho đó sẽ tự động mở lại để người dùng tiếp tục mà không cần tìm lại.

2\. Form Đăng Ký với đầy đủ 9 trường \& Bộ kiểm tra tính hợp lệ nghiêm ngặt

Tại tab Đăng Ký Tài Khoản (



index.html:L188

), form đã được thiết kế đầy đủ các trường kèm kiểm tra thời gian thực (



validateField

) và kiểm tra chéo ở Backend (



auth.service.js:validateRegistrationData

):



Trường thông tin	Ràng buộc kiểm tra tính hợp lệ

1\. Họ và tên	Bắt buộc (not null), 2 - 50 ký tự, hỗ trợ tiếng Việt có dấu, không chứa số hoặc ký tự đặc biệt.

2\. Ngày tháng năm sinh	Bắt buộc (not null), lịch chọn ngày, không được ở tương lai, bắt buộc từ đủ 18 tuổi trở lên (và $\\le 100$ tuổi).

3\. Giới tính	Bắt buộc (not null), dạng chọn Dropdown (Nam / Nữ).

4\. Số điện thoại	Bắt buộc (not null), 10 chữ số, đúng các đầu số nhà mạng chuẩn Việt Nam (03, 05, 07, 08, 09), chặn các dãy số ảo/lặp như 0123456789, 0999999999.

5\. Email	Bắt buộc (not null), định dạng chuẩn RFC, chặn các domain rác/ảo (fake.com, test.com, mailinator.com,...), kiểm tra không trùng lặp tài khoản.

6\. Số CCCD	Bắt buộc (not null), đúng 12 chữ số theo quy chuẩn Bộ Công An: kiểm tra 3 số đầu là mã tỉnh/thành phố hợp lệ (001 - 096), số thứ 4 khớp giới tính \& thế kỷ sinh (0/1 cho TK 20, 2/3 cho TK 21), 2 số tiếp theo khớp với năm sinh.

7\. Tên đăng nhập	Bắt buộc (not null), 4 - 20 ký tự (chữ, số, \_), không bắt đầu bằng chữ số, kiểm tra tính duy nhất.

8\. Mật khẩu	Bắt buộc (not null), ẩn thành dấu \*\*\* (type="password"), tối thiểu 6 ký tự, có icon mắt 👁️ để bật/tắt hiển thị khi cần.

9\. Xác nhận lại mật khẩu	Bắt buộc (not null), ẩn thành dấu \*\*\*, có icon mắt 👁️, bắt buộc phải trùng khớp 100% với Mật khẩu ở trên.

3\. Quy trình gửi và xác thực mã Email OTP

Gửi mã OTP:

Khi người dùng điền đầy đủ và bấm "Xác nhận \& Nhận mã xác minh Email →", hệ thống sinh mã OTP 6 chữ số ngẫu nhiên qua API 



POST /api/auth/send-otp

.

Modal Xác minh Email:

Popup Modal (



\#modalEmailVerify

) hiện lên với địa chỉ email đã đăng ký.

Hộp thư mô phỏng (Test/Demo): Hiển thị giao diện email gửi đến kèm mã OTP và nút "Nhập nhanh" giúp bạn kiểm tra thử nghiệm hoặc demo chấm điểm đồ án cực kỳ tiện lợi mà không sợ bị nghẽn mạng.

6 ô nhập mã OTP: Mỗi ô 1 ký tự số, tự động nhảy sang ô tiếp theo khi nhập, hỗ trợ phím Backspace lùi ô và hỗ trợ dán (Paste) cả chuỗi 6 số.

Tự động xác nhận: Khi nhập đủ 6 số, hệ thống tự động gọi xác minh qua 



POST /api/auth/verify-otp

.

Gửi lại mã: Có đồng hồ đếm ngược 60 giây và nút bấm gửi lại mã mới.

Kích hoạt tài khoản \& Tiếp tục luồng đặt kho:

Sau khi nhập đúng OTP, tài khoản được kích hoạt thành công (emailVerified: true), tự động đăng nhập vào hệ thống và quay lại hoàn tất việc đặt kho nếu trước đó đang bấm đặt dở.

4\. Các tệp đã được cập nhật trực tiếp tại thư mục dự án





index.html

: Bổ sung khu vực tra cứu tồn kho cơ sở trên landing page, cập nhật form 9 trường và modal nhập OTP 6 ô số.





css/style.css

: Thêm style cho icon ẩn/hiện mật khẩu, viền báo lỗi đỏ input và hiệu ứng các ô số OTP.





js/app.js

: Xử lý bộ lọc cơ sở, chặn truy cập chưa đăng nhập khi đặt kho, validate 9 trường dữ liệu và quản lý phiên OTP.

services/auth-service/auth.service.js

: Backend validation, danh mục 63 mã tỉnh thành CCCD theo Bộ Công An, cơ chế phát sinh \& kiểm tra OTP.





services/auth-service/index.js

: Endpoint REST API /send-otp, /verify-otp, /resend-otp.

