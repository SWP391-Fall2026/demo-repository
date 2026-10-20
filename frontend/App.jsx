import React, { useState, useEffect, useMemo } from 'react';

/**
 * ==============================================================================
 * SELFSTORAGE PRO - REACT COMPONENT (App.jsx)
 * Tổng hợp toàn bộ hệ thống giao diện & phân quyền RBAC (5 Actors)
 * SWP391 - Hệ thống Quản lý & Cho thuê Kho Lưu trữ Tự phục vụ
 * ==============================================================================
 */

// 1. API Helper kết nối tới Spring Boot (cổng 8080)
const API_BASE = typeof window !== 'undefined' && window.location.port === '8080' ? '' : 'http://localhost:8080';

// 2. Dữ liệu mẫu ban đầu (Mock Data)
const INITIAL_UNITS = [
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

const INITIAL_USERS = [
  { id: 'USR-01', name: 'Trần Văn Bảo', username: 'customer', password: '1', email: 'customer@selfstorage.vn', phone: '0987.654.321', cccd: '001202019988', role: 'CUSTOMER', roleTitle: 'Khách hàng thuê kho', facility: 'Hà Nội - Cầu Giấy', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-02', name: 'Nguyễn Văn Tuấn', username: 'staff', password: '3', email: 'staff@selfstorage.vn', phone: '0912.345.678', cccd: '001201044556', role: 'STAFF', roleTitle: 'Nhân viên cơ sở', facility: 'Hà Nội - Cầu Giấy', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-04', name: 'Phạm Hải Đăng', username: 'manager', password: '4', email: 'manager@selfstorage.vn', phone: '0934.567.890', cccd: '001200055443', role: 'FMANAGER', roleTitle: 'Quản lý cơ sở', facility: 'Hà Nội - Cầu Giấy', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-06', name: 'Đặng Hoàng Long', username: 'business', password: '5', email: 'business@selfstorage.vn', phone: '0918.777.666', cccd: '001200011223', role: 'OPS_MGR', roleTitle: 'Quản lý vận hành toàn chuỗi', facility: 'Toàn hệ thống (HQ)', facilityCode: 'HQ', status: 'ACTIVE' },
  { id: 'USR-07', name: 'Quản trị viên Hệ thống', username: 'admin', password: '2', email: 'admin@selfstorage.vn', phone: '0909.999.000', cccd: '001200000001', role: 'ADMIN', roleTitle: 'Quản trị hệ thống', facility: 'Toàn hệ thống (HQ)', facilityCode: 'HQ', status: 'ACTIVE' }
];

const INITIAL_TICKETS = [
  { id: 'TCK-2026-01', unit: 'A-102', category: 'Kẹt khóa / Khóa cơ', priority: 'NORMAL', desc: 'Ổ khóa cơ hơi rít khi tra chìa vào buổi sáng sớm.', status: 'Đang xử lý', time: '10:15 Hôm nay' },
  { id: 'TCK-2026-02', unit: 'A-106', category: 'Đèn chiếu sáng', priority: 'LOW', desc: 'Đèn LED trần kho chập chờn khi mở cửa.', status: 'Chờ xử lý', time: '08:30 Hôm nay' }
];

const INITIAL_AUDIT_LOGS = [
  { time: '12:35:10 Hôm nay', user: 'Nguyễn Văn Tuấn', role: 'STAFF', action: 'HANDOVER_UNIT', detail: 'Hoàn tất bàn giao kho A-102 cho khách Trần Văn Bảo (RSV-8821)', ip: '192.168.1.45', status: 'SUCCESS' },
  { time: '11:20:00 Hôm nay', user: 'Phạm Hải Đăng', role: 'FMANAGER', action: 'ASSIGN_UNIT', detail: 'Gán kho A-105 cho yêu cầu đặt giữ chỗ RSV-9012', ip: '192.168.1.12', status: 'SUCCESS' },
  { time: '09:15:22 Hôm nay', user: 'Trần Văn Bảo', role: 'CUSTOMER', action: 'RESERVATION', detail: 'Tạo đơn đặt kho Tiêu chuẩn 5.0m2 (Thanh toán cọc VietQR 500k)', ip: '118.70.12.9', status: 'SUCCESS' }
];

const ROLE_METADATA = {
  CUSTOMER: { title: 'Khách hàng thuê kho', badgeText: 'Khách hàng', color: '#2563eb', defaultScreen: 'SCR-C00' },
  STAFF: { title: 'Nhân viên cơ sở', badgeText: 'Nhân viên kho', color: '#0d9488', defaultScreen: 'SCR-S01' },
  FMANAGER: { title: 'Quản lý cơ sở', badgeText: 'Quản lý cơ sở', color: '#7c3aed', defaultScreen: 'SCR-M01' },
  OPS_MGR: { title: 'Quản lý vận hành toàn chuỗi', badgeText: 'GĐ Vận hành', color: '#ea580c', defaultScreen: 'SCR-O01' },
  ADMIN: { title: 'Quản trị hệ thống', badgeText: 'Quản trị viên', color: '#e11d48', defaultScreen: 'SCR-A01' }
};

const FACILITIES = [
  { code: 'HN-CG', name: 'Chi nhánh Cầu Giấy (120 Duy Tân, Hà Nội)', total: 120, occupied: 98, manager: 'Phạm Hải Đăng', phone: '024.7300.8888' },
  { code: 'HCM-Q7', name: 'Chi nhánh Quận 7 (Nguyễn Thị Thập, TP.HCM)', total: 150, occupied: 126, manager: 'Trần Quang Vinh', phone: '028.7300.9999' },
  { code: 'HN-NTL', name: 'Chi nhánh Nam Từ Liêm (Khu CNC Hòa Lạc, Hà Nội)', total: 90, occupied: 65, manager: 'Lê Hoàng Long', phone: '024.7300.6666' },
  { code: 'HCM-TB', name: 'Chi nhánh Tân Bình (Cộng Hòa, TP.HCM)', total: 110, occupied: 94, manager: 'Nguyễn Kiều Oanh', phone: '028.7300.5555' },
  { code: 'DN-HC', name: 'Chi nhánh Hải Châu (Nguyễn Văn Linh, Đà Nẵng)', total: 90, occupied: 72, manager: 'Võ Minh Trí', phone: '0236.7300.7777' }
];

export default function App() {
  // Trạng thái người dùng và phân quyền RBAC
  const [currentUser, setCurrentUser] = useState(null);
  const [currentActor, setCurrentActor] = useState(null); // 'CUSTOMER' | 'STAFF' | 'FMANAGER' | 'OPS_MGR' | 'ADMIN'
  const [currentScreen, setCurrentScreen] = useState('SCR-C00');
  const [activeBranch, setActiveBranch] = useState('HN-CG');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Dữ liệu ứng dụng
  const [units, setUnits] = useState(INITIAL_UNITS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Trạng thái Toast thông báo
  const [toast, setToast] = useState({ show: false, message: '' });

  // Trạng thái Đăng nhập / Đăng ký
  const [authTab, setAuthTab] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', phone: '', email: '', cccd: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Trạng thái Đặt kho & Thanh toán (Khách hàng)
  const [bookingData, setBookingData] = useState({
    facilityCode: 'HN-CG',
    unitType: 'M',
    size: '5.0 m²',
    price: 1450000,
    duration: 3,
    startDate: new Date().toISOString().split('T')[0],
    deposit: 500000
  });
  const [paymentTimer, setPaymentTimer] = useState(900); // 15 phút
  const [customerPin, setCustomerPin] = useState('842916');
  const [isPinVisible, setIsPinVisible] = useState(false);

  // Trạng thái Bàn phím PIN mô phỏng mở khóa (Staff SCR-S07)
  const [keypadInput, setKeypadInput] = useState('');
  const [keypadStatus, setKeypadStatus] = useState(null); // 'SUCCESS' | 'ERROR' | null

  // Trạng thái Modal Thêm kho mới (Manager SCR-M02)
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [newUnitForm, setNewUnitForm] = useState({
    code: 'A-119',
    type: 'M',
    size: '5.0',
    price: 1450000,
    status: 'available',
    location: 'Tầng 1 - Khu A'
  });

  // Hiển thị thông báo Toast
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3500);
  };

  // Điều hướng màn hình có kiểm tra RBAC Route Guard
  const navigateTo = (screenId) => {
    if (!currentUser) {
      if (['SCR-C00', 'SCR-C01', 'SCR-AUTH'].includes(screenId)) {
        setCurrentScreen(screenId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      showToast('⚠️ Vui lòng đăng nhập để truy cập tính năng này!');
      setAuthTab('LOGIN');
      setCurrentScreen('SCR-AUTH');
      return;
    }

    // Kiểm tra quyền truy cập theo vai trò
    if (currentActor === 'CUSTOMER' && !screenId.startsWith('SCR-C') && screenId !== 'SCR-AUTH') {
      showToast('⛔ Bạn không có quyền truy cập màn hình của nhân viên / quản lý!');
      return;
    }
    if (currentActor === 'STAFF' && !screenId.startsWith('SCR-S') && screenId !== 'SCR-C00') {
      showToast('⛔ Màn hình này không thuộc thẩm quyền của Nhân viên kho!');
      return;
    }
    if (currentActor === 'FMANAGER' && !screenId.startsWith('SCR-M') && screenId !== 'SCR-C00') {
      showToast('⛔ Màn hình này không thuộc thẩm quyền của Quản lý cơ sở!');
      return;
    }
    if (currentActor === 'OPS_MGR' && !screenId.startsWith('SCR-O') && screenId !== 'SCR-C00') {
      showToast('⛔ Màn hình này không thuộc thẩm quyền của Giám đốc Vận hành!');
      return;
    }

    setCurrentScreen(screenId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Đăng nhập hệ thống
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    const found = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (!found) {
      setAuthError('Tên đăng nhập hoặc mật khẩu không chính xác!');
      return;
    }
    if (found.status === 'LOCKED') {
      setAuthError('Tài khoản này hiện đang bị tạm khóa. Vui lòng liên hệ Admin!');
      return;
    }

    setCurrentUser(found);
    setCurrentActor(found.role);
    setAuthError('');
    showToast(`Xin chào ${found.name} (${ROLE_METADATA[found.role].title})!`);
    
    // Ghi log đăng nhập
    setAuditLogs(prev => [
      { time: 'Vừa xong', user: found.name, role: found.role, action: 'USER_LOGIN', detail: `Đăng nhập thành công (@${found.username})`, ip: '127.0.0.1', status: 'SUCCESS' },
      ...prev
    ]);

    navigateTo(ROLE_METADATA[found.role].defaultScreen);
  };

  // Đăng nhập nhanh bằng tài khoản test (1-Click Switch Account)
  const quickLoginAs = (role) => {
    const user = users.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      setCurrentActor(user.role);
      showToast(`Đã chuyển sang vai trò: ${ROLE_METADATA[user.role].title}`);
      navigateTo(ROLE_METADATA[user.role].defaultScreen);
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    if (currentUser) {
      setAuditLogs(prev => [
        { time: 'Vừa xong', user: currentUser.name, role: currentActor, action: 'USER_LOGOUT', detail: `Đăng xuất khỏi hệ thống`, ip: '127.0.0.1', status: 'SUCCESS' },
        ...prev
      ]);
    }
    setCurrentUser(null);
    setCurrentActor(null);
    setIsUserDropdownOpen(false);
    showToast('👋 Đã đăng xuất khỏi hệ thống!');
    setCurrentScreen('SCR-C00');
  };

  // Đếm ngược thời gian thanh toán VietQR
  useEffect(() => {
    if (currentScreen === 'SCR-C03' && paymentTimer > 0) {
      const timer = setInterval(() => setPaymentTimer(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [currentScreen, paymentTimer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render Danh mục điều hướng theo quyền hạn (Navigation Links)
  const renderNavLinks = () => {
    if (!currentUser) {
      return (
        <>
          <span className={`nav-item-link ${currentScreen === 'SCR-C00' ? 'active' : ''}`} onClick={() => navigateTo('SCR-C00')}>Trang chủ</span>
          <span className={`nav-item-link ${currentScreen === 'SCR-C01' ? 'active' : ''}`} onClick={() => navigateTo('SCR-C01')}>Tìm kho &amp; Bảng giá</span>
          <span className="nav-item-link" onClick={() => navigateTo('SCR-C01')}>Cơ sở lưu trữ</span>
        </>
      );
    }

    switch (currentActor) {
      case 'CUSTOMER':
        return (
          <>
            <span className={`nav-item-link ${currentScreen === 'SCR-C00' ? 'active' : ''}`} onClick={() => navigateTo('SCR-C00')}>Trang chủ</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-C01' ? 'active' : ''}`} onClick={() => navigateTo('SCR-C01')}>Tìm kho &amp; Bảng giá</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-C02' ? 'active' : ''}`} onClick={() => navigateTo('SCR-C02')}>Đặt giữ chỗ</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-C04' ? 'active' : ''}`} onClick={() => navigateTo('SCR-C04')}>Thẻ Check-in</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-C05' ? 'active' : ''}`} onClick={() => navigateTo('SCR-C05')}>Kho của tôi &amp; Mã PIN</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-C06' ? 'active' : ''}`} onClick={() => navigateTo('SCR-C06')}>Hỗ trợ sự cố</span>
          </>
        );
      case 'STAFF':
        return (
          <>
            <span className={`nav-item-link ${currentScreen === 'SCR-S01' ? 'active' : ''}`} onClick={() => navigateTo('SCR-S01')}>Ca trực hôm nay</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-S02' ? 'active' : ''}`} onClick={() => navigateTo('SCR-S02')}>Tra cứu đơn</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-S03' ? 'active' : ''}`} onClick={() => navigateTo('SCR-S03')}>Bàn giao kho</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-S04' ? 'active' : ''}`} onClick={() => navigateTo('SCR-S04')}>Sơ đồ mặt bằng</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-S05' ? 'active' : ''}`} onClick={() => navigateTo('SCR-S05')}>Nghiệm thu trả kho</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-S06' ? 'active' : ''}`} onClick={() => navigateTo('SCR-S06')}>Bàn sự cố</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-S07' ? 'active' : ''}`} onClick={() => navigateTo('SCR-S07')}>Mở khóa số</span>
          </>
        );
      case 'FMANAGER':
        return (
          <>
            <span className={`nav-item-link ${currentScreen === 'SCR-M01' ? 'active' : ''}`} onClick={() => navigateTo('SCR-M01')}>Tổng quan cơ sở</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-M02' ? 'active' : ''}`} onClick={() => navigateTo('SCR-M02')}>Quản lý kho</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-M03' ? 'active' : ''}`} onClick={() => navigateTo('SCR-M03')}>Gán phòng kho</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-M04' ? 'active' : ''}`} onClick={() => navigateTo('SCR-M04')}>Phân công việc</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-M05' ? 'active' : ''}`} onClick={() => navigateTo('SCR-M05')}>Hợp đồng &amp; Nợ</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-M06' ? 'active' : ''}`} onClick={() => navigateTo('SCR-M06')}>Báo cáo vận hành</span>
          </>
        );
      case 'OPS_MGR':
        return (
          <>
            <span className={`nav-item-link ${currentScreen === 'SCR-O01' ? 'active' : ''}`} onClick={() => navigateTo('SCR-O01')}>Tổng quan chuỗi</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-O02' ? 'active' : ''}`} onClick={() => navigateTo('SCR-O02')}>5 Chi nhánh</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-O03' ? 'active' : ''}`} onClick={() => navigateTo('SCR-O03')}>Bảng giá &amp; Cọc</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-O04' ? 'active' : ''}`} onClick={() => navigateTo('SCR-O04')}>Báo cáo doanh thu</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-O05' ? 'active' : ''}`} onClick={() => navigateTo('SCR-O05')}>Chính sách chung</span>
          </>
        );
      case 'ADMIN':
        return (
          <>
            <span className={`nav-item-link ${currentScreen === 'SCR-A01' ? 'active' : ''}`} onClick={() => navigateTo('SCR-A01')}>Tổng quan Admin</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-A02' ? 'active' : ''}`} onClick={() => navigateTo('SCR-A02')}>Tài khoản</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-A03' ? 'active' : ''}`} onClick={() => navigateTo('SCR-A03')}>Phân quyền RBAC</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-A04' ? 'active' : ''}`} onClick={() => navigateTo('SCR-A04')}>Gán cơ sở</span>
            <span className={`nav-item-link ${currentScreen === 'SCR-A05' ? 'active' : ''}`} onClick={() => navigateTo('SCR-A05')}>Audit Logs</span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* =========================================================================
          HEADER & THANH ĐIỀU HƯỚNG CHÍNH
          ========================================================================= */}
      <header className="app-header">
        <div className="header-left-zone">
          <div className="app-brand-logo" onClick={() => navigateTo('SCR-C00')} style={{ cursor: 'pointer' }}>
            <div className="app-brand-icon">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <div className="brand-text-block">
              <span className="brand-title" style={{ letterSpacing: '1px', fontWeight: 800 }}>STORAGE</span>
              <span className="brand-role-indicator">
                {currentUser ? `${ROLE_METADATA[currentActor].title.toUpperCase()} | ${currentUser.facility}` : 'HỆ THỐNG KHO TỰ QUẢN THÔNG MINH'}
              </span>
            </div>
          </div>
        </div>

        <nav className="app-main-nav">
          {renderNavLinks()}
        </nav>

        <div className="app-profile-slot">
          {currentUser ? (
            <div className="user-profile-widget" style={{ position: 'relative' }}>
              <div 
                className="user-badge-chip" 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: '20px' }}
              >
                <div className="avatar-circle" style={{ width: 28, height: 28, borderRadius: '50%', background: ROLE_METADATA[currentActor].color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '12px' }}>
                  {currentUser.name.charAt(0)}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentUser.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{ROLE_METADATA[currentActor].badgeText}</div>
                </div>
                <span style={{ fontSize: '10px' }}>▼</span>
              </div>

              {isUserDropdownOpen && (
                <div className="user-dropdown-card" style={{ position: 'absolute', right: 0, top: '42px', width: '220px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100 }}>
                  <div style={{ paddingBottom: '8px', borderBottom: '1px solid #334155', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>ĐANG ĐĂNG NHẬP VỚI:</div>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{currentUser.username}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{currentUser.facility}</div>
                  </div>
                  <button className="btn btn-outline btn-sm" style={{ width: '100%', marginBottom: '6px' }} onClick={() => { setIsUserDropdownOpen(false); navigateTo(ROLE_METADATA[currentActor].defaultScreen); }}>
                    🏠 Bàn làm việc
                  </button>
                  <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="header-logged-out-group" style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-nav-login" onClick={() => { setAuthTab('LOGIN'); navigateTo('SCR-AUTH'); }}>Đăng nhập</button>
              <button className="btn-nav-register" onClick={() => { setAuthTab('REGISTER'); navigateTo('SCR-AUTH'); }}>Đăng ký</button>
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          NỘI DUNG MÀN HÌNH TƯƠNG ỨNG (SCREEN PANELS)
          ========================================================================= */}
      <main className="app-main-content" style={{ minHeight: 'calc(100vh - 180px)', padding: '24px 20px' }}>

        {/* -----------------------------------------------------------------------
            SCR-AUTH: ĐĂNG NHẬP / ĐĂNG KÝ
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-AUTH' && (
          <div className="screen-panel active auth-card-container" style={{ maxWidth: '520px', margin: '40px auto', background: '#0f172a', padding: '32px', borderRadius: '16px', border: '1px solid #1e293b' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8' }}>STORAGE PRO</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Hệ thống quản lý & Cho thuê kho lưu trữ tự phục vụ</p>
            </div>

            {/* Switch Tabs */}
            <div style={{ display: 'flex', background: '#1e293b', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
              <button 
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: authTab === 'LOGIN' ? '#2563eb' : 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setAuthTab('LOGIN')}
              >
                Đăng nhập
              </button>
              <button 
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: authTab === 'REGISTER' ? '#2563eb' : 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setAuthTab('REGISTER')}
              >
                Đăng ký tài khoản
              </button>
            </div>

            {authError && (
              <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {authError}
              </div>
            )}

            {authTab === 'LOGIN' ? (
              <form onSubmit={handleLogin}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#cbd5e1' }}>Tên đăng nhập *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={loginForm.username} 
                    onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} 
                    placeholder="ví dụ: customer, staff, manager..." 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: 'white' }} 
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#cbd5e1' }}>Mật khẩu *</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={loginForm.password} 
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} 
                    placeholder="Mật khẩu của bạn" 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: 'white' }} 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 700 }}>
                  Đăng Nhập Vào Hệ Thống
                </button>
              </form>
            ) : (
              <div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '13px' }}>Họ và tên *</label>
                  <input type="text" className="form-control" placeholder="Nguyễn Văn A" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', border: '1px solid #334155', color: 'white' }} />
                </div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '13px' }}>Số Căn cước công dân (CCCD 12 số) *</label>
                  <input type="text" className="form-control" placeholder="001202019988" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', border: '1px solid #334155', color: 'white' }} />
                </div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '13px' }}>Số điện thoại liên hệ *</label>
                  <input type="tel" className="form-control" placeholder="0987.654.321" style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1e293b', border: '1px solid #334155', color: 'white' }} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', padding: '10px', borderRadius: '8px', marginTop: '10px' }} onClick={() => { showToast('Đăng ký tài khoản thành công! Vui lòng đăng nhập.'); setAuthTab('LOGIN'); }}>
                  Hoàn Tất Đăng Ký
                </button>
              </div>
            )}

            {/* Quick 1-Click Demo Accounts */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #1e293b', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>⚡ ĐĂNG NHẬP NHANH TÀI KHOẢN THỬ NGHIỆM (5 ROLES):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                <button type="button" className="btn btn-xs" style={{ background: '#2563eb', color: 'white', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', border: 'none', cursor: 'pointer' }} onClick={() => quickLoginAs('CUSTOMER')}>
                  👤 Khách hàng (pass: 1)
                </button>
                <button type="button" className="btn btn-xs" style={{ background: '#0d9488', color: 'white', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', border: 'none', cursor: 'pointer' }} onClick={() => quickLoginAs('STAFF')}>
                  🛠️ Nhân viên (pass: 3)
                </button>
                <button type="button" className="btn btn-xs" style={{ background: '#7c3aed', color: 'white', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', border: 'none', cursor: 'pointer' }} onClick={() => quickLoginAs('FMANAGER')}>
                  🏢 Quản lý cơ sở (pass: 4)
                </button>
                <button type="button" className="btn btn-xs" style={{ background: '#ea580c', color: 'white', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', border: 'none', cursor: 'pointer' }} onClick={() => quickLoginAs('OPS_MGR')}>
                  📊 GĐ Vận hành (pass: 5)
                </button>
                <button type="button" className="btn btn-xs" style={{ background: '#e11d48', color: 'white', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', border: 'none', cursor: 'pointer' }} onClick={() => quickLoginAs('ADMIN')}>
                  🛡️ Admin (pass: 2)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-C00: TRANG CHỦ LANDING PAGE & TÌM KIẾM KHO
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-C00' && (
          <div className="screen-panel active">
            <section className="hero-banner" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '60px 30px', borderRadius: '20px', border: '1px solid #334155', textAlign: 'center', marginBottom: '40px' }}>
              <span className="badge-promo" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                🚀 GIẢI PHÁP LƯU TRỮ TỰ PHỤC VỤ THÔNG MINH 4.0
              </span>
              <h1 style={{ fontSize: '38px', fontWeight: 800, margin: '20px 0 12px', color: '#f8fafc', lineHeight: 1.2 }}>
                Thuê Kho Tự Quản An Toàn, Linh Hoạt &amp; Tiện Lợi
              </h1>
              <p style={{ maxWidth: '640px', margin: '0 auto 30px', color: '#94a3b8', fontSize: '16px' }}>
                Hệ thống 5 cơ sở tại Hà Nội, TP.HCM &amp; Đà Nẵng. Mở khóa bằng mã PIN điện tử, bảo vệ 24/7, camera giám sát AI và kiểm soát nhiệt độ tự động.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-primary btn-lg" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => navigateTo('SCR-C01')}>
                  🔍 Tra Cứu Kho &amp; Báo Giá
                </button>
                <button className="btn btn-outline btn-lg" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => navigateTo('SCR-C02')}>
                  📝 Đặt Giữ Chỗ Trực Tuyến
                </button>
              </div>
            </section>

            {/* Quick Branches Highlight */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>📍 Hệ thống 5 Chi nhánh Toàn quốc</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {FACILITIES.map(fac => (
                  <div key={fac.code} style={{ background: '#1e293b', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#38bdf8', marginBottom: '6px' }}>{fac.name}</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Hotline: {fac.phone}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                      <span>Tổng phòng kho: <b>{fac.total}</b></span>
                      <span>Đã thuê: <b style={{ color: '#22c55e' }}>{fac.occupied}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-C01: DANH MỤC PHÒNG KHO & BẢNG GIÁ NIÊM YẾT
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-C01' && (
          <div className="screen-panel active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Danh Mục Phòng Kho &amp; Bảng Giá</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Lựa chọn kích thước kho phù hợp với nhu cầu lưu đồ gia đình, chuyển nhà hoặc hàng hóa</p>
              </div>
              <button className="btn btn-primary" onClick={() => navigateTo('SCR-C02')}>
                + Tiến hành Đặt Giữ Chỗ
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Type S */}
              <div className="unit-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge" style={{ background: '#2563eb', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>LOẠI S</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>800.000 đ/th</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Kho Mini / Cá Nhân</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>Diện tích: 2.0 - 3.0 m² | Chứa 15-20 thùng carton, vali du lịch, tài liệu lưu trữ.</p>
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => { setBookingData({ ...bookingData, unitType: 'S', size: '2.5 m²', price: 800000 }); navigateTo('SCR-C02'); }}>
                  Chọn Thuê Kho Này
                </button>
              </div>

              {/* Type M */}
              <div className="unit-card" style={{ background: '#1e293b', border: '2px solid #38bdf8', borderRadius: '12px', padding: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-10px', right: '16px', background: '#38bdf8', color: '#0f172a', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>PHỔ BIẾN NHẤT</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge" style={{ background: '#0d9488', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>LOẠI M</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>1.450.000 đ/th</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Kho Tiêu Chuẩn Gia Đình</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>Diện tích: 5.0 - 6.0 m² | Chứa nội thất căn hộ 1-2 phòng ngủ, máy giặt, tủ lạnh, xe máy.</p>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setBookingData({ ...bookingData, unitType: 'M', size: '5.0 m²', price: 1450000 }); navigateTo('SCR-C02'); }}>
                  Chọn Thuê Kho Này
                </button>
              </div>

              {/* Type L */}
              <div className="unit-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge" style={{ background: '#7c3aed', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>LOẠI L</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>2.800.000 đ/th</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Kho Lớn / Doanh Nghiệp</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>Diện tích: 10.0 - 15.0 m² | Chứa hàng hóa pallet thương mại, thiết bị sự kiện, nội thất biệt thự.</p>
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => { setBookingData({ ...bookingData, unitType: 'L', size: '10.0 m²', price: 2800000 }); navigateTo('SCR-C02'); }}>
                  Chọn Thuê Kho Này
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-C02: ĐẶT GIỮ CHỖ PHÒNG KHO (BƯỚC 1)
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-C02' && (
          <div className="screen-panel active" style={{ maxWidth: '680px', margin: '0 auto', background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>📝 Đăng Ký Đặt Giữ Chỗ Phòng Kho</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Bước 1: Điền thông tin thuê kho và thời hạn mong muốn</p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Chi nhánh cơ sở *</label>
              <select 
                className="form-control" 
                value={bookingData.facilityCode} 
                onChange={e => setBookingData({ ...bookingData, facilityCode: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
              >
                {FACILITIES.map(fac => (
                  <option key={fac.code} value={fac.code}>{fac.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Loại phòng kho</label>
                <input type="text" className="form-control" value={`Loại ${bookingData.unitType} (${bookingData.size})`} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8' }} />
              </div>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Thời hạn thuê (Tháng)</label>
                <select 
                  className="form-control" 
                  value={bookingData.duration} 
                  onChange={e => setBookingData({ ...bookingData, duration: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                >
                  <option value={1}>1 tháng</option>
                  <option value={3}>3 tháng (Giảm 5%)</option>
                  <option value={6}>6 tháng (Giảm 10%)</option>
                  <option value={12}>12 tháng (Giảm 15%)</option>
                </select>
              </div>
            </div>

            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ color: '#94a3b8' }}>Đơn giá niêm yết:</span>
                <span>{bookingData.price.toLocaleString()} VNĐ/tháng</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ color: '#94a3b8' }}>Tiền cọc giữ chỗ (Cần thanh toán ngay):</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>500.000 VNĐ</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigateTo('SCR-C01')}>
                ← Quay lại danh mục
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => navigateTo('SCR-C03')}>
                Tiếp Tục Thanh Toán VietQR →
              </button>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-C03: THANH TOÁN CỌC QUA VIETQR (BƯỚC 2)
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-C03' && (
          <div className="screen-panel active" style={{ maxWidth: '640px', margin: '0 auto', background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>💳 Thanh Toán Tiền Cọc Giữ Chỗ</h2>
            <div style={{ color: '#f59e0b', fontSize: '14px', marginBottom: '20px' }}>
              ⏳ Mã thanh toán có hiệu lực trong: <b style={{ fontSize: '16px' }}>{formatTimer(paymentTimer)}</b>
            </div>

            {/* VietQR Mock Card */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', display: 'inline-block', color: '#0f172a', marginBottom: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#2563eb', marginBottom: '8px' }}>VIETQR PRO - NGAN HANG MBBANK</div>
              <div style={{ width: '200px', height: '200px', margin: '0 auto 10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #94a3b8', borderRadius: '8px' }}>
                <span style={{ fontSize: '48px' }}>📱</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>CTK: HE THONG SELF STORAGE VN</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>STK: 098765432199</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>SỐ TIỀN: 500.000 VNĐ</div>
              <div style={{ fontSize: '12px', background: '#e0e7ff', padding: '4px 8px', borderRadius: '4px', marginTop: '6px', fontWeight: 600 }}>ND: COC KHO M CG HN</div>
            </div>

            <div>
              <button 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%', marginBottom: '10px' }}
                onClick={() => {
                  showToast('✅ Xác nhận thanh toán thành công! Mã giữ chỗ của bạn đã được kích hoạt.');
                  navigateTo('SCR-C04');
                }}
              >
                ✅ Giả lập: Tôi đã chuyển khoản thành công
              </button>
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => navigateTo('SCR-C02')}>
                Hủy thanh toán
              </button>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-C04: THẺ CHECK-IN NHẬN KHO (QR PASS)
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-C04' && (
          <div className="screen-panel active" style={{ maxWidth: '560px', margin: '0 auto', background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center' }}>
            <span style={{ background: '#22c55e', color: '#0f172a', fontWeight: 800, fontSize: '12px', padding: '4px 12px', borderRadius: '20px' }}>
              THẺ CHECK-IN SẴN SÀNG
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '14px 0 6px' }}>Thẻ Vào Cửa &amp; Nhận Kho</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>Xuất trình mã này cho Nhân viên lễ tân tại chi nhánh để nhận bàn giao kho và chìa khóa</p>

            <div style={{ background: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>MÃ ĐẶT GIỮ CHỖ</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', letterSpacing: '2px', margin: '4px 0 16px' }}>RSV-8821</div>
              <div style={{ width: '140px', height: '140px', background: 'white', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                <span style={{ fontSize: '42px' }}>🏁</span>
              </div>
              <div style={{ fontSize: '14px' }}>Cơ sở: <b>Chi nhánh Cầu Giấy (120 Duy Tân)</b></div>
              <div style={{ fontSize: '14px' }}>Kho dự kiến: <b>A-102 (Loại M - 5.0m²)</b></div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigateTo('SCR-C05')}>
              Xem Kho Của Tôi &amp; Mã PIN Điện Tử →
            </button>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-C05: KHO CỦA TÔI & QUẢN LÝ MÃ PIN ĐIỆN TỬ
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-C05' && (
          <div className="screen-panel active">
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Kho Của Tôi &amp; Mã PIN Cửa</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Quản lý phòng kho đang thuê, mở cửa điện tử và đổi mật mã PIN truy cập</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="badge" style={{ background: '#22c55e', color: '#0f172a', fontWeight: 800, padding: '4px 10px', borderRadius: '6px' }}>ĐANG THUÊ</span>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>HĐ: HD-2026-001</span>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>Phòng Kho A-102</h3>
                <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '16px' }}>Chi nhánh Cầu Giấy (120 Duy Tân) | Tầng 1 - Khu A</div>

                {/* Digital PIN Box */}
                <div style={{ background: '#0f172a', padding: '16px', borderRadius: '10px', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>MÃ PIN ĐIỆN TỬ MỞ CỬA KHO</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '6px', color: '#22c55e' }}>
                    {isPinVisible ? customerPin : '••••••'}
                  </div>
                  <button 
                    className="btn btn-xs btn-outline" 
                    style={{ marginTop: '8px' }} 
                    onClick={() => setIsPinVisible(!isPinVisible)}
                  >
                    {isPinVisible ? '🙈 Ẩn mã PIN' : '👁️ Hiện mã PIN'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
                    const newPin = prompt('Nhập mã PIN mới (6 chữ số):', '123456');
                    if (newPin && newPin.length === 6) {
                      setCustomerPin(newPin);
                      showToast('✅ Đổi mã PIN điện tử thành công!');
                    }
                  }}>
                    🔑 Đổi mã PIN
                  </button>
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => navigateTo('SCR-C06')}>
                    ⚠️ Báo sự cố
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-C06: BÁO CÁO SỰ CỐ & TICKET HỖ TRỢ
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-C06' && (
          <div className="screen-panel active" style={{ maxWidth: '640px', margin: '0 auto', background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Gửi Yêu Cầu Hỗ Trợ &amp; Báo Sự Cố</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Nhân viên kỹ thuật và trực kho sẽ phản hồi trong vòng 15-30 phút</p>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Phòng kho xảy ra sự cố</label>
              <input type="text" className="form-control" value="A-102 (Chi nhánh Cầu Giấy)" disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8' }} />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Nhóm vấn đề *</label>
              <select className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}>
                <option>Kẹt khóa cơ / Không nhập được mã PIN</option>
                <option>Sự cố điện / Đèn chiếu sáng trong kho</option>
                <option>Nhiệt độ / Độ ẩm phòng kho</option>
                <option>Hỗ trợ xe nâng / Xe đẩy chuyển đồ</option>
                <option>Khác</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Mô tả chi tiết *</label>
              <textarea rows={4} className="form-control" placeholder="Mô tả cụ thể hiện trạng sự cố..." style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}></textarea>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
              showToast('✅ Đã gửi phiếu hỗ trợ thành công! Nhân viên sẽ hỗ trợ ngay.');
              navigateTo('SCR-C05');
            }}>
              Gửi Phiếu Yêu Cầu
            </button>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-S01: NHÂN VIÊN KHO - CA TRỰC HÔM NAY (STAFF WORKSPACE)
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-S01' && (
          <div className="screen-panel active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Ca Trực Nhân Viên Kho</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Bàn làm việc vận hành chi nhánh: Đón khách, bàn giao kho, xử lý sự cố</p>
              </div>
              <button className="btn btn-primary" onClick={() => navigateTo('SCR-S02')}>
                🔍 Tra cứu mã đơn khách đến
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#1e293b', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Khách hẹn nhận kho hôm nay</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>04 khách</div>
              </div>
              <div style={{ background: '#1e293b', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Lịch hẹn trả kho / Nghiệm thu</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>02 phòng</div>
              </div>
              <div style={{ background: '#1e293b', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Sự cố cần xử lý tại quầy</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>01 vụ</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => navigateTo('SCR-S04')}>🗺️ Xem Sơ đồ mặt bằng kho</button>
              <button className="btn btn-outline" onClick={() => navigateTo('SCR-S07')}>⌨️ Thử mở khóa mã PIN điện tử</button>
              <button className="btn btn-outline" onClick={() => navigateTo('SCR-S06')}>🛠️ Bàn xử lý sự cố tại chỗ</button>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-S04: SƠ ĐỒ MẶT BẰNG & TRẠNG THÁI PHÒNG KHO (FLOOR PLAN)
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-S04' && (
          <div className="screen-panel active">
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Sơ Đồ Mặt Bằng &amp; Trạng Thái Kho</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Chi nhánh Cầu Giấy (120 Duy Tân) - Tầng 1 - Khu A</p>

            {/* Status Legend */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#22c55e' }}></span> Trống (Available)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b' }}></span> Đã đặt (Reserved)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#2563eb' }}></span> Đang thuê (Occupied)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#64748b' }}></span> Đang dọn vệ sinh (Cleaning)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444' }}></span> Đang bảo trì (Maintenance)</span>
            </div>

            {/* Units Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {units.map(u => {
                let bg = '#22c55e';
                if (u.status === 'reserved') bg = '#f59e0b';
                if (u.status === 'occupied') bg = '#2563eb';
                if (u.status === 'cleaning') bg = '#64748b';
                if (u.status === 'maintenance') bg = '#ef4444';

                return (
                  <div 
                    key={u.code} 
                    style={{ background: '#1e293b', border: `2px solid ${bg}`, borderRadius: '10px', padding: '12px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => showToast(`Kho ${u.code}: Loại ${u.type} (${u.size}) - Trạng thái: ${u.status}`)}
                  >
                    <div style={{ fontWeight: 800, fontSize: '16px', color: 'white' }}>{u.code}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{u.size}</div>
                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: bg, color: 'white' }}>
                      {u.status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-S07: BÀN PHÍM SỐ MỞ KHÓA THỰC ĐỊA (KEYPAD SIMULATOR)
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-S07' && (
          <div className="screen-panel active" style={{ maxWidth: '420px', margin: '0 auto', background: '#1e293b', padding: '30px', borderRadius: '20px', border: '1px solid #334155', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>⌨️ Mô Phỏng Bàn Phím Khóa Cửa</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>Kiểm tra khả năng mở khóa cửa bằng mã PIN 6 số của khách</p>

            {/* Display screen */}
            <div style={{ background: '#0f172a', border: '2px solid #334155', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>TRẠNG THÁI KHÓA ĐIỆN TỬ: READY</div>
              <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '8px', color: keypadStatus === 'SUCCESS' ? '#22c55e' : (keypadStatus === 'ERROR' ? '#ef4444' : '#38bdf8'), minHeight: '44px' }}>
                {keypadInput ? keypadInput.padEnd(6, '•') : '••••••'}
              </div>
              {keypadStatus === 'SUCCESS' && <div style={{ color: '#22c55e', fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>🔓 MỞ CỬA THÀNH CÔNG!</div>}
              {keypadStatus === 'ERROR' && <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>❌ SAI MÃ PIN! VUI LÒNG THỬ LẠI</div>}
            </div>

            {/* Numeric Keypad Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num} 
                  className="btn btn-outline" 
                  style={{ fontSize: '20px', fontWeight: 700, padding: '14px', borderRadius: '10px' }}
                  onClick={() => {
                    if (keypadInput.length < 6) {
                      setKeypadInput(prev => prev + num);
                      setKeypadStatus(null);
                    }
                  }}
                >
                  {num}
                </button>
              ))}
              <button 
                className="btn btn-outline" 
                style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}
                onClick={() => { setKeypadInput(''); setKeypadStatus(null); }}
              >
                C (XÓA)
              </button>
              <button 
                className="btn btn-outline" 
                style={{ fontSize: '20px', fontWeight: 700, padding: '14px', borderRadius: '10px' }}
                onClick={() => {
                  if (keypadInput.length < 6) {
                    setKeypadInput(prev => prev + '0');
                    setKeypadStatus(null);
                  }
                }}
              >
                0
              </button>
              <button 
                className="btn btn-primary" 
                style={{ fontSize: '14px', fontWeight: 700 }}
                onClick={() => {
                  if (keypadInput === '842916' || keypadInput === customerPin) {
                    setKeypadStatus('SUCCESS');
                  } else {
                    setKeypadStatus('ERROR');
                  }
                }}
              >
                # (MỞ)
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Gợi ý mã đúng mẫu: <b>842916</b></div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-M01: QUẢN LÝ CƠ SỞ - TỔNG QUAN CHI NHÁNH (FACILITY MANAGER)
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-M01' && (
          <div className="screen-panel active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Tổng Quan Chi Nhánh Cầu Giấy</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Dashboard quản lý cơ sở: Giám sát kho, lấp đầy, hợp đồng và công việc nhân viên</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsAddUnitModalOpen(true)}>
                + Thêm Phòng Kho Mới
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Tổng số phòng kho</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginTop: '4px' }}>120</div>
                <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>98 kho đang thuê (82%)</div>
              </div>
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Doanh thu tháng này</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>145.2 Tr</div>
                <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>↑ 12% so với tháng trước</div>
              </div>
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Nhân viên đang trực</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>03 / 04</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Ca trực sáng: 08:00 - 17:00</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => navigateTo('SCR-M02')}>📦 Quản lý danh mục kho</button>
              <button className="btn btn-outline" onClick={() => navigateTo('SCR-M03')}>🎯 Gán kho cho khách</button>
              <button className="btn btn-outline" onClick={() => navigateTo('SCR-M05')}>📑 Hợp đồng &amp; Công nợ</button>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-O01: GĐ VẬN HÀNH TOÀN CHUỖI (OPS MANAGER)
            ----------------------------------------------------------------------- */}
        {currentScreen === 'SCR-O01' && (
          <div className="screen-panel active">
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Tổng Quan Chuỗi Chi Nhánh Toàn Quốc</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Giám sát kinh doanh và vận hành 5 chi nhánh tại Hà Nội, TP.HCM &amp; Đà Nẵng</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '30px' }}>
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Tổng kho toàn hệ thống</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'white' }}>560 kho</div>
                <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>Tỷ lệ lấp đầy TB: 84.5%</div>
              </div>
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Doanh thu toàn chuỗi</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#ea580c' }}>648.5 Tr</div>
                <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>Doanh thu kế hoạch đạt 104%</div>
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Bảng Tình Trạng Các Chi Nhánh</h3>
            <table className="table" style={{ width: '100%', background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#0f172a', textAlign: 'left', color: '#94a3b8', fontSize: '13px' }}>
                  <th style={{ padding: '12px' }}>Cơ sở</th>
                  <th style={{ padding: '12px' }}>Quản lý phụ trách</th>
                  <th style={{ padding: '12px' }}>Công suất kho</th>
                  <th style={{ padding: '12px' }}>Tỷ lệ thuê</th>
                  <th style={{ padding: '12px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {FACILITIES.map(fac => (
                  <tr key={fac.code} style={{ borderTop: '1px solid #334155', fontSize: '13px' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{fac.name}</td>
                    <td style={{ padding: '12px' }}>{fac.manager}</td>
                    <td style={{ padding: '12px' }}>{fac.occupied} / {fac.total} kho</td>
                    <td style={{ padding: '12px', color: '#22c55e', fontWeight: 700 }}>
                      {Math.round((fac.occupied / fac.total) * 100)}%
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge" style={{ background: '#15803d', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>HOẠT ĐỘNG TỐT</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            SCR-A01 / SCR-A05: QUẢN TRỊ VIÊN HỆ THỐNG (SYSTEM ADMIN & AUDIT LOGS)
            ----------------------------------------------------------------------- */}
        {(currentScreen === 'SCR-A01' || currentScreen === 'SCR-A05') && (
          <div className="screen-panel active">
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Nhật Ký Hoạt Động Hệ Thống (Audit Logs)</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Ghi nhận toàn bộ thao tác người dùng, đăng nhập và bảo mật thời gian thực</p>

            <table className="table" style={{ width: '100%', background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#0f172a', textAlign: 'left', color: '#94a3b8', fontSize: '13px' }}>
                  <th style={{ padding: '12px' }}>Thời gian</th>
                  <th style={{ padding: '12px' }}>Người thực hiện</th>
                  <th style={{ padding: '12px' }}>Vai trò</th>
                  <th style={{ padding: '12px' }}>Hành động</th>
                  <th style={{ padding: '12px' }}>Chi tiết</th>
                  <th style={{ padding: '12px' }}>IP</th>
                  <th style={{ padding: '12px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, index) => (
                  <tr key={index} style={{ borderTop: '1px solid #334155', fontSize: '13px' }}>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{log.time}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{log.user}</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge" style={{ background: ROLE_METADATA[log.role]?.color || '#64748b', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        {log.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#38bdf8' }}>{log.action}</td>
                    <td style={{ padding: '12px' }}>{log.detail}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{log.ip}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>✓ {log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL THÊM PHÒNG KHO MỚI (MANAGER SCR-M02)
          ========================================================================= */}
      {isAddUnitModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-card" style={{ background: '#1e293b', padding: '24px', borderRadius: '14px', width: '90%', maxWidth: '480px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>+ Thêm Phòng Kho Mới Vào Chi Nhánh</h3>
            
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Mã phòng kho *</label>
              <input type="text" className="form-control" value={newUnitForm.code} onChange={e => setNewUnitForm({ ...newUnitForm, code: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '13px' }}>Loại kho</label>
                <select className="form-control" value={newUnitForm.type} onChange={e => setNewUnitForm({ ...newUnitForm, type: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}>
                  <option value="S">Loại S (Mini)</option>
                  <option value="M">Loại M (Tiêu chuẩn)</option>
                  <option value="L">Loại L (Lớn)</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '13px' }}>Diện tích (m²)</label>
                <input type="text" className="form-control" value={newUnitForm.size} onChange={e => setNewUnitForm({ ...newUnitForm, size: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Đơn giá (VNĐ/tháng)</label>
              <input type="number" className="form-control" value={newUnitForm.price} onChange={e => setNewUnitForm({ ...newUnitForm, price: Number(e.target.value) })} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsAddUnitModalOpen(false)}>
                Hủy
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                setUnits(prev => [...prev, { ...newUnitForm, size: `${newUnitForm.size} m²`, tenant: null, pin: '842916' }]);
                setIsAddUnitModalOpen(false);
                showToast(`✅ Đã thêm phòng kho ${newUnitForm.code} thành công!`);
              }}>
                Lưu Phòng Kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          GLOBAL TOAST BAR
          ========================================================================= */}
      {toast.show && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0f172a', color: 'white', padding: '12px 20px', borderRadius: '10px', border: '1px solid #38bdf8', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🔔</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      {/* =========================================================================
          FOOTER CHÂN TRANG
          ========================================================================= */}
      <footer className="app-footer" style={{ borderTop: '1px solid #1e293b', padding: '24px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        <div>STORAGE PRO - Hệ Thống Quản Lý &amp; Cho Thuê Kho Lưu Trữ Tự Phục Vụ (Self-Storage)</div>
        <div style={{ marginTop: '4px' }}>Đồ án môn học SWP391 - Phân quyền 5 tác nhân (Customer, Staff, Manager, Ops Manager, Admin)</div>
      </footer>
    </div>
  );
}
