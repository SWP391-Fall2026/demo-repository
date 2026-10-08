// State & Data
let currentActor = 'CUSTOMER';
let currentScreen = 'SCR-C00';
let isPinVisible = false;
let keypadInput = '';
let selectedUnitForModal = null;
let paymentTimerInterval = null;

// Mock Units (Floor 1 - Area A)
let mockUnits = [
  { code: 'A-101', type: 'S', size: '2.0 m²', status: 'available', price: 800000, tenant: null },
  { code: 'A-102', type: 'M', size: '5.0 m²', status: 'reserved', price: 1450000, tenant: 'Trần Văn Bảo' },
  { code: 'A-103', type: 'M', size: '5.0 m²', status: 'occupied', price: 1450000, tenant: 'Lê Hoàng Nam' },
  { code: 'A-104', type: 'L', size: '10.0 m²', status: 'occupied', price: 2800000, tenant: 'Công ty Alpha Logistics' },
  { code: 'A-105', type: 'S', size: '3.0 m²', status: 'available', price: 950000, tenant: null },
  { code: 'A-106', type: 'M', size: '5.0 m²', status: 'occupied', price: 1450000, tenant: 'Hoàng Minh Châu' },
  { code: 'A-107', type: 'L', size: '12.0 m²', status: 'maintenance', price: 3200000, tenant: null },
  { code: 'A-108', type: 'M', size: '6.0 m²', status: 'cleaning', price: 1600000, tenant: null },
  { code: 'A-109', type: 'S', size: '2.5 m²', status: 'occupied', price: 850000, tenant: 'Phạm Thu Trang' },
  { code: 'A-110', type: 'M', size: '5.0 m²', status: 'available', price: 1450000, tenant: null },
  { code: 'A-111', type: 'L', size: '10.0 m²', status: 'occupied', price: 2800000, tenant: 'Vũ Quốc Đạt' },
  { code: 'A-112', type: 'M', size: '5.0 m²', status: 'available', price: 1450000, tenant: null },
  { code: 'A-113', type: 'L', size: '12.0 m²', status: 'occupied', price: 3200000, tenant: 'Công ty CP Đầu tư Á Châu' },
  { code: 'A-114', type: 'S', size: '2.0 m²', status: 'available', price: 800000, tenant: null },
  { code: 'A-115', type: 'M', size: '5.0 m²', status: 'reserved', price: 1450000, tenant: 'Nguyễn Kiều Oanh' },
  { code: 'A-116', type: 'S', size: '3.0 m²', status: 'cleaning', price: 950000, tenant: null },
  { code: 'A-117', type: 'L', size: '10.0 m²', status: 'available', price: 2800000, tenant: null },
  { code: 'A-118', type: 'M', size: '5.0 m²', status: 'available', price: 1450000, tenant: null }
];

// Mock Users (Admin Actor)
let mockUsers = [
  { id: 'USR-01', name: 'Trần Văn Bảo', email: 'baotran@gmail.com', phone: '0987.654.321', role: 'CUSTOMER', facility: 'Hà Nội - Cầu Giấy', status: 'ACTIVE' },
  { id: 'USR-02', name: 'Nguyễn Văn Tuấn', email: 'tuan.nv@selfstorage.vn', phone: '0912.345.678', role: 'STAFF', facility: 'Hà Nội - Cầu Giấy', status: 'ACTIVE' },
  { id: 'USR-03', name: 'Lê Thị Mai', email: 'mai.lt@selfstorage.vn', phone: '0903.112.233', role: 'STAFF', facility: 'Hà Nội - Cầu Giấy', status: 'ACTIVE' },
  { id: 'USR-04', name: 'Phạm Hải Đăng', email: 'dang.ph@selfstorage.vn', phone: '0934.567.890', role: 'FACILITY_MANAGER', facility: 'Hà Nội - Cầu Giấy', status: 'ACTIVE' },
  { id: 'USR-05', name: 'Trần Quang Vinh', email: 'vinh.tq@selfstorage.vn', phone: '0978.889.900', role: 'FACILITY_MANAGER', facility: 'TP.HCM - Quận 7', status: 'ACTIVE' },
  { id: 'USR-06', name: 'Đặng Hoàng Long', email: 'long.dh@selfstorage.vn', phone: '0918.777.666', role: 'OPS_MANAGER', facility: 'Toàn hệ thống (HQ)', status: 'ACTIVE' },
  { id: 'USR-07', name: 'Quản trị viên Hệ thống', email: 'admin@selfstorage.vn', phone: '0909.999.000', role: 'SYSTEM_ADMIN', facility: 'Toàn hệ thống (HQ)', status: 'ACTIVE' },
  { id: 'USR-08', name: 'Nguyễn Kiều Oanh', email: 'oanh.nk@gmail.com', phone: '0988.123.456', role: 'CUSTOMER', facility: 'TP.HCM - Quận 7', status: 'ACTIVE' }
];

// Mock Audit Logs
let mockAuditLogs = [
  { time: '12:35:10 Hôm nay', user: 'Nguyễn Văn Tuấn', role: 'STAFF', action: 'HANDOVER_UNIT', detail: 'Hoàn tất bàn giao kho A-102 cho khách Trần Văn Bảo (RSV-8821)', ip: '192.168.1.45', status: 'SUCCESS' },
  { time: '12:15:02 Hôm nay', user: 'Trần Văn Bảo', role: 'CUSTOMER', action: 'PAYMENT_CONFIRM', detail: 'Thanh toán cọc 1.450.000 VNĐ qua VietQR TxID: 998124', ip: '113.190.23.8', status: 'SUCCESS' },
  { time: '11:50:40 Hôm nay', user: 'Phạm Hải Đăng', role: 'FACILITY_MGR', action: 'ASSIGN_UNIT', detail: 'Gán kho A-102 cho đơn đặt chỗ RSV-8821', ip: '192.168.1.12', status: 'SUCCESS' },
  { time: '10:30:15 Hôm nay', user: 'Trần Văn Bảo', role: 'CUSTOMER', action: 'CREATE_RESERVATION', detail: 'Tạo đơn đặt giữ chỗ Kho M (5.0m²) tại Cầu Giấy', ip: '113.190.23.8', status: 'SUCCESS' },
  { time: '09:40:22 Hôm nay', user: 'Đặng Hoàng Long', role: 'OPS_MGR', action: 'UPDATE_POLICY', detail: 'Cập nhật mức chiết khấu thuê 12 tháng lên 15%', ip: '192.168.0.2', status: 'SUCCESS' },
  { time: '08:15:00 Hôm nay', user: 'Admin Hệ thống', role: 'SYSTEM_ADMIN', action: 'USER_LOGIN', detail: 'Đăng nhập vào bảng điều khiển quản trị tập trung', ip: '192.168.0.1', status: 'SUCCESS' }
];

// Screen Catalog metadata for all 5 actors
const ACTOR_SCREENS = {
  CUSTOMER: [
    { id: 'SCR-C00', code: 'SCR-C00', name: 'Trang chủ & Giới thiệu', desc: 'Landing Page, danh mục gói kho & quy trình thuê 4 bước' },
    { id: 'SCR-C01', code: 'SCR-C01', name: 'Catalog & Bảng giá', desc: 'Khám phá cơ sở, kích thước kho S/M/L, giá & phòng trống' },
    { id: 'SCR-C02', code: 'SCR-C02', name: 'Đặt giữ chỗ trực tuyến', desc: 'Chọn chi nhánh, thời hạn thuê, hẹn giờ check-in & tính cọc' },
    { id: 'SCR-C03', code: 'SCR-C03', name: 'Thanh toán & VietQR', desc: 'Thanh toán cọc qua mã VietQR Napas247 & Giả lập giao dịch' },
    { id: 'SCR-C04', code: 'SCR-C04', name: 'Thẻ hẹn Check-in Pass', desc: 'Thẻ boarding pass tiếp đón nhận kho với mã QR cá nhân' },
    { id: 'SCR-C05', code: 'SCR-C05', name: 'Kho của tôi & Mã PIN', desc: 'Quản lý kho đang thuê, xem mã PIN 842916 & bàn phím' },
    { id: 'SCR-C06', code: 'SCR-C06', name: 'Gửi ticket hỗ trợ', desc: 'Báo cáo sự cố khẩn cấp (kẹt khóa, quên PIN, thấm ẩm)' }
  ],
  STAFF: [
    { id: 'SCR-S01', code: 'SCR-S01', name: 'Ca trực hôm nay', desc: 'Bàn làm việc theo dõi danh sách khách hẹn nhận/trả kho' },
    { id: 'SCR-S02', code: 'SCR-S02', name: 'Tra cứu đơn đặt chỗ', desc: 'Đối chiếu CCCD, kiểm tra tiền cọc RSV-8821 khi khách đến' },
    { id: 'SCR-S03', code: 'SCR-S03', name: 'Biên bản bàn giao kho', desc: 'Checklist 5 mục hiện trường, cấp khóa/thẻ/mã PIN & ký nhận' },
    { id: 'SCR-S04', code: 'SCR-S04', name: 'Sơ đồ mặt bằng kho', desc: 'Ma trận ô phòng kho chi nhánh & cập nhật trạng thái tức thì' },
    { id: 'SCR-S05', code: 'SCR-S05', name: 'Nghiệm thu trả kho', desc: 'Kiểm tra dọn sạch, hoàn trả tiền cọc 1.500.000 VNĐ' },
    { id: 'SCR-S06', code: 'SCR-S06', name: 'Xử lý sự cố tại quầy', desc: 'Cấp mã PIN tạm 60p, xử lý mất chìa, báo bảo trì khẩn' },
    { id: 'SCR-S07', code: 'SCR-S07', name: 'Mô phỏng Mở khóa kho', desc: 'Bàn phím nhập mã PIN thực địa kiểm tra mở cửa' }
  ],
  FMANAGER: [
    { id: 'SCR-M01', code: 'SCR-M01', name: 'Tổng quan chi nhánh', desc: 'Dashboard điều hành chi nhánh: 120 kho, 82% lấp đầy, 145M VNĐ' },
    { id: 'SCR-M02', code: 'SCR-M02', name: 'Quản lý phòng kho', desc: 'Danh sách 120 kho chi nhánh, thêm kho, sửa thông tin' },
    { id: 'SCR-M03', code: 'SCR-M03', name: 'Gán phòng kho cho khách', desc: 'Duyệt đơn đặt chỗ và gán phòng kho trống phù hợp' },
    { id: 'SCR-M04', code: 'SCR-M04', name: 'Phân công nhân viên', desc: 'Giao việc ca trực cho Staff: Bàn giao, Nghiệm thu, Bảo trì' },
    { id: 'SCR-M05', code: 'SCR-M05', name: 'Giám sát hợp đồng & nợ', desc: 'Theo dõi hợp đồng thuê, cảnh báo hạn & xử lý quá hạn' },
    { id: 'SCR-M06', code: 'SCR-M06', name: 'Báo cáo vận hành cơ sở', desc: 'Báo cáo doanh thu, công nợ và tỷ lệ khai thác mặt bằng' }
  ],
  OPS_MGR: [
    { id: 'SCR-O01', code: 'SCR-O01', name: 'Tổng quan toàn chuỗi', desc: 'Dashboard 5 chi nhánh toàn quốc, 560 kho, 648M VNĐ/tháng' },
    { id: 'SCR-O02', code: 'SCR-O02', name: 'Quản lý 5 Chi nhánh', desc: 'Danh mục chi nhánh Hà Nội, TP.HCM, Đà Nẵng & điều hành' },
    { id: 'SCR-O03', code: 'SCR-O03', name: 'Bảng giá & Chính sách cọc', desc: 'Thiết lập khung giá chuẩn S/M/L, biểu phí cọc, chiết khấu' },
    { id: 'SCR-O04', code: 'SCR-O04', name: 'Báo cáo kinh doanh chuỗi', desc: 'Phân tích doanh thu, tỷ lệ lấp đầy liên chi nhánh & xuất file' },
    { id: 'SCR-O05', code: 'SCR-O05', name: 'Chính sách cho thuê chung', desc: 'Quy chuẩn an toàn kho, bảo hiểm và hàng cấm lưu trữ' }
  ],
  ADMIN: [
    { id: 'SCR-A01', code: 'SCR-A01', name: 'Tổng quan hệ thống', desc: 'Dashboard quản trị: 1.284 người dùng, 5 cơ sở, Uptime 99.98%' },
    { id: 'SCR-A02', code: 'SCR-A02', name: 'Quản lý tài khoản', desc: 'Danh sách người dùng, phân vai trò, khóa/mở khóa tài khoản' },
    { id: 'SCR-A03', code: 'SCR-A03', name: 'Ma trận phân quyền RBAC', desc: 'Cấu hình chi tiết quyền hạn cho các vai trò người dùng' },
    { id: 'SCR-A04', code: 'SCR-A04', name: 'Gán cơ sở phụ trách', desc: 'Phân quyền dữ liệu theo chi nhánh cho nhân viên và quản lý' },
    { id: 'SCR-A05', code: 'SCR-A05', name: 'Nhật ký hệ thống Audit', desc: 'Theo dõi lịch sử đăng nhập và nhật ký thao tác thời gian thực' }
  ]
};

// Initialization
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get('role');
  if (roleParam && ACTOR_SCREENS[roleParam.toUpperCase()]) {
    switchActor(roleParam.toUpperCase());
  } else {
    switchActor('CUSTOMER');
  }

  const screenParam = urlParams.get('screen');
  if (screenParam) {
    navigateToScreen(screenParam);
  }

  renderMatrixGrid();
  renderUserTable();
  renderAuditLogsTable();
  startPaymentCountdown();
});

// Role & Access Control

const ROLE_USER_MAP = {
  CUSTOMER: {
    name: 'Trần Văn Bảo',
    email: 'baotran@gmail.com',
    role: 'Khách hàng thuê kho',
    shortRole: 'Khách hàng',
    init: 'TB',
    color: '#2563eb',
    facility: 'Hà Nội - Cầu Giấy'
  },
  STAFF: {
    name: 'Nguyễn Văn Tuấn',
    email: 'tuan.nv@selfstorage.vn',
    role: 'Nhân viên cơ sở Cầu Giấy',
    shortRole: 'Nhân viên kho',
    init: 'NT',
    color: '#0d9488',
    facility: 'Hà Nội - Cầu Giấy'
  },
  FMANAGER: {
    name: 'Phạm Hải Đăng',
    email: 'dang.ph@selfstorage.vn',
    role: 'Quản lý cơ sở Cầu Giấy',
    shortRole: 'Quản lý cơ sở',
    init: 'HĐ',
    color: '#7c3aed',
    facility: 'Hà Nội - Cầu Giấy'
  },
  OPS_MGR: {
    name: 'Đặng Hoàng Long',
    email: 'long.dh@selfstorage.vn',
    role: 'Giám đốc vận hành chuỗi',
    shortRole: 'GĐ Vận hành',
    init: 'HL',
    color: '#ea580c',
    facility: 'Toàn hệ thống (HQ)'
  },
  ADMIN: {
    name: 'Quản trị viên Hệ thống',
    email: 'admin@selfstorage.vn',
    role: 'Quản trị hệ thống (HQ)',
    shortRole: 'Quản trị viên',
    init: 'AD',
    color: '#e11d48',
    facility: 'Toàn hệ thống (HQ)'
  }
};

function switchActor(actorKey) {
  currentActor = actorKey;
  const user = ROLE_USER_MAP[actorKey] || ROLE_USER_MAP.CUSTOMER;

  // Update header labels
  if (document.getElementById('txtUserName')) {
    document.getElementById('txtUserName').innerText = user.name;
  }
  if (document.getElementById('txtUserRoleBadge')) {
    document.getElementById('txtUserRoleBadge').innerText = user.shortRole;
  }
  if (document.getElementById('headerRoleIndicator')) {
    document.getElementById('headerRoleIndicator').innerText = user.role;
  }

  // Update header avatar
  const avatar = document.getElementById('avatarInitials');
  if (avatar) {
    avatar.innerText = user.init;
    avatar.style.background = user.color;
  }

  // Update dropdown modal/menu values
  if (document.getElementById('ddAvatar')) {
    document.getElementById('ddAvatar').innerText = user.init;
    document.getElementById('ddAvatar').style.background = user.color;
  }
  if (document.getElementById('ddUserName')) {
    document.getElementById('ddUserName').innerText = user.name;
  }
  if (document.getElementById('ddUserEmail')) {
    document.getElementById('ddUserEmail').innerText = user.email;
  }
  if (document.getElementById('ddUserRoleText')) {
    document.getElementById('ddUserRoleText').innerText = `Vai trò hiện tại: ${user.role}`;
  }

  // Highlight active role in dropdown list
  document.querySelectorAll('.role-select-item').forEach(item => item.classList.remove('active'));
  const activeOpt = document.getElementById(`roleOpt-${actorKey}`);
  if (activeOpt) {
    activeOpt.classList.add('active');
  }

  // Set default initial screen for each actor
  const defaultScreenMap = {
    CUSTOMER: 'SCR-C00',
    STAFF: 'SCR-S01',
    FMANAGER: 'SCR-M01',
    OPS_MGR: 'SCR-O01',
    ADMIN: 'SCR-A01'
  };
  currentScreen = defaultScreenMap[actorKey];

  renderAppNavLinks();
  navigateToScreen(currentScreen);
  showToast(`Đã chuyển sang vai trò: ${user.role}`);
}

// Select role from dropdown item
function selectRole(actorKey) {
  closeUserDropdown();
  switchActor(actorKey);
}

// Quick Switcher from Modal
function quickSwitchIdentity(actorKey) {
  closeModal('modalIdentitySwitch');
  switchActor(actorKey);
}

// User Profile & Role Dropdown controls
function toggleUserDropdown(event) {
  if (event) {
    event.stopPropagation();
  }
  const menu = document.getElementById('userRoleDropdownMenu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

function closeUserDropdown() {
  const menu = document.getElementById('userRoleDropdownMenu');
  if (menu) {
    menu.classList.remove('show');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const trigger = document.getElementById('userRoleTrigger');
  const quickBtn = document.querySelector('.btn-quick-role-switch');
  const menu = document.getElementById('userRoleDropdownMenu');
  if (menu && menu.classList.contains('show')) {
    const isInsideMenu = menu.contains(e.target);
    const isInsideTrigger = trigger && trigger.contains(e.target);
    const isInsideQuickBtn = quickBtn && quickBtn.contains(e.target);
    if (!isInsideMenu && !isInsideTrigger && !isInsideQuickBtn) {
      menu.classList.remove('show');
    }
  }
});

// Navigation Rendering

function renderSubnav() {
  const container = document.getElementById('subnavContainer');
  if (!container) return;
  const screens = ACTOR_SCREENS[currentActor] || [];
  container.innerHTML = screens.map(s => `
    <button class="subnav-screen-pill ${s.id === currentScreen ? 'active' : ''}" onclick="navigateToScreen('${s.id}')">
      <span class="code-tag">[${s.code}]</span>
      <span>${s.name}</span>
    </button>
  `).join('');
}

function renderAppNavLinks() {
  const nav = document.getElementById('appNavLinks');
  if (!nav) return;

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
      <span class="nav-item-link ${currentScreen === 'SCR-S05' ? 'active' : ''}" onclick="navigateToScreen('SCR-S05')">Nghiệm thu trả</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S06' ? 'active' : ''}" onclick="navigateToScreen('SCR-S06')">Bàn sự cố</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S07' ? 'active' : ''}" onclick="navigateToScreen('SCR-S07')">Mở khóa số</span>
    `;
  } else if (currentActor === 'FMANAGER') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-M01' ? 'active' : ''}" onclick="navigateToScreen('SCR-M01')">Dashboard Cơ sở</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M02' ? 'active' : ''}" onclick="navigateToScreen('SCR-M02')">Quản lý kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M03' ? 'active' : ''}" onclick="navigateToScreen('SCR-M03')">Gán phòng</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M04' ? 'active' : ''}" onclick="navigateToScreen('SCR-M04')">Phân công việc</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M05' ? 'active' : ''}" onclick="navigateToScreen('SCR-M05')">Hợp đồng & Nợ</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M06' ? 'active' : ''}" onclick="navigateToScreen('SCR-M06')">Báo cáo</span>
    `;
  } else if (currentActor === 'OPS_MGR') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-O01' ? 'active' : ''}" onclick="navigateToScreen('SCR-O01')">Tổng quan chuỗi</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O02' ? 'active' : ''}" onclick="navigateToScreen('SCR-O02')">5 Chi nhánh</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O03' ? 'active' : ''}" onclick="navigateToScreen('SCR-O03')">Bảng giá & Cọc</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O04' ? 'active' : ''}" onclick="navigateToScreen('SCR-O04')">Báo cáo doanh thu</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O05' ? 'active' : ''}" onclick="navigateToScreen('SCR-O05')">Tiêu chuẩn an toàn</span>
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

function navigateToScreen(screenId) {
  currentScreen = screenId;

  // Toggle active screen panel
  document.querySelectorAll('.screen-panel').forEach(panel => panel.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }

  // Update App Nav links
  renderAppNavLinks();

  // Update Frame Meta bar if present
  const screens = ACTOR_SCREENS[currentActor] || [];
  const meta = screens.find(s => s.id === screenId);
  if (meta) {
    if (document.getElementById('lblFrameCode')) document.getElementById('lblFrameCode').innerText = meta.code;
    if (document.getElementById('lblFrameName')) document.getElementById('lblFrameName').innerText = meta.name;
    if (document.getElementById('lblFrameActor')) {
      const userRole = document.getElementById('txtUserRoleBadge') ? document.getElementById('txtUserRoleBadge').innerText : '';
      document.getElementById('lblFrameActor').innerText = `Vai trò: ${userRole} • ${meta.desc}`;
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Customer Workflows

function openUnitDetailModal(name, size, volume, price) {
  document.getElementById('mdlDetailUnitTitle').innerText = name;
  document.getElementById('mdlDetailSize').innerText = size;
  document.getElementById('mdlDetailVol').innerText = volume;
  document.getElementById('mdlDetailPrice').innerText = price.toLocaleString('vi-VN') + ' đ/tháng';
  openModal('modalUnitDetail');
}

function openReservationModal(name, size, price) {
  closeModal('modalUnitDetail');
  document.getElementById('mdlRsvUnitName').innerText = `${name} (${size})`;
  document.getElementById('mdlRsvPrice').innerText = price.toLocaleString('vi-VN') + ' đ/tháng';
  openModal('modalReservation');
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
  addAuditLog('Trần Văn Bảo', 'CUSTOMER', 'PAYMENT_CONFIRM', 'Thanh toán cọc 1.450.000 VNĐ qua VietQR');
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
  addAuditLog('Trần Văn Bảo', 'CUSTOMER', 'UPDATE_PIN', 'Đổi mã PIN điện tử kho Unit A-102');
}

function openRenewalModal(unit) {
  navigateToScreen('SCR-C03');
  setPaymentType('RENEW');
  showToast(`Mở hóa đơn gia hạn cho phòng kho ${unit}!`);
}

function openCheckoutRequestModal(unit) {
  if (confirm(`Bạn có chắc chắn muốn gửi yêu cầu trả phòng kho ${unit}? Lịch hẹn nghiệm thu sẽ được chuyển đến Nhân viên ca trực.`)) {
    showToast(`Đã gửi yêu cầu trả kho ${unit}! Vui lòng mang đủ chìa và thẻ từ đến bàn giao.`);
    addAuditLog('Trần Văn Bảo', 'CUSTOMER', 'REQUEST_CHECKOUT', `Yêu cầu trả phòng kho ${unit}`);
  }
}

function submitSupportTicket() {
  const desc = document.getElementById('ticketDesc').value.trim();
  if (!desc) {
    alert('Vui lòng nhập mô tả chi tiết sự cố cần hỗ trợ!');
    return;
  }
  document.getElementById('ticketDesc').value = '';
  showToast('Phiếu hỗ trợ đã được tạo và phân công tới Nhân viên ca trực!');
  addAuditLog('Trần Văn Bảo', 'CUSTOMER', 'CREATE_TICKET', 'Báo cáo sự cố phòng kho Unit A-102');
}

// Staff Handlers

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
  document.getElementById('txtSearchReservation').value = rsv;
  showToast(`Đang tra cứu hồ sơ đơn đặt chỗ ${rsv} của khách ${cust}...`);
}

function lookupReservation() {
  showToast('Xác thực hồ sơ đơn đặt RSV-8821 thành công! Đủ điều kiện nhận bàn giao kho.');
}

function completeHandoverProtocol() {
  // Update unit state in database
  const target = mockUnits.find(u => u.code === 'A-102');
  if (target) {
    target.status = 'occupied';
    target.tenant = 'Trần Văn Bảo';
  }
  renderMatrixGrid();

  showToast('🎉 Hoàn tất Bàn giao kho! Hợp đồng CTR-2026-001 chính thức có hiệu lực.');
  addAuditLog('Nguyễn Văn Tuấn', 'STAFF', 'HANDOVER_COMPLETE', 'Hoàn tất bàn giao Unit A-102 cho Trần Văn Bảo');

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
  addAuditLog('Nguyễn Văn Tuấn', 'STAFF', 'RETURN_INSPECTION', 'Nghiệm thu trả kho Unit A-102 & duyệt hoàn cọc');

  setTimeout(() => {
    navigateToScreen('SCR-S04');
    showToast('Phòng A-102 đã chuyển sang trạng thái: CLEANING (Đang vệ sinh)');
  }, 1000);
}

function openEmergencyPinModal() {
  const tempPin = Math.floor(100000 + Math.random() * 900000);
  alert(`[GIAO THỨC KHẨN CẤP TẠI QUẦY]\nMã PIN tạm thời hiệu lực 60 phút cho khách là: ${tempPin}\nHệ thống đã gửi SMS tới số điện thoại chính chủ.`);
  showToast(`Đã cấp mã PIN tạm thời: ${tempPin} (Hiệu lực 60 phút)`);
  addAuditLog('Nguyễn Văn Tuấn', 'STAFF', 'EMERGENCY_PIN', `Cấp mã PIN tạm thời 60p cho Unit A-102`);
}

function openLostKeyModal() {
  if (confirm('Lập biên bản mất chìa khóa cơ, thu phụ phí thay ổ khóa mới 150.000 VNĐ?')) {
    showToast('Đã lập biên bản mất chìa và phân công kỹ thuật thay ổ khóa mới!');
    addAuditLog('Nguyễn Văn Tuấn', 'STAFF', 'LOST_KEY_PROTOCOL', 'Thu phụ phí 150.000đ và thay khóa Unit A-102');
  }
}

// Matrix Grid Renderer
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
  addAuditLog(document.getElementById('txtUserName').innerText, currentActor, 'UPDATE_UNIT_STATUS', `Cập nhật trạng thái Unit ${selectedUnitForModal.code} -> ${newStatus}`);
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
  document.getElementById('keypadStatusResult').innerHTML = '';
}

function updateKeypadDisplay() {
  const display = document.getElementById('keypadScreenDisplay');
  if (!display) return;
  if (!keypadInput) {
    display.innerText = '------';
  } else {
    display.innerText = keypadInput.padEnd(6, '-');
  }
}

function submitKeypadPin() {
  const result = document.getElementById('keypadStatusResult');
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

// Facility Manager Handlers

function assignUnitToReservation(rsvId, unitCode) {
  const target = mockUnits.find(u => u.code === unitCode);
  if (target) {
    target.status = 'reserved';
    target.tenant = 'Trần Văn Bảo';
    renderMatrixGrid();
  }
  showToast(`Đã gán phòng kho ${unitCode} cho đơn đặt chỗ ${rsvId}! Khách hàng đã nhận được thông báo.`);
  addAuditLog('Phạm Hải Đăng', 'FACILITY_MGR', 'ASSIGN_UNIT', `Gán kho ${unitCode} cho đơn đặt chỗ ${rsvId}`);
}

function dispatchStaffTask() {
  const taskName = document.getElementById('txtTaskTitle').value.trim();
  const staffName = document.getElementById('selTaskStaff').value;
  if (!taskName) {
    alert('Vui lòng nhập tên công việc!');
    return;
  }
  showToast(`Đã phân công việc "${taskName}" cho nhân viên ${staffName}!`);
  addAuditLog('Phạm Hải Đăng', 'FACILITY_MGR', 'DISPATCH_TASK', `Phân công việc "${taskName}" cho ${staffName}`);
  document.getElementById('txtTaskTitle').value = '';
}

// Operations Manager Handlers

function savePricingPolicy() {
  showToast('Đã lưu và ban hành chính sách giá & tỷ lệ cọc mới trên toàn hệ thống!');
  addAuditLog('Đặng Hoàng Long', 'OPS_MGR', 'UPDATE_PRICE_POLICY', 'Ban hành khung giá cọc và chiết khấu mới');
}

function exportFinancialReport() {
  showToast('Đang kết xuất báo cáo tài chính 5 chi nhánh (File: SelfStorage_Report_2026.xlsx)...');
  setTimeout(() => {
    showToast('Tải xuống báo cáo thành công!');
  }, 1200);
}

// Administrator Handlers

function renderUserTable() {
  const tbody = document.getElementById('tblUsersBody');
  if (!tbody) return;

  tbody.innerHTML = mockUsers.map(u => `
    <tr>
      <td><span class="code-display">${u.id}</span></td>
      <td>
        <div style="font-weight:700; color:#0f172a;">${u.name}</div>
        <div style="font-size:12px; color:#64748b;">${u.email}</div>
      </td>
      <td>${u.phone}</td>
      <td>
        <span class="badge ${
          u.role === 'CUSTOMER' ? 'badge-primary' :
          u.role === 'STAFF' ? 'badge-teal' :
          u.role === 'FACILITY_MANAGER' ? 'badge-purple' :
          u.role === 'OPS_MANAGER' ? 'badge-warning' : 'badge-danger'
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
  showToast(`Đã thay đổi trạng thái tài khoản ${target.name} thành: ${target.status}!`);
  addAuditLog('Quản trị viên', 'SYSTEM_ADMIN', 'TOGGLE_USER_STATUS', `Đổi trạng thái tài khoản ${target.id} -> ${target.status}`);
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
  const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}:${now.getSeconds() < 10 ? '0' : ''}${now.getSeconds()} Hôm nay`;
  mockAuditLogs.unshift({
    time: timeStr,
    user: user,
    role: role,
    action: action,
    detail: detail,
    ip: '192.168.1.100',
    status: 'SUCCESS'
  });
  renderAuditLogsTable();
}

// Modal Helpers & Notifications

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
