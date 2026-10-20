-- ==============================================================================
-- SELF-STORAGE FACILITY RENTAL SYSTEM - SUPABASE DATABASE SCHEMA & SEED DATA
-- Hệ thống Quản lý và Cho thuê Kho Lưu trữ Tự phục vụ (5 Actors RBAC)
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
  email_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;

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
  floor INT,
  size_sqm NUMERIC(5,2) NOT NULL,
  price_per_month NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied', 'cleaning', 'maintenance')),
  tenant_name TEXT,
  pin_code TEXT DEFAULT '842916',
  temporary_pin TEXT,
  temporary_pin_expires_at TIMESTAMPTZ
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
  appointment TEXT,
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
  last_renewal_at TIMESTAMPTZ,
  checkout_requested_at TIMESTAMPTZ,
  checkout_requested_date DATE,
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
  time_str TEXT,
  status TEXT DEFAULT 'PAID' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG SUPPORT_TICKETS (YÊU CẦU HỖ TRỢ SỰ CỐ)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id),
  facility_code TEXT,
  customer_name TEXT NOT NULL,
  unit_code TEXT,
  title TEXT,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'HIGH', 'URGENT')),
  description TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  staff_assigned TEXT,
  notes TEXT,
  rating INT,
  feedback TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8A. BUSINESS POLICIES (PRICING, DEPOSIT, GRACE PERIOD)
CREATE TABLE IF NOT EXISTS public.business_policies (
  policy_key TEXT PRIMARY KEY,
  policy_value TEXT NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8B. HANDOVER, INSPECTION AND REFUND AUDIT RECORDS
CREATE TABLE IF NOT EXISTS public.handover_records (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  reservation_id TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  handover_date TIMESTAMPTZ NOT NULL,
  lock_type TEXT,
  unit_condition_notes TEXT,
  customer_signature_confirmed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.inspection_records (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  inspection_date TIMESTAMPTZ NOT NULL,
  cleanliness_status TEXT,
  damage_notes TEXT,
  penalty_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit_refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_cleared BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id TEXT PRIMARY KEY,
  contract_id TEXT,
  reservation_id TEXT,
  inspection_id TEXT,
  payment_id TEXT,
  facility_code TEXT NOT NULL,
  approved_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.refund_requests ADD COLUMN IF NOT EXISTS reservation_id TEXT;
ALTER TABLE public.refund_requests ALTER COLUMN contract_id DROP NOT NULL;
ALTER TABLE public.refund_requests ALTER COLUMN inspection_id DROP NOT NULL;

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

-- Spring Boot entity table used by DailyTaskRepository.
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  staff TEXT NOT NULL,
  deadline TEXT,
  status TEXT DEFAULT 'PENDING',
  facility_code TEXT,
  staff_id TEXT,
  task_type TEXT,
  unit_code TEXT,
  reservation_id TEXT,
  contract_id TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS time_str TEXT;
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS ip TEXT;
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Compatibility migration for databases created by earlier backend builds.
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS time_display TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'time_str') THEN
    EXECUTE 'UPDATE public.audit_logs SET time_display = COALESCE(time_display, time_str) WHERE time_display IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'ip') THEN
    EXECUTE 'UPDATE public.audit_logs SET ip_address = COALESCE(ip_address, ip) WHERE ip_address IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'login_history' AND column_name = 'login_time') THEN
    EXECUTE 'UPDATE public.login_history SET created_at = COALESCE(created_at, login_time) WHERE created_at IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'login_history' AND column_name = 'ip_address') THEN
    EXECUTE 'UPDATE public.login_history SET ip = COALESCE(ip, ip_address) WHERE ip IS NULL';
  END IF;
END $$;

-- ==============================================================================
-- SEED DATA: 5 TÀI KHOẢN THEO ĐÚNG YÊU CẦU ĐỀ BÀI (USERNAME & MẬT KHẨU)
-- ==============================================================================

-- 1. Customer: customer / 1
-- 2. System Administrator: admin / 2
-- 3. Staff: staff / 3
-- 4. Facility Manager: manager / 4
-- 5. Business Operations Manager: business / 5

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

-- SEED 5 CƠ SỞ KHO
INSERT INTO public.facilities (code, name, address, city, hotline, total_units, occupied_units, occupancy_rate, status)
VALUES
  ('HN-CG', 'Cơ sở Cầu Giấy', '120 Duy Tân, P. Dịch Vọng Hậu, Cầu Giấy', 'Hà Nội', '024.7300.6868', 120, 98, 81.67, 'ACTIVE'),
  ('HCM-Q7', 'Cơ sở Quận 7', '450 Nguyễn Thị Thập, P. Tân Quy, Quận 7', 'TP.HCM', '028.7300.6868', 150, 132, 88.00, 'ACTIVE'),
  ('HN-NTL', 'Cơ sở Nam Từ Liêm', 'Lô E2, Khu Công Nghệ Cao, Nam Từ Liêm', 'Hà Nội', '024.7300.9999', 100, 80, 80.00, 'ACTIVE'),
  ('HCM-TB', 'Cơ sở Tân Bình', '180 Cộng Hòa, P. 12, Q. Tân Bình', 'TP.HCM', '028.7300.8888', 110, 93, 84.55, 'ACTIVE'),
  ('DN-HC', 'Cơ sở Đà Nẵng', '92 Nguyễn Văn Linh, Q. Hải Châu', 'Đà Nẵng', '0236.730.6868', 80, 60, 75.00, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- SEED PHÒNG KHO CHI NHÁNH CẦU GIẤY (MẶT BẰNG TẦNG 1)
INSERT INTO public.units (code, facility_code, type, size_desc, size_sqm, price_per_month, status, tenant_name, pin_code)
VALUES
  ('A-101', 'HN-CG', 'S', '2.0 m²', 2.0, 800000, 'available', NULL, '842916'),
  ('A-102', 'HN-CG', 'M', '5.0 m²', 5.0, 1450000, 'reserved', 'Trần Văn Bảo', '842916'),
  ('A-103', 'HN-CG', 'M', '5.0 m²', 5.0, 1450000, 'occupied', 'Lê Hoàng Nam', '771239'),
  ('A-104', 'HN-CG', 'L', '10.0 m²', 10.0, 2800000, 'occupied', 'Công ty Alpha Logistics', '918234'),
  ('A-105', 'HN-CG', 'S', '3.0 m²', 3.0, 950000, 'available', NULL, '842916'),
  ('A-106', 'HN-CG', 'M', '5.0 m²', 5.0, 1450000, 'occupied', 'Hoàng Minh Châu', '629104'),
  ('A-107', 'HN-CG', 'L', '12.0 m²', 12.0, 3200000, 'maintenance', NULL, '000000'),
  ('A-108', 'HN-CG', 'M', '6.0 m²', 6.0, 1600000, 'cleaning', NULL, '000000'),
  ('A-109', 'HN-CG', 'S', '2.5 m²', 2.5, 850000, 'occupied', 'Phạm Thu Trang', '512984'),
  ('A-110', 'HN-CG', 'M', '5.0 m²', 5.0, 1450000, 'available', NULL, '842916'),
  ('A-111', 'HN-CG', 'L', '10.0 m²', 10.0, 2800000, 'occupied', 'Vũ Quốc Đạt', '491204'),
  ('A-112', 'HN-CG', 'M', '5.0 m²', 5.0, 1450000, 'available', NULL, '842916'),
  ('A-113', 'HN-CG', 'L', '12.0 m²', 12.0, 3200000, 'occupied', 'Công ty CP Đầu tư Á Châu', '948123'),
  ('A-114', 'HN-CG', 'S', '2.0 m²', 2.0, 800000, 'available', NULL, '842916'),
  ('A-115', 'HN-CG', 'M', '5.0 m²', 5.0, 1450000, 'reserved', 'Nguyễn Kiều Oanh', '842916'),
  ('A-116', 'HN-CG', 'S', '3.0 m²', 3.0, 950000, 'cleaning', NULL, '000000'),
  ('A-117', 'HN-CG', 'L', '10.0 m²', 10.0, 2800000, 'available', NULL, '842916'),
  ('A-118', 'HN-CG', 'M', '5.0 m²', 5.0, 1450000, 'available', NULL, '842916')
ON CONFLICT (code) DO NOTHING;

-- SEED ĐƠN ĐẶT CHỖ MẪU
INSERT INTO public.reservations (id, user_id, customer_name, customer_phone, facility_code, unit_type, unit_code, duration_months, start_date, deposit_amount, status)
VALUES
  ('RSV-8821', 'USR-01', 'Trần Văn Bảo', '0987.654.321', 'HN-CG', 'M', 'A-102', 3, '2026-10-10', 1450000, 'RESERVED')
ON CONFLICT (id) DO NOTHING;

-- BẬT ROW LEVEL SECURITY (RLS) CHO TẤT CẢ CÁC BẢNG
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- CÁC CHÍNH SÁCH RLS CƠ BẢN (CHO PHÉP ANONYMOUS/AUTHENTICATED TRUY VẤN TRONG GIAI ĐOẠN PHÁT TRIỂN)
DROP POLICY IF EXISTS "Public access users" ON public.users;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access facilities" ON public.facilities;
CREATE POLICY "Public access facilities" ON public.facilities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access units" ON public.units;
CREATE POLICY "Public access units" ON public.units FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access reservations" ON public.reservations;
CREATE POLICY "Public access reservations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access contracts" ON public.contracts;
CREATE POLICY "Public access contracts" ON public.contracts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access payments" ON public.payments;
CREATE POLICY "Public access payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access support_tickets" ON public.support_tickets;
CREATE POLICY "Public access support_tickets" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access staff_tasks" ON public.staff_tasks;
CREATE POLICY "Public access staff_tasks" ON public.staff_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access daily_tasks" ON public.daily_tasks;
CREATE POLICY "Public access daily_tasks" ON public.daily_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access business_policies" ON public.business_policies;
CREATE POLICY "Public access business_policies" ON public.business_policies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access handover_records" ON public.handover_records;
CREATE POLICY "Public access handover_records" ON public.handover_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access inspection_records" ON public.inspection_records;
CREATE POLICY "Public access inspection_records" ON public.inspection_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access refund_requests" ON public.refund_requests;
CREATE POLICY "Public access refund_requests" ON public.refund_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access audit_logs" ON public.audit_logs;
CREATE POLICY "Public access audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access login_history" ON public.login_history;
CREATE POLICY "Public access login_history" ON public.login_history FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.notifications (
  id varchar(80) PRIMARY KEY,
  user_id varchar(50) NOT NULL REFERENCES public.users(id),
  title varchar(255) NOT NULL,
  message text NOT NULL,
  type varchar(50) NOT NULL,
  reference_id varchar(80),
  read boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access notifications" ON public.notifications;
CREATE POLICY "Public access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

