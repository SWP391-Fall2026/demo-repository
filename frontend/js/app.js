/**
 * ==============================================================================
 * SELFSTORAGE PRO - CORE APPLICATION JAVASCRIPT
 * Há»‡ thá»‘ng Quáº£n lÃ½ & Cho thuÃª Kho LÆ°u trá»¯ Tá»± phá»¥c vá»¥
 * ==============================================================================
 */

// Application State & Backend Connection
const API_BASE = window.location.port === '8080' ? '' : 'http://localhost:8080';
let currentUser = null;
let authToken = localStorage.getItem('selfstorage_auth_token') || null;
let currentActor = null; // 'CUSTOMER' | 'STAFF' | 'FMANAGER' | 'OPS_MGR' | 'ADMIN'
let currentScreen = 'SCR-C00';
let isPinVisible = false;
let keypadInput = '';
let selectedUnitForModal = null;
let paymentTimerInterval = null;
let pendingReservationIntent = null;
let currentPendingRegistration = null;
let otpCountdownInterval = null;
let currentReservation = null;
let currentContract = null;
let currentContracts = [];
let knownFacilities = [];
let editingFacilityCode = null;
let currentPaymentType = 'DEPOSIT';
let currentRenewalQuote = null;
let currentLandingFacilityCode = 'HN-CG';
let currentBookingContext = { facilityCode: 'HN-CG', unitType: 'M' };
let managedUnits = null;

function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// Mock Units (Floor 1 - Area A, Cáº§u Giáº¥y Branch)
let mockUnits = [
  { code: 'A-101', type: 'S', size: '2.0 mÂ²', status: 'available', price: 800000, tenant: null, pin: '842916' },
  { code: 'A-102', type: 'M', size: '5.0 mÂ²', status: 'reserved', price: 1450000, tenant: 'Tráº§n VÄƒn Báº£o', pin: '842916' },
  { code: 'A-103', type: 'M', size: '5.0 mÂ²', status: 'occupied', price: 1450000, tenant: 'LÃª HoÃ ng Nam', pin: '771239' },
  { code: 'A-104', type: 'L', size: '10.0 mÂ²', status: 'occupied', price: 2800000, tenant: 'CÃ´ng ty Alpha Logistics', pin: '918234' },
  { code: 'A-105', type: 'S', size: '3.0 mÂ²', status: 'available', price: 950000, tenant: null, pin: '842916' },
  { code: 'A-106', type: 'M', size: '5.0 mÂ²', status: 'occupied', price: 1450000, tenant: 'HoÃ ng Minh ChÃ¢u', pin: '629104' },
  { code: 'A-107', type: 'L', size: '12.0 mÂ²', status: 'maintenance', price: 3200000, tenant: null, pin: '000000' },
  { code: 'A-108', type: 'M', size: '6.0 mÂ²', status: 'cleaning', price: 1600000, tenant: null, pin: '000000' },
  { code: 'A-109', type: 'S', size: '2.5 mÂ²', status: 'occupied', price: 850000, tenant: 'Pháº¡m Thu Trang', pin: '512984' },
  { code: 'A-110', type: 'M', size: '5.0 mÂ²', status: 'available', price: 1450000, tenant: null, pin: '842916' },
  { code: 'A-111', type: 'L', size: '10.0 mÂ²', status: 'occupied', price: 2800000, tenant: 'VÅ© Quá»‘c Äáº¡t', pin: '491204' },
  { code: 'A-112', type: 'M', size: '5.0 mÂ²', status: 'available', price: 1450000, tenant: null, pin: '842916' },
  { code: 'A-113', type: 'L', size: '12.0 mÂ²', status: 'occupied', price: 3200000, tenant: 'CÃ´ng ty CP Äáº§u tÆ° Ã ChÃ¢u', pin: '948123' },
  { code: 'A-114', type: 'S', size: '2.0 mÂ²', status: 'available', price: 800000, tenant: null, pin: '842916' },
  { code: 'A-115', type: 'M', size: '5.0 mÂ²', status: 'reserved', price: 1450000, tenant: 'Nguyá»…n Kiá»u Oanh', pin: '842916' },
  { code: 'A-116', type: 'S', size: '3.0 mÂ²', status: 'cleaning', price: 950000, tenant: null, pin: '000000' },
  { code: 'A-117', type: 'L', size: '10.0 mÂ²', status: 'available', price: 2800000, tenant: null, pin: '842916' },
  { code: 'A-118', type: 'M', size: '5.0 mÂ²', status: 'available', price: 1450000, tenant: null, pin: '842916' }
];

// Mock Users Database (5 Required Accounts + Extras)
let mockUsers = [
  { id: 'USR-01', name: 'Tráº§n VÄƒn Báº£o', dob: '1998-05-12', gender: 'Nam', username: 'customer', password: '1', email: 'customer@selfstorage.vn', phone: '0987.654.321', cccd: '001202019988', role: 'CUSTOMER', roleTitle: 'KhÃ¡ch hÃ ng thuÃª kho', facility: 'HÃ  Ná»™i - Cáº§u Giáº¥y', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-02', name: 'Nguyá»…n VÄƒn Tuáº¥n', dob: '1994-08-20', gender: 'Nam', username: 'staff', password: '3', email: 'staff@selfstorage.vn', phone: '0912.345.678', cccd: '001201044556', role: 'STAFF', roleTitle: 'NhÃ¢n viÃªn cÆ¡ sá»Ÿ', facility: 'HÃ  Ná»™i - Cáº§u Giáº¥y', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-03', name: 'LÃª Thá»‹ Mai', dob: '1996-03-15', gender: 'Ná»¯', username: 'staff2', password: '3', email: 'mai.lt@selfstorage.vn', phone: '0903.112.233', cccd: '001203099881', role: 'STAFF', roleTitle: 'NhÃ¢n viÃªn cÆ¡ sá»Ÿ', facility: 'HÃ  Ná»™i - Cáº§u Giáº¥y', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-04', name: 'Pháº¡m Háº£i ÄÄƒng', dob: '1988-11-25', gender: 'Nam', username: 'manager', password: '4', email: 'manager@selfstorage.vn', phone: '0934.567.890', cccd: '001200055443', role: 'FMANAGER', roleTitle: 'Quáº£n lÃ½ cÆ¡ sá»Ÿ', facility: 'HÃ  Ná»™i - Cáº§u Giáº¥y', facilityCode: 'HN-CG', status: 'ACTIVE' },
  { id: 'USR-05', name: 'Tráº§n Quang Vinh', dob: '1990-07-10', gender: 'Nam', username: 'manager_q7', password: '4', email: 'vinh.tq@selfstorage.vn', phone: '0978.889.900', cccd: '079201088997', role: 'FMANAGER', roleTitle: 'Quáº£n lÃ½ cÆ¡ sá»Ÿ', facility: 'TP.HCM - Quáº­n 7', facilityCode: 'HCM-Q7', status: 'ACTIVE' },
  { id: 'USR-06', name: 'Äáº·ng HoÃ ng Long', dob: '1985-02-18', gender: 'Nam', username: 'business', password: '5', email: 'business@selfstorage.vn', phone: '0918.777.666', cccd: '001200011223', role: 'OPS_MGR', roleTitle: 'Quáº£n lÃ½ váº­n hÃ nh toÃ n chuá»—i', facility: 'ToÃ n há»‡ thá»‘ng (HQ)', facilityCode: 'HQ', status: 'ACTIVE' },
  { id: 'USR-07', name: 'Quáº£n trá»‹ viÃªn Há»‡ thá»‘ng', dob: '1992-09-09', gender: 'Nam', username: 'admin', password: '2', email: 'admin@selfstorage.vn', phone: '0909.999.000', cccd: '001200000001', role: 'ADMIN', roleTitle: 'Quáº£n trá»‹ há»‡ thá»‘ng', facility: 'ToÃ n há»‡ thá»‘ng (HQ)', facilityCode: 'HQ', status: 'ACTIVE' },
  { id: 'USR-08', name: 'Nguyá»…n Kiá»u Oanh', dob: '1999-12-05', gender: 'Ná»¯', username: 'oanhnguyen', password: '1', email: 'oanh.nk@gmail.com', phone: '0988.123.456', cccd: '079201998811', role: 'CUSTOMER', roleTitle: 'KhÃ¡ch hÃ ng thuÃª kho', facility: 'TP.HCM - Quáº­n 7', facilityCode: 'HCM-Q7', status: 'ACTIVE' }
];

// Mock Support Tickets
let mockSupportTickets = [
  { id: 'TCK-2026-01', unit: 'A-102', category: 'Káº¹t khÃ³a / KhÃ³a cÆ¡', priority: 'NORMAL', desc: 'á»” khÃ³a cÆ¡ hÆ¡i rÃ­t khi tra chÃ¬a vÃ o buá»•i sÃ¡ng sá»›m.', status: 'Äang xá»­ lÃ½', time: '10:15 HÃ´m nay' }
];

// Mock Audit Logs
let mockAuditLogs = [
  { time: '12:35:10 HÃ´m nay', user: 'Nguyá»…n VÄƒn Tuáº¥n', role: 'STAFF', action: 'HANDOVER_UNIT', detail: 'HoÃ n táº¥t bÃ n giao kho A-102 cho khÃ¡ch Tráº§n VÄƒn Báº£o (RSV-8821)', ip: '192.168.1.45', status: 'SUCCESS' },
  { time: '12:15:02 HÃ´m nay', user: 'Tráº§n VÄƒn Báº£o', role: 'CUSTOMER', action: 'PAYMENT_CONFIRM', detail: 'Thanh toÃ¡n cá»c 1.450.000 VNÄ qua VietQR TxID: 998124', ip: '113.190.23.8', status: 'SUCCESS' },
  { time: '11:50:40 HÃ´m nay', user: 'Pháº¡m Háº£i ÄÄƒng', role: 'FACILITY_MGR', action: 'ASSIGN_UNIT', detail: 'GÃ¡n kho A-102 cho Ä‘Æ¡n Ä‘áº·t chá»— RSV-8821', ip: '192.168.1.12', status: 'SUCCESS' },
  { time: '10:30:15 HÃ´m nay', user: 'Tráº§n VÄƒn Báº£o', role: 'CUSTOMER', action: 'CREATE_RESERVATION', detail: 'Táº¡o Ä‘Æ¡n Ä‘áº·t giá»¯ chá»— Kho M (5.0mÂ²) táº¡i Cáº§u Giáº¥y', ip: '113.190.23.8', status: 'SUCCESS' },
  { time: '09:40:22 HÃ´m nay', user: 'Äáº·ng HoÃ ng Long', role: 'OPS_MGR', action: 'UPDATE_POLICY', detail: 'Cáº­p nháº­t má»©c chiáº¿t kháº¥u thuÃª 12 thÃ¡ng lÃªn 15%', ip: '192.168.0.2', status: 'SUCCESS' },
  { time: '08:15:00 HÃ´m nay', user: 'Quáº£n trá»‹ viÃªn Há»‡ thá»‘ng', role: 'SYSTEM_ADMIN', action: 'USER_LOGIN', detail: 'ÄÄƒng nháº­p vÃ o báº£ng Ä‘iá»u khiá»ƒn quáº£n trá»‹ táº­p trung', ip: '192.168.0.1', status: 'SUCCESS' }
];

// Screen Catalog metadata strictly separated by Actor
const ACTOR_SCREENS = {
  CUSTOMER: [
    { id: 'SCR-C00', code: 'SCR-C00', name: 'Trang chá»§ & Giá»›i thiá»‡u', desc: 'Landing Page, danh má»¥c gÃ³i kho & quy trÃ¬nh thuÃª 4 bÆ°á»›c' },
    { id: 'SCR-C01', code: 'SCR-C01', name: 'Catalog & Báº£ng giÃ¡', desc: 'Xem cÆ¡ sá»Ÿ lÆ°u trá»¯, loáº¡i kho, kÃ­ch thÆ°á»›c, giÃ¡ thuÃª vÃ  kho kháº£ dá»¥ng' },
    { id: 'SCR-C02', code: 'SCR-C02', name: 'Äáº·t giá»¯ chá»— trá»±c tuyáº¿n', desc: 'Chá»n chi nhÃ¡nh, loáº¡i kho, ngÃ y báº¯t Ä‘áº§u, thá»i háº¡n thuÃª & tÃ­nh cá»c' },
    { id: 'SCR-C03', code: 'SCR-C03', name: 'Thanh toÃ¡n cÃ¡c khoáº£n phÃ­', desc: 'Thanh toÃ¡n tiá»n cá»c, tiá»n thuÃª Ä‘á»‹nh ká»³, gia háº¡n, phá»¥ phÃ­ qua VietQR' },
    { id: 'SCR-C04', code: 'SCR-C04', name: 'Tháº» háº¹n Check-in Pass', desc: 'Thá»§ tá»¥c check-in nháº­n phÃ²ng kho bÃ n giao theo lá»‹ch háº¹n' },
    { id: 'SCR-C05', code: 'SCR-C05', name: 'Quáº£n lÃ½ kho Ä‘ang thuÃª', desc: 'Quáº£n lÃ½ cÃ¡c phÃ²ng kho Ä‘ang thuÃª, xem & Ä‘á»•i mÃ£ PIN Ä‘iá»‡n tá»­' },
    { id: 'SCR-C06', code: 'SCR-C06', name: 'Gá»­i yÃªu cáº§u há»— trá»£ sá»± cá»‘', desc: 'Gá»­i ticket há»— trá»£: á»• khÃ³a, mÃ£ PIN, áº©m má»‘c, thanh toÃ¡n, hÃ ng hÃ³a' }
  ],
  STAFF: [
    { id: 'SCR-S01', code: 'SCR-S01', name: 'Lá»‹ch cÃ´ng viá»‡c hÃ ng ngÃ y', desc: 'Theo dÃµi danh sÃ¡ch khÃ¡ch háº¹n nháº­n kho, tráº£ kho & sá»± cá»‘ ca trá»±c' },
    { id: 'SCR-S02', code: 'SCR-S02', name: 'Kiá»ƒm tra Ä‘Æ¡n Ä‘áº·t chá»—', desc: 'Kiá»ƒm tra vÃ  xÃ¡c thá»±c Ä‘Æ¡n Ä‘áº·t giá»¯ chá»— cá»§a khÃ¡ch hÃ ng khi Ä‘áº¿n' },
    { id: 'SCR-S03', code: 'SCR-S03', name: 'Há»— trá»£ check-in & BÃ n giao', desc: 'BiÃªn báº£n bÃ n giao kho, á»• khÃ³a, tháº» tá»« hoáº·c mÃ£ truy cáº­p PIN' },
    { id: 'SCR-S04', code: 'SCR-S04', name: 'Cáº­p nháº­t tráº¡ng thÃ¡i phÃ²ng kho', desc: 'SÆ¡ Ä‘á»“ máº·t báº±ng kho & cáº­p nháº­t tráº¡ng thÃ¡i kho tá»©c thÃ¬' },
    { id: 'SCR-S05', code: 'SCR-S05', name: 'Kiá»ƒm tra & Nghiá»‡m thu khi tráº£ kho', desc: 'Kiá»ƒm tra vÃ  xÃ¡c nháº­n tÃ¬nh tráº¡ng thá»±c táº¿ cá»§a phÃ²ng kho khi khÃ¡ch tráº£' },
    { id: 'SCR-S06', code: 'SCR-S06', name: 'Xá»­ lÃ½ sá»± cá»‘ táº¡i chá»—', desc: 'Tiáº¿p nháº­n xá»­ lÃ½ táº¡i quáº§y: cáº¥p mÃ£ PIN táº¡m, máº¥t chÃ¬a, hÆ° háº¡i' },
    { id: 'SCR-S07', code: 'SCR-S07', name: 'MÃ´ phá»ng Má»Ÿ khÃ³a kho', desc: 'BÃ n phÃ­m nháº­p mÃ£ PIN thá»±c Ä‘á»‹a kiá»ƒm tra má»Ÿ cá»­a' }
  ],
  FMANAGER: [
    { id: 'SCR-M01', code: 'SCR-M01', name: 'Tá»•ng quan chi nhÃ¡nh', desc: 'Dashboard Ä‘iá»u hÃ nh cÆ¡ sá»Ÿ: 120 kho, 82% láº¥p Ä‘áº§y, 145M VNÄ' },
    { id: 'SCR-M02', code: 'SCR-M02', name: 'Quáº£n lÃ½ kho táº¡i chi nhÃ¡nh', desc: 'Quáº£n lÃ½ danh má»¥c phÃ²ng kho: loáº¡i kho, kÃ­ch thÆ°á»›c, vá»‹ trÃ­, giÃ¡, tráº¡ng thÃ¡i' },
    { id: 'SCR-M03', code: 'SCR-M03', name: 'GÃ¡n phÃ²ng kho phÃ¹ há»£p', desc: 'GÃ¡n phÃ²ng kho trá»‘ng phÃ¹ há»£p cho khÃ¡ch theo loáº¡i kho & thá»i háº¡n' },
    { id: 'SCR-M04', code: 'SCR-M04', name: 'PhÃ¢n cÃ´ng nhÃ¢n viÃªn', desc: 'PhÃ¢n cÃ´ng nhÃ¢n viÃªn cÆ¡ sá»Ÿ thá»±c hiá»‡n há»— trá»£ bÃ n giao, nghiá»‡m thu, sá»± cá»‘' },
    { id: 'SCR-M05', code: 'SCR-M05', name: 'GiÃ¡m sÃ¡t khÃ¡ch hÃ ng & Há»£p Ä‘á»“ng', desc: 'GiÃ¡m sÃ¡t há»£p Ä‘á»“ng, thá»i háº¡n, thanh toÃ¡n vÃ  xá»­ lÃ½ quÃ¡ háº¡n ná»£ cÆ°á»›c' },
    { id: 'SCR-M06', code: 'SCR-M06', name: 'BÃ¡o cÃ¡o váº­n hÃ nh chi nhÃ¡nh', desc: 'Xem bÃ¡o cÃ¡o chi nhÃ¡nh: kho trá»‘ng, kho Ä‘ang thuÃª, doanh thu, láº¥p Ä‘áº§y' }
  ],
  OPS_MGR: [
    { id: 'SCR-O01', code: 'SCR-O01', name: 'Tá»•ng quan toÃ n chuá»—i', desc: 'Dashboard 5 chi nhÃ¡nh toÃ n quá»‘c, 560 kho, 648M VNÄ/thÃ¡ng' },
    { id: 'SCR-O02', code: 'SCR-O02', name: 'Quáº£n lÃ½ chuá»—i chi nhÃ¡nh', desc: 'Quáº£n lÃ½ danh sÃ¡ch táº¥t cáº£ cÃ¡c chi nhÃ¡nh cÆ¡ sá»Ÿ kho toÃ n há»‡ thá»‘ng' },
    { id: 'SCR-O03', code: 'SCR-O03', name: 'Khung giÃ¡ & Phá»¥ phÃ­', desc: 'Quáº£n lÃ½ khung giÃ¡ thuÃª, biá»ƒu phÃ­ phá»¥, phÃ­ pháº¡t, chiáº¿t kháº¥u' },
    { id: 'SCR-O04', code: 'SCR-O04', name: 'BÃ¡o cÃ¡o toÃ n há»‡ thá»‘ng & Xuáº¥t file', desc: 'Xem vÃ  xuáº¥t cÃ¡c bÃ¡o cÃ¡o cáº¥p há»‡ thá»‘ng theo chi nhÃ¡nh, doanh thu' },
    { id: 'SCR-O05', code: 'SCR-O05', name: 'Ban hÃ nh chÃ­nh sÃ¡ch cho thuÃª', desc: 'Thiáº¿t láº­p chÃ­nh sÃ¡ch tiá»n cá»c, gia háº¡n, há»§y Ä‘Æ¡n, tráº£ kho, an toÃ n' }
  ],
  ADMIN: [
    { id: 'SCR-A01', code: 'SCR-A01', name: 'Tá»•ng quan há»‡ thá»‘ng', desc: 'Dashboard quáº£n trá»‹: 1.284 ngÆ°á»i dÃ¹ng, 5 cÆ¡ sá»Ÿ, Uptime 99.98%' },
    { id: 'SCR-A02', code: 'SCR-A02', name: 'Quáº£n trá»‹ tÃ i khoáº£n ngÆ°á»i dÃ¹ng', desc: 'Danh sÃ¡ch ngÆ°á»i dÃ¹ng: táº¡o má»›i, phÃ¢n quyá»n, khÃ³a/má»Ÿ khÃ³a tÃ i khoáº£n' },
    { id: 'SCR-A03', code: 'SCR-A03', name: 'PhÃ¢n vai trÃ² ngÆ°á»i dÃ¹ng (Roles)', desc: 'GÃ¡n vai trÃ² cho Customer, Staff, Facility Manager, Ops Manager' },
    { id: 'SCR-A04', code: 'SCR-A04', name: 'Cáº¥u hÃ¬nh quyá»n truy cáº­p dá»¯ liá»‡u', desc: 'Cáº¥u hÃ¬nh quyá»n dá»¯ liá»‡u dá»±a trÃªn vai trÃ² & chi nhÃ¡nh Ä‘Æ°á»£c phÃ¢n cÃ´ng' },
    { id: 'SCR-A05', code: 'SCR-A05', name: 'Nháº­t kÃ½ hoáº¡t Ä‘á»™ng & ÄÄƒng nháº­p', desc: 'Theo dÃµi lá»‹ch sá»­ Ä‘Äƒng nháº­p vÃ  nháº­t kÃ½ hoáº¡t Ä‘á»™ng thá»i gian thá»±c' }
  ]
};

// Role styling & display mappings
const ROLE_METADATA = {
  CUSTOMER: {
    title: 'KhÃ¡ch hÃ ng thuÃª kho',
    badgeText: 'KhÃ¡ch hÃ ng',
    color: '#2563eb',
    defaultScreen: 'SCR-C00'
  },
  STAFF: {
    title: 'NhÃ¢n viÃªn cÆ¡ sá»Ÿ',
    badgeText: 'NhÃ¢n viÃªn kho',
    color: '#0d9488',
    defaultScreen: 'SCR-S01'
  },
  FMANAGER: {
    title: 'Quáº£n lÃ½ cÆ¡ sá»Ÿ',
    badgeText: 'Quáº£n lÃ½ cÆ¡ sá»Ÿ',
    color: '#7c3aed',
    defaultScreen: 'SCR-M01'
  },
  OPS_MGR: {
    title: 'Quáº£n lÃ½ váº­n hÃ nh toÃ n chuá»—i',
    badgeText: 'GÄ Váº­n hÃ nh',
    color: '#ea580c',
    defaultScreen: 'SCR-O01'
  },
  ADMIN: {
    title: 'Quáº£n trá»‹ há»‡ thá»‘ng',
    badgeText: 'Quáº£n trá»‹ viÃªn',
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
    showAuthAlert('ThÃ´ng tin khÃ´ng há»£p lá»‡!');
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
      authToken = data.token || null;
      if (authToken) localStorage.setItem('selfstorage_auth_token', authToken);
      applyUserSession(data.data);
      showToast(`ðŸŽ‰ ${data.message}`);
      addAuditLog(data.data.name, data.data.role, 'USER_LOGIN', `ÄÄƒng nháº­p thÃ nh cÃ´ng vá»›i tÃ i khoáº£n @${data.data.username}`);
      return;
    } else if (res.status === 401) {
      showAuthAlert('ThÃ´ng tin khÃ´ng há»£p lá»‡!');
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
    showAuthAlert('ThÃ´ng tin khÃ´ng há»£p lá»‡!');
    return;
  }

  if (found.status === 'LOCKED') {
    showAuthAlert('ðŸ”’ TÃ i khoáº£n cá»§a báº¡n Ä‘Ã£ bá»‹ khÃ³a! Vui lÃ²ng liÃªn há»‡ Quáº£n trá»‹ viÃªn há»‡ thá»‘ng.');
    return;
  }

  applyUserSession(found);
  showToast(`ðŸŽ‰ ÄÄƒng nháº­p thÃ nh cÃ´ng! ChÃ o má»«ng ${found.name} (${found.roleTitle || found.role})`);
  addAuditLog(found.name, found.role, 'USER_LOGIN', `ÄÄƒng nháº­p thÃ nh cÃ´ng vá»›i tÃ i khoáº£n @${found.username}`);
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
      if (!val) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      if (val.length < 2 || val.length > 50) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      const nameRegex = /^[a-zA-ZÃ€ÃÃ‚ÃƒÃˆÃ‰ÃŠÃŒÃÃ’Ã“Ã”Ã•Ã™ÃšÄ‚ÄÄ¨Å¨Æ Ã Ã¡Ã¢Ã£Ã¨Ã©ÃªÃ¬Ã­Ã²Ã³Ã´ÃµÃ¹ÃºÄƒÄ‘Ä©Å©Æ¡Æ¯Ä‚áº áº¢áº¤áº¦áº¨áºªáº¬áº®áº°áº²áº´áº¶áº¸áººáº¼á»€á»€á»‚Æ°Äƒáº¡áº£áº¥áº§áº©áº«áº­áº¯áº±áº³áºµáº·áº¹áº»áº½á»á»á»ƒá»„á»†á»ˆá»Šá»Œá»Žá»á»’á»”á»–á»˜á»šá»œá»žá» á»¢á»¤á»¦á»¨á»ªá»…á»‡á»‰á»‹á»á»á»‘á»“á»•á»—á»™á»›á»á»Ÿá»¡á»£á»¥á»§á»©á»«á»¬á»®á»°á»²á»´Ãá»¶á»¸á»­á»¯á»±á»³á»µá»·á»¹\s]+$/;
      if (!nameRegex.test(val)) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regUsername': {
      if (!val) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      if (!/^[a-zA-Z0-9_]{4,20}$/.test(val)) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      if (/^[0-9]/.test(val)) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      const exists = mockUsers.some(u => u.username.toLowerCase() === val.toLowerCase());
      if (exists) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regDob': {
      if (!val) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      const bDate = new Date(val);
      const now = new Date();
      if (bDate > now) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      let age = now.getFullYear() - bDate.getFullYear();
      const m = now.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < bDate.getDate())) age--;
      if (age < 18 || age > 100) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regGender': {
      if (!val) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regPhone': {
      const cleanP = val.replace(/[\s.-]/g, '');
      if (!cleanP) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      if (!/^(03|05|07|08|09)[0-9]{8}$/.test(cleanP)) {
        setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false;
      }
      if (/^(\d)\1{9}$/.test(cleanP) || cleanP === '0123456789' || cleanP === '0987654321') {
        setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false;
      }
      setFieldError(fieldId, ''); return true;
    }
    case 'regEmail': {
      const cleanE = val.toLowerCase();
      if (!cleanE) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanE) || cleanE.includes('..')) {
        setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false;
      }
      const domain = cleanE.split('@')[1];
      if (['test.com', 'example.com', 'fake.com', 'mailinator.com', 'abc.xyz'].includes(domain)) {
        setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false;
      }
      const exists = mockUsers.some(u => u.email.toLowerCase() === cleanE);
      if (exists) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regCccd': {
      const cleanC = val.replace(/\s/g, '');
      if (!cleanC) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      if (!/^[0-9]{12}$/.test(cleanC)) {
        setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false;
      }
      const prov = cleanC.substring(0, 3);
      if (!VALID_PROVINCES.includes(prov)) {
        setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false;
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
          setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!');
          return false;
        }
        const expYear = String(bYear).slice(-2);
        const actYear = cleanC.substring(4, 6);
        if (expYear !== actYear) {
          setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!');
          return false;
        }
      }
      setFieldError(fieldId, ''); return true;
    }
    case 'regPassword': {
      if (!val) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      if (val.length < 6) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      setFieldError(fieldId, ''); return true;
    }
    case 'regPasswordConfirm': {
      const pw = document.getElementById('regPassword')?.value || '';
      if (!val) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
      if (val !== pw) { setFieldError(fieldId, 'ThÃ´ng tin khÃ´ng há»£p lá»‡!'); return false; }
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
    showAuthAlert('ThÃ´ng tin khÃ´ng há»£p lá»‡!');
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
  showToast(`ðŸ“§ ÄÃ£ gá»­i mÃ£ xÃ¡c minh 6 sá»‘ tá»›i ${email}!`);
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
  showToast('ÄÃ£ tá»± Ä‘á»™ng Ä‘iá»n mÃ£ xÃ¡c nháº­n!');
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
      alertBox.innerText = 'ThÃ´ng tin khÃ´ng há»£p lá»‡!';
      alertBox.style.display = 'block';
    }
    return;
  }

  if (!currentPendingRegistration) {
    if (alertBox) {
      alertBox.innerText = 'ThÃ´ng tin khÃ´ng há»£p lá»‡!';
      alertBox.style.display = 'block';
    }
    return;
  }

  if (Date.now() > currentPendingRegistration.expiresAt) {
    if (alertBox) {
      alertBox.innerText = 'MÃ£ xÃ¡c minh Ä‘Ã£ háº¿t háº¡n!';
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
      authToken = resData.token || null;
      if (authToken) localStorage.setItem('selfstorage_auth_token', authToken);
      completeRegistrationSuccess(resData.data);
      return;
    } else if (!res.ok) {
      if (alertBox) {
        alertBox.innerText = resData.message || 'ThÃ´ng tin khÃ´ng há»£p lá»‡!';
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
      alertBox.innerText = 'ThÃ´ng tin khÃ´ng há»£p lá»‡!';
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
    roleTitle: 'KhÃ¡ch hÃ ng thuÃª kho',
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
  showToast(`ðŸŽ‰ ÄÄƒng kÃ½ & xÃ¡c thá»±c email thÃ nh cÃ´ng! ChÃ o má»«ng ${user.name}`);
  addAuditLog(user.name, 'CUSTOMER', 'USER_REGISTER', `ÄÄƒng kÃ½ & xÃ¡c thá»±c thÃ nh cÃ´ng tÃ i khoáº£n @${user.username}`);
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
        btnResend.innerHTML = 'Gá»­i láº¡i mÃ£ má»›i';
      }
    }
  }, 1000);
}

async function resendOtpCode() {
  if (!currentPendingRegistration) return;
  const alertBox = document.getElementById('otpErrorAlert');
  if (alertBox) alertBox.style.display = 'none';

  try {
    const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentPendingRegistration.userData.email })
    });
    const responseData = await response.json();
    if (!response.ok || !responseData.code) {
      if (alertBox) {
        alertBox.innerText = responseData.message || 'KhÃ´ng thá»ƒ gá»­i láº¡i mÃ£ lÃºc nÃ y.';
        alertBox.style.display = 'block';
      }
      return;
    }
    currentPendingRegistration.otpCode = responseData.code;
  } catch (err) {
    currentPendingRegistration.otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  }

  currentPendingRegistration.expiresAt = Date.now() + 5 * 60 * 1000;
  document.getElementById('simulatedOtpCode').innerText = currentPendingRegistration.otpCode;

  startOtpCountdown(60);
  showToast('ðŸ“¬ ÄÃ£ gá»­i láº¡i mÃ£ xÃ¡c minh má»›i vÃ o email cá»§a báº¡n!');
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
  if (document.getElementById('ddUserRoleText')) document.getElementById('ddUserRoleText').innerText = `Vai trÃ²: ${meta.title}`;

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
    const { name, size, price, facilityCode, unitType } = pendingReservationIntent;
    pendingReservationIntent = null;
    navigateToScreen('SCR-C00');
    setTimeout(() => {
      openReservationModal(name, size, price, { facilityCode, unitType });
      showToast(`ChÃ o má»«ng ${user.name}! Báº¡n cÃ³ thá»ƒ tiáº¿p tá»¥c hoÃ n táº¥t Ä‘Æ¡n Ä‘áº·t kho.`);
    }, 400);
    return;
  }

  navigateToScreen(meta.defaultScreen);
}

function applyLoggedOutState() {
  currentUser = null;
  authToken = null;
  currentActor = null;
  localStorage.removeItem('selfstorage_auth_user');
  localStorage.removeItem('selfstorage_auth_token');

  const loggedOutSlot = document.getElementById('authLoggedOutSlot');
  const loggedInSlot = document.getElementById('authLoggedInSlot');
  const branchWrap = document.getElementById('headerBranchWrap');
  if (loggedOutSlot) loggedOutSlot.style.display = 'flex';
  if (loggedInSlot) loggedInSlot.style.display = 'none';
  if (branchWrap) branchWrap.style.display = 'none';

  if (document.getElementById('headerRoleIndicator')) {
    document.getElementById('headerRoleIndicator').innerText = 'KHO ÄÆ N | Há»† THá»NG KHO Tá»° QUáº¢N';
  }

  renderAppNavLinks();
  navigateToScreen('SCR-C00');
}

function logoutUser() {
  if (currentUser) {
    addAuditLog(currentUser.name, currentActor, 'USER_LOGOUT', `ÄÄƒng xuáº¥t khá»i há»‡ thá»‘ng (@${currentUser.username})`);
  }
  applyLoggedOutState();
  showToast('ðŸ‘‹ ÄÃ£ Ä‘Äƒng xuáº¥t khá»i há»‡ thá»‘ng thÃ nh cÃ´ng.');
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
      <span class="nav-item-link ${currentScreen === 'SCR-C00' ? 'active' : ''}" onclick="navigateToScreen('SCR-C00')">Trang chá»§</span>
      <span class="nav-item-link" onclick="scrollToLandingSection('sectionBranchStockPreview')">Sá»‘ lÆ°á»£ng kho cÃ¡c nÆ¡i</span>
      <span class="nav-item-link" onclick="scrollToLandingSection('landing-pricing')">Báº£ng giÃ¡ kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C01' ? 'active' : ''}" onclick="navigateToScreen('SCR-C01')">Tra cá»©u chi nhÃ¡nh</span>
      <span class="nav-item-link" onclick="scrollToLandingSection('landing-facilities')">CÆ¡ sá»Ÿ lÆ°u trá»¯</span>
    `;
    return;
  }

  if (currentActor === 'CUSTOMER') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-C00' ? 'active' : ''}" onclick="navigateToScreen('SCR-C00')">Trang chá»§</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C01' ? 'active' : ''}" onclick="navigateToScreen('SCR-C01')">TÃ¬m kho & Báº£ng giÃ¡</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C02' ? 'active' : ''}" onclick="navigateToScreen('SCR-C02')">Äáº·t giá»¯ chá»—</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C04' ? 'active' : ''}" onclick="navigateToScreen('SCR-C04')">Tháº» Check-in</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C05' ? 'active' : ''}" onclick="navigateToScreen('SCR-C05')">Kho cá»§a tÃ´i & MÃ£ PIN</span>
      <span class="nav-item-link ${currentScreen === 'SCR-C06' ? 'active' : ''}" onclick="navigateToScreen('SCR-C06')">Há»— trá»£ sá»± cá»‘</span>
    `;
  } else if (currentActor === 'STAFF') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-S01' ? 'active' : ''}" onclick="navigateToScreen('SCR-S01')">Ca trá»±c hÃ´m nay</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S02' ? 'active' : ''}" onclick="navigateToScreen('SCR-S02')">Tra cá»©u Ä‘Æ¡n</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S03' ? 'active' : ''}" onclick="navigateToScreen('SCR-S03')">BÃ n giao kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S04' ? 'active' : ''}" onclick="navigateToScreen('SCR-S04')">SÆ¡ Ä‘á»“ máº·t báº±ng</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S05' ? 'active' : ''}" onclick="navigateToScreen('SCR-S05')">Nghiá»‡m thu tráº£ kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S06' ? 'active' : ''}" onclick="navigateToScreen('SCR-S06')">BÃ n sá»± cá»‘</span>
      <span class="nav-item-link ${currentScreen === 'SCR-S07' ? 'active' : ''}" onclick="navigateToScreen('SCR-S07')">Má»Ÿ khÃ³a sá»‘</span>
    `;
  } else if (currentActor === 'FMANAGER') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-M01' ? 'active' : ''}" onclick="navigateToScreen('SCR-M01')">Tá»•ng quan cÆ¡ sá»Ÿ</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M02' ? 'active' : ''}" onclick="navigateToScreen('SCR-M02')">Quáº£n lÃ½ kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M03' ? 'active' : ''}" onclick="navigateToScreen('SCR-M03')">GÃ¡n phÃ²ng kho</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M04' ? 'active' : ''}" onclick="navigateToScreen('SCR-M04')">PhÃ¢n cÃ´ng viá»‡c</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M05' ? 'active' : ''}" onclick="navigateToScreen('SCR-M05')">Há»£p Ä‘á»“ng & Ná»£</span>
      <span class="nav-item-link ${currentScreen === 'SCR-M06' ? 'active' : ''}" onclick="navigateToScreen('SCR-M06')">BÃ¡o cÃ¡o váº­n hÃ nh</span>
    `;
  } else if (currentActor === 'OPS_MGR') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-O01' ? 'active' : ''}" onclick="navigateToScreen('SCR-O01')">Tá»•ng quan chuá»—i</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O02' ? 'active' : ''}" onclick="navigateToScreen('SCR-O02')">5 Chi nhÃ¡nh</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O03' ? 'active' : ''}" onclick="navigateToScreen('SCR-O03')">Báº£ng giÃ¡ & Cá»c</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O04' ? 'active' : ''}" onclick="navigateToScreen('SCR-O04')">BÃ¡o cÃ¡o doanh thu</span>
      <span class="nav-item-link ${currentScreen === 'SCR-O05' ? 'active' : ''}" onclick="navigateToScreen('SCR-O05')">ChÃ­nh sÃ¡ch chung</span>
    `;
  } else if (currentActor === 'ADMIN') {
    nav.innerHTML = `
      <span class="nav-item-link ${currentScreen === 'SCR-A01' ? 'active' : ''}" onclick="navigateToScreen('SCR-A01')">Tá»•ng quan Admin</span>
      <span class="nav-item-link ${currentScreen === 'SCR-A02' ? 'active' : ''}" onclick="navigateToScreen('SCR-A02')">TÃ i khoáº£n</span>
      <span class="nav-item-link ${currentScreen === 'SCR-A03' ? 'active' : ''}" onclick="navigateToScreen('SCR-A03')">PhÃ¢n quyá»n RBAC</span>
      <span class="nav-item-link ${currentScreen === 'SCR-A04' ? 'active' : ''}" onclick="navigateToScreen('SCR-A04')">GÃ¡n cÆ¡ sá»Ÿ</span>
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
      pendingReservationIntent = { name: 'Kho TiÃªu Chuáº©n M', size: '5.0 mÂ²', price: 1450000 };
      showToast('â„¹ï¸ Vui lÃ²ng Ä‘Äƒng nháº­p hoáº·c Ä‘Äƒng kÃ½ tÃ i khoáº£n Ä‘á»ƒ tiáº¿p tá»¥c Ä‘áº·t giá»¯ chá»—!');
      openAuthScreen('LOGIN');
      showAuthAlert('Vui lÃ²ng Ä‘Äƒng nháº­p hoáº·c Ä‘Äƒng kÃ½ tÃ i khoáº£n Ä‘á»ƒ tiáº¿p tá»¥c Ä‘áº·t giá»¯ chá»— kho!');
      return;
    }
    showToast('âš ï¸ Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ truy cáº­p tÃ­nh nÄƒng nÃ y!');
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
    showToast(`â›” Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p mÃ n hÃ¬nh nÃ y! TÃ­nh nÄƒng nÃ y chá»‰ dÃ nh cho vai trÃ² tÆ°Æ¡ng á»©ng.`);
    return;
  }

  currentScreen = screenId;
  displayScreen(screenId);
  renderAppNavLinks();
  if (screenId === 'SCR-S01') loadDailyTasks();
  if (screenId === 'SCR-S04' || screenId === 'SCR-M02') loadManagedUnits();
  if (screenId === 'SCR-M05') { loadPendingRefunds(); loadManagerContracts(); }
  if (screenId === 'SCR-M03') loadAssignableReservations();
  if (screenId === 'SCR-O02') loadFacilities();
  if (screenId === 'SCR-O03') loadPricingPolicies();
  if (screenId === 'SCR-O01' || screenId === 'SCR-O04') loadChainStats();
  if (screenId === 'SCR-M06') loadFacilityReport();
  if (screenId === 'SCR-C05') loadMyContracts();
  if (screenId === 'SCR-C06' || screenId === 'SCR-S06') loadSupportTickets();
  if (screenId === 'SCR-S01') loadSupportTickets();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function displayScreen(screenId) {
  document.querySelectorAll('.screen-panel').forEach(panel => panel.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

function handleBranchChange(val) {
  showToast(`ðŸ“ ÄÃ£ chá»n cÆ¡ sá»Ÿ: ${val}`);
}

// ==============================================================================
// CUSTOMER ACTOR WORKFLOWS
// ==============================================================================

let currentDetailUnit = { name: 'Kho TiÃªu Chuáº©n Medium (M)', size: '5.0 mÂ²', volume: '12.5 mÂ³', price: 1450000 };

function openUnitDetailModal(name, size, volume, price) {
  currentDetailUnit = { name, size, volume, price };
  document.getElementById('mdlDetailUnitTitle').innerText = name;
  document.getElementById('mdlDetailSize').innerText = size;
  document.getElementById('mdlDetailVol').innerText = volume;
  document.getElementById('mdlDetailPrice').innerText = price.toLocaleString('vi-VN') + ' Ä‘/thÃ¡ng';
  openModal('modalUnitDetail');
}

function handleDetailModalBookNow() {
  if (currentDetailUnit) {
    openReservationModal(currentDetailUnit.name, currentDetailUnit.size, currentDetailUnit.price);
  } else {
    openReservationModal('Kho TiÃªu Chuáº©n Medium (M)', '5.0 mÂ²', 1450000);
  }
}

function openReservationModal(name, size, price, bookingContext = {}) {
  closeModal('modalUnitDetail');
  const unitType = bookingContext.unitType || inferUnitType(name);
  currentBookingContext = {
    facilityCode: bookingContext.facilityCode || currentLandingFacilityCode || 'HN-CG',
    unitType,
    name,
    size,
    price
  };
  if (!currentUser) {
    pendingReservationIntent = { ...currentBookingContext };
    showToast('â„¹ï¸ Vui lÃ²ng Ä‘Äƒng nháº­p hoáº·c Ä‘Äƒng kÃ½ tÃ i khoáº£n Ä‘á»ƒ tiáº¿p tá»¥c Ä‘áº·t giá»¯ chá»— kho!');
    openAuthScreen('LOGIN');
    showAuthAlert(`Vui lÃ²ng Ä‘Äƒng nháº­p hoáº·c Ä‘Äƒng kÃ½ tÃ i khoáº£n Ä‘á»ƒ Ä‘áº·t: ${name} (${size})!`);
    return;
  }
  document.getElementById('mdlRsvUnitName').innerText = `${name} (${size})`;
  document.getElementById('mdlRsvPrice').innerText = price.toLocaleString('vi-VN') + ' Ä‘/thÃ¡ng';
  const renterName = document.getElementById('quickRsvName');
  const renterPhone = document.getElementById('quickRsvPhone');
  if (renterName) renterName.value = currentUser.name || '';
  if (renterPhone) renterPhone.value = currentUser.phone || '';
  openModal('modalReservation');
}

function inferUnitType(name) {
  const value = String(name || '').toUpperCase();
  if (value.includes('CLIMATE') || value.includes('Láº NH')) return 'CLIMATE';
  if (value.includes('XL')) return 'L';
  if (value.includes('SIZE L') || value.includes('Lá»šN') || value.includes('KHO L')) return 'L';
  if (value.includes('SIZE S') || value.includes('MINI') || value.includes('KHO S')) return 'S';
  return 'M';
}

// Data & Renderer: Real-time Branch Warehouse Inventory for Guest Explorer
const branchStockData = {
  'HN-CG': {
    name: 'CÆ¡ sá»Ÿ Cáº§u Giáº¥y (120 Duy TÃ¢n, HÃ  Ná»™i)',
    total: 120,
    available: 34,
    reserved: 8,
    occupied: 78,
    units: [
      { code: 'CG-101', name: 'Kho Mini S', size: '2.0 mÂ²', vol: '4.9 mÂ³', price: 650000, stock: 12, floor: 'Táº§ng 1 (Khu A)' },
      { code: 'CG-102', name: 'Kho TiÃªu Chuáº©n M', size: '5.0 mÂ²', vol: '12.5 mÂ³', price: 1450000, stock: 14, floor: 'Táº§ng 1 (Khu A)' },
      { code: 'CG-205', name: 'Kho Lá»›n L', size: '10.0 mÂ²', vol: '25.0 mÂ³', price: 2800000, stock: 6, floor: 'Táº§ng 2 (Khu B)' },
      { code: 'CG-301', name: 'Kho Khoang Lá»›n XL', size: '16.0 mÂ²', vol: '40.0 mÂ³', price: 4200000, stock: 2, floor: 'Táº§ng trá»‡t (Lá»‘i xe táº£i)' }
    ]
  },
  'HCM-Q7': {
    name: 'CÆ¡ sá»Ÿ Quáº­n 7 (Nguyá»…n Thá»‹ Tháº­p, TP.HCM)',
    total: 150,
    available: 42,
    reserved: 10,
    occupied: 98,
    units: [
      { code: 'Q7-101', name: 'Kho Mini S', size: '2.0 mÂ²', vol: '4.9 mÂ³', price: 700000, stock: 16, floor: 'Táº§ng 1' },
      { code: 'Q7-105', name: 'Kho TiÃªu Chuáº©n M', size: '5.0 mÂ²', vol: '12.5 mÂ³', price: 1500000, stock: 18, floor: 'Táº§ng 1 - Khu mÃ¡t' },
      { code: 'Q7-202', name: 'Kho Lá»›n L', size: '10.0 mÂ²', vol: '25.0 mÂ³', price: 2900000, stock: 6, floor: 'Táº§ng 2' },
      { code: 'Q7-308', name: 'Kho Doanh Nghiá»‡p XL', size: '18.0 mÂ²', vol: '45.0 mÂ³', price: 4600000, stock: 2, floor: 'Táº§ng trá»‡t' }
    ]
  },
  'HN-NTL': {
    name: 'CÆ¡ sá»Ÿ Nam Tá»« LiÃªm (Khu CÃ´ng Nghá»‡ Cao, HÃ  Ná»™i)',
    total: 110,
    available: 29,
    reserved: 5,
    occupied: 76,
    units: [
      { code: 'NTL-101', name: 'Kho Mini S', size: '2.0 mÂ²', vol: '4.9 mÂ³', price: 620000, stock: 10, floor: 'Táº§ng 1' },
      { code: 'NTL-104', name: 'Kho TiÃªu Chuáº©n M', size: '5.0 mÂ²', vol: '12.5 mÂ³', price: 1400000, stock: 12, floor: 'Táº§ng 1' },
      { code: 'NTL-201', name: 'Kho Lá»›n L', size: '10.0 mÂ²', vol: '25.0 mÂ³', price: 2700000, stock: 5, floor: 'Táº§ng 2' },
      { code: 'NTL-302', name: 'Kho Khoang Lá»›n XL', size: '16.0 mÂ²', vol: '40.0 mÂ³', price: 4100000, stock: 2, floor: 'Táº§ng trá»‡t' }
    ]
  },
  'HCM-TB': {
    name: 'CÆ¡ sá»Ÿ TÃ¢n BÃ¬nh (Cá»™ng HÃ²a / KCN TÃ¢n BÃ¬nh, TP.HCM)',
    total: 140,
    available: 38,
    reserved: 7,
    occupied: 95,
    units: [
      { code: 'TB-101', name: 'Kho Mini S', size: '2.0 mÂ²', vol: '4.9 mÂ³', price: 680000, stock: 15, floor: 'Táº§ng 1' },
      { code: 'TB-106', name: 'Kho TiÃªu Chuáº©n M', size: '5.0 mÂ²', vol: '12.5 mÂ³', price: 1480000, stock: 14, floor: 'Táº§ng 1' },
      { code: 'TB-203', name: 'Kho Lá»›n L', size: '10.0 mÂ²', vol: '25.0 mÂ³', price: 2850000, stock: 7, floor: 'Táº§ng 2' },
      { code: 'TB-305', name: 'Kho Doanh Nghiá»‡p XL', size: '16.0 mÂ²', vol: '40.0 mÂ³', price: 4300000, stock: 2, floor: 'Táº§ng trá»‡t' }
    ]
  },
  'DN-HC': {
    name: 'CÆ¡ sá»Ÿ Háº£i ChÃ¢u (Nguyá»…n VÄƒn Linh, ÄÃ  Náºµng)',
    total: 90,
    available: 24,
    reserved: 4,
    occupied: 62,
    units: [
      { code: 'HC-101', name: 'Kho Mini S', size: '2.0 mÂ²', vol: '4.9 mÂ³', price: 600000, stock: 8, floor: 'Táº§ng 1' },
      { code: 'HC-103', name: 'Kho TiÃªu Chuáº©n M', size: '5.0 mÂ²', vol: '12.5 mÂ³', price: 1350000, stock: 10, floor: 'Táº§ng 1' },
      { code: 'HC-201', name: 'Kho Lá»›n L', size: '10.0 mÂ²', vol: '25.0 mÂ³', price: 2600000, stock: 4, floor: 'Táº§ng 2' },
      { code: 'HC-301', name: 'Kho Khoang Lá»›n XL', size: '15.0 mÂ²', vol: '38.0 mÂ³', price: 3900000, stock: 2, floor: 'Táº§ng trá»‡t' }
    ]
  }
};

async function renderLandingBranchInventory(facilityCode = 'HN-CG') {
  currentLandingFacilityCode = facilityCode;
  let data = branchStockData[facilityCode] || branchStockData['HN-CG'];
  try {
    const response = await fetch(`${API_BASE}/api/facilities/inventory/${encodeURIComponent(facilityCode)}`);
    if (response.ok) {
      const result = await response.json();
      const inventory = result.data || result;
      const typeNames = { S: 'Kho Mini S', M: 'Kho TiÃªu Chuáº©n M', L: 'Kho Lá»›n L', CLIMATE: 'Kho kiá»ƒm soÃ¡t nhiá»‡t áº©m' };
      data = {
        name: inventory.facilityName,
        total: Number(inventory.total || 0),
        available: Number(inventory.available || 0),
        reserved: Number(inventory.reserved || 0),
        occupied: Number(inventory.occupied || 0),
        units: (inventory.units || []).map(unit => ({
          code: unit.code,
          type: unit.type,
          name: typeNames[unit.type] || `Kho ${unit.type}`,
          size: unit.sizeDesc || `${unit.sizeSqm} mÂ²`,
          vol: `${Number(unit.volumeM3 || 0).toFixed(1)} mÂ³`,
          price: Number(unit.pricePerMonth || 0),
          stock: unit.status === 'available' ? 1 : 0,
          status: unit.status,
          floor: unit.floor == null ? 'ChÆ°a cáº­p nháº­t táº§ng' : `Táº§ng ${unit.floor}`
        }))
      };
    }
  } catch (error) {
    console.warn('[Inventory] Backend unavailable; using demo inventory.', error);
  }
  const statsBar = document.getElementById('landingBranchStatsBar');
  const unitsGrid = document.getElementById('landingBranchUnitsGrid');

  if (statsBar) {
    statsBar.innerHTML = `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 16px;">
        <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Tá»•ng phÃ²ng kho</div>
        <div style="font-size:22px; font-weight:800; color:#0f172a; margin-top:2px;">${data.total} <span style="font-size:13px; font-weight:600; color:#64748b;">phÃ²ng</span></div>
      </div>
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px 16px;">
        <div style="font-size:11px; font-weight:700; color:#166534; text-transform:uppercase;">ðŸŸ¢ CÃ²n trá»‘ng sáºµn sÃ ng</div>
        <div style="font-size:22px; font-weight:800; color:#15803d; margin-top:2px;">${data.available} <span style="font-size:13px; font-weight:600; color:#166534;">kho</span></div>
      </div>
      <div style="background:#fefce8; border:1px solid #fef08a; border-radius:10px; padding:12px 16px;">
        <div style="font-size:11px; font-weight:700; color:#854d0e; text-transform:uppercase;">ðŸŸ¡ KhÃ¡ch Ä‘ang giá»¯ chá»—</div>
        <div style="font-size:22px; font-weight:800; color:#ca8a04; margin-top:2px;">${data.reserved} <span style="font-size:13px; font-weight:600; color:#854d0e;">kho</span></div>
      </div>
      <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:10px; padding:12px 16px;">
        <div style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase;">ðŸ”´ Äang cho thuÃª</div>
        <div style="font-size:22px; font-weight:800; color:#334155; margin-top:2px;">${data.occupied} <span style="font-size:13px; font-weight:600; color:#475569;">kho</span></div>
      </div>
    `;
  }

  if (unitsGrid) {
    unitsGrid.innerHTML = data.units.map(u => {
      const stateLabels = {
        available: ['CÃ²n trá»‘ng', 'badge-success'],
        reserved: ['Äang giá»¯ chá»—', 'badge-warning'],
        occupied: ['Äang cho thuÃª', 'badge-secondary'],
        cleaning: ['Äang vá»‡ sinh', 'badge-warning'],
        maintenance: ['Báº£o trÃ¬', 'badge-danger']
      };
      const state = stateLabels[u.status || 'available'] || stateLabels.available;
      return `
      <div class="ui-card" style="display:flex; flex-direction:column; justify-content:space-between; padding:18px; border:1px solid #e2e8f0; border-radius:12px; transition:transform 0.2s, box-shadow 0.2s; background:#ffffff;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:11px; font-weight:800; color:#2563eb; background:#eff6ff; padding:3px 8px; border-radius:6px; letter-spacing:0.5px;">${u.code}</span>
            <span class="badge ${state[1]}" style="font-size:11px;">${state[0]}</span>
          </div>
          <h4 style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px;">${u.name}</h4>
          <div style="font-size:12.5px; color:#64748b; margin-bottom:10px;">
            ðŸ“ Diá»‡n tÃ­ch: <strong>${u.size}</strong> â€¢ Thá»ƒ tÃ­ch: <strong>${u.vol}</strong><br>
            ðŸ“ Vá»‹ trÃ­: ${u.floor}
          </div>
          <div style="font-size:12px; color:#475569; display:flex; flex-direction:column; gap:3px; margin-bottom:14px; background:#f8fafc; padding:8px 10px; border-radius:8px;">
            <div>ðŸ”’ KhÃ³a Ä‘iá»‡n tá»­ PIN + ChÃ¬a Titan</div>
            <div>â„ï¸ Cáº£m biáº¿n áº©m 55-65% chá»‘ng má»‘c</div>
            <div>ðŸ›¡ï¸ Camera báº£o vá»‡ trá»±c diá»‡n 24/7</div>
          </div>
        </div>
        <div>
          <div style="margin-bottom:12px;">
            <span style="font-size:19px; font-weight:800; color:#1e40af;">${u.price.toLocaleString('vi-VN')} Ä‘</span>
            <span style="font-size:12px; color:#64748b;">/thÃ¡ng</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm" style="flex:1; justify-content:center; font-weight:700; padding:7px 8px; font-size:12px;" onclick="openUnitDetailModal('${u.name}', '${u.size}', '${u.vol}', ${u.price})">
              ðŸ” Chi tiáº¿t
            </button>
            <button class="btn btn-primary btn-sm" ${u.status && u.status !== 'available' ? 'disabled' : ''} style="flex:1; justify-content:center; font-weight:700; padding:7px 8px; font-size:12px;" onclick="openReservationModal('${u.name}', '${u.size}', ${u.price}, {facilityCode:'${facilityCode}', unitType:'${u.type || inferUnitType(u.name)}'})">
              âš¡ Äáº·t kho
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');
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
  document.getElementById('sumDuration').innerText = dur + ' ThÃ¡ng';
  document.getElementById('sumDiscount').innerText = '- ' + discountAmt.toLocaleString('vi-VN') + ' Ä‘';
  document.getElementById('sumDeposit').innerText = baseMonthly.toLocaleString('vi-VN') + ' Ä‘';
  document.getElementById('sumPayNow').innerText = baseMonthly.toLocaleString('vi-VN') + ' Ä‘';
}

async function confirmReservation() {
  if (!currentUser || !authToken) {
    pendingReservationIntent = { ...currentBookingContext };
    closeModal('modalReservation');
    openAuthScreen('LOGIN');
    showAuthAlert('Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i Ä‘á»ƒ Ä‘áº·t giá»¯ chá»—.');
    return;
  }
  const durationMonths = Number(document.getElementById('quickRsvDuration')?.value || 3);
  const body = {
    facilityCode: currentBookingContext.facilityCode,
    unitType: currentBookingContext.unitType,
    durationMonths,
    startDate: new Date().toISOString().slice(0, 10)
  };
  try {
    const response = await apiFetch('/api/reservations', { method: 'POST', body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || 'KhÃ´ng thá»ƒ táº¡o reservation.');
    }
    currentReservation = result.data;
    currentBookingContext.depositAmount = Number(currentReservation.depositAmount || 0);
    currentBookingContext.durationMonths = durationMonths;
    closeModal('modalReservation');
    navigateToScreen('SCR-C03');
    setPaymentType('DEPOSIT');
    showToast(`ÄÃ£ táº¡o Ä‘Æ¡n ${currentReservation.id}. Thanh toÃ¡n cá»c Ä‘á»ƒ giá»¯ chá»—.`);
    addAuditLog(currentUser.name, 'CUSTOMER', 'CREATE_RESERVATION', `Táº¡o reservation ${currentReservation.id}`);
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ káº¿t ná»‘i backend Ä‘á»ƒ táº¡o Ä‘Æ¡n.');
  }
}

function setPaymentType(type) {
  currentPaymentType = type;
  const title = document.getElementById('lblInvoiceTitle');
  const item = document.getElementById('tblInvoiceItemName');
  const total = document.getElementById('tblInvoiceTotal');
  const amt = document.getElementById('tblInvoiceAmount');
  const qrDesc = document.getElementById('qrTransferContent');

  if (type === 'DEPOSIT') {
    title.innerText = 'HÃ³a Ä‘Æ¡n tiá»n cá»c giá»¯ chá»— (Security Deposit)';
    const reservationId = currentReservation?.id || 'ChÆ°a cÃ³ reservation';
    const deposit = Number(currentReservation?.depositAmount || currentBookingContext.depositAmount || currentBookingContext.price || 0);
    item.innerText = `Tiá»n cá»c ${currentBookingContext.name || 'kho'} (MÃ£ Ä‘Æ¡n: ${reservationId})`;
    total.innerText = deposit.toLocaleString('vi-VN') + ' Ä‘';
    amt.innerText = deposit.toLocaleString('vi-VN') + ' Ä‘';
    qrDesc.innerText = `TT COC ${reservationId}`;
  } else if (type === 'RENT') {
    title.innerText = 'HÃ³a Ä‘Æ¡n cÆ°á»›c thuÃª phÃ²ng kho ká»³ Ä‘áº§u';
    const rent = Number(currentBookingContext.price || 0);
    item.innerText = `Tiá»n thuÃª ká»³ Ä‘áº§u (${currentReservation?.unitCode || 'chá» Manager gÃ¡n Unit'})`;
    total.innerText = rent.toLocaleString('vi-VN') + ' Ä‘';
    amt.innerText = rent.toLocaleString('vi-VN') + ' Ä‘';
    qrDesc.innerText = `THUE ${currentReservation?.id || ''}`;
  } else if (type === 'RENEW') {
    title.innerText = 'HÃ³a Ä‘Æ¡n gia háº¡n há»£p Ä‘á»“ng thuÃª kho';
    const quote = currentRenewalQuote || { durationMonths: 1, totalAmount: 0, contractId: '' };
    item.innerText = `Gia háº¡n ${quote.durationMonths} thÃ¡ng (${quote.contractId})`;
    total.innerText = Number(quote.totalAmount || 0).toLocaleString('vi-VN') + ' Ä‘';
    amt.innerText = Number(quote.totalAmount || 0).toLocaleString('vi-VN') + ' Ä‘';
    qrDesc.innerText = `GIA HAN ${quote.contractId}`;
  } else if (type === 'EXTRA') {
    title.innerText = 'HÃ³a Ä‘Æ¡n phá»¥ phÃ­ dá»‹ch vá»¥ phÃ¡t sinh';
    item.innerText = 'PhÃ­ vá»‡ sinh chuyÃªn sÃ¢u & thay á»• khÃ³a cÆ¡ má»›i';
    total.innerText = '200.000 Ä‘';
    amt.innerText = '200.000 Ä‘';
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

async function simulatePaymentSuccess() {
  if (!authToken || ((currentPaymentType === 'DEPOSIT' || currentPaymentType === 'RENT') && !currentReservation?.id)
      || (currentPaymentType === 'RENEW' && !currentRenewalQuote?.contractId)) {
    showToast('Thiáº¿u thÃ´ng tin há»£p Ä‘á»“ng hoáº·c reservation Ä‘á»ƒ thanh toÃ¡n.');
    return;
  }
  const isDeposit = currentPaymentType === 'DEPOSIT';
  const isRenew = currentPaymentType === 'RENEW';
  if (!isDeposit && currentPaymentType !== 'RENT' && !isRenew) {
    showToast('Loáº¡i thanh toÃ¡n nÃ y chÆ°a Ä‘Æ°á»£c ná»‘i vá»›i backend.');
    return;
  }
  const amount = isDeposit
    ? Number(currentReservation.depositAmount || currentBookingContext.depositAmount || 0)
    : isRenew ? Number(currentRenewalQuote.totalAmount || 0) : Number(currentBookingContext.price || 0);
  const endpoint = isDeposit ? '/api/payments/deposit' : isRenew ? '/api/payments/renew' : '/api/payments/rent';
  const body = isRenew
    ? { contractId: currentRenewalQuote.contractId, durationMonths: currentRenewalQuote.durationMonths, amount, paymentMethod: 'VietQR Napas247' }
    : { reservationId: currentReservation.id, amount, paymentMethod: 'VietQR Napas247' };
  try {
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Thanh toÃ¡n tháº¥t báº¡i.');
    if (isDeposit) currentReservation.status = 'RESERVED';
    showToast(`Thanh toÃ¡n thÃ nh cÃ´ng. MÃ£ giao dá»‹ch ${result.data?.transactionCode || result.data?.id || ''}`);
    addAuditLog(currentUser.name, 'CUSTOMER', 'PAYMENT_CONFIRM', `Thanh toÃ¡n ${currentPaymentType} cho ${currentReservation.id}`);
    if (isDeposit) {
      setTimeout(() => {
        navigateToScreen('SCR-C04');
        showToast(`Reservation ${currentReservation.id} Ä‘Ã£ Ä‘Æ°á»£c giá»¯ chá»—; chá» Manager gÃ¡n Unit.`);
      }, 500);
    } else if (isRenew) {
      currentRenewalQuote = null;
      await loadMyContracts();
      showToast('Há»£p Ä‘á»“ng Ä‘Ã£ Ä‘Æ°á»£c gia háº¡n vÃ  PIN Ä‘Ã£ Ä‘Æ°á»£c kÃ­ch hoáº¡t.');
    }
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ káº¿t ná»‘i backend Ä‘á»ƒ thanh toÃ¡n.');
  }
}

function togglePinVisibility() {
  const pin = currentContract?.pinCode;
  if (!pin) return showToast('ChÆ°a cÃ³ PIN cá»§a há»£p Ä‘á»“ng Ä‘ang hoáº¡t Ä‘á»™ng.');
  isPinVisible = !isPinVisible;
  const box = document.getElementById('pinDisplayBox');
  const btn = document.getElementById('btnPinEyeText');
  if (isPinVisible) {
    box.innerText = pin.split('').join(' ');
    box.style.color = '#10b981';
    btn.innerText = 'ðŸ”’ áº¨n mÃ£ PIN';
  } else {
    box.innerText = 'â— â— â— â— â— â—';
    box.style.color = '#38bdf8';
    btn.innerText = 'ðŸ‘ï¸ Hiá»‡n mÃ£ PIN';
  }
}

function copyPinCode() {
  const pin = currentContract?.pinCode;
  if (!pin) return showToast('ChÆ°a cÃ³ PIN cá»§a há»£p Ä‘á»“ng Ä‘ang hoáº¡t Ä‘á»™ng.');
  navigator.clipboard.writeText(pin).then(() => {
    showToast('ÄÃ£ sao chÃ©p mÃ£ PIN.');
  }).catch(() => {
    showToast('KhÃ´ng thá»ƒ sao chÃ©p PIN trÃªn trÃ¬nh duyá»‡t nÃ y.');
  });
}

function openChangePinModal() {
  openModal('modalChangePin');
}

async function saveNewPin() {
  const p1 = document.getElementById('txtNewPin').value;
  const p2 = document.getElementById('txtConfirmPin').value;
  if (p1.length !== 6 || p1 !== p2) {
    alert('MÃ£ PIN pháº£i gá»“m Ä‘Ãºng 6 chá»¯ sá»‘ vÃ  hai láº§n nháº­p pháº£i giá»‘ng nhau!');
    return;
  }
  if (!currentContract?.unitCode) return showToast('ChÆ°a táº£i há»£p Ä‘á»“ng Ä‘ang thuÃª.');
  try {
    const response = await apiFetch(`/api/contracts/${encodeURIComponent(currentContract.unitCode)}/pin`, {
      method: 'PATCH', body: JSON.stringify({ newPin: p1 })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ Ä‘á»•i PIN.');
    currentContract = result.data;
    closeModal('modalChangePin');
    showToast('ÄÃ£ Ä‘á»•i mÃ£ PIN má»›i trÃªn há»£p Ä‘á»“ng vÃ  Unit.');
    addAuditLog(currentUser.name, currentActor, 'UPDATE_PIN', `Äá»•i PIN Unit ${currentContract.unitCode}`);
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ Ä‘á»•i PIN.');
  }
}

async function openRenewalModal(unit) {
  if (!currentContracts.length) await loadMyContracts();
  const contract = currentContracts.find(item => item.unitCode === unit && ['ACTIVE', 'EXPIRING_SOON', 'OVERDUE'].includes(item.status));
  if (!contract) return showToast(`KhÃ´ng tÃ¬m tháº¥y há»£p Ä‘á»“ng cÃ³ thá»ƒ gia háº¡n cá»§a Unit ${unit}.`);
  const monthsText = prompt('Sá»‘ thÃ¡ng muá»‘n gia háº¡n (1-36):', '1');
  const months = Number(monthsText || 1);
  if (!Number.isInteger(months) || months < 1 || months > 36) return showToast('Sá»‘ thÃ¡ng gia háº¡n khÃ´ng há»£p lá»‡.');
  try {
    const response = await apiFetch(`/api/contracts/${encodeURIComponent(contract.id)}/renewal-quote?months=${months}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ tÃ­nh phÃ­ gia háº¡n.');
    currentRenewalQuote = result.data;
    navigateToScreen('SCR-C03');
    setPaymentType('RENEW');
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ tÃ­nh phÃ­ gia háº¡n.');
  }
}

async function openCheckoutRequestModal(unit) {
  if (!currentContracts.length) await loadMyContracts();
  const contract = currentContracts.find(item => item.unitCode === unit
    && ['ACTIVE', 'EXPIRING_SOON', 'OVERDUE'].includes(item.status));
  if (!contract) return showToast(`KhÃ´ng tÃ¬m tháº¥y há»£p Ä‘á»“ng Ä‘ang thuÃª cá»§a Unit ${unit}.`);
  if (confirm(`Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n gá»­i yÃªu cáº§u tráº£ phÃ²ng kho ${unit}? Lá»‹ch háº¹n nghiá»‡m thu sáº½ Ä‘Æ°á»£c chuyá»ƒn Ä‘áº¿n NhÃ¢n viÃªn ca trá»±c.`)) {
    try {
      const response = await apiFetch('/api/contracts/checkout-request', {
        method: 'POST',
        body: JSON.stringify({ contractId: contract.id, requestedDate: new Date().toISOString().slice(0, 10) })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ gá»­i yÃªu cáº§u tráº£ kho.');
      currentContract = result.data;
      showToast(`ÄÃ£ táº¡o lá»‹ch nghiá»‡m thu cho Unit ${unit}.`);
      addAuditLog(currentUser.name, currentActor, 'REQUEST_CHECKOUT', `Checkout ${contract.id}`);
    } catch (error) {
      showToast(error.message || 'KhÃ´ng thá»ƒ gá»­i yÃªu cáº§u tráº£ kho.');
    }
  }
}

async function loadMyContracts() {
  if (!authToken || currentActor !== 'CUSTOMER') return;
  try {
    const response = await apiFetch('/api/contracts');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c há»£p Ä‘á»“ng.');
    currentContracts = result.data || [];
    currentContract = currentContracts.find(contract => contract.status === 'ACTIVE') || currentContracts[0] || null;
  } catch (error) {
    showToast(error.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c há»£p Ä‘á»“ng.');
  }
}

async function submitSupportTicket() {
  if (!authToken || currentActor !== 'CUSTOMER') {
    return showToast('Vui l?ng ??ng nh?p b?ng t?i kho?n kh?ch h?ng.');
  }
  const desc = document.getElementById('ticketDesc')?.value.trim();
  const unit = document.getElementById('ticketUnitSelect')?.value;
  const category = document.getElementById('ticketCategorySelect')?.value || 'GENERAL';
  const priorityText = document.getElementById('ticketPrioritySelect')?.value || '';
  const priority = priorityText.toLowerCase().includes('kh?n') ? 'URGENT'
    : priorityText.toLowerCase().includes('cao') ? 'HIGH' : 'NORMAL';
  const attachmentUrl = document.getElementById('ticketAttachmentUrl')?.value.trim();
  if (!desc || !unit) return showToast('Ch?n kho v? nh?p m? t? s? c?.');
  try {
    const response = await apiFetch('/api/tasks/tickets', {
      method: 'POST',
      body: JSON.stringify({ unitCode: unit, category, description: desc, priority, attachmentUrl })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Kh?ng th? t?o ticket.');
    document.getElementById('ticketDesc').value = '';
    if (document.getElementById('ticketAttachmentUrl')) document.getElementById('ticketAttachmentUrl').value = '';
    showToast(`?? t?o ticket ${result.data.id} v? chuy?n ??n nh?n vi?n c? s?.`);
    await loadSupportTickets();
  } catch (error) {
    showToast(error.message || 'Kh?ng th? t?o ticket.');
  }
}

async function loadSupportTickets() {
  if (!authToken || !['CUSTOMER', 'STAFF', 'FMANAGER', 'FACILITY_MANAGER'].includes(currentActor)) return;
  try {
    if (currentActor === 'CUSTOMER') {
      await loadMyContracts();
      const unitSelect = document.getElementById('ticketUnitSelect');
      const rented = currentContracts.filter(contract => ['ACTIVE', 'EXPIRING_SOON', 'OVERDUE'].includes(contract.status));
      if (unitSelect) unitSelect.innerHTML = rented.map(contract =>
        `<option value="${escapeHtml(contract.unitCode)}">Unit ${escapeHtml(contract.unitCode)} (${escapeHtml(contract.facilityCode || '')})</option>`
      ).join('') || '<option value="">Ch?a c? kho ?ang thu?</option>';
    }
    const response = await apiFetch('/api/tasks/tickets');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Kh?ng t?i ???c ticket.');
    const tickets = result.data || [];
    renderSupportTicketsTable(tickets);
    renderStaffSupportTickets(tickets);
  } catch (error) {
    console.warn('[Tickets] Unable to load tickets', error);
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function renderSupportTicketsTable(tickets = []) {
  const container = document.getElementById('supportTicketsHistory');
  if (!container) return;
  const empty = document.getElementById('supportTicketsEmptyState');
  if (!tickets.length) {
    container.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  container.innerHTML = tickets.map(ticket => `
    <div style="border-bottom:1px solid #e2e8f0; padding:10px 0;">
      <div style="display:flex; justify-content:space-between; gap:8px;">
        <span class="code-display">${escapeHtml(ticket.id)}</span>
        <span class="badge ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'badge-success' : 'badge-warning'}">${escapeHtml(ticket.status)}</span>
      </div>
      <div style="font-weight:700; margin:5px 0;">${escapeHtml(ticket.category || ticket.title)}</div>
      <div style="font-size:13px; color:#475569;">${escapeHtml(ticket.description || '')}</div>
      <div style="font-size:12px; color:#64748b; margin-top:5px;">Unit ${escapeHtml(ticket.unitCode)} ? ${escapeHtml(ticket.priority)}${ticket.staffAssigned ? ` ? ${escapeHtml(ticket.staffAssigned)}` : ''}</div>
      ${ticket.status === 'RESOLVED' ? `<button class="btn btn-outline btn-sm" style="margin-top:8px;" onclick="closeSupportTicket('${escapeHtml(ticket.id)}')">??ng ticket</button>` : ''}
    </div>`).join('');
}

function renderStaffSupportTickets(tickets = []) {
  const rows = tickets.map(ticket => `<tr>
    <td><span class="code-display">${escapeHtml(ticket.id)}</span></td>
    <td>${escapeHtml(ticket.category || ticket.title)}</td>
    <td>${escapeHtml(ticket.unitCode || '')}</td>
    <td><span class="badge ${ticket.priority === 'URGENT' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(ticket.priority)}</span></td>
    <td>${ticket.status === 'OPEN' ? `<button class="btn btn-primary btn-sm" onclick="updateSupportTicket('${escapeHtml(ticket.id)}','IN_PROGRESS')">Ti?p nh?n</button>` : ticket.status === 'IN_PROGRESS' ? `<button class="btn btn-success btn-sm" onclick="updateSupportTicket('${escapeHtml(ticket.id)}','RESOLVED')">?? x? l?</button>` : escapeHtml(ticket.status)}</td>
  </tr>`).join('') || '<tr><td colspan="5">Kh?ng c? ticket.</td></tr>';
  const queue = document.getElementById('staffSupportQueueBody');
  if (queue) queue.innerHTML = rows;
  const incident = document.getElementById('incidentTicketsBody');
  if (incident) incident.innerHTML = tickets.map(ticket => `<tr>
    <td><span class="code-display">${escapeHtml(ticket.id)}</span></td><td>${escapeHtml(ticket.customerName || '')}</td><td><strong>${escapeHtml(ticket.unitCode || '')}</strong></td>
    <td>${escapeHtml(ticket.description || ticket.category || '')}</td><td><span class="badge ${ticket.priority === 'URGENT' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(ticket.priority)}</span></td>
    <td>${ticket.status === 'OPEN' ? `<button class="btn btn-primary btn-sm" onclick="updateSupportTicket('${escapeHtml(ticket.id)}','IN_PROGRESS')">Ti?p nh?n</button>` : ticket.status === 'IN_PROGRESS' ? `<button class="btn btn-success btn-sm" onclick="updateSupportTicket('${escapeHtml(ticket.id)}','RESOLVED')">Ho?n t?t</button>` : escapeHtml(ticket.status)}</td>
  </tr>`).join('') || '<tr><td colspan="6">Kh?ng c? s? c?.</td></tr>';
}

async function updateSupportTicket(ticketId, status, extra = {}) {
  try {
    const response = await apiFetch(`/api/tasks/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'PATCH', body: JSON.stringify({ status, ...extra })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Kh?ng th? c?p nh?t ticket.');
    showToast(`Ticket ${ticketId}: ${status}`);
    await loadSupportTickets();
  } catch (error) {
    showToast(error.message || 'Kh?ng th? c?p nh?t ticket.');
  }
}

async function closeSupportTicket(ticketId) {
  const rating = Number(prompt('??nh gi? d?ch v? t? 1 ??n 5:', '5'));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
  await updateSupportTicket(ticketId, 'CLOSED', { rating, feedback: 'Customer confirmed resolution.' });
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
  loadDailyTasks();
}

async function loadDailyTasks() {
  if (!authToken || !['STAFF', 'FMANAGER', 'FACILITY_MANAGER'].includes(currentActor)) return;
  try {
    const response = await apiFetch(`/api/tasks/daily?date=${new Date().toISOString().slice(0, 10)}`);
    const result = await response.json();
    if (!response.ok || !result.success) return;
    const tasks = result.data || [];
    const checkinBody = document.getElementById('checkinTasksBody');
    const returnBody = document.getElementById('returnTasksBody');
    const checkins = tasks.filter(task => task.taskType === 'CHECKIN');
    const returns = tasks.filter(task => task.taskType === 'RETURN');
    if (checkinBody) checkinBody.innerHTML = checkins.map(task => `
      <tr>
        <td><strong>${task.deadline || ''}</strong></td><td>${task.staff || ''}</td><td>-</td>
        <td><span class="code-display">${task.reservationId || ''}</span></td><td>${task.unitCode || 'ChÆ°a gÃ¡n'}</td>
        <td><span class="badge ${task.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}">${task.status}</span></td>
        <td><button class="btn btn-primary btn-sm" onclick="startCheckinForCustomer('${task.reservationId || ''}')">Ti?n h?nh Check-in</button> ${task.status !== 'COMPLETED' ? `<button class="btn btn-outline btn-sm" onclick="updateDailyTask('${task.id}','${task.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED'}')">${task.status === 'PENDING' ? 'Nh?n vi?c' : 'Ho?n t?t'}</button>` : ''}</td>
      </tr>`).join('') || '<tr><td colspan="7">KhÃ´ng cÃ³ lá»‹ch check-in hÃ´m nay.</td></tr>';
    if (returnBody) returnBody.innerHTML = returns.map(task => `
      <tr>
        <td>${task.deadline || ''}</td><td>${task.staff || ''}</td>
        <td><span class="code-display">${task.contractId || ''}</span></td><td>${task.unitCode || ''}</td>
        <td>-</td><td><button class="btn btn-primary btn-sm" onclick="startReturnInspection('${task.contractId || ''}', '${task.unitCode || ''}')">B?t ??u nghi?m thu</button> ${task.status !== 'COMPLETED' ? `<button class="btn btn-outline btn-sm" onclick="updateDailyTask('${task.id}','${task.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED'}')">${task.status === 'PENDING' ? 'Nh?n vi?c' : 'Ho?n t?t'}</button>` : ''}</td>
      </tr>`).join('') || '<tr><td colspan="6">KhÃ´ng cÃ³ lá»‹ch tráº£ kho hÃ´m nay.</td></tr>';
  } catch (error) {
    console.warn('[Tasks] Unable to load daily tasks', error);
  }
}

async function updateDailyTask(taskId, status) {
  try {
    const response = await apiFetch(`/api/tasks/${encodeURIComponent(taskId)}/status`, {
      method: 'PATCH', body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Kh?ng th? c?p nh?t nhi?m v?.');
    await loadDailyTasks();
  } catch (error) {
    showToast(error.message || 'Kh?ng th? c?p nh?t nhi?m v?.');
  }
}

function startCheckinForCustomer(rsv) {
  navigateToScreen('SCR-S02');
  const input = document.getElementById('txtSearchReservation');
  if (input) input.value = rsv;
  showToast(`Äang tra cá»©u há»“ sÆ¡ Ä‘Æ¡n Ä‘áº·t chá»— ${rsv}...`);
}

async function lookupReservation() {
  const reservationId = document.getElementById('txtSearchReservation')?.value.trim();
  if (!reservationId) return showToast('Nháº­p mÃ£ reservation, CCCD hoáº·c sá»‘ Ä‘iá»‡n thoáº¡i cáº§n tra cá»©u.');
  try {
    let response = await apiFetch(`/api/reservations/${encodeURIComponent(reservationId)}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      response = await apiFetch(`/api/reservations/lookup?query=${encodeURIComponent(reservationId)}`);
      const lookupResult = await response.json();
      if (!response.ok || !lookupResult.success || !lookupResult.data?.length) {
        throw new Error(lookupResult.message || 'KhÃ´ng tÃ¬m tháº¥y reservation.');
      }
      currentReservation = lookupResult.data[0];
    } else {
      currentReservation = result.data;
    }
    showToast(`Reservation ${currentReservation.id}: ${currentReservation.status}, Unit ${currentReservation.unitCode || 'chÆ°a gÃ¡n'}.`);
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ tra cá»©u reservation.');
  }
}

async function completeHandoverProtocol() {
  if (!currentReservation?.id) return showToast('Tra cá»©u reservation trÆ°á»›c khi bÃ n giao.');
  try {
    const response = await apiFetch('/api/contracts/handover', {
      method: 'POST',
      body: JSON.stringify({
        reservationId: currentReservation.id,
        customerSignatureConfirmed: true,
        lock: document.getElementById('handoverLock')?.value || null,
        rfid: document.getElementById('handoverRfid')?.value || null,
        unitConditionNotes: 'Staff xÃ¡c nháº­n checklist bÃ n giao Ä‘áº¡t yÃªu cáº§u.'
      })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ hoÃ n táº¥t bÃ n giao.');
    currentContract = result.data;
    showToast(`BÃ n giao thÃ nh cÃ´ng; há»£p Ä‘á»“ng ${currentContract.id} Ä‘Ã£ ACTIVE.`);
    addAuditLog(currentUser.name, currentActor, 'HANDOVER_COMPLETE', `BÃ n giao ${currentContract.unitCode}`);
    loadDailyTasks();
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ hoÃ n táº¥t bÃ n giao.');
  }
}

function startReturnInspection(contractId, unitCode) {
  currentContract = { id: contractId, unitCode };
  navigateToScreen('SCR-S05');
}

async function completeReturnInspection() {
  if (!currentContract?.unitCode) return showToast('Chá»n contract tá»« danh sÃ¡ch lá»‹ch tráº£ trÆ°á»›c.');
  try {
    const response = await apiFetch('/api/contracts/return-inspection', {
      method: 'POST',
      body: JSON.stringify({
        unitCode: currentContract.unitCode,
        cleanlinessStatus: 'CLEAN',
        damageNotes: '',
        deductions: 0
      })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ lÆ°u inspection.');
    showToast(`Nghiá»‡m thu Ä‘Ã£ lÆ°u. YÃªu cáº§u hoÃ n ${Number(result.data.refundAmount || 0).toLocaleString('vi-VN')} Ä‘ Ä‘ang chá» Manager duyá»‡t.`);
    addAuditLog(currentUser.name, currentActor, 'RETURN_INSPECTION', `Inspection ${result.data.inspectionId}`);
    loadDailyTasks();
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ lÆ°u inspection.');
  }
}

async function openEmergencyPinModal() {
  const unitCode = currentContract?.unitCode || 'A-102';
  try {
    const response = await apiFetch('/api/tasks/emergency-pin', {
      method: 'POST', body: JSON.stringify({ unitCode })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ cáº¥p PIN táº¡m thá»i.');
    const pinData = result.data;
    alert(`[GIAO THá»¨C KHáº¨N Cáº¤P Táº I QUáº¦Y]\nMÃ£ PIN táº¡m thá»i hiá»‡u lá»±c ${pinData.expiresInMinutes} phÃºt: ${pinData.tempPin}`);
    showToast(`ÄÃ£ cáº¥p mÃ£ PIN táº¡m thá»i cho Unit ${unitCode}.`);
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ cáº¥p PIN táº¡m thá»i.');
  }
}

function openLostKeyModal() {
  if (confirm('Láº­p biÃªn báº£n máº¥t chÃ¬a khÃ³a cÆ¡, thu phá»¥ phÃ­ thay á»• khÃ³a má»›i 150.000 VNÄ?')) {
    showToast('ÄÃ£ láº­p biÃªn báº£n máº¥t chÃ¬a vÃ  phÃ¢n cÃ´ng ká»¹ thuáº­t thay á»• khÃ³a má»›i!');
    const uName = currentUser ? currentUser.name : 'Nguyá»…n VÄƒn Tuáº¥n';
    addAuditLog(uName, 'STAFF', 'LOST_KEY_PROTOCOL', 'Thu phá»¥ phÃ­ 150.000Ä‘ vÃ  thay khÃ³a Unit A-102');
  }
}

// Matrix Grid Renderer (Floor 1 - Area A)
function renderMatrixGrid() {
  const container = document.getElementById('matrixGridContainer');
  if (!container) return;

  const units = managedUnits || mockUnits;
  container.innerHTML = units.map(u => {
    const type = u.type || 'M';
    const size = u.sizeDesc || u.size || `${u.sizeSqm || 0} mÂ²`;
    let badgeText = 'Trá»‘ng';
    if (u.status === 'occupied') badgeText = 'Äang dÃ¹ng';
    else if (u.status === 'reserved') badgeText = 'ÄÃ£ Ä‘áº·t';
    else if (u.status === 'maintenance') badgeText = 'Báº£o trÃ¬';
    else if (u.status === 'cleaning') badgeText = 'Vá»‡ sinh';

    return `
      <div class="matrix-cell ${u.status}" onclick="openUnitStatusModal('${u.code}')">
        <div style="font-weight:800; font-size:15px; margin-bottom:2px;">${u.code}</div>
        <div style="font-size:11px; opacity:0.85;">${size}</div>
        <div style="font-size:10px; font-weight:700; text-transform:uppercase; margin-top:4px;">${badgeText}</div>
      </div>
    `;
  }).join('');
}

async function loadManagedUnits() {
  if (!authToken || !['FMANAGER', 'FACILITY_MANAGER'].includes(currentActor)) {
    managedUnits = null;
    renderMatrixGrid();
    return;
  }
  try {
    const response = await apiFetch('/api/facilities/units/manage');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c danh sÃ¡ch Unit.');
    managedUnits = result.data || [];
    renderMatrixGrid();
    const tbody = document.getElementById('managedUnitsBody');
    if (tbody) tbody.innerHTML = managedUnits.map(unit => `
      <tr>
        <td><span class="code-display">${unit.code}</span></td><td>${unit.type}</td>
        <td>${unit.sizeDesc || `${unit.sizeSqm} mÂ²`}</td>
        <td>${Number(unit.pricePerMonth || 0).toLocaleString('vi-VN')} Ä‘</td>
        <td>${unit.tenantName || 'â€”'}</td><td><span class="badge badge-neutral">${unit.status}</span></td>
        <td><button class="btn btn-outline btn-sm" onclick="openUnitStatusModal('${unit.code}')">Sá»­a tráº¡ng thÃ¡i</button>
        <button class="btn btn-danger btn-sm" onclick="deleteManagedUnit('${unit.code}')">XÃ³a</button></td>
      </tr>`).join('') || '<tr><td colspan="7">Chi nhÃ¡nh chÆ°a cÃ³ Unit.</td></tr>';
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ táº£i sÆ¡ Ä‘á»“ kho.');
  }
}

async function loadFacilities() {
  if (!authToken || currentActor !== 'OPS_MGR') return;
  try {
    const response = await apiFetch('/api/facilities');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c chi nhÃ¡nh.');
    knownFacilities = result.data || [];
    const grid = document.getElementById('facilityCardsGrid');
    if (grid) grid.innerHTML = knownFacilities.map(facility => `
      <div class="ui-card">
        <h3 style="font-size:16px; font-weight:800; margin-bottom:8px; color:#1e40af;">${facility.name}</h3>
        <div style="font-size:13px; color:#64748b; margin-bottom:12px;">${facility.address}, ${facility.city}</div>
        <div style="font-size:12px; margin-bottom:16px;">
          <div>ðŸ¢ Quy mÃ´: <strong>${facility.totalUnits || 0} Unit</strong></div>
          <div>â˜Ž Hotline: <strong>${facility.hotline || 'â€”'}</strong></div>
          <div>âš¡ Tráº¡ng thÃ¡i: <span class="badge badge-success">${facility.status}</span></div>
        </div>
        <button class="btn btn-outline btn-block btn-sm" onclick="openFacilityForm('${facility.code}')">Cáº¥u hÃ¬nh chi nhÃ¡nh</button>
      </div>`).join('');
  } catch (error) {
    showToast(error.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c chi nhÃ¡nh.');
  }
}

function openFacilityForm(code = null) {
  editingFacilityCode = code;
  const facility = knownFacilities.find(item => item.code === code);
  document.getElementById('facilityFormTitle').innerText = facility ? 'Cáº¥u hÃ¬nh chi nhÃ¡nh' : 'ThÃªm chi nhÃ¡nh';
  document.getElementById('facilityFormCode').value = facility?.code || '';
  document.getElementById('facilityFormCode').disabled = Boolean(facility);
  document.getElementById('facilityFormName').value = facility?.name || '';
  document.getElementById('facilityFormAddress').value = facility?.address || '';
  document.getElementById('facilityFormCity').value = facility?.city || '';
  document.getElementById('facilityFormHotline').value = facility?.hotline || '';
  openModal('modalFacilityForm');
}

async function submitFacilityForm() {
  const body = {
    code: document.getElementById('facilityFormCode').value.trim().toUpperCase(),
    name: document.getElementById('facilityFormName').value.trim(),
    address: document.getElementById('facilityFormAddress').value.trim(),
    city: document.getElementById('facilityFormCity').value.trim(),
    hotline: document.getElementById('facilityFormHotline').value.trim()
  };
  const isEdit = Boolean(editingFacilityCode);
  try {
    const response = await apiFetch(isEdit ? `/api/facilities/${encodeURIComponent(editingFacilityCode)}` : '/api/facilities', {
      method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ lÆ°u chi nhÃ¡nh.');
    closeModal('modalFacilityForm');
    showToast(isEdit ? 'ÄÃ£ cáº­p nháº­t chi nhÃ¡nh.' : 'ÄÃ£ thÃªm chi nhÃ¡nh.');
    await loadFacilities();
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ lÆ°u chi nhÃ¡nh.');
  }
}

async function loadPendingRefunds() {
  if (!authToken || !['FMANAGER', 'FACILITY_MANAGER'].includes(currentActor)) return;
  const tbody = document.getElementById('pendingRefundsBody');
  if (!tbody) return;
  try {
    const response = await apiFetch('/api/contracts/refunds/pending');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c refund requests.');
    const refunds = result.data || [];
    tbody.innerHTML = refunds.map(refund => `
      <tr><td>${refund.contractId || refund.reservationId}</td><td>${refund.inspectionId || 'Reservation cancellation'}</td>
      <td>${Number(refund.approvedAmount || 0).toLocaleString('vi-VN')} Ä‘</td>
      <td><button class="btn btn-success btn-sm" onclick="approveRefund('${refund.contractId || ''}', '${refund.reservationId || ''}')">Duyá»‡t hoÃ n cá»c</button></td></tr>
    `).join('') || '<tr><td colspan="4">KhÃ´ng cÃ³ yÃªu cáº§u Ä‘ang chá».</td></tr>';
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`;
  }
}

async function loadManagerContracts() {
  if (!authToken || !['FMANAGER', 'FACILITY_MANAGER'].includes(currentActor)) return;
  const tbody = document.getElementById('managerContractsBody');
  if (!tbody) return;
  try {
    const response = await apiFetch('/api/contracts');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c contracts.');
    const contracts = result.data || [];
    tbody.innerHTML = contracts.map(contract => {
      const status = contract.status || 'ACTIVE';
      const badge = status === 'OVERDUE' ? 'badge-danger' : status === 'EXPIRING_SOON' ? 'badge-warning' : 'badge-success';
      const action = status === 'OVERDUE'
        ? `<button class="btn btn-danger btn-sm" onclick="triggerOverdueLockout('${escapeHtml(contract.id)}','${escapeHtml(contract.unitCode)}','${escapeHtml(contract.customerName)}')">KhÃ³a PIN</button>`
        : `<button class="btn btn-outline btn-sm" onclick="showToast('ÄÃ£ ghi nháº­n yÃªu cáº§u nháº¯c gia háº¡n cho ${escapeHtml(contract.customerName)}.')">Nháº¯c gia háº¡n</button>`;
      return `<tr><td><span class="code-display">${escapeHtml(contract.id)}</span></td><td>${escapeHtml(contract.customerName)}</td><td>${escapeHtml(contract.unitCode)}</td><td>${escapeHtml(contract.endDate)}</td><td><span class="badge ${badge}">${escapeHtml(status)}</span></td><td>${action}</td></tr>`;
    }).join('') || '<tr><td colspan="6">KhÃ´ng cÃ³ contract.</td></tr>';
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  }
}

async function approveRefund(contractId, reservationId = '') {
  try {
    const endpoint = reservationId
      ? `/api/contracts/reservations/${encodeURIComponent(reservationId)}/refund/approve`
      : `/api/contracts/${encodeURIComponent(contractId)}/refund/approve`;
    const response = await apiFetch(endpoint, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ duyá»‡t hoÃ n cá»c.');
    showToast(`ÄÃ£ duyá»‡t hoÃ n cá»c cho ${reservationId || contractId}.`);
    await loadPendingRefunds();
    await loadManagedUnits();
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ duyá»‡t hoÃ n cá»c.');
  }
}

function openUnitStatusModal(code) {
  selectedUnitForModal = (managedUnits || mockUnits).find(u => u.code === code);
  if (!selectedUnitForModal) return;

  document.getElementById('mdlUnitStatusTitle').innerText = `Cáº­p nháº­t Tráº¡ng thÃ¡i PhÃ²ng Kho ${code}`;
  document.getElementById('mdlUnitStatusName').innerText = `PhÃ²ng ${code} (${selectedUnitForModal.sizeDesc || selectedUnitForModal.size} - GÃ³i ${selectedUnitForModal.type})`;
  document.getElementById('selUnitNewStatus').value = selectedUnitForModal.status.toUpperCase();
  openModal('modalUnitStatus');
}

async function saveUnitStatusChange() {
  if (!selectedUnitForModal) return;
  const newStatus = document.getElementById('selUnitNewStatus').value.toLowerCase();
  try {
    const response = await apiFetch(`/api/facilities/units/${encodeURIComponent(selectedUnitForModal.code)}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: newStatus })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ cáº­p nháº­t Unit.');
    closeModal('modalUnitStatus');
    showToast(`ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i kho ${selectedUnitForModal.code}: ${newStatus.toUpperCase()}`);
    addAuditLog(currentUser.name, currentActor, 'UPDATE_UNIT_STATUS', `Unit ${selectedUnitForModal.code} -> ${newStatus}`);
    await loadManagedUnits();
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ cáº­p nháº­t Unit.');
  }
}

async function deleteManagedUnit(code) {
  if (!confirm(`XÃ³a Unit ${code}? Chá»‰ Unit trá»‘ng vÃ  khÃ´ng cÃ²n lá»‹ch sá»­ há»£p Ä‘á»“ng/Ä‘áº·t chá»— má»›i Ä‘Æ°á»£c xÃ³a.`)) return;
  try {
    const response = await apiFetch(`/api/facilities/units/${encodeURIComponent(code)}`, { method: 'DELETE' });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'KhÃ´ng thá»ƒ xÃ³a Unit.');
    }
    showToast(`ÄÃ£ xÃ³a Unit ${code}.`);
    await loadManagedUnits();
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ xÃ³a Unit.');
  }
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

async function submitKeypadPin() {
  const result = document.getElementById('keypadStatusResult');
  if (!result) return;
  const unitCode = currentContract?.unitCode;
  if (!unitCode || keypadInput.length !== 6) {
    showToast('Chá»n há»£p Ä‘á»“ng Ä‘ang thuÃª vÃ  nháº­p Ä‘á»§ 6 sá»‘ PIN.');
    return;
  }
  try {
    const response = await apiFetch('/api/contracts/verify-pin', {
      method: 'POST', body: JSON.stringify({ unitCode, pin: keypadInput })
    });
    const responseData = await response.json();
    if (!response.ok || !responseData.success) throw new Error(responseData.message || 'KhÃ´ng thá»ƒ xÃ¡c minh PIN.');
    if (responseData.data?.authorized) {
    result.innerHTML = `
      <div style="background:#ecfdf5; border:1px solid #10b981; border-radius:10px; padding:16px; text-align:center; color:#047857; margin-top:16px;">
        <div style="font-size:24px; font-weight:800; margin-bottom:4px;">ðŸ”“ ACCESS GRANTED</div>
        <div style="font-size:13px; font-weight:600;">KhÃ³a Ä‘iá»‡n tá»­ Unit ${unitCode} Ä‘Ã£ má»Ÿ! Thá»i gian má»Ÿ cá»­a: 05:00</div>
      </div>
    `;
    showToast('ðŸ”“ Cá»­a kho má»Ÿ thÃ nh cÃ´ng!');
    } else {
    result.innerHTML = `
      <div style="background:#fef2f2; border:1px solid #ef4444; border-radius:10px; padding:16px; text-align:center; color:#b91c1c; margin-top:16px;">
        <div style="font-size:24px; font-weight:800; margin-bottom:4px;">ðŸ”’ ACCESS DENIED</div>
        <div style="font-size:13px; font-weight:600;">MÃ£ PIN khÃ´ng chÃ­nh xÃ¡c hoáº·c Ä‘Ã£ háº¿t hiá»‡u lá»±c!</div>
      </div>
    `;
    showToast('âŒ MÃ£ PIN khÃ´ng Ä‘Ãºng! Vui lÃ²ng thá»­ láº¡i.');
    }
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ xÃ¡c minh PIN.');
  }
}

// ==============================================================================
// FACILITY MANAGER WORKFLOWS
// ==============================================================================

async function assignUnitToReservation(rsvId, unitCode) {
  try {
    const response = await apiFetch(`/api/reservations/${encodeURIComponent(rsvId)}/assign`, {
      method: 'PATCH', body: JSON.stringify({ unitCode })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ gÃ¡n Unit.');
    showToast(`ÄÃ£ gÃ¡n ${unitCode} cho reservation ${rsvId}.`);
    addAuditLog(currentUser.name, currentActor, 'ASSIGN_UNIT', `${unitCode} -> ${rsvId}`);
    await loadManagedUnits();
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ gÃ¡n Unit.');
  }
}

async function loadAssignableReservations() {
  if (!authToken || !['FMANAGER', 'FACILITY_MANAGER'].includes(currentActor)) return;
  const tbody = document.getElementById('assignableReservationsBody');
  if (!tbody) return;
  try {
    const reservationsResponse = await apiFetch('/api/reservations');
    const reservationsResult = await reservationsResponse.json();
    if (!reservationsResponse.ok || !reservationsResult.success) throw new Error(reservationsResult.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c reservations.');
    const reservations = (reservationsResult.data || []).filter(item => item.status === 'RESERVED' && !item.unitCode);
    const rows = await Promise.all(reservations.map(async reservation => {
      const unitResponse = await apiFetch(`/api/facilities/units?facilityCode=${encodeURIComponent(currentUser.facilityCode)}&type=${encodeURIComponent(reservation.unitType)}`);
      const unitResult = await unitResponse.json();
      if (!unitResponse.ok || !unitResult.success) throw new Error(unitResult.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c Unit trá»‘ng.');
      const units = unitResult.data || [];
      const selectId = `assignUnit-${reservation.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
      const choices = units.map(unit => `<option value="${unit.code}">${unit.code} (${unit.sizeDesc || unit.sizeSqm + ' mÂ²'})</option>`).join('');
      return `<tr>
        <td><span class="code-display">${reservation.id}</span></td><td>${reservation.customerName}</td>
        <td>${reservation.unitType}</td><td>${reservation.durationMonths} thÃ¡ng</td>
        <td><span class="badge badge-success">ÄÃ£ cá»c</span></td>
        <td>${units.length ? `<select id="${selectId}" class="form-control">${choices}</select>` : 'KhÃ´ng cÃ²n Unit trá»‘ng'}</td>
        <td><button class="btn btn-primary btn-sm" ${units.length ? '' : 'disabled'} onclick="assignUnitToReservation('${reservation.id}', document.getElementById('${selectId}').value)">GÃ¡n kho</button></td>
      </tr>`;
    }));
    tbody.innerHTML = rows.join('') || '<tr><td colspan="7">KhÃ´ng cÃ³ reservation Ä‘ang chá» gÃ¡n Unit.</td></tr>';
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
  }
}

async function dispatchStaffTask() {
  const taskName = document.getElementById('txtTaskTitle').value.trim();
  const staffName = document.getElementById('selTaskStaff').value;
  if (!taskName) {
    alert('Vui lÃ²ng nháº­p tÃªn cÃ´ng viá»‡c!');
    return;
  }
  try {
    const response = await apiFetch('/api/tasks/dispatch', {
      method: 'POST',
      body: JSON.stringify({ title: taskName, staff: staffName, taskType: inferTaskType(taskName), date: new Date().toISOString().slice(0, 10) })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ phÃ¢n cÃ´ng task.');
    showToast(`ÄÃ£ phÃ¢n cÃ´ng viá»‡c "${taskName}" cho ${staffName}.`);
    addAuditLog(currentUser.name, currentActor, 'DISPATCH_TASK', `Task ${result.data.id} -> ${staffName}`);
    document.getElementById('txtTaskTitle').value = '';
    loadDailyTasks();
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ phÃ¢n cÃ´ng task.');
  }
}

function inferTaskType(title) {
  const value = title.toLowerCase();
  if (value.includes('check-in') || value.includes('bÃ n giao')) return 'CHECKIN';
  if (value.includes('tráº£') || value.includes('nghiá»‡m thu')) return 'RETURN';
  if (value.includes('báº£o trÃ¬') || value.includes('vá»‡ sinh')) return 'MAINTENANCE';
  return 'SUPPORT';
}

async function submitCreateUnitByManager() {
  const code = document.getElementById('txtNewUnitCode').value.trim().toUpperCase();
  const type = document.getElementById('selNewUnitType').value;
  const size = parseFloat(document.getElementById('txtNewUnitSize').value) || 5.0;
  const price = parseInt(document.getElementById('txtNewUnitPrice').value) || 1450000;

  if (!code) {
    alert('Vui lÃ²ng nháº­p mÃ£ phÃ²ng kho!');
    return;
  }

  try {
    const response = await apiFetch('/api/facilities/units', {
      method: 'POST',
      body: JSON.stringify({
        code, type, sizeDesc: `${size.toFixed(1)} mÂ²`, sizeSqm: size, pricePerMonth: price,
        facilityCode: currentUser.facilityCode, floor: Number((document.getElementById('txtNewUnitLocation').value.match(/\d+/) || [1])[0]),
        status: document.getElementById('selNewUnitInitialStatus').value
      })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ táº¡o Unit.');
    closeModal('modalAddUnit');
    showToast(`ÄÃ£ thÃªm Unit ${code}.`);
    addAuditLog(currentUser.name, currentActor, 'CREATE_UNIT', `Unit ${code} (${size}mÂ²)`);
    await loadManagedUnits();
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ táº¡o Unit.');
  }
}

async function triggerOverdueLockout(contractId, unitCode, customerName) {
  if (!confirm(`XÃ¡c nháº­n khÃ³a PIN Unit ${unitCode} cá»§a ${customerName} do quÃ¡ háº¡n?`)) return;
  try {
    const response = await apiFetch(`/api/contracts/${encodeURIComponent(contractId)}/overdue-lockout`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ khÃ³a PIN.');
    showToast(`ÄÃ£ khÃ³a PIN Unit ${unitCode}.`);
    await loadManagerContracts();
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ khÃ³a PIN.');
  }
}

// ==============================================================================
// BUSINESS OPERATIONS MANAGER WORKFLOWS
// ==============================================================================

async function loadPricingPolicies() {
  if (!authToken || currentActor !== 'OPS_MGR') return;
  try {
    const response = await apiFetch('/api/policies');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c chÃ­nh sÃ¡ch.');
    const data = result.data;
    document.getElementById('policyPriceS').value = data.basePrices.S;
    document.getElementById('policyPriceM').value = data.basePrices.M;
    document.getElementById('policyPriceL').value = data.basePrices.L;
    document.getElementById('policyPriceClimate').value = data.basePrices.CLIMATE;
    document.getElementById('policyDepositRule').value = data.depositRule;
    document.getElementById('policyDiscount3').value = Number(data.durationDiscounts['3']) * 100;
    document.getElementById('policyDiscount6').value = Number(data.durationDiscounts['6']) * 100;
    document.getElementById('policyDiscount12').value = Number(data.durationDiscounts['12']) * 100;
    document.getElementById('policyFeeCleaning').value = data.extraFees.cleaning;
    document.getElementById('policyFeeNewLock').value = data.extraFees.newLock;
    document.getElementById('policyFeeOverdue').value = data.extraFees.overduePenaltyPerDay;
    if (document.getElementById('policyGracePeriod')) document.getElementById('policyGracePeriod').value = data.gracePeriodDays ?? 3;
  } catch (error) {
    showToast(error.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c chÃ­nh sÃ¡ch.');
  }
}

async function loadChainStats() {
  if (!authToken || currentActor !== 'OPS_MGR') return;
  try {
    const month = new Date().toISOString().slice(0, 7);
    const response = await apiFetch(`/api/policies/stats?month=${month}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c bÃ¡o cÃ¡o chuá»—i.');
    const stats = result.data;
    document.getElementById('chainFacilityCount').innerText = `${stats.totalBranches} Chi nhÃ¡nh`;
    document.getElementById('chainTotalUnits').innerText = `${stats.totalUnits} Kho`;
    document.getElementById('chainUnitBreakdown').innerText = `${stats.occupiedUnits} Äang thuÃª â€¢ ${stats.availableUnits} Trá»‘ng â€¢ ${stats.reservedUnits} Giá»¯ chá»—`;
    document.getElementById('chainOccupancyRate').innerText = stats.occupancyRate;
    document.getElementById('chainMonthlyRevenue').innerText = `${Number(stats.monthlyRevenue || 0).toLocaleString('vi-VN')} Ä‘`;
    const tbody = document.getElementById('chainFacilitiesBody');
    if (tbody) tbody.innerHTML = (stats.facilities || []).map((facility, index) => `
      <tr><td><strong>${index + 1}. ${facility.facilityName}</strong></td><td>-</td>
      <td>${facility.totalUnits}</td><td>${facility.occupiedUnits}</td><td>${facility.occupancyRate}</td>
      <td>${Number(facility.monthlyRevenue || 0).toLocaleString('vi-VN')} Ä‘</td>
      <td><span class="badge badge-primary">Live</span></td></tr>`).join('');
  } catch (error) {
    showToast(error.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c bÃ¡o cÃ¡o chuá»—i.');
  }
}

async function loadFacilityReport() {
  if (!authToken || currentActor !== 'FMANAGER') return;
  try {
    const month = new Date().toISOString().slice(0, 7);
    const response = await apiFetch(`/api/policies/reports/facility?month=${month}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c bÃ¡o cÃ¡o chi nhÃ¡nh.');
    const report = result.data;
    const revenue = document.getElementById('facilityMonthlyRevenue');
    const deposits = document.getElementById('facilityHeldDeposits');
    if (revenue) revenue.innerText = `${Number(report.monthlyRevenue || 0).toLocaleString('vi-VN')} Ä‘`;
    if (deposits) deposits.innerText = `${Number(report.heldDepositFunds || 0).toLocaleString('vi-VN')} Ä‘`;
  } catch (error) {
    showToast(error.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c bÃ¡o cÃ¡o chi nhÃ¡nh.');
  }
}

async function savePricingPolicy() {
  const numberValue = id => Number(document.getElementById(id)?.value);
  const updates = {
    basePrices: {
      S: numberValue('policyPriceS'), M: numberValue('policyPriceM'),
      L: numberValue('policyPriceL'), CLIMATE: numberValue('policyPriceClimate')
    },
    depositRule: document.getElementById('policyDepositRule').value,
    durationDiscounts: {
      '3': numberValue('policyDiscount3') / 100,
      '6': numberValue('policyDiscount6') / 100,
      '12': numberValue('policyDiscount12') / 100
    },
    extraFees: {
      cleaning: numberValue('policyFeeCleaning'),
      newLock: numberValue('policyFeeNewLock'),
      overduePenaltyPerDay: numberValue('policyFeeOverdue')
    },
    gracePeriodDays: numberValue('policyGracePeriod')
  };
  try {
    const response = await apiFetch('/api/policies', { method: 'PATCH', body: JSON.stringify(updates) });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng thá»ƒ lÆ°u chÃ­nh sÃ¡ch.');
    showToast('ÄÃ£ lÆ°u chÃ­nh sÃ¡ch giÃ¡, cá»c vÃ  phÃ­ vÃ o há»‡ thá»‘ng.');
    addAuditLog(currentUser.name, currentActor, 'UPDATE_PRICE_POLICY', 'Cáº­p nháº­t khung giÃ¡, tiá»n cá»c, chiáº¿t kháº¥u vÃ  phá»¥ phÃ­');
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ lÆ°u chÃ­nh sÃ¡ch.');
  }
}

function saveGeneralPolicy() {
  showToast('ÄÃ£ ban hÃ nh Bá»™ quy chuáº©n & ChÃ­nh sÃ¡ch cho thuÃª chung toÃ n chuá»—i 5 cÆ¡ sá»Ÿ!');
  const uName = currentUser ? currentUser.name : 'Äáº·ng HoÃ ng Long';
  addAuditLog(uName, 'OPS_MGR', 'UPDATE_GENERAL_POLICY', 'Cáº­p nháº­t chÃ­nh sÃ¡ch an toÃ n, cá»c vÃ  thá»i gian Ã¢n háº¡n');
}

async function exportFinancialReport() {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const response = await apiFetch(`/api/policies/stats?month=${month}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c bÃ¡o cÃ¡o.');
    const rows = result.data.facilities || [];
    const csvRows = [
      ['Facility', 'Total units', 'Available', 'Reserved', 'Occupied', 'Occupancy rate', 'Monthly revenue'],
      ...rows.map(row => [row.facilityName, row.totalUnits, row.availableUnits, row.reservedUnits,
        row.occupiedUnits, row.occupancyRate, row.monthlyRevenue])
    ];
    const csv = '\uFEFF' + csvRows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `SelfStorage_Report_${month}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('ÄÃ£ táº£i bÃ¡o cÃ¡o hiá»‡n táº¡i tá»« backend.');
  } catch (error) {
    showToast(error.message || 'KhÃ´ng thá»ƒ xuáº¥t bÃ¡o cÃ¡o.');
  }
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
        <div style="font-size:12px; color:#64748b;">${u.email} â€¢ <strong>@${u.username}</strong></div>
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
          ${u.status === 'ACTIVE' ? 'ðŸŸ¢ Hoáº¡t Ä‘á»™ng' : 'ðŸ”´ KhÃ³a'}
        </span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="toggleLockUser('${u.id}')">
          ${u.status === 'ACTIVE' ? 'KhÃ³a' : 'Má»Ÿ'}
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
  showToast(`ÄÃ£ thay Ä‘á»•i tráº¡ng thÃ¡i tÃ i khoáº£n ${target.name} (@${target.username}) thÃ nh: ${target.status}!`);
  const uName = currentUser ? currentUser.name : 'Quáº£n trá»‹ viÃªn';
  addAuditLog(uName, 'ADMIN', 'TOGGLE_USER_STATUS', `Äá»•i tráº¡ng thÃ¡i tÃ i khoáº£n ${target.id} (@${target.username}) -> ${target.status}`);
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
    alert('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ cÃ¡c thÃ´ng tin báº¯t buá»™c (*)!');
    return;
  }

  const exists = mockUsers.find(u => u.username === username);
  if (exists) {
    alert(`TÃªn Ä‘Äƒng nháº­p @${username} Ä‘Ã£ tá»“n táº¡i!`);
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
  showToast(`ÄÃ£ táº¡o thÃ nh cÃ´ng tÃ i khoáº£n @${username} cho ${name} (${role})!`);
  const uName = currentUser ? currentUser.name : 'Quáº£n trá»‹ viÃªn';
  addAuditLog(uName, 'ADMIN', 'CREATE_USER', `Táº¡o tÃ i khoáº£n má»›i @${username} (${role})`);
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
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} HÃ´m nay`;
  mockAuditLogs.unshift({
    time: timeStr,
    user: user || 'Há»‡ thá»‘ng',
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
