/**
 * ==============================================================================
 * SELFSTORAGE PRO - CORE APPLICATION JAVASCRIPT
 * Hệ thống Quản lý & Cho thuê Kho Lưu trữ Tự phục vụ
 * ==============================================================================
 */

// Application State & Backend Connection
const API_BASE = window.location.port === '8080' ? '' : 'http://localhost:8080';
let currentUser = null;
let currentActor = null; // 'CUSTOMER' | 'STAFF' | 'FMANAGER' | 'OPS_MGR' | 'ADMIN'
let currentScreen = 'SCR-C00';
let isPinVisible = false;
let keypadInput = '';
let selectedUnitForModal = null;
let paymentTimerInterval = null;
let pendingReservationIntent = null;
let currentPendingRegistration = null;
let otpCountdownInterval = null;

// Mock Units (Floor 1 - Area A, Cầu Giấy Branch)
let mockUnits = [
  { code: 'A-101', type: 'S', size: '2.0 m²', status: 'available', price: 800000, tenant: null, pin: '842916' },
  { code: 'A-102', type: 'M', size: '5.0 m²', status: 'reserved', price: 1450000, tenant: 'Trần Văn Bảo', pin: '842916' },
  { code: 'A-103', type: 'M', size: '5.0 m²', status: 'occupied', price: 1450000, tenant: 'Lê Hoàng Nam', pin: '771239' },
  { code: 'A-104', type: 'L', size: '10.0 m²', status: 'occupied', price: 2800000, tenant: 'Công ty Alpha Logistics', pin: '918234' },
  { code: 'A-105', type: 'S', size: '3.0 m²', status: 'available', price: 950000, tenant: null, pin: '842916' },
  { code: 'A-106', type: 'M', size: '5.0 m²', status: 'occupied', price: 1450000, tenant: 'Hoàng Minh Châu', pin: '629104' },
  { code: 'A-107', type: 'L', size: '12.0 m²', status: 'maintenance', price: 3200000, tenant: null, pin: '000000' },
  { code: 'A-108', type: 'M', size: '6.0 m²', status: 'cleaning', price: 1600000, tenant: null, pin: '000000' },
  { code: 'A-109', type: 'S', size: '2.5 m²', status: 'occupied', price: 850000, tenant: 'Phạm Thu Trang', pin: '512984' },
  { code: 'A-110', type: 'M', size: '5.0 m²', status: 'available', price: 1450000, tenant: null, pin: '842916' },
  { code: 'A-111', type: 'L', size: '10.0 m²', status: 'occupied', price: 2800000, tenant: 'Vũ Quốc Đạt', pin: '491204' },
  { code: 'A-112', type: 'M', size: '5.0 m²', status: 'available', price: 1450000, tenant: null, pin: '842916' },
  { code: 'A-113', type: 'L', size: '12.0 m²', status: 'occupied', price: 3200000, tenant: 'Công ty CP Đầu tư Á Châu', pin: '948123' },
  { code: 'A-114', type: 'S', size: '2.0 m²', status: 'available', price: 800000, tenant: null, pin: '842916' },
  { code: 'A-115', type: 'M', size: '5.0 m²', status: 'reserved', price: 1450000, tenant: 'Nguyễn Kiều Oanh', pin: '842916' },
  { code: 'A-116', type: 'S', size: '3.0 m²', status: 'cleaning', price: 950000, tenant: null, pin: '000000' },
  { code: 'A-117', type: 'L', size: '10.0 m²', status: 'available', price: 2800000, tenant: null, pin: '842916' },
  { code: 'A-118', type: 'M', size: '5.0 m²', status: 'available', price: 1450000, tenant: null, pin: '842916' }
];

// Mock Users Database (5 Required Accounts + Extras)
let mockUsers = [
  { id: 'USR-01', name: 'Trần Văn Bảo', dob: '1998-05-12', gender: 'Nam', username: 'customer', password: '1', email: 'customer@selfstorage.vn', phone: '0987.654.321', cccd: '001202019988', role: 'CUSTOMER', roleTitle: 'Khách hàng thuê kho', facility: 'Hà Nội - Cầu Giấy', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-02', name: 'Nguyễn Văn Tuấn', dob: '1994-08-20', gender: 'Nam', username: 'staff', password: '3', email: 'staff@selfstorage.vn', phone: '0912.345.678', cccd: '001201044556', role: 'STAFF', roleTitle: 'Nhân viên cơ sở', facility: 'Hà Nội - Cầu Giấy', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-03', name: 'Lê Thị Mai', dob: '1996-03-15', gender: 'Nữ', username: 'staff2', password: '3', email: 'mai.lt@selfstorage.vn', phone: '0903.112.233', cccd: '001203099881', role: 'STAFF', roleTitle: 'Nhân viên cơ sở', facility: 'Hà Nội - Cầu Giấy', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-04', name: 'Phạm Hải Đăng', dob: '1988-11-25', gender: 'Nam', username: 'manager', password: '4', email: 'manager@selfstorage.vn', phone: '0934.567.890', cccd: '001200055443', role: 'FMANAGER', roleTitle: 'Quản lý cơ sở', facility: 'Hà Nội - Cầu Giấy', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-05', name: 'Trần Quang Vinh', dob: '1990-07-10', gender: 'Nam', username: 'manager_q7', password: '4', email: 'vinh.tq@selfstorage.vn', phone: '0978.889.900', cccd: '079201088997', role: 'FMANAGER', roleTitle: 'Quản lý cơ sở', facility: 'TP.HCM - Quận 7', facilityCode: 'HCM-Q7', status: 'ACTIVE' },
  { id: 'USR-06', name: 'Đặng Hoàng Long', dob: '1985-02-18', gender: 'Nam', username: 'business', password: '5', email: 'business@selfstorage.vn', phone: '0918.777.666', cccd: '001200011223', role: 'OPS_MGR', roleTitle: 'Quản lý vận hành toàn chuỗi', facility: 'Toàn hệ thống (HQ)', facilityCode: 'HQ', status: 'ACTIVE' },
  { id: 'USR-07', name: 'Quản trị viên Hệ thống', dob: '1992-09-09', gender: 'Nam', username: 'admin', password: '2', email: 'admin@selfstorage.vn', phone: '0909.999.000', cccd: '001200000001', role: 'ADMIN', roleTitle: 'Quản trị hệ thống', facility: 'Toàn hệ thống (HQ)', facilityCode: 'HQ', status: 'ACTIVE' },
  { id: 'USR-08', name: 'Nguyễn Kiều Oanh', dob: '1999-12-05', gender: 'Nữ', username: 'oanhnguyen', password: '1', email: 'oanh.nk@gmail.com', phone: '0988.123.456', cccd: '079201998811', role: 'CUSTOMER', roleTitle: 'Khách hàng thuê kho', facility: 'TP.HCM - Quận 7', facilityCode: 'HCM-Q7', status: 'ACTIVE' }
];

// Mock Support Tickets
let mockSupportTickets = [
  { id: 'TCK-2026-01', unit: 'A-102', category: 'Kẹt khóa / Khóa cơ', priority: 'NORMAL', desc: 'Ổ khóa cơ hơi rít khi tra chìa vào buổi sáng sớm.', status: 'Đang xử lý', time: '10:15 Hôm nay' }
];

// Mock Audit Logs
let mockAuditLogs = [
  { time: '12:35:10 Hôm nay', user: 'Nguyễn Văn Tuấn', role: 'STAFF', action: 'HANDOVER_UNIT', detail: 'Hoàn tất bàn giao kho A-102 cho khách Trần Văn Bảo (RSV-8821)', ip: '192.168.1.45', status: 'SUCCESS' },
  { time: '12:15:02 Hôm nay', user: 'Trần Văn Bảo', role: 'CUSTOMER', action: 'PAYMENT_CONFIRM', detail: 'Thanh toán cọc 1.450.000 VNĐ qua VietQR TxID: 998124', ip: '113.190.23.8', status: 'SUCCESS' },
  { time: '11:50:40 Hôm nay', user: 'Phạm Hải Đăng', role: 'FACILITY_MGR', action: 'ASSIGN_UNIT', detail: 'Gán kho A-102 cho đơn đặt chỗ RSV-8821', ip: '192.168.1.12', status: 'SUCCESS' },
  { time: '10:30:15 Hôm nay', user: 'Trần Văn Bảo', role: 'CUSTOMER', action: 'CREATE_RESERVATION', detail: 'Tạo đơn đặt giữ chỗ Kho M (5.0m²) tại Cầu Giấy', ip: '113.190.23.8', status: 'SUCCESS' },
  { time: '09:40:22 Hôm nay', user: 'Đặng Hoàng Long', role: 'OPS_MGR', action: 'UPDATE_POLICY', detail: 'Cập nhật mức chiết khấu thuê 12 tháng lên 15%', ip: '192.168.0.2', status: 'SUCCESS' },
  { time: '08:15:00 Hôm nay', user: 'Quản trị viên Hệ thống', role: 'SYSTEM_ADMIN', action: 'USER_LOGIN', detail: 'Đăng nhập vào bảng điều khiển quản trị tập trung', ip: '192.168.0.1', status: 'SUCCESS' }
];

// Screen Catalog metadata strictly separated by Actor
const ACTOR_SCREENS = {
  CUSTOMER: [
    { id: 'SCR-C00', code: 'SCR-C00', name: 'Trang chủ & Giới thiệu', desc: 'Landing Page, danh mục gói kho & quy trình thuê 4 bước' },
    { id: 'SCR-C01', code: 'SCR-C01', name: 'Catalog & Bảng giá', desc: 'Xem cơ sở lưu trữ, loại kho, kích thước, giá thuê và kho khả dụng' },
    { id: 'SCR-C02', code: 'SCR-C02', name: 'Đặt giữ chỗ trực tuyến', desc: 'Chọn chi nhánh, loại kho, ngày bắt đầu, thời hạn thuê & tính cọc' },
    { id: 'SCR-C03', code: 'SCR-C03', name: 'Thanh toán các khoản phí', desc: 'Thanh toán tiền cọc, tiền thuê định kỳ, gia hạn, phụ phí qua VietQR' },
    { id: 'SCR-C04', code: 'SCR-C04', name: 'Thẻ hẹn Check-in Pass', desc: 'Thủ tục check-in nhận phòng kho bàn giao theo lịch hẹn' },
    { id: 'SCR-C05', code: 'SCR-C05', name: 'Quản lý kho đang thuê', desc: 'Quản lý các phòng kho đang thuê, xem & đổi mã PIN điện tử' },
    { id: 'SCR-C06', code: 'SCR-C06', name: 'Gửi yêu cầu hỗ trợ sự cố', desc: 'Gửi ticket hỗ trợ: ổ khóa, mã PIN, ẩm mốc, thanh toán, hàng hóa' }
  ],
  STAFF: [
    { id: 'SCR-S01', code: 'SCR-S01', name: 'Lịch công việc hàng ngày', desc: 'Theo dõi danh sách khách hẹn nhận kho, trả kho & sự cố ca trực' },
    { id: 'SCR-S02', code: 'SCR-S02', name: 'Kiểm tra đơn đặt chỗ', desc: 'Kiểm tra và xác thực đơn đặt giữ chỗ của khách hàng khi đến' },
    { id: 'SCR-S03', code: 'SCR-S03', name: 'Hỗ trợ check-in & Bàn giao', desc: 'Biên bản bàn giao kho, ổ khóa, thẻ từ hoặc mã truy cập PIN' },
    { id: 'SCR-S04', code: 'SCR-S04', name: 'Cập nhật trạng thái phòng kho', desc: 'Sơ đồ mặt bằng kho & cập nhật trạng thái kho tức thì' },
    { id: 'SCR-S05', code: 'SCR-S05', name: 'Kiểm tra & Nghiệm thu khi trả kho', desc: 'Kiểm tra và xác nhận tình trạng thực tế của phòng kho khi khách trả' },
    { id: 'SCR-S06', code: 'SCR-S06', name: 'Xử lý sự cố tại chỗ', desc: 'Tiếp nhận xử lý tại quầy: cấp mã PIN tạm, mất chìa, hư hại' },
    { id: 'SCR-S07', code: 'SCR-S07', name: 'Mô phỏng Mở khóa kho', desc: 'Bàn phím nhập mã PIN thực địa kiểm tra mở cửa' }
  ],
  FMANAGER: [
    { id: 'SCR-M01', code: 'SCR-M01', name: 'Tổng quan chi nhánh', desc: 'Dashboard điều hành cơ sở: 120 kho, 82% lấp đầy, 145M VNĐ' },
    { id: 'SCR-M02', code: 'SCR-M02', name: 'Quản lý kho tại chi nhánh', desc: 'Quản lý danh mục phòng kho: loại kho, kích thước, vị trí, giá, trạng thái' },
    { id: 'SCR-M03', code: 'SCR-M03', name: 'Gán phòng kho phù hợp', desc: 'Gán phòng kho trống phù hợp cho khách theo loại kho & thời hạn' },
    { id: 'SCR-M04', code: 'SCR-M04', name: 'Phân công nhân viên', desc: 'Phân công nhân viên cơ sở thực hiện hỗ trợ bàn giao, nghiệm thu, sự cố' },
    { id: 'SCR-M05', code: 'SCR-M05', name: 'Giám sát khách hàng & Hợp đồng', desc: 'Giám sát hợp đồng, thời hạn, thanh toán và xử lý quá hạn nợ cước' },
    { id: 'SCR-M06', code: 'SCR-M06', name: 'Báo cáo vận hành chi nhánh', desc: 'Xem báo cáo chi nhánh: kho trống, kho đang thuê, doanh thu, lấp đầy' }
  ],
  OPS_MGR: [
    { id: 'SCR-O01', code: 'SCR-O01', name: 'Tổng quan toàn chuỗi', desc: 'Dashboard 5 chi nhánh toàn quốc, 560 kho, 648M VNĐ/tháng' },
    { id: 'SCR-O02', code: 'SCR-O02', name: 'Quản lý chuỗi chi nhánh', desc: 'Quản lý danh sách tất cả các chi nhánh cơ sở kho toàn hệ thống' },
    { id: 'SCR-O03', code: 'SCR-O03', name: 'Khung giá & Phụ phí', desc: 'Quản lý khung giá thuê, biểu phí phụ, phí phạt, chiết khấu' },
    { id: 'SCR-O04', code: 'SCR-O04', name: 'Báo cáo toàn hệ thống & Xuất file', desc: 'Xem và xuất các báo cáo cấp hệ thống theo chi nhánh, doanh thu' },
    { id: 'SCR-O05', code: 'SCR-O05', name: 'Ban hành chính sách cho thuê', desc: 'Thiết lập chính sách tiền cọc, gia hạn, hủy đơn, trả kho, an toàn' }
  ],
  ADMIN: [
    { id: 'SCR-A01', code: 'SCR-A01', name: 'Tổng quan hệ thống', desc: 'Dashboard quản trị: 1.284 người dùng, 5 cơ sở, Uptime 99.98%' },
    { id: 'SCR-A02', code: 'SCR-A02', name: 'Quản trị tài khoản người dùng', desc: 'Danh sách người dùng: tạo mới, phân quyền, khóa/mở khóa tài khoản' },
    { id: 'SCR-A03', code: 'SCR-A03', name: 'Phân vai trò người dùng (Roles)', desc: 'Gán vai trò cho Customer, Staff, Facility Manager, Ops Manager' },
    { id: 'SCR-A04', code: 'SCR-A04', name: 'Cấu hình quyền truy cập dữ liệu', desc: 'Cấu hình quyền dữ liệu dựa trên vai trò & chi nhánh được phân công' },
    { id: 'SCR-A05', code: 'SCR-A05', name: 'Nhật ký hoạt động & Đăng nhập', desc: 'Theo dõi lịch sử đăng nhập và nhật ký hoạt động thời gian thực' }
  ]
};

// Role styling & display mappings
const ROLE_METADATA = {
  CUSTOMER: {
    title: 'Khách hàng thuê kho',
    badgeText: 'Khách hàng',
    color: '#2563eb',
    defaultScreen: 'SCR-C00'
  },
  STAFF: {
    title: 'Nhân viên cơ sở',
    badgeText: 'Nhân viên kho',
    color: '#0d9488',
    defaultScreen: 'SCR-S01'
  },
  FMANAGER: {
    title: 'Quản lý cơ sở',
    badgeText: 'Quản lý cơ sở',
    color: '#7c3aed',
    defaultScreen: 'SCR-M01'
  },
  OPS_MGR: {
    title: 'Quản lý vận hành toàn chuỗi',
    badgeText: 'GĐ Vận hành',
    color: '#ea580c',
    defaultScreen: 'SCR-O01'
  },
  ADMIN: {
    title: 'Quản trị hệ thống',
    badgeText: 'Quản trị viên',
    color: '#e11d48',
    defaultScreen: 'SCR-A01'
  }
};

// Aliases normalization
function normalizeRole(role) {
  if (!role) return 'CUSTOMER';
  const r = role.toUpperCase();
  if (r === 'FACILITY_MANAGER') return 'FMANAGER';
  if (r === 'OPS_MANAGER') return 'OPS_MGR';
  if (r === 'SYSTEM_ADMIN') return 'ADMIN';
  return r;
}

// ==============================================================================
// INITIALIZATION
// ==============================================================================

window.addEventListener('DOMContentLoaded', async () => {
  // Restore saved session or show login screen
  const savedSession = localStorage.getItem('selfstorage_auth_user');
  if (savedSession) {
    try {
      const user = JSON.parse(savedSession);
      applyUserSession(user);
    } catch (e) {
      applyLoggedOutState();
    }
  } else {
    applyLoggedOutState();
  }

  renderMatrixGrid();
  renderUserTable();
  renderAuditLogsTable();
  renderSupportTicketsTable();
  startPaymentCountdown();
  renderLandingBranchInventory('HN-CG');
});

// ==============================================================================
// AUTHENTICATION & SESSION MANAGEMENT
// ==============================================================================

function switchAuthTab(tab) {
  const isLogin = tab === 'LOGIN';
  document.getElementById('tabBtnLogin').classList.toggle('active', isLogin);
  document.getElementById('tabBtnRegister').classList.toggle('active', !isLogin);
  document.getElementById('authPanelLogin').style.display = isLogin ? 'block' : 'none';
  document.getElementById('authPanelRegister').style.display = isLogin ? 'none' : 'block';
  hideAuthAlert();
}

const VALID_PROVINCES = [
  '001','002','004','006','008','010','011','012','014','015','017','019',
  '020','022','024','025','026','027','030','031','033','034','035','036',
  '037','038','040','042','044','045','046','048','049','051','052','054',
  '056','058','060','062','064','066','067','068','070','072','074','075',
  '077','079','080','082','083','084','086','087','089','091','092','093',
  '094','095','096'
];

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function toggleLoginPassword() {
  togglePasswordVisibility('txtLoginPassword');
}

function showAuthAlert(msg) {
  const box = document.getElementById('authAlertBox');
  if (box) {
    box.innerText = msg;
    box.style.display = 'block';
  }
}

function hideAuthAlert() {
  const box = document.getElementById('authAlertBox');
  if (box) box.style.display = 'none';
}

function handleLoginFormSubmit(e) {
  if (e) e.preventDefault();
  const username = document.getElementById('txtLoginUsername').value.trim();
  const password = document.getElementById('txtLoginPassword').value.trim();
  executeLogin(username, password);
}

function quickFillAndLogin(username, password) {
  const uInput = document.getElementById('txtLoginUsername');
  const pInput = document.getElementById('txtLoginPassword');
  if (uInput) uInput.value = username;
  if (pInput) pInput.value = password;
  switchAuthTab('LOGIN');
  executeLogin(username, password);
}

async function executeLogin(username, password) {
  hideAuthAlert();
  if (!username || !password) {
    showAuthAlert('Thông tin không hợp lệ!');
    return;
  }

  // 1. Attempt API login
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.success && data.data) {
      applyUserSession(data.data);
      showToast(`🎉 ${data.message}`);
      addAuditLog(data.data.name, data.data.role, 'USER_LOGIN', `Đăng nhập thành công với tài khoản @${data.data.username}`);
      return;
    } else if (res.status === 401) {
      showAuthAlert('Thông tin không hợp lệ!');
      return;
    }
  } catch (err) {
    console.warn('[Auth] Server API offline, falling back to local database.');
  }

  // 2. Fallback to local user database
  const cleanU = username.toLowerCase();
  const cleanP = String(password);
  const found = mockUsers.find(u => 
    (u.username.toLowerCase() === cleanU || u.email.toLowerCase() === cleanU) &&
    String(u.password) === cleanP
  );

  if (!found) {
    showAuthAlert('Thông tin không hợp lệ!');
    return;
  }

  if (found.status === 'LOCKED') {
    showAuthAlert('🔒 Tài khoản của bạn đã bị khóa! Vui lòng liên hệ Quản trị viên hệ thống.');
    return;
  }

  applyUserSession(found);
  showToast(`🎉 Đăng nhập thành công! Chào mừng ${found.name} (${found.roleTitle || found.role})`);
  addAuditLog(found.name, found.role, 'USER_LOGIN', `Đăng nhập thành công với tài khoản @${found.username}`);
}

function setFieldError(fieldId, errorMsg) {
  const input = document.getElementById(fieldId);
  const errEl = document.getElementById('err' + fieldId.charAt(0).toUpperCase() + fieldId.slice(1));
  if (input) {
    if (errorMsg) {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
    } else {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
    }
  }
  if (errEl) {
    errEl.innerText = errorMsg || '';
    errEl.style.display = errorMsg ? 'block' : 'none';
  }
}

function validateField(fieldId) {
  const el = document.getElementById(fieldId);
  const val = (el ? el.value : '').trim();

  switch (fieldId) {
    case 'regFullName': {
      if (!val) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      if (val.length < 2 || val.length > 50) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;
      if (!nameRegex.test(val)) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regUsername': {
      if (!val) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      if (!/^[a-zA-Z0-9_]{4,20}$/.test(val)) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      if (/^[0-9]/.test(val)) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      const exists = mockUsers.some(u => u.username.toLowerCase() === val.toLowerCase());
      if (exists) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regDob': {
      if (!val) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      const bDate = new Date(val);
      const now = new Date();
      if (bDate > now) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      let age = now.getFullYear() - bDate.getFullYear();
      const m = now.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < bDate.getDate())) age--;
      if (age < 18 || age > 100) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regGender': {
      if (!val) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regPhone': {
      const cleanP = val.replace(/[\s.-]/g, '');
      if (!cleanP) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      if (!/^(03|05|07|08|09)[0-9]{8}$/.test(cleanP)) {
        setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false;
      }
      if (/^(\d)\1{9}$/.test(cleanP) || cleanP === '0123456789' || cleanP === '0987654321') {
        setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false;
      }
      setFieldError(fieldId, ''); return true;
    }
    case 'regEmail': {
      const cleanE = val.toLowerCase();
      if (!cleanE) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanE) || cleanE.includes('..')) {
        setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false;
      }
      const domain = cleanE.split('@')[1];
      if (['test.com', 'example.com', 'fake.com', 'mailinator.com', 'abc.xyz'].includes(domain)) {
        setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false;
      }
      const exists = mockUsers.some(u => u.email.toLowerCase() === cleanE);
      if (exists) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regCccd': {
      const cleanC = val.replace(/\s/g, '');
      if (!cleanC) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      if (!/^[0-9]{12}$/.test(cleanC)) {
        setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false;
      }
      const prov = cleanC.substring(0, 3);
      if (!VALID_PROVINCES.includes(prov)) {
        setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false;
      }
      // Cross validation with DOB & Gender
      const dobVal = document.getElementById('regDob')?.value;
      const genderVal = document.getElementById('regGender')?.value;
      if (dobVal && genderVal) {
        const bYear = new Date(dobVal).getFullYear();
        let expCode = -1;
        if (bYear >= 1900 && bYear <= 1999) expCode = (genderVal === 'Nam') ? 0 : 1;
        else if (bYear >= 2000 && bYear <= 2099) expCode = (genderVal === 'Nam') ? 2 : 3;
        const actualCode = parseInt(cleanC.charAt(3), 10);
        if (expCode !== -1 && actualCode !== expCode) {
          setFieldError(fieldId, 'Thông tin không hợp lệ!');
          return false;
        }
        const expYear = String(bYear).slice(-2);
        const actYear = cleanC.substring(4, 6);
        if (expYear !== actYear) {
          setFieldError(fieldId, 'Thông tin không hợp lệ!');
          return false;
        }
      }
      setFieldError(fieldId, ''); return true;
    }
    case 'regPassword': {
      if (!val) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      if (val.length < 6) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regPasswordConfirm': {
      const pw = document.getElementById('regPassword')?.value || '';
      if (!val) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      if (val !== pw) { setFieldError(fieldId, 'Thông tin không hợp lệ!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
  }
  return true;
}

function validateAllRegistrationFields() {
  const fields = ['regFullName', 'regUsername', 'regDob', 'regGender', 'regPhone', 'regEmail', 'regCccd', 'regPassword', 'regPasswordConfirm'];
  let allValid = true;
  let firstInvalid = null;

  for (const f of fields) {
    const isValid = validateField(f);
    if (!isValid) {
      allValid = false;
      if (!firstInvalid) firstInvalid = f;
    }
  }

  if (firstInvalid) {
    const el = document.getElementById(firstInvalid);
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return allValid;
}

async function handleRegisterFormSubmit(e) {
  if (e) e.preventDefault();
  hideAuthAlert();

  if (!validateAllRegistrationFields()) {
    showAuthAlert('Thông tin không hợp lệ!');
    return;
  }

  const name = document.getElementById('regFullName').value.trim();
  const username = document.getElementById('regUsername').value.trim().toLowerCase();
  const dob = document.getElementById('regDob').value;
  const gender = document.getElementById('regGender').value;
  const phone = document.getElementById('regPhone').value.trim().replace(/[\s.-]/g, '');
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const cccd = document.getElementById('regCccd').value.trim().replace(/\s/g, '');
  const facility = document.getElementById('regFacility').value;
  const password = document.getElementById('regPassword').value;

  const userData = { name, username, dob, gender, phone, email, cccd, facility, password };

  // Generate 6-digit OTP code
  const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  currentPendingRegistration = {
    userData,
    otpCode: generatedCode,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  // Try sending to backend service
  try {
    const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, confirmPassword: password })
    });
    const resData = await res.json();
    if (res.ok && resData.code) {
      currentPendingRegistration.otpCode = resData.code;
    }
  } catch (err) {
    console.warn('[Register] Send OTP API offline, using local verification.');
  }

  // Open OTP Modal
  openOtpVerificationModal(email, currentPendingRegistration.otpCode);
}

function openOtpVerificationModal(email, code) {
  document.getElementById('txtVerifyEmailTarget').innerText = email;
  document.getElementById('simulatedOtpCode').innerText = code;
  const alertBox = document.getElementById('otpErrorAlert');
  if (alertBox) alertBox.style.display = 'none';

  const inputs = document.querySelectorAll('.otp-digit-input');
  inputs.forEach(inp => {
    inp.value = '';
    inp.classList.remove('filled');
  });

  openModal('modalEmailVerify');
  setupOtpDigitInputs();
  startOtpCountdown(60);
  showToast(`📧 Đã gửi mã xác minh 6 số tới ${email}!`);
}

function setupOtpDigitInputs() {
  const inputs = document.querySelectorAll('.otp-digit-input');
  if (!inputs || inputs.length === 0) return;

  inputs.forEach((input, index) => {
    input.oninput = (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val ? val[val.length - 1] : '';
      if (val) {
        input.classList.add('filled');
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        } else {
          checkOtpAutoSubmit();
        }
      } else {
        input.classList.remove('filled');
      }
    };

    input.onkeydown = (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        inputs[index - 1].focus();
      }
    };

    input.onpaste = (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
      if (pasted) {
        for (let i = 0; i < inputs.length; i++) {
          if (pasted[i]) {
            inputs[i].value = pasted[i];
            inputs[i].classList.add('filled');
          }
        }
        const lastIdx = Math.min(pasted.length, inputs.length) - 1;
        inputs[lastIdx].focus();
        checkOtpAutoSubmit();
      }
    };
  });

  setTimeout(() => inputs[0].focus(), 150);
}

function autoFillOtp() {
  if (!currentPendingRegistration) return;
  const code = currentPendingRegistration.otpCode;
  const inputs = document.querySelectorAll('.otp-digit-input');
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].value = code[i] || '';
    inputs[i].classList.add('filled');
  }
  showToast('Đã tự động điền mã xác nhận!');
}

function checkOtpAutoSubmit() {
  const inputs = document.querySelectorAll('.otp-digit-input');
  let fullCode = '';
  inputs.forEach(inp => fullCode += (inp.value || ''));
  if (fullCode.length === 6) {
    setTimeout(submitOtpVerification, 200);
  }
}

async function submitOtpVerification() {
  const inputs = document.querySelectorAll('.otp-digit-input');
  let enteredCode = '';
  inputs.forEach(inp => enteredCode += (inp.value || '').trim());

  const alertBox = document.getElementById('otpErrorAlert');
  if (enteredCode.length !== 6) {
    if (alertBox) {
      alertBox.innerText = 'Thông tin không hợp lệ!';
      alertBox.style.display = 'block';
    }
    return;
  }

  if (!currentPendingRegistration) {
    if (alertBox) {
      alertBox.innerText = 'Thông tin không hợp lệ!';
      alertBox.style.display = 'block';
    }
    return;
  }

  if (Date.now() > currentPendingRegistration.expiresAt) {
    if (alertBox) {
      alertBox.innerText = 'Mã xác minh đã hết hạn!';
      alertBox.style.display = 'block';
    }
    return;
  }

  // 1. Try server OTP verification
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentPendingRegistration.userData.email,
        code: enteredCode
      })
    });
    const resData = await res.json();
    if (res.ok && resData.success && resData.data) {
      completeRegistrationSuccess(resData.data);
      return;
    } else if (!res.ok) {
      if (alertBox) {
        alertBox.innerText = resData.message || 'Thông tin không hợp lệ!';
        alertBox.style.display = 'block';
      }
      return;
    }
  } catch (err) {
    console.warn('[Register] Verify OTP API offline, using local verification.');
  }

  // 2. Local verification fallback
  if (enteredCode !== currentPendingRegistration.otpCode) {
    if (alertBox) {
      alertBox.innerText = 'Thông tin không hợp lệ!';
      alertBox.style.display = 'block';
    }
    return;
  }

  const u = currentPendingRegistration.userData;
  const newUser = {
    id: `USR-0${mockUsers.length + 1}`,
    name: u.name,
    dob: u.dob,
    gender: u.gender,
    username: u.username,
    password: u.password,
    email: u.email,
    phone: u.phone,
    cccd: u.cccd,
    role: 'CUSTOMER',
    roleTitle: 'Khách hàng thuê kho',
    facility: u.facility,
    facilityCode: 'HN-CG',
    status: 'ACTIVE',
    emailVerified: true
  };

  mockUsers.push(newUser);
  completeRegistrationSuccess(newUser);
}

function completeRegistrationSuccess(user) {
  closeModal('modalEmailVerify');
  clearInterval(otpCountdownInterval);
  currentPendingRegistration = null;

  applyUserSession(user);
  showToast(`🎉 Đăng ký & xác thực email thành công! Chào mừng ${user.name}`);
  addAuditLog(user.name, 'CUSTOMER', 'USER_REGISTER', `Đăng ký & xác thực thành công tài khoản @${user.username}`);
}

function startOtpCountdown(seconds = 60) {
  clearInterval(otpCountdownInterval);
  let remain = seconds;
  const countEl = document.getElementById('otpCountdown');
  const btnResend = document.getElementById('btnResendOtp');
  if (btnResend) btnResend.style.pointerEvents = 'none';

  if (countEl) countEl.innerText = remain;

  otpCountdownInterval = setInterval(() => {
    remain--;
    if (countEl) countEl.innerText = remain;
    if (remain <= 0) {
      clearInterval(otpCountdownInterval);
      if (btnResend) {
        btnResend.style.pointerEvents = 'auto';
        btnResend.innerHTML = 'Gửi lại mã mới';
      }
    }
  }, 1000);
}

async function resendOtpCode() {
  if (!currentPendingRegistration) return;
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  currentPendingRegistration.otpCode = newCode;
  currentPendingRegistration.expiresAt = Date.now() + 5 * 60 * 1000;

  document.getElementById('simulatedOtpCode').innerText = newCode;
  const alertBox = document.getElementById('otpErrorAlert');
  if (alertBox) alertBox.style.display = 'none';

  try {
    await fetch(`${API_BASE}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentPendingRegistration.userData.email })
    });
  } catch (err) {}

  startOtpCountdown(60);
  showToast('📬 Đã gửi lại mã xác minh mới vào email của bạn!');
}

function applyUserSession(user) {
  currentUser = user;
  currentActor = normalizeRole(user.role);
  localStorage.setItem('selfstorage_auth_user', JSON.stringify(user));

  const meta = ROLE_METADATA[currentActor] || ROLE_METADATA.CUSTOMER;

  // Update Header Elements
  const loggedOutSlot = document.getElementById('authLoggedOutSlot');
  const loggedInSlot = document.getElementById('authLoggedInSlot');
  const branchWrap = document.getElementById('headerBranchWrap');
  if (loggedOutSlot) loggedOutSlot.style.display = 'none';
  if (loggedInSlot) loggedInSlot.style.display = 'flex';
  if (branchWrap) branchWrap.style.display = (currentActor === 'CUSTOMER') ? 'none' : 'block';

  if (document.getElementById('txtUserName')) document.getElementById('txtUserName').innerText = user.name;
  if (document.getElementById('txtUserHandle')) document.getElementById('txtUserHandle').innerText = `@${user.username || 'user'}`;
  if (document.getElementById('txtUserRoleBadge')) document.getElementById('txtUserRoleBadge').innerText = meta.badgeText;
  if (document.getElementById('headerRoleIndicator')) document.getElementById('headerRoleIndicator').innerText = meta.title;

  const initials = getInitials(user.name);
  const avatar = document.getElementById('avatarInitials');
  if (avatar) {
    avatar.innerText = initials;
    avatar.style.background = meta.color;
  }

  const ddAvatar = document.getElementById('ddAvatar');
  if (ddAvatar) {
    ddAvatar.innerText = initials;
    ddAvatar.style.background = meta.color;
  }
  if (document.getElementById('ddUserName')) document.getElementById('ddUserName').innerText = user.name;
  if (document.getElementById('ddUserEmail')) document.getElementById('ddUserEmail').innerText = user.email || `${user.username}@selfstorage.vn`;
  if (document.getElementById('ddUserRoleText')) document.getElementById('ddUserRoleText').innerText = `Vai trò: ${meta.title}`;

  // Branch selector adjustment for staff/manager
  if (user.facility && document.getElementById('activeBranchSelect')) {
    const sel = document.getElementById('activeBranchSelect');
    for (let opt of sel.options) {
      if (opt.text.includes(user.facility) || user.facility.includes(opt.value)) {
        sel.value = opt.value;
        break;
      }
    }
  }

  renderAppNavLinks();

  // If user had a pending reservation intent, resume booking!
  if (pendingReservationIntent) {
    const { name, size, price } = pendingReservationIntent;
    pendingReservationIntent = null;
    navigateToScreen('SCR-C00');
    setTimeout(() => {
      openReservationModal(name, size, price);
      showToast(`Chào mừng ${user.name}! Bạn có thể tiếp tục hoàn tất đơn đặt kho.`);
    }, 400);
    return;
  }

  navigateToScreen(meta.defaultScreen);
}

function applyLoggedOutState() {
  currentUser = null;
  currentActor = null;
  localStorage.removeItem('selfstorage_auth_user');

  const loggedOutSlot = document.getElementById('authLoggedOutSlot');
  const loggedInSlot = document.getElementById('authLoggedInSlot');
  const branchWrap = document.getElementById('headerBranchWrap');
  if (loggedOutSlot) loggedOutSlot.style.display = 'flex';
  if (loggedInSlot) loggedInSlot.style.display = 'none';
  if (branchWrap) branchWrap.style.display = 'none';

  if (document.getElementById('headerRoleIndicator')) {
    document.getElementById('headerRoleIndicator').innerText = 'KHO ĐƠN | HỆ THỐNG KHO TỰ QUẢN';
  }

  renderAppNavLinks();
  navigateToScreen('SCR-C00');
}

function logoutUser() {
  if (currentUser) {
    addAuditLog(currentUser.name, currentActor, 'USER_LOGOUT', `Đăng xuất khỏi hệ thống (@${currentUser.username})`);
  }
  applyLoggedOutState();
  showToast('👋 Đã đăng xuất khỏi hệ thống thành công.');
}

function getInitials(name) {
  if (!name) return 'US';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// User Profile dropdown
function toggleUserDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('userRoleDropdownMenu');
  if (menu) menu.classList.toggle('show');
}

function closeUserDropdown() {
  const menu = document.getElementById('userRoleDropdownMenu');
  if (menu) menu.classList.remove('show');
}

document.addEventListener('click', (e) => {
  const trigger = document.getElementById('userRoleTrigger');
  const menu = document.getElementById('userRoleDropdownMenu');
  if (menu && menu.classList.contains('show')) {
    if (!menu.contains(e.target) && (!trigger || !trigger.contains(e.target))) {
      menu.classList.remove('show');
    }
  }
});

// ==============================================================================
// STRICT NAVIGATION & RBAC ROUTE GUARD
// ==============================================================================

function renderAppNavLinks() {
  const nav = document.getElementById('appNavLinks');
  if (!nav) return;

  if (!currentUser) {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-C00' ? 'active' : ''}" onclick="navigateToScreen('SCR-C00')">Trang chủ</span>
      <span class="nav-item-link" onclick="scrollToLandingSection('sectionBranchStockPreview')">Số lượng kho các nơi</span>
      <span class="nav-item-link" onclick="scrollToLandingSection('landing-pricing')">Bảng giá kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C01' ? 'active' : ''}" onclick="navigateToScreen('SCR-C01')">Tra cứu chi nhánh</span>
      <span class="nav-item-link" onclick="scrollToLandingSection('landing-facilities')">Cơ sở lưu trữ</span>
    `;
    return;
  }

  if (currentActor === 'CUSTOMER') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-C00' ? 'active' : ''}" onclick="navigateToScreen('SCR-C00')">Trang chủ</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C01' ? 'active' : ''}" onclick="navigateToScreen('SCR-C01')">Tìm kho & Bảng giá</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C02' ? 'active' : ''}" onclick="navigateToScreen('SCR-C02')">Đặt giữ chỗ</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C04' ? 'active' : ''}" onclick="navigateToScreen('SCR-C04')">Thẻ Check-in</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C05' ? 'active' : ''}" onclick="navigateToScreen('SCR-C05')">Kho của tôi & Mã PIN</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C06' ? 'active' : ''}" onclick="navigateToScreen('SCR-C06')">Hỗ trợ sự cố</span>
    `;
  } else if (currentActor === 'STAFF') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-S01' ? 'active' : ''}" onclick="navigateToScreen('SCR-S01')">Ca trực hôm nay</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S02' ? 'active' : ''}" onclick="navigateToScreen('SCR-S02')">Tra cứu đơn</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S03' ? 'active' : ''}" onclick="navigateToScreen('SCR-S03')">Bàn giao kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S04' ? 'active' : ''}" onclick="navigateToScreen('SCR-S04')">Sơ đồ mặt bằng</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S05' ? 'active' : ''}" onclick="navigateToScreen('SCR-S05')">Nghiệm thu trả kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S06' ? 'active' : ''}" onclick="navigateToScreen('SCR-S06')">Bàn sự cố</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S07' ? 'active' : ''}" onclick="navigateToScreen('SCR-S07')">Mở khóa số</span>
    `;
  } else if (currentActor === 'FMANAGER') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-M01' ? 'active' : ''}" onclick="navigateToScreen('SCR-M01')">Tổng quan cơ sở</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M02' ? 'active' : ''}" onclick="navigateToScreen('SCR-M02')">Quản lý kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M03' ? 'active' : ''}" onclick="navigateToScreen('SCR-M03')">Gán phòng kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M04' ? 'active' : ''}" onclick="navigateToScreen('SCR-M04')">Phân công việc</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M05' ? 'active' : ''}" onclick="navigateToScreen('SCR-M05')">Hợp đồng & Nợ</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M06' ? 'active' : ''}" onclick="navigateToScreen('SCR-M06')">Báo cáo vận hành</span>
    `;
  } else if (currentActor === 'OPS_MGR') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-O01' ? 'active' : ''}" onclick="navigateToScreen('SCR-O01')">Tổng quan chuỗi</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O02' ? 'active' : ''}" onclick="navigateToScreen('SCR-O02')">5 Chi nhánh</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O03' ? 'active' : ''}" onclick="navigateToScreen('SCR-O03')">Bảng giá & Cọc</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O04' ? 'active' : ''}" onclick="navigateToScreen('SCR-O04')">Báo cáo doanh thu</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O05' ? 'active' : ''}" onclick="navigateToScreen('SCR-O05')">Chính sách chung</span>
    `;
  } else if (currentActor === 'ADMIN') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-A01' ? 'active' : ''}" onclick="navigateToScreen('SCR-A01')">Tổng quan Admin</span>
      <span class="nav-item-link ${currentScreen === 'SCR-A02' ? 'active' : ''}" onclick="navigateToScreen('SCR-A02')">Tài khoản</span>
      <span class="nav-item-link ${currentScreen === 'SCR-A03' ? 'active' : ''}" onclick="navigateToScreen('SCR-A03')">Phân quyền RBAC</span>
      <span class="nav-item-link ${currentScreen === 'SCR-A04' ? 'active' : ''}" onclick="navigateToScreen('SCR-A04')">Gán cơ sở</span>
      <span class="nav-item-link ${currentScreen === 'SCR-A05' ? 'active' : ''}" onclick="navigateToScreen('SCR-A05')">Audit Logs</span>
    `;
  }
}

function openAuthScreen(tab = 'LOGIN') {
  navigateToScreen('SCR-AUTH');
  switchAuthTab(tab);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToLandingSection(sectionId) {
  if (currentScreen !== 'SCR-C00') {
    navigateToScreen('SCR-C00');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  } else {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

function navigateToScreen(screenId) {
  // Public screens for guests / non-logged-in
  if (!currentUser) {
    if (screenId === 'SCR-C00' || screenId === 'SCR-C01' || screenId === 'SCR-AUTH') {
      currentScreen = screenId;
      displayScreen(screenId);
      renderAppNavLinks();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (screenId === 'SCR-C02') {
      pendingReservationIntent = { name: 'Kho Tiêu Chuẩn M', size: '5.0 m²', price: 1450000 };
      showToast('ℹ️ Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt giữ chỗ!');
      openAuthScreen('LOGIN');
      showAuthAlert('Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt giữ chỗ kho!');
      return;
    }
    showToast('⚠️ Vui lòng đăng nhập để truy cập tính năng này!');
    openAuthScreen('LOGIN');
    return;
  }

  // Logged-in navigation to home or auth
  if (screenId === 'SCR-C00' || screenId === 'SCR-AUTH') {
    currentScreen = screenId;
    displayScreen(screenId);
    renderAppNavLinks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Route Guard check against ACTOR_SCREENS
  const allowedScreens = ACTOR_SCREENS[currentActor] || [];
  const isAllowed = allowedScreens.some(s => s.id === screenId);

  if (!isAllowed) {
    const meta = ROLE_METADATA[currentActor] || {};
    showToast(`⛔ Bạn không có quyền truy cập màn hình này! Tính năng này chỉ dành cho vai trò tương ứng.`);
    return;
  }

  currentScreen = screenId;
  displayScreen(screenId);
  renderAppNavLinks();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function displayScreen(screenId) {
  document.querySelectorAll('.screen-panel').forEach(panel => panel.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

function handleBranchChange(val) {
  showToast(`📍 Đã chọn cơ sở: ${val}`);
}

// ==============================================================================
// CUSTOMER ACTOR WORKFLOWS
// ==============================================================================

let currentDetailUnit = { name: 'Kho Tiêu Chuẩn Medium (M)', size: '5.0 m²', volume: '12.5 m³', price: 1450000 };

function openUnitDetailModal(name, size, volume, price) {
  currentDetailUnit = { name, size, volume, price };
  document.getElementById('mdlDetailUnitTitle').innerText = name;
  document.getElementById('mdlDetailSize').innerText = size;
  document.getElementById('mdlDetailVol').innerText = volume;
  document.getElementById('mdlDetailPrice').innerText = price.toLocaleString('vi-VN') + ' đ/tháng';
  openModal('modalUnitDetail');
}

function handleDetailModalBookNow() {
  if (currentDetailUnit) {
    openReservationModal(currentDetailUnit.name, currentDetailUnit.size, currentDetailUnit.price);
  } else {
    openReservationModal('Kho Tiêu Chuẩn Medium (M)', '5.0 m²', 1450000);
  }
}

function openReservationModal(name, size, price) {
  closeModal('modalUnitDetail');
  if (!currentUser) {
    pendingReservationIntent = { name, size, price };
    showToast('ℹ️ Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt giữ chỗ kho!');
    openAuthScreen('LOGIN');
    showAuthAlert(`Vui lòng đăng nhập hoặc đăng ký tài khoản để đặt: ${name} (${size})!`);
    return;
  }
  document.getElementById('mdlRsvUnitName').innerText = `${name} (${size})`;
  document.getElementById('mdlRsvPrice').innerText = price.toLocaleString('vi-VN') + ' đ/tháng';
  openModal('modalReservation');
}

// Data & Renderer: Real-time Branch Warehouse Inventory for Guest Explorer
const branchStockData = {
  'HN-CG': {
    name: 'Cơ sở Cầu Giấy (120 Duy Tân, Hà Nội)',
    total: 120,
    available: 34,
    reserved: 8,
    occupied: 78,
    units: [
      { code: 'CG-101', name: 'Kho Mini S', size: '2.0 m²', vol: '4.9 m³', price: 650000, stock: 12, floor: 'Tầng 1 (Khu A)' },
      { code: 'CG-102', name: 'Kho Tiêu Chuẩn M', size: '5.0 m²', vol: '12.5 m³', price: 1450000, stock: 14, floor: 'Tầng 1 (Khu A)' },
      { code: 'CG-205', name: 'Kho Lớn L', size: '10.0 m²', vol: '25.0 m³', price: 2800000, stock: 6, floor: 'Tầng 2 (Khu B)' },
      { code: 'CG-301', name: 'Kho Khoang Lớn XL', size: '16.0 m²', vol: '40.0 m³', price: 4200000, stock: 2, floor: 'Tầng trệt (Lối xe tải)' }
    ]
  },
  'HCM-Q7': {
    name: 'Cơ sở Quận 7 (Nguyễn Thị Thập, TP.HCM)',
    total: 150,
    available: 42,
    reserved: 10,
    occupied: 98,
    units: [
      { code: 'Q7-101', name: 'Kho Mini S', size: '2.0 m²', vol: '4.9 m³', price: 700000, stock: 16, floor: 'Tầng 1' },
      { code: 'Q7-105', name: 'Kho Tiêu Chuẩn M', size: '5.0 m²', vol: '12.5 m³', price: 1500000, stock: 18, floor: 'Tầng 1 - Khu mát' },
      { code: 'Q7-202', name: 'Kho Lớn L', size: '10.0 m²', vol: '25.0 m³', price: 2900000, stock: 6, floor: 'Tầng 2' },
      { code: 'Q7-308', name: 'Kho Doanh Nghiệp XL', size: '18.0 m²', vol: '45.0 m³', price: 4600000, stock: 2, floor: 'Tầng trệt' }
    ]
  },
  'HN-NTL': {
    name: 'Cơ sở Nam Từ Liêm (Khu Công Nghệ Cao, Hà Nội)',
    total: 110,
    available: 29,
    reserved: 5,
    occupied: 76,
    units: [
      { code: 'NTL-101', name: 'Kho Mini S', size: '2.0 m²', vol: '4.9 m³', price: 620000, stock: 10, floor: 'Tầng 1' },
      { code: 'NTL-104', name: 'Kho Tiêu Chuẩn M', size: '5.0 m²', vol: '12.5 m³', price: 1400000, stock: 12, floor: 'Tầng 1' },
      { code: 'NTL-201', name: 'Kho Lớn L', size: '10.0 m²', vol: '25.0 m³', price: 2700000, stock: 5, floor: 'Tầng 2' },
      { code: 'NTL-302', name: 'Kho Khoang Lớn XL', size: '16.0 m²', vol: '40.0 m³', price: 4100000, stock: 2, floor: 'Tầng trệt' }
    ]
  },
  'HCM-TB': {
    name: 'Cơ sở Tân Bình (Cộng Hòa / KCN Tân Bình, TP.HCM)',
    total: 140,
    available: 38,
    reserved: 7,
    occupied: 95,
    units: [
      { code: 'TB-101', name: 'Kho Mini S', size: '2.0 m²', vol: '4.9 m³', price: 680000, stock: 15, floor: 'Tầng 1' },
      { code: 'TB-106', name: 'Kho Tiêu Chuẩn M', size: '5.0 m²', vol: '12.5 m³', price: 1480000, stock: 14, floor: 'Tầng 1' },
      { code: 'TB-203', name: 'Kho Lớn L', size: '10.0 m²', vol: '25.0 m³', price: 2850000, stock: 7, floor: 'Tầng 2' },
      { code: 'TB-305', name: 'Kho Doanh Nghiệp XL', size: '16.0 m²', vol: '40.0 m³', price: 4300000, stock: 2, floor: 'Tầng trệt' }
    ]
  },
  'DN-HC': {
    name: 'Cơ sở Hải Châu (Nguyễn Văn Linh, Đà Nẵng)',
    total: 90,
    available: 24,
    reserved: 4,
    occupied: 62,
    units: [
      { code: 'HC-101', name: 'Kho Mini S', size: '2.0 m²', vol: '4.9 m³', price: 600000, stock: 8, floor: 'Tầng 1' },
      { code: 'HC-103', name: 'Kho Tiêu Chuẩn M', size: '5.0 m²', vol: '12.5 m³', price: 1350000, stock: 10, floor: 'Tầng 1' },
      { code: 'HC-201', name: 'Kho Lớn L', size: '10.0 m²', vol: '25.0 m³', price: 2600000, stock: 4, floor: 'Tầng 2' },
      { code: 'HC-301', name: 'Kho Khoang Lớn XL', size: '15.0 m²', vol: '38.0 m³', price: 3900000, stock: 2, floor: 'Tầng trệt' }
    ]
  }
};

function renderLandingBranchInventory(facilityCode = 'HN-CG') {
  const data = branchStockData[facilityCode] || branchStockData['HN-CG'];
  const statsBar = document.getElementById('landingBranchStatsBar');
  const unitsGrid = document.getElementById('landingBranchUnitsGrid');

  if (statsBar) {
    statsBar.innerHTML = `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 16px;">
        <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Tổng phòng kho</div>
        <div style="font-size:22px; font-weight:800; color:#0f172a; margin-top:2px;">${data.total} <span style="font-size:13px; font-weight:600; color:#64748b;">phòng</span></div>
      </div>
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px 16px;">
        <div style="font-size:11px; font-weight:700; color:#166534; text-transform:uppercase;">🟢 Còn trống sẵn sàng</div>
        <div style="font-size:22px; font-weight:800; color:#15803d; margin-top:2px;">${data.available} <span style="font-size:13px; font-weight:600; color:#166534;">kho</span></div>
      </div>
      <div style="background:#fefce8; border:1px solid #fef08a; border-radius:10px; padding:12px 16px;">
        <div style="font-size:11px; font-weight:700; color:#854d0e; text-transform:uppercase;">🟡 Khách đang giữ chỗ</div>
        <div style="font-size:22px; font-weight:800; color:#ca8a04; margin-top:2px;">${data.reserved} <span style="font-size:13px; font-weight:600; color:#854d0e;">kho</span></div>
      </div>
      <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:10px; padding:12px 16px;">
        <div style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase;">🔴 Đang cho thuê</div>
        <div style="font-size:22px; font-weight:800; color:#334155; margin-top:2px;">${data.occupied} <span style="font-size:13px; font-weight:600; color:#475569;">kho</span></div>
      </div>
    `;
  }

  if (unitsGrid) {
    unitsGrid.innerHTML = data.units.map(u => `
      <div class="ui-card" style="display:flex; flex-direction:column; justify-content:space-between; padding:18px; border:1px solid #e2e8f0; border-radius:12px; transition:transform 0.2s, box-shadow 0.2s; background:#ffffff;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:11px; font-weight:800; color:#2563eb; background:#eff6ff; padding:3px 8px; border-radius:6px; letter-spacing:0.5px;">${u.code}</span>
            <span class="badge badge-success" style="font-size:11px;">🟢 Còn ${u.stock} phòng</span>
          </div>
          <h4 style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px;">${u.name}</h4>
          <div style="font-size:12.5px; color:#64748b; margin-bottom:10px;">
            📐 Diện tích: <strong>${u.size}</strong> • Thể tích: <strong>${u.vol}</strong><br>
            📍 Vị trí: ${u.floor}
          </div>
          <div style="font-size:12px; color:#475569; display:flex; flex-direction:column; gap:3px; margin-bottom:14px; background:#f8fafc; padding:8px 10px; border-radius:8px;">
            <div>🔒 Khóa điện tử PIN + Chìa Titan</div>
            <div>❄️ Cảm biến ẩm 55-65% chống mốc</div>
            <div>🛡️ Camera bảo vệ trực diện 24/7</div>
          </div>
        </div>
        <div>
          <div style="margin-bottom:12px;">
            <span style="font-size:19px; font-weight:800; color:#1e40af;">${u.price.toLocaleString('vi-VN')} đ</span>
            <span style="font-size:12px; color:#64748b;">/tháng</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm" style="flex:1; justify-content:center; font-weight:700; padding:7px 8px; font-size:12px;" onclick="openUnitDetailModal('${u.name}', '${u.size}', '${u.vol}', ${u.price})">
              🔍 Chi tiết
            </button>
            <button class="btn btn-primary btn-sm" style="flex:1; justify-content:center; font-weight:700; padding:7px 8px; font-size:12px;" onclick="openReservationModal('${u.name}', '${u.size}', ${u.price})">
              ⚡ Đặt kho
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function calculateCost() {
  const dur = parseInt(document.getElementById('rsvDuration').value);
  const baseMonthly = 1450000;
  let discountRate = 0;
  if (dur === 3) discountRate = 0.05;
  else if (dur === 6) discountRate = 0.10;
  else if (dur === 12) discountRate = 0.15;

  const discountAmt = Math.round(baseMonthly * dur * discountRate);
  document.getElementById('sumDuration').innerText = dur + ' Tháng';
  document.getElementById('sumDiscount').innerText = '- ' + discountAmt.toLocaleString('vi-VN') + ' đ';
  document.getElementById('sumDeposit').innerText = baseMonthly.toLocaleString('vi-VN') + ' đ';
  document.getElementById('sumPayNow').innerText = baseMonthly.toLocaleString('vi-VN') + ' đ';
}

function confirmReservation() {
  closeModal('modalReservation');
  navigateToScreen('SCR-C03');
  setPaymentType('DEPOSIT');
  showToast('Đã tạo đơn đặt chỗ RSV-8821! Đang chuyển sang cổng thanh toán VietQR...');
  if (currentUser) {
    addAuditLog(currentUser.name, 'CUSTOMER', 'CREATE_RESERVATION', 'Tạo đơn đặt giữ chỗ Kho M (5.0m²) tại Cầu Giấy');
  }
}

function setPaymentType(type) {
  const title = document.getElementById('lblInvoiceTitle');
  const item = document.getElementById('tblInvoiceItemName');
  const total = document.getElementById('tblInvoiceTotal');
  const amt = document.getElementById('tblInvoiceAmount');
  const qrDesc = document.getElementById('qrTransferContent');

  if (type === 'DEPOSIT') {
    title.innerText = 'Hóa đơn tiền cọc giữ chỗ (Security Deposit)';
    item.innerText = 'Tiền cọc bảo đảm phòng kho Medium 5.0m² (Mã đơn: RSV-8821)';
    total.innerText = '1.450.000 đ';
    amt.innerText = '1.450.000 đ';
    qrDesc.innerText = 'TT COC RSV 8821';
  } else if (type === 'RENT') {
    title.innerText = 'Hóa đơn cước thuê phòng kho kỳ đầu';
    item.innerText = 'Tiền thuê tháng đầu tiên (Tháng 10/2026 - Unit A-102)';
    total.innerText = '1.450.000 đ';
    amt.innerText = '1.450.000 đ';
    qrDesc.innerText = 'THUE THANG 10 UNIT A102';
  } else if (type === 'RENEW') {
    title.innerText = 'Hóa đơn gia hạn hợp đồng thuê kho';
    item.innerText = 'Gia hạn thêm 01 tháng sử dụng (Unit A-102)';
    total.innerText = '1.450.000 đ';
    amt.innerText = '1.450.000 đ';
    qrDesc.innerText = 'GIA HAN UNIT A102';
  } else if (type === 'EXTRA') {
    title.innerText = 'Hóa đơn phụ phí dịch vụ phát sinh';
    item.innerText = 'Phí vệ sinh chuyên sâu & thay ổ khóa cơ mới';
    total.innerText = '200.000 đ';
    amt.innerText = '200.000 đ';
    qrDesc.innerText = 'PHU PHI UNIT A102';
  }
}

function startPaymentCountdown() {
  let timeLeft = 15 * 60; // 15 mins
  if (paymentTimerInterval) clearInterval(paymentTimerInterval);
  paymentTimerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(paymentTimerInterval);
      return;
    }
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const el = document.getElementById('paymentCountdown');
    if (el) el.innerText = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }, 1000);
}

function simulatePaymentSuccess() {
  showToast('🎉 Giao dịch thành công! Mã giao dịch Napas: TXN-998124');
  const uName = currentUser ? currentUser.name : 'Trần Văn Bảo';
  addAuditLog(uName, 'CUSTOMER', 'PAYMENT_CONFIRM', 'Thanh toán cọc 1.450.000 VNĐ qua VietQR');
  setTimeout(() => {
    navigateToScreen('SCR-C04');
    showToast('Đã phát hành Thẻ hẹn Check-in nhận kho Unit A-102!');
  }, 1000);
}

function togglePinVisibility() {
  isPinVisible = !isPinVisible;
  const box = document.getElementById('pinDisplayBox');
  const btn = document.getElementById('btnPinEyeText');
  if (isPinVisible) {
    box.innerText = '8 4 2 9 1 6';
    box.style.color = '#10b981';
    btn.innerText = '🔒 Ẩn mã PIN';
  } else {
    box.innerText = '● ● ● ● ● ●';
    box.style.color = '#38bdf8';
    btn.innerText = '👁️ Hiện mã PIN';
  }
}

function copyPinCode() {
  navigator.clipboard.writeText('842916').then(() => {
    showToast('Đã sao chép mã PIN: 842916');
  }).catch(() => {
    showToast('Đã sao chép mã PIN: 842916');
  });
}

function openChangePinModal() {
  openModal('modalChangePin');
}

function saveNewPin() {
  const p1 = document.getElementById('txtNewPin').value;
  const p2 = document.getElementById('txtConfirmPin').value;
  if (p1.length !== 6 || p1 !== p2) {
    alert('Mã PIN phải gồm đúng 6 chữ số và hai lần nhập phải giống nhau!');
    return;
  }
  closeModal('modalChangePin');
  showToast('Đã đổi mã PIN mới thành công! Hệ thống khóa đã được đồng bộ.');
  const uName = currentUser ? currentUser.name : 'Trần Văn Bảo';
  addAuditLog(uName, 'CUSTOMER', 'UPDATE_PIN', 'Đổi mã PIN điện tử kho Unit A-102');
}

function openRenewalModal(unit) {
  navigateToScreen('SCR-C03');
  setPaymentType('RENEW');
  showToast(`Mở hóa đơn gia hạn cho phòng kho ${unit}!`);
}

function openCheckoutRequestModal(unit) {
  if (confirm(`Bạn có chắc chắn muốn gửi yêu cầu trả phòng kho ${unit}? Lịch hẹn nghiệm thu sẽ được chuyển đến Nhân viên ca trực.`)) {
    showToast(`Đã gửi yêu cầu trả kho ${unit}! Vui lòng mang đủ chìa và thẻ từ đến bàn giao.`);
    const uName = currentUser ? currentUser.name : 'Trần Văn Bảo';
    addAuditLog(uName, 'CUSTOMER', 'REQUEST_CHECKOUT', `Yêu cầu trả phòng kho ${unit}`);
  }
}

function submitSupportTicket() {
  const desc = document.getElementById('ticketDesc').value.trim();
  const unit = document.getElementById('ticketUnitSelect') ? document.getElementById('ticketUnitSelect').value : 'A-102';
  const category = document.getElementById('ticketCategorySelect') ? document.getElementById('ticketCategorySelect').value : 'Ổ khóa cơ';
  
  if (!desc) {
    alert('Vui lòng nhập mô tả chi tiết sự cố cần hỗ trợ!');
    return;
  }

  const newTicket = {
    id: `TCK-2026-0${mockSupportTickets.length + 1}`,
    unit,
    category,
    priority: 'NORMAL',
    desc,
    status: 'Đang xử lý',
    time: 'Vừa xong'
  };

  mockSupportTickets.unshift(newTicket);
  renderSupportTicketsTable();

  document.getElementById('ticketDesc').value = '';
  showToast('Phiếu hỗ trợ đã được tạo và chuyển đến Nhân viên ca trực!');
  const uName = currentUser ? currentUser.name : 'Trần Văn Bảo';
  addAuditLog(uName, 'CUSTOMER', 'CREATE_TICKET', `Báo cáo sự cố ${category} tại phòng ${unit}`);
}

function renderSupportTicketsTable() {
  const tbody = document.getElementById('tblSupportTicketsBody');
  if (!tbody) return;
  tbody.innerHTML = mockSupportTickets.map(t => `
    <tr>
      <td><span class="code-display">${t.id}</span></td>
      <td><strong>${t.unit}</strong></td>
      <td>${t.category}</td>
      <td>${t.desc}</td>
      <td><span class="badge badge-warning">${t.status}</span></td>
      <td style="font-size:12px; color:#64748b;">${t.time}</td>
    </tr>
  `).join('');
}

// ==============================================================================
// FACILITY STAFF WORKFLOWS
// ==============================================================================

function switchStaffTaskTab(tab) {
  document.getElementById('queueCheckinTable').style.display = tab === 'CHECKIN' ? 'block' : 'none';
  document.getElementById('queueReturnTable').style.display = tab === 'RETURN' ? 'block' : 'none';
  document.getElementById('queueSupportTable').style.display = tab === 'SUPPORT' ? 'block' : 'none';

  document.getElementById('btnTaskCheckin').classList.toggle('btn-primary', tab === 'CHECKIN');
  document.getElementById('btnTaskCheckin').classList.toggle('btn-outline', tab !== 'CHECKIN');
  document.getElementById('btnTaskReturn').classList.toggle('btn-primary', tab === 'RETURN');
  document.getElementById('btnTaskReturn').classList.toggle('btn-outline', tab !== 'RETURN');
  document.getElementById('btnTaskSupport').classList.toggle('btn-primary', tab === 'SUPPORT');
  document.getElementById('btnTaskSupport').classList.toggle('btn-outline', tab !== 'SUPPORT');
}

function startCheckinForCustomer(rsv, cust, unit) {
  navigateToScreen('SCR-S02');
  const input = document.getElementById('txtSearchReservation');
  if (input) input.value = rsv;
  showToast(`Đang tra cứu hồ sơ đơn đặt chỗ ${rsv} của khách ${cust}...`);
}

function lookupReservation() {
  showToast('Xác thực hồ sơ đơn đặt RSV-8821 thành công! Đủ điều kiện nhận bàn giao kho.');
}

function completeHandoverProtocol() {
  const target = mockUnits.find(u => u.code === 'A-102');
  if (target) {
    target.status = 'occupied';
    target.tenant = 'Trần Văn Bảo';
  }
  renderMatrixGrid();

  showToast('🎉 Hoàn tất Bàn giao kho! Hợp đồng CTR-2026-001 chính thức có hiệu lực.');
  const uName = currentUser ? currentUser.name : 'Nguyễn Văn Tuấn';
  addAuditLog(uName, 'STAFF', 'HANDOVER_COMPLETE', 'Hoàn tất bàn giao Unit A-102 cho Trần Văn Bảo');

  setTimeout(() => {
    navigateToScreen('SCR-S04');
    showToast('Phòng A-102 đã chuyển sang trạng thái: OCCUPIED (Đang thuê)');
  }, 1000);
}

function completeReturnInspection() {
  const target = mockUnits.find(u => u.code === 'A-102');
  if (target) {
    target.status = 'cleaning';
    target.tenant = null;
  }
  renderMatrixGrid();

  showToast('Xác nhận Nghiệm thu thành công! Hoàn trả cọc 1.500.000đ về MBBank của khách.');
  const uName = currentUser ? currentUser.name : 'Nguyễn Văn Tuấn';
  addAuditLog(uName, 'STAFF', 'RETURN_INSPECTION', 'Nghiệm thu trả kho Unit A-102 & duyệt hoàn cọc');

  setTimeout(() => {
    navigateToScreen('SCR-S04');
    showToast('Phòng A-102 đã chuyển sang trạng thái: CLEANING (Đang vệ sinh)');
  }, 1000);
}

function openEmergencyPinModal() {
  const tempPin = Math.floor(100000 + Math.random() * 900000);
  alert(`[GIAO THỨC KHẨN CẤP TẠI QUẦY]\nMã PIN tạm thời hiệu lực 60 phút cho khách là: ${tempPin}\nHệ thống đã gửi SMS tới số điện thoại chính chủ.`);
  showToast(`Đã cấp mã PIN tạm thời: ${tempPin} (Hiệu lực 60 phút)`);
  const uName = currentUser ? currentUser.name : 'Nguyễn Văn Tuấn';
  addAuditLog(uName, 'STAFF', 'EMERGENCY_PIN', `Cấp mã PIN tạm thời 60p cho Unit A-102`);
}

function openLostKeyModal() {
  if (confirm('Lập biên bản mất chìa khóa cơ, thu phụ phí thay ổ khóa mới 150.000 VNĐ?')) {
    showToast('Đã lập biên bản mất chìa và phân công kỹ thuật thay ổ khóa mới!');
    const uName = currentUser ? currentUser.name : 'Nguyễn Văn Tuấn';
    addAuditLog(uName, 'STAFF', 'LOST_KEY_PROTOCOL', 'Thu phụ phí 150.000đ và thay khóa Unit A-102');
  }
}

// Matrix Grid Renderer (Floor 1 - Area A)
function renderMatrixGrid() {
  const container = document.getElementById('matrixGridContainer');
  if (!container) return;

  container.innerHTML = mockUnits.map(u => {
    let badgeText = 'Trống';
    if (u.status === 'occupied') badgeText = 'Đang dùng';
    else if (u.status === 'reserved') badgeText = 'Đã đặt';
    else if (u.status === 'maintenance') badgeText = 'Bảo trì';
    else if (u.status === 'cleaning') badgeText = 'Vệ sinh';

    return `
      <div class="matrix-cell ${u.status}" onclick="openUnitStatusModal('${u.code}')">
        <div style="font-weight:800; font-size:15px; margin-bottom:2px;">${u.code}</div>
        <div style="font-size:11px; opacity:0.85;">${u.size}</div>
        <div style="font-size:10px; font-weight:700; text-transform:uppercase; margin-top:4px;">${badgeText}</div>
      </div>
    `;
  }).join('');
}

function openUnitStatusModal(code) {
  selectedUnitForModal = mockUnits.find(u => u.code === code);
  if (!selectedUnitForModal) return;

  document.getElementById('mdlUnitStatusTitle').innerText = `Cập nhật Trạng thái Phòng Kho ${code}`;
  document.getElementById('mdlUnitStatusName').innerText = `Phòng ${code} (${selectedUnitForModal.size} - Gói ${selectedUnitForModal.type})`;
  document.getElementById('selUnitNewStatus').value = selectedUnitForModal.status.toUpperCase();
  openModal('modalUnitStatus');
}

function saveUnitStatusChange() {
  if (!selectedUnitForModal) return;
  const newStatus = document.getElementById('selUnitNewStatus').value.toLowerCase();
  selectedUnitForModal.status = newStatus;
  renderMatrixGrid();
  closeModal('modalUnitStatus');
  showToast(`Đã cập nhật trạng thái kho ${selectedUnitForModal.code} thành: ${newStatus.toUpperCase()}`);
  const uName = currentUser ? currentUser.name : 'Nhân viên';
  addAuditLog(uName, currentActor || 'STAFF', 'UPDATE_UNIT_STATUS', `Cập nhật trạng thái Unit ${selectedUnitForModal.code} -> ${newStatus}`);
}

// Keypad Simulator (SCR-S07)
function typeKeypadDigit(digit) {
  if (keypadInput.length < 6) {
    keypadInput += digit;
    updateKeypadDisplay();
  }
}

function clearKeypad() {
  keypadInput = '';
  updateKeypadDisplay();
  const el = document.getElementById('keypadStatusResult');
  if (el) el.innerHTML = '';
}

function updateKeypadDisplay() {
  const display = document.getElementById('keypadScreenDisplay');
  if (!display) return;
  display.innerText = !keypadInput ? '------' : keypadInput.padEnd(6, '-');
}

function submitKeypadPin() {
  const result = document.getElementById('keypadStatusResult');
  if (!result) return;
  if (keypadInput === '842916' || keypadInput === '894210') {
    result.innerHTML = `
      <div style="background:#ecfdf5; border:1px solid #10b981; border-radius:10px; padding:16px; text-align:center; color:#047857; margin-top:16px;">
        <div style="font-size:24px; font-weight:800; margin-bottom:4px;">🔓 ACCESS GRANTED</div>
        <div style="font-size:13px; font-weight:600;">Khóa điện tử Unit A-102 đã mở! Thời gian mở cửa: 05:00</div>
      </div>
    `;
    showToast('🔓 Cửa kho mở thành công!');
  } else {
    result.innerHTML = `
      <div style="background:#fef2f2; border:1px solid #ef4444; border-radius:10px; padding:16px; text-align:center; color:#b91c1c; margin-top:16px;">
        <div style="font-size:24px; font-weight:800; margin-bottom:4px;">🔒 ACCESS DENIED</div>
        <div style="font-size:13px; font-weight:600;">Mã PIN không chính xác hoặc đã hết hiệu lực!</div>
      </div>
    `;
    showToast('❌ Mã PIN không đúng! Vui lòng thử lại.');
  }
}

// ==============================================================================
// FACILITY MANAGER WORKFLOWS
// ==============================================================================

function assignUnitToReservation(rsvId, unitCode) {
  const target = mockUnits.find(u => u.code === unitCode);
  if (target) {
    target.status = 'reserved';
    target.tenant = 'Trần Văn Bảo';
    renderMatrixGrid();
  }
  showToast(`Đã gán phòng kho ${unitCode} cho đơn đặt chỗ ${rsvId}! Khách hàng đã nhận được thông báo.`);
  const uName = currentUser ? currentUser.name : 'Phạm Hải Đăng';
  addAuditLog(uName, 'FACILITY_MGR', 'ASSIGN_UNIT', `Gán kho ${unitCode} cho đơn đặt chỗ ${rsvId}`);
}

function dispatchStaffTask() {
  const taskName = document.getElementById('txtTaskTitle').value.trim();
  const staffName = document.getElementById('selTaskStaff').value;
  if (!taskName) {
    alert('Vui lòng nhập tên công việc!');
    return;
  }
  showToast(`Đã phân công việc "${taskName}" cho nhân viên ${staffName}!`);
  const uName = currentUser ? currentUser.name : 'Phạm Hải Đăng';
  addAuditLog(uName, 'FACILITY_MGR', 'DISPATCH_TASK', `Phân công việc "${taskName}" cho ${staffName}`);
  document.getElementById('txtTaskTitle').value = '';
}

function submitCreateUnitByManager() {
  const code = document.getElementById('txtNewUnitCode').value.trim().toUpperCase();
  const type = document.getElementById('selNewUnitType').value;
  const size = parseFloat(document.getElementById('txtNewUnitSize').value) || 5.0;
  const price = parseInt(document.getElementById('txtNewUnitPrice').value) || 1450000;
  const status = document.getElementById('selNewUnitInitialStatus').value;

  if (!code) {
    alert('Vui lòng nhập mã phòng kho!');
    return;
  }

  const exists = mockUnits.find(u => u.code === code);
  if (exists) {
    alert(`Mã phòng kho ${code} đã tồn tại trong cơ sở!`);
    return;
  }

  const newUnit = {
    code,
    type,
    size: `${size.toFixed(1)} m²`,
    status,
    price,
    tenant: null,
    pin: '842916'
  };

  mockUnits.push(newUnit);
  renderMatrixGrid();
  closeModal('modalAddUnit');
  showToast(`Đã thêm phòng kho mới: ${code} vào cơ sở!`);
  const uName = currentUser ? currentUser.name : 'Quản lý cơ sở';
  addAuditLog(uName, 'FACILITY_MGR', 'CREATE_UNIT', `Thêm phòng kho mới ${code} (${size}m²)`);
}

function triggerOverdueLockout(contractId, unitCode, customerName) {
  if (confirm(`Xác nhận kích hoạt Giao thức Khóa An Ninh Quá Hạn nợ cước cho phòng ${unitCode} (${customerName})? Mã PIN sẽ bị vô hiệu hóa tạm thời.`)) {
    showToast(`🔒 Đã khóa an ninh Unit ${unitCode}! Mã PIN tạm vô hiệu hóa đến khi hoàn tất công nợ.`);
    const uName = currentUser ? currentUser.name : 'Phạm Hải Đăng';
    addAuditLog(uName, 'FACILITY_MGR', 'OVERDUE_LOCKOUT', `Khóa an ninh phòng ${unitCode} do quá hạn nợ cước (${contractId})`);
  }
}

// ==============================================================================
// BUSINESS OPERATIONS MANAGER WORKFLOWS
// ==============================================================================

function savePricingPolicy() {
  showToast('Đã lưu và ban hành chính sách giá & tỷ lệ cọc mới trên toàn hệ thống!');
  const uName = currentUser ? currentUser.name : 'Đặng Hoàng Long';
  addAuditLog(uName, 'OPS_MGR', 'UPDATE_PRICE_POLICY', 'Ban hành khung giá cọc và chiết khấu mới toàn chuỗi');
}

function saveGeneralPolicy() {
  showToast('Đã ban hành Bộ quy chuẩn & Chính sách cho thuê chung toàn chuỗi 5 cơ sở!');
  const uName = currentUser ? currentUser.name : 'Đặng Hoàng Long';
  addAuditLog(uName, 'OPS_MGR', 'UPDATE_GENERAL_POLICY', 'Cập nhật chính sách an toàn, cọc và thời gian ân hạn');
}

function exportFinancialReport() {
  showToast('Đang kết xuất báo cáo tài chính 5 chi nhánh (File: SelfStorage_Report_2026.csv)...');
  
  // Real CSV export generation
  setTimeout(() => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Chi nhánh,Tổng số kho,Kho đang thuê,Tỷ lệ lấp đầy (%),Doanh thu tháng (VNĐ),Trạng thái\n"
      + "Cơ sở Cầu Giấy (120 Duy Tân),120,98,81.67%,145200000,Hoạt động tốt\n"
      + "Cơ sở Quận 7 (Nguyễn Thị Thập),150,132,88.00%,198000000,Hoạt động tốt\n"
      + "Cơ sở Nam Từ Liêm (Khu CNC),100,80,80.00%,118500000,Hoạt động tốt\n"
      + "Cơ sở Tân Bình (Cộng Hòa),110,93,84.55%,137800000,Hoạt động tốt\n"
      + "Cơ sở Đà Nẵng (Hải Châu),80,60,75.00%,88500000,Cần tối ưu marketing\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "SelfStorage_Bao_Cao_Chuoi_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('✅ Tải xuống báo cáo tài chính thành công!');
  }, 1000);
}

// ==============================================================================
// SYSTEM ADMINISTRATOR WORKFLOWS
// ==============================================================================

function renderUserTable() {
  const tbody = document.getElementById('tblUsersBody');
  if (!tbody) return;

  tbody.innerHTML = mockUsers.map(u => `
    <tr>
      <td><span class="code-display">${u.id}</span></td>
      <td>
        <div style="font-weight:700; color:#0f172a;">${u.name}</div>
        <div style="font-size:12px; color:#64748b;">${u.email} • <strong>@${u.username}</strong></div>
      </td>
      <td>${u.phone}</td>
      <td>
        <span class="badge ${
          u.role === 'CUSTOMER' ? 'badge-primary' :
          u.role === 'STAFF' ? 'badge-teal' :
          u.role === 'FMANAGER' ? 'badge-purple' :
          u.role === 'OPS_MGR' ? 'badge-warning' : 'badge-danger'
        }">${u.role}</span>
      </td>
      <td>${u.facility}</td>
      <td>
        <span class="badge ${u.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}">
          ${u.status === 'ACTIVE' ? '🟢 Hoạt động' : '🔴 Khóa'}
        </span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="toggleLockUser('${u.id}')">
          ${u.status === 'ACTIVE' ? 'Khóa' : 'Mở'}
        </button>
      </td>
    </tr>
  `).join('');
}

function toggleLockUser(userId) {
  const target = mockUsers.find(u => u.id === userId);
  if (!target) return;
  target.status = target.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
  renderUserTable();
  showToast(`Đã thay đổi trạng thái tài khoản ${target.name} (@${target.username}) thành: ${target.status}!`);
  const uName = currentUser ? currentUser.name : 'Quản trị viên';
  addAuditLog(uName, 'ADMIN', 'TOGGLE_USER_STATUS', `Đổi trạng thái tài khoản ${target.id} (@${target.username}) -> ${target.status}`);
}

function submitCreateUserByAdmin() {
  const name = document.getElementById('txtNewUserName').value.trim();
  const username = document.getElementById('txtNewUserUsername').value.trim().toLowerCase();
  const password = document.getElementById('txtNewUserPassword').value.trim();
  const phone = document.getElementById('txtNewUserPhone').value.trim();
  const email = document.getElementById('txtNewUserEmail').value.trim();
  const cccd = document.getElementById('txtNewUserCccd').value.trim();
  const role = document.getElementById('selNewUserRole').value;
  const facility = document.getElementById('selNewUserFacility').value;

  if (!name || !username || !password || !email) {
    alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
    return;
  }

  const exists = mockUsers.find(u => u.username === username);
  if (exists) {
    alert(`Tên đăng nhập @${username} đã tồn tại!`);
    return;
  }

  const meta = ROLE_METADATA[role] || ROLE_METADATA.CUSTOMER;

  const newUser = {
    id: `USR-0${mockUsers.length + 1}`,
    name,
    username,
    password,
    phone: phone || '0900.000.000',
    email,
    cccd: cccd || '0012020xxxxx',
    role,
    roleTitle: meta.title,
    facility,
    facilityCode: 'HN-CG',
    status: 'ACTIVE'
  };

  mockUsers.push(newUser);
  renderUserTable();
  closeModal('modalAddUser');
  showToast(`Đã tạo thành công tài khoản @${username} cho ${name} (${role})!`);
  const uName = currentUser ? currentUser.name : 'Quản trị viên';
  addAuditLog(uName, 'ADMIN', 'CREATE_USER', `Tạo tài khoản mới @${username} (${role})`);
}

function renderAuditLogsTable() {
  const tbody = document.getElementById('tblAuditLogsBody');
  if (!tbody) return;

  tbody.innerHTML = mockAuditLogs.map(log => `
    <tr>
      <td style="font-family:'JetBrains Mono', monospace; font-size:12px;">${log.time}</td>
      <td>
        <div style="font-weight:700;">${log.user}</div>
        <div style="font-size:11px; color:#64748b;">${log.role}</div>
      </td>
      <td><span class="code-display">${log.action}</span></td>
      <td>${log.detail}</td>
      <td style="font-family:'JetBrains Mono', monospace; font-size:12px;">${log.ip}</td>
      <td><span class="badge badge-success">SUCCESS</span></td>
    </tr>
  `).join('');
}

function addAuditLog(user, role, action, detail) {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} Hôm nay`;
  mockAuditLogs.unshift({
    time: timeStr,
    user: user || 'Hệ thống',
    role: role || 'SYSTEM',
    action: action,
    detail: detail,
    ip: '192.168.1.100',
    status: 'SUCCESS'
  });
  renderAuditLogsTable();
}



// ==============================================================================
// MODAL HELPERS & NOTIFICATIONS
// ==============================================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function showToast(message) {
  const toast = document.getElementById('globalToastBar');
  const msgEl = document.getElementById('globalToastMsg');
  if (!toast || !msgEl) return;
  msgEl.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}
