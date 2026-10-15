-- ==============================================================================
-- SELF-STORAGE FACILITY RENTAL SYSTEM - SUPABASE DATABASE SCHEMA & SEED DATA
-- Copy lưu tại thư mục docs phục vụ tra cứu đồ án
-- ==============================================================================

-- 1. BẢNG USERS (TÀI KHOẢN NGƯỜI DÙNG & VAI TRÒ)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  cccd TEXT,
  role TEXT NOT NULL CHECK (role IN ('CUSTOMER', 'STAFF', 'FMANAGER', 'FACILITY_MANAGER', 'OPS_MGR', 'OPS_MANAGER', 'ADMIN', 'SYSTEM_ADMIN')),
  role_title TEXT,
  facility TEXT,
  facility_code TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED', 'DISABLED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG FACILITIES (DANH MỤC CƠ SỞ KHO TOÀN HỆ THỐNG)
CREATE TABLE IF NOT EXISTS public.facilities (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  hotline TEXT,
  total_units INT DEFAULT 0,
  occupied_units INT DEFAULT 0,
  occupancy_rate NUMERIC(5,2) DEFAULT 0.00,
  status TEXT DEFAULT 'ACTIVE'
);

-- 3. BẢNG UNITS (PHÒNG KHO CHI NHÁNH & TRẠNG THÁI)
CREATE TABLE IF NOT EXISTS public.units (
  code TEXT PRIMARY KEY,
  facility_code TEXT REFERENCES public.facilities(code) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('S', 'M', 'L', 'CLIMATE')),
  size_desc TEXT,
  size_sqm NUMERIC(5,2) NOT NULL,
  price_per_month NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied', 'cleaning', 'maintenance')),
  tenant_name TEXT,
  pin_code TEXT DEFAULT '842916'
);

-- 4. BẢNG RESERVATIONS (ĐƠN ĐẶT GIỮ CHỖ TRỰC TUYẾN)
CREATE TABLE IF NOT EXISTS public.reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  facility_code TEXT REFERENCES public.facilities(code),
  unit_type TEXT NOT NULL,
  unit_code TEXT,
  duration_months INT DEFAULT 1,
  start_date DATE NOT NULL,
  deposit_amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'RESERVED', 'CHECKED_IN', 'CANCELLED', 'EXPIRED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG CONTRACTS (HỢP ĐỒNG CHO THUÊ KHO)
CREATE TABLE IF NOT EXISTS public.contracts (
  id TEXT PRIMARY KEY,
  reservation_id TEXT,
  user_id TEXT REFERENCES public.users(id),
  customer_name TEXT NOT NULL,
  unit_code TEXT REFERENCES public.units(code),
  facility_code TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_fee NUMERIC(12,2) NOT NULL,
  deposit_fee NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRING_SOON', 'OVERDUE', 'TERMINATED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG PAYMENTS (LỊCH SỬ THANH TOÁN VIETQR / HÓA ĐƠN)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  reservation_id TEXT,
  contract_id TEXT,
  customer_name TEXT,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('DEPOSIT', 'RENT', 'RENEW', 'EXTRA')),
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT DEFAULT 'VIETQR_NAPAS247',
  transaction_code TEXT,
  status TEXT DEFAULT 'PAID' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG SUPPORT_TICKETS (YÊU CẦU HỖ TRỢ SỰ CỐ)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id),
  customer_name TEXT NOT NULL,
  unit_code TEXT,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'HIGH', 'URGENT')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BẢNG STAFF_TASKS (NHIỆM VỤ CA TRỰC NHÂN VIÊN)
CREATE TABLE IF NOT EXISTS public.staff_tasks (
  id TEXT PRIMARY KEY,
  staff_name TEXT NOT NULL,
  facility_code TEXT,
  task_title TEXT NOT NULL,
  task_type TEXT CHECK (task_type IN ('CHECKIN', 'RETURN', 'SUPPORT', 'MAINTENANCE')),
  unit_code TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  due_date DATE DEFAULT CURRENT_DATE
);

-- 9. BẢNG AUDIT_LOGS (NHẬT KÝ THAO TÁC HỆ THỐNG)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  time_display TEXT,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  ip_address TEXT DEFAULT '127.0.0.1',
  status TEXT DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BẢNG LOGIN_HISTORY (LỊCH SỬ ĐĂNG NHẬP)
CREATE TABLE IF NOT EXISTS public.login_history (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  login_time TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  device TEXT,
  status TEXT DEFAULT 'SUCCESS'
);

-- SEED 5 TÀI KHOẢN THEO ĐÚNG YÊU CẦU ĐỀ BÀI:
INSERT INTO public.users (id, name, username, password, email, phone, cccd, role, role_title, facility, facility_code, status)
VALUES
  ('USR-01', 'Trần Văn Bảo', 'customer', '1', 'customer@selfstorage.vn', '0987.654.321', '001202019988', 'CUSTOMER', 'Khách hàng thuê kho', 'Hà Nội - Cầu Giấy', 'HN-CG', 'ACTIVE'),
  ('USR-02', 'Nguyễn Văn Tuấn', 'staff', '3', 'staff@selfstorage.vn', '0912.345.678', '001201044556', 'STAFF', 'Nhân viên cơ sở', 'Hà Nội - Cầu Giấy', 'HN-CG', 'ACTIVE'),
  ('USR-03', 'Lê Thị Mai', 'staff2', '3', 'mai.lt@selfstorage.vn', '0903.112.233', '001203099881', 'STAFF', 'Nhân viên cơ sở', 'Hà Nội - Cầu Giấy', 'HN-CG', 'ACTIVE'),
  ('USR-04', 'Phạm Hải Đăng', 'manager', '4', 'manager@selfstorage.vn', '0934.567.890', '001200055443', 'FMANAGER', 'Quản lý cơ sở', 'Hà Nội - Cầu Giấy', 'HN-CG', 'ACTIVE'),
  ('USR-05', 'Trần Quang Vinh', 'manager_q7', '4', 'vinh.tq@selfstorage.vn', '0978.889.900', '079201088997', 'FMANAGER', 'Quản lý cơ sở', 'TP.HCM - Quận 7', 'HCM-Q7', 'ACTIVE'),
  ('USR-06', 'Đặng Hoàng Long', 'business', '5', 'business@selfstorage.vn', '0918.777.666', '001200011223', 'OPS_MGR', 'Quản lý vận hành toàn chuỗi', 'Toàn hệ thống (HQ)', 'HQ', 'ACTIVE'),
  ('USR-07', 'Quản trị viên Hệ thống', 'admin', '2', 'admin@selfstorage.vn', '0909.999.000', '001200000001', 'ADMIN', 'Quản trị hệ thống', 'Toàn hệ thống (HQ)', 'HQ', 'ACTIVE'),
  ('USR-08', 'Nguyễn Kiều Oanh', 'oanhnguyen', '1', 'oanh.nk@gmail.com', '0988.123.456', '079201998811', 'CUSTOMER', 'Khách hàng thuê kho', 'TP.HCM - Quận 7', 'HCM-Q7', 'ACTIVE')
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password, role = EXCLUDED.role, status = EXCLUDED.status;
