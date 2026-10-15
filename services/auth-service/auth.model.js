/**
 * AUTH SERVICE - DATA MODEL
 * Định nghĩa cấu trúc tài khoản người dùng, tài khoản đăng nhập chuẩn và ma trận phân quyền RBAC
 */

const users = [
  {
    id: 'USR-01',
    name: 'Trần Văn Bảo',
    username: 'customer',
    password: '1',
    email: 'customer@selfstorage.vn',
    phone: '0987.654.321',
    cccd: '001202019988',
    role: 'CUSTOMER',
    roleTitle: 'Khách hàng thuê kho',
    facility: 'Hà Nội - Cầu Giấy',
    facilityCode: 'HN-CG',
    status: 'ACTIVE',
    createdAt: '2026-01-15'
  },
  {
    id: 'USR-02',
    name: 'Nguyễn Văn Tuấn',
    username: 'staff',
    password: '3',
    email: 'staff@selfstorage.vn',
    phone: '0912.345.678',
    cccd: '001201044556',
    role: 'STAFF',
    roleTitle: 'Nhân viên cơ sở',
    facility: 'Hà Nội - Cầu Giấy',
    facilityCode: 'HN-CG',
    status: 'ACTIVE',
    createdAt: '2026-01-10'
  },
  {
    id: 'USR-03',
    name: 'Lê Thị Mai',
    username: 'staff2',
    password: '3',
    email: 'mai.lt@selfstorage.vn',
    phone: '0903.112.233',
    cccd: '001203099881',
    role: 'STAFF',
    roleTitle: 'Nhân viên cơ sở',
    facility: 'Hà Nội - Cầu Giấy',
    facilityCode: 'HN-CG',
    status: 'ACTIVE',
    createdAt: '2026-02-01'
  },
  {
    id: 'USR-04',
    name: 'Phạm Hải Đăng',
    username: 'manager',
    password: '4',
    email: 'manager@selfstorage.vn',
    phone: '0934.567.890',
    cccd: '001200055443',
    role: 'FMANAGER',
    roleTitle: 'Quản lý cơ sở',
    facility: 'Hà Nội - Cầu Giấy',
    facilityCode: 'HN-CG',
    status: 'ACTIVE',
    createdAt: '2026-01-05'
  },
  {
    id: 'USR-05',
    name: 'Trần Quang Vinh',
    username: 'manager_q7',
    password: '4',
    email: 'vinh.tq@selfstorage.vn',
    phone: '0978.889.900',
    cccd: '079201088997',
    role: 'FMANAGER',
    roleTitle: 'Quản lý cơ sở',
    facility: 'TP.HCM - Quận 7',
    facilityCode: 'HCM-Q7',
    status: 'ACTIVE',
    createdAt: '2026-01-08'
  },
  {
    id: 'USR-06',
    name: 'Đặng Hoàng Long',
    username: 'business',
    password: '5',
    email: 'business@selfstorage.vn',
    phone: '0918.777.666',
    cccd: '001200011223',
    role: 'OPS_MGR',
    roleTitle: 'Quản lý vận hành toàn chuỗi',
    facility: 'Toàn hệ thống (HQ)',
    facilityCode: 'HQ',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  },
  {
    id: 'USR-07',
    name: 'Quản trị viên Hệ thống',
    username: 'admin',
    password: '2',
    email: 'admin@selfstorage.vn',
    phone: '0909.999.000',
    cccd: '001200000001',
    role: 'ADMIN',
    roleTitle: 'Quản trị hệ thống',
    facility: 'Toàn hệ thống (HQ)',
    facilityCode: 'HQ',
    status: 'ACTIVE',
    createdAt: '2026-01-01'
  },
  {
    id: 'USR-08',
    name: 'Nguyễn Kiều Oanh',
    username: 'oanhnguyen',
    password: '1',
    email: 'oanh.nk@gmail.com',
    phone: '0988.123.456',
    cccd: '079201998811',
    role: 'CUSTOMER',
    roleTitle: 'Khách hàng thuê kho',
    facility: 'TP.HCM - Quận 7',
    facilityCode: 'HCM-Q7',
    status: 'ACTIVE',
    createdAt: '2026-03-01'
  }
];

const loginHistory = [
  { id: 'LOG-01', username: 'admin', name: 'Quản trị viên Hệ thống', role: 'ADMIN', time: '2026-10-09 20:30:15', ip: '192.168.0.1', device: 'Chrome / Windows 11', status: 'SUCCESS' },
  { id: 'LOG-02', username: 'business', name: 'Đặng Hoàng Long', role: 'OPS_MGR', time: '2026-10-09 19:45:22', ip: '192.168.0.2', device: 'Edge / Windows 11', status: 'SUCCESS' },
  { id: 'LOG-03', username: 'manager', name: 'Phạm Hải Đăng', role: 'FMANAGER', time: '2026-10-09 18:12:40', ip: '192.168.1.12', device: 'Chrome / Windows 11', status: 'SUCCESS' },
  { id: 'LOG-04', username: 'staff', name: 'Nguyễn Văn Tuấn', role: 'STAFF', time: '2026-10-09 17:05:10', ip: '192.168.1.45', device: 'Firefox / Windows 11', status: 'SUCCESS' },
  { id: 'LOG-05', username: 'customer', name: 'Trần Văn Bảo', role: 'CUSTOMER', time: '2026-10-09 16:20:05', ip: '113.190.23.8', device: 'Safari / iPhone 15 Pro', status: 'SUCCESS' }
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

module.exports = { users, loginHistory, rbacMatrix };
