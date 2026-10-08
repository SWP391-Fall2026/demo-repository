/**
 * AUTH SERVICE - DATA MODEL
 * Định nghĩa cấu trúc tài khoản người dùng và ma trận phân quyền RBAC
 */

const users = [
  { id: 'USR-01', name: 'Trần Văn Bảo', email: 'baotran@gmail.com', phone: '0987.654.321', cccd: '001202019988', role: 'CUSTOMER', facility: 'Hà Nội - Cầu Giấy', status: 'ACTIVE' },
  { id: 'USR-02', name: 'Nguyễn Văn Tuấn', email: 'tuan.nv@selfstorage.vn', phone: '0912.345.678', cccd: '001201044556', role: 'STAFF', facility: 'Hà Nội - Cầu Giấy', status: 'ACTIVE' },
  { id: 'USR-03', name: 'Lê Thị Mai', email: 'mai.lt@selfstorage.vn', phone: '0903.112.233', cccd: '001203099881', role: 'STAFF', facility: 'Hà Nội - Cầu Giấy', status: 'ACTIVE' },
  { id: 'USR-04', name: 'Phạm Hải Đăng', email: 'dang.ph@selfstorage.vn', phone: '0934.567.890', cccd: '001200055443', role: 'FACILITY_MANAGER', facility: 'Hà Nội - Cầu Giấy', status: 'ACTIVE' },
  { id: 'USR-05', name: 'Trần Quang Vinh', email: 'vinh.tq@selfstorage.vn', phone: '0978.889.900', cccd: '079201088997', role: 'FACILITY_MANAGER', facility: 'TP.HCM - Quận 7', status: 'ACTIVE' },
  { id: 'USR-06', name: 'Đặng Hoàng Long', email: 'long.dh@selfstorage.vn', phone: '0918.777.666', cccd: '001200011223', role: 'OPS_MANAGER', facility: 'Toàn hệ thống (HQ)', status: 'ACTIVE' },
  { id: 'USR-07', name: 'Quản trị viên Hệ thống', email: 'admin@selfstorage.vn', phone: '0909.999.000', cccd: '001200000001', role: 'SYSTEM_ADMIN', facility: 'Toàn hệ thống (HQ)', status: 'ACTIVE' },
  { id: 'USR-08', name: 'Nguyễn Kiều Oanh', email: 'oanh.nk@gmail.com', phone: '0988.123.456', cccd: '079201998811', role: 'CUSTOMER', facility: 'TP.HCM - Quận 7', status: 'ACTIVE' }
];

const rbacMatrix = [
  { feature: 'Xem danh mục kho & bảng giá', customer: '✓ Toàn quyền', staff: '✓ Toàn quyền', fmanager: '✓ Toàn quyền', ops: '✓ Toàn quyền', admin: '✓ Toàn quyền' },
  { feature: 'Tạo đơn đặt giữ chỗ (Reservation)', customer: 'Của mình', staff: 'Xem', fmanager: 'Chi nhánh', ops: 'Toàn chuỗi', admin: '—' },
  { feature: 'Thanh toán cọc & cước định kỳ', customer: 'Của mình', staff: 'Ghi nhận tại quầy', fmanager: 'Xem chi nhánh', ops: 'Xem toàn chuỗi', admin: '—' },
  { feature: 'Check-in & Bàn giao kho', customer: 'Nhận bàn giao', staff: '✓ Toàn quyền', fmanager: 'Giám sát', ops: '—', admin: '—' },
  { feature: 'Quản lý kho đang thuê (Rented Units)', customer: 'Của mình', staff: 'Xem', fmanager: 'Chi nhánh', ops: 'Toàn chuỗi', admin: '—' },
  { feature: 'Nghiệm thu trả kho & Duyệt cọc', customer: 'Yêu cầu', staff: '✓ Kiểm tra', fmanager: '✓ Phê duyệt', ops: '—', admin: '—' },
  { feature: 'Phân công nhân viên ca trực', customer: '—', staff: 'Nhận việc', fmanager: '✓ Toàn quyền', ops: '—', admin: '—' },
  { feature: 'Thiết lập khung giá & biểu phí', customer: '—', staff: '—', fmanager: 'Đề xuất', ops: '✓ Toàn quyền', admin: '—' },
  { feature: 'Quản trị User & Phân vai trò (RBAC)', customer: '—', staff: '—', fmanager: '—', ops: '—', admin: '✓ Quản trị tối cao' },
  { feature: 'Xem nhật ký hệ thống (Audit Logs)', customer: '—', staff: '—', fmanager: '—', ops: '—', admin: '✓ Toàn quyền' }
];

module.exports = { users, rbacMatrix };
