const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.resolve(__dirname, 'Screens_Bao_Cao');
const htmlDir = path.resolve(__dirname, 'Screens_Bao_Cao', 'html_templates');
if (!fs.existsSync(htmlDir)) fs.mkdirSync(htmlDir, { recursive: true });

const commonStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1440px;
    height: 900px;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    background: #f8fafc;
    color: #0f172a;
    display: flex;
    flex-direction: column;
  }
  .app-header {
    height: 68px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    flex-shrink: 0;
  }
  .app-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 800;
    font-size: 20px;
    color: #0f172a;
  }
  .logo-box {
    width: 36px;
    height: 36px;
    background: #1e40af;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 900;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .nav-link {
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 6px;
  }
  .nav-link.active {
    color: #1e40af;
    background: #eff6ff;
  }
  .user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #dbeafe;
    color: #1e40af;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    border: 2px solid #3b82f6;
  }
  .content-body {
    flex: 1;
    padding: 32px 40px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
  }
  .badge-success { background: #ecfdf5; color: #047857; }
  .badge-warning { background: #fffbeb; color: #b45309; }
  .badge-danger { background: #fef2f2; color: #b91c1c; }
  .badge-primary { background: #eff6ff; color: #1d4ed8; }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-family: inherit;
    text-decoration: none;
  }
  .btn-primary { background: #1e40af; color: white; }
  .btn-outline { background: white; border: 1px solid #cbd5e1; color: #334155; }
  .btn-success { background: #10b981; color: white; }
  .btn-danger { background: #ef4444; color: white; }
  .ui-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
  .form-control {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    background: white;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .data-table th {
    background: #f8fafc;
    padding: 12px 16px;
    font-weight: 700;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
  }
  .data-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #f1f5f9;
  }
`;

function getCustomerHeader(activeTab) {
  return `
    <header class="app-header">
      <div class="app-logo">
        <div class="logo-box">S</div>
        <span>SelfStorage <span style="color:#2563eb;">PRO</span></span>
      </div>
      <nav class="nav-links">
        <span class="nav-link ${activeTab === 'catalog' ? 'active' : ''}">Tìm kho & Bảng giá</span>
        <span class="nav-link ${activeTab === 'reservation' ? 'active' : ''}">Đặt giữ chỗ</span>
        <span class="nav-link ${activeTab === 'payment' ? 'active' : ''}">Thanh toán cọc/phí</span>
        <span class="nav-link ${activeTab === 'pass' ? 'active' : ''}">Thẻ Check-in</span>
        <span class="nav-link ${activeTab === 'rentals' ? 'active' : ''}">Kho đang thuê</span>
        <span class="nav-link ${activeTab === 'support' ? 'active' : ''}">Hỗ trợ kỹ thuật</span>
      </nav>
      <div class="user-profile">
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:14px;">Trần Văn Bảo</div>
          <div style="font-size:12px; color:#64748b;">Storage Customer</div>
        </div>
        <div class="avatar">TB</div>
      </div>
    </header>
  `;
}

function getStaffHeader(activeTab) {
  return `
    <header class="app-header" style="background:#0f172a; border-bottom:1px solid #1e293b; color:white;">
      <div class="app-logo" style="color:white;">
        <div class="logo-box" style="background:#2563eb;">⚡</div>
        <span>SelfStorage <span style="color:#60a5fa;">STAFF</span></span>
      </div>
      <nav class="nav-links">
        <span class="nav-link ${activeTab === 'daily' ? 'active' : ''}" style="${activeTab === 'daily' ? 'color:#60a5fa; background:rgba(37,99,235,0.2);' : 'color:#94a3b8;'}">Bàn làm việc ca trực</span>
        <span class="nav-link ${activeTab === 'lookup' ? 'active' : ''}" style="${activeTab === 'lookup' ? 'color:#60a5fa; background:rgba(37,99,235,0.2);' : 'color:#94a3b8;'}">Tra cứu đơn đặt</span>
        <span class="nav-link ${activeTab === 'handover' ? 'active' : ''}" style="${activeTab === 'handover' ? 'color:#60a5fa; background:rgba(37,99,235,0.2);' : 'color:#94a3b8;'}">Bàn giao kho</span>
        <span class="nav-link ${activeTab === 'matrix' ? 'active' : ''}" style="${activeTab === 'matrix' ? 'color:#60a5fa; background:rgba(37,99,235,0.2);' : 'color:#94a3b8;'}">Sơ đồ mặt bằng kho</span>
        <span class="nav-link ${activeTab === 'return' ? 'active' : ''}" style="${activeTab === 'return' ? 'color:#60a5fa; background:rgba(37,99,235,0.2);' : 'color:#94a3b8;'}">Nghiệm thu trả kho</span>
        <span class="nav-link ${activeTab === 'incident' ? 'active' : ''}" style="${activeTab === 'incident' ? 'color:#60a5fa; background:rgba(37,99,235,0.2);' : 'color:#94a3b8;'}">Sự cố tại chỗ</span>
      </nav>
      <div class="user-profile">
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:14px; color:white;">Nguyễn Văn Tuấn</div>
          <div style="font-size:12px; color:#94a3b8;">Staff • Chi nhánh Cầu Giấy</div>
        </div>
        <div class="avatar" style="background:#1e293b; color:#60a5fa; border-color:#2563eb;">NT</div>
      </div>
    </header>
  `;
}

const screens = [
  // 1. CUSTOMER: CATALOG & EXPLORER
  {
    fileName: 'SCR_03_Customer_Catalog_Explorer.png',
    title: 'SCR-03: Xem Danh Mục Cơ Sở, Loại Kho & Bảng Giá Khả Dụng',
    html: `
      ${getCustomerHeader('catalog')}
      <main class="content-body">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px;">
          <div>
            <span class="badge badge-primary" style="margin-bottom:8px;">HỆ THỐNG KHO TỰ PHỤC VỤ 24/7</span>
            <h1 style="font-size:26px; font-weight:800; color:#0f172a;">Danh Mục Cơ Sở & Kích Thước Kho Lưu Trữ</h1>
            <p style="font-size:14px; color:#64748b; margin-top:4px;">Lưu trữ an toàn, bảo mật bằng mã PIN điện tử, camera an ninh 24/7, phòng mát kiểm soát độ ẩm.</p>
          </div>
          <div style="display:flex; gap:12px;">
            <select class="form-control" style="width:280px; font-weight:600;">
              <option>Hà Nội - Cơ sở Cầu Giấy (120 Duy Tân)</option>
              <option>TP.HCM - Cơ sở Quận 7 (Nguyễn Thị Thập)</option>
            </select>
            <button class="btn btn-primary">Tìm kiếm kho</button>
          </div>
        </div>

        <!-- 3 CARDS GRID -->
        <div class="grid-3">
          <!-- CARD 1 -->
          <div class="ui-card">
            <div style="height:140px; background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; margin-bottom:16px;">
              <span style="font-size:32px;">📦</span>
              <span style="font-weight:800; margin-top:8px;">KHO NHỎ (SMALL)</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <h3 style="font-size:18px; font-weight:800;">Kho S-Standard (2.0 m²)</h3>
              <span class="badge badge-success">🟢 Còn 6 kho trống</span>
            </div>
            <p style="font-size:13px; color:#64748b; margin-bottom:14px;">Dài 1.5m x Rộng 1.3m x Cao 2.5m (Thể tích 4.9 m³). Thích hợp chứa vali, tài liệu cá nhân, 6 thùng đồ.</p>
            <div style="font-size:12px; color:#475569; display:flex; flex-direction:column; gap:6px; margin-bottom:18px;">
              <div>🔒 Khóa điện tử PIN cá nhân 6 số</div>
              <div>❄️ Kiểm soát ẩm mốc và thông gió tự động</div>
              <div>📍 Vị trí: Cầu Giấy - Tầng 1</div>
            </div>
            <div style="border-top:1px solid #e2e8f0; padding-top:14px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:22px; font-weight:800; color:#1e40af;">800.000 đ</span>
                <span style="font-size:12px; color:#64748b;">/ tháng</span>
              </div>
              <button class="btn btn-primary">Đặt giữ chỗ ngay</button>
            </div>
          </div>

          <!-- CARD 2 -->
          <div class="ui-card" style="border:2px solid #3b82f6;">
            <div style="height:140px; background:linear-gradient(135deg, #1e40af 0%, #1e1b4b 100%); border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; margin-bottom:16px;">
              <span style="font-size:32px;">🏢</span>
              <span style="font-weight:800; margin-top:8px;">KHO VỪA (MEDIUM) - PHỔ BIẾN NHẤT</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <h3 style="font-size:18px; font-weight:800;">Kho M-Premium (5.0 m²)</h3>
              <span class="badge badge-success">🟢 Còn 4 kho trống</span>
            </div>
            <p style="font-size:13px; color:#64748b; margin-bottom:14px;">Dài 2.5m x Rộng 2.0m x Cao 2.5m (Thể tích 12.5 m³). Để vừa 1 xe máy + 20 thùng đồ đạc gia đình.</p>
            <div style="font-size:12px; color:#475569; display:flex; flex-direction:column; gap:6px; margin-bottom:18px;">
              <div>🔒 Khóa cơ an toàn + Smart Access Code riêng</div>
              <div>📹 Camera an ninh soi cửa kho 24/7</div>
              <div>📍 Vị trí: Cầu Giấy - Tầng 1 (Cạnh thang máy hàng)</div>
            </div>
            <div style="border-top:1px solid #e2e8f0; padding-top:14px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:22px; font-weight:800; color:#1e40af;">1.500.000 đ</span>
                <span style="font-size:12px; color:#64748b;">/ tháng</span>
              </div>
              <button class="btn btn-primary">Đặt giữ chỗ ngay</button>
            </div>
          </div>

          <!-- CARD 3 -->
          <div class="ui-card">
            <div style="height:140px; background:linear-gradient(135deg, #065f46 0%, #0f172a 100%); border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; margin-bottom:16px;">
              <span style="font-size:32px;">🚛</span>
              <span style="font-weight:800; margin-top:8px;">KHO LỚN (LARGE - DOANH NGHIỆP)</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <h3 style="font-size:18px; font-weight:800;">Kho L-Business (10.0 m²)</h3>
              <span class="badge badge-warning">🟡 Chỉ còn 1 kho</span>
            </div>
            <p style="font-size:13px; color:#64748b; margin-bottom:14px;">Dài 4.0m x Rộng 2.5m x Cao 2.8m (Thể tích 28.0 m³). Phù hợp doanh nghiệp lưu kho hàng hóa, nội thất lớn.</p>
            <div style="font-size:12px; color:#475569; display:flex; flex-direction:column; gap:6px; margin-bottom:18px;">
              <div>🚛 Cửa kho rộng 2m, xe nâng ra vào thuận tiện</div>
              <div>🛡️ Có gói bảo hiểm hàng hóa theo giá trị</div>
              <div>📍 Vị trí: Quận 7 - Tầng Trệt</div>
            </div>
            <div style="border-top:1px solid #e2e8f0; padding-top:14px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:22px; font-weight:800; color:#1e40af;">3.200.000 đ</span>
                <span style="font-size:12px; color:#64748b;">/ tháng</span>
              </div>
              <button class="btn btn-primary">Đặt giữ chỗ ngay</button>
            </div>
          </div>
        </div>
      </main>
    `
  },

  // 2. CUSTOMER: UNIT RESERVATION
  {
    fileName: 'SCR_04_Customer_Unit_Reservation.png',
    title: 'SCR-04: Đặt Giữ Chỗ Phòng Kho Trực Tuyến',
    html: `
      ${getCustomerHeader('reservation')}
      <main class="content-body">
        <div style="margin-bottom:24px;">
          <span class="badge badge-primary">BƯỚC 1 / 3: THIẾT LẬP THỜI HẠN THUÊ</span>
          <h1 style="font-size:24px; font-weight:800; margin-top:6px;">Đặt Giữ Chỗ Kho Tự Phục Vụ Trực Tuyến</h1>
          <p style="font-size:14px; color:#64748b;">Hệ thống giữ chỗ trong 24 giờ để Quản lý cơ sở gán số phòng cụ thể và gửi thẻ hẹn Check-in.</p>
        </div>

        <div class="grid-2">
          <!-- FORM -->
          <div class="ui-card">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:18px; color:#1e40af; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
              1. Thông tin thuê kho & Lịch hẹn tiếp đón
            </h3>
            <div class="form-group">
              <label class="form-label">Cơ sở chi nhánh tiếp nhận</label>
              <input type="text" class="form-control" value="Hà Nội - Cơ sở Cầu Giấy (120 Duy Tân)" readonly style="background:#f8fafc; font-weight:700;">
            </div>
            <div class="form-group">
              <label class="form-label">Loại phòng kho lựa chọn</label>
              <input type="text" class="form-control" value="Kho M-Premium (5.0 m² - Dài 2.5m x Rộng 2.0m x Cao 2.5m)" readonly style="background:#f8fafc; font-weight:700;">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Ngày bắt đầu thuê</label>
                <input type="date" class="form-control" value="2026-09-24" style="font-weight:600;">
              </div>
              <div class="form-group">
                <label class="form-label">Thời hạn thuê</label>
                <select class="form-control" style="font-weight:600;">
                  <option>1 Tháng (Giá gốc)</option>
                  <option selected>3 Tháng (Chiết khấu 5%)</option>
                  <option>6 Tháng (Chiết khấu 10%)</option>
                  <option>12 Tháng (Chiết khấu 15%)</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Khung giờ hẹn đến check-in nhận kho</label>
              <select class="form-control" style="font-weight:600;">
                <option selected>Hôm nay: 14:00 - 15:00 (Nhân viên ca trực đón tiếp)</option>
                <option>Hôm nay: 15:30 - 16:30</option>
                <option>Ngày mai: 09:00 - 10:00</option>
              </select>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Họ tên người nhận kho</label>
                <input type="text" class="form-control" value="Trần Văn Bảo" style="font-weight:600;">
              </div>
              <div class="form-group">
                <label class="form-label">Số CCCD / Hộ chiếu</label>
                <input type="text" class="form-control" value="001202019988" style="font-weight:600;">
              </div>
            </div>
          </div>

          <!-- SUMMARY -->
          <div class="ui-card" style="background:#f8fafc; border:1px solid #cbd5e1; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <h3 style="font-size:16px; font-weight:700; margin-bottom:18px; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
                2. Tóm tắt chi phí & Quy định đặt cọc
              </h3>
              <div style="display:flex; flex-direction:column; gap:12px; font-size:14px; margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:#64748b;">Đơn giá niêm yết:</span>
                  <span style="font-weight:700;">1.500.000 đ / tháng</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:#64748b;">Thời hạn thuê:</span>
                  <span style="font-weight:700;">3 Tháng</span>
                </div>
                <div style="display:flex; justify-content:space-between; color:#10b981;">
                  <span>Chiết khấu 3 tháng (5%):</span>
                  <span style="font-weight:700;">- 225.000 đ</span>
                </div>
                <div style="border-top:1px dashed #cbd5e1; padding-top:12px; display:flex; justify-content:space-between;">
                  <span style="color:#64748b;">Tiền cọc giữ chỗ (Deposit - 1 tháng):</span>
                  <span style="font-weight:800; color:#1e40af;">1.500.000 đ</span>
                </div>
                <div style="font-size:12px; color:#64748b; line-height:1.5;">
                  * Tiền cọc được hoàn lại 100% khi thanh lý hợp đồng và nghiệm thu kho nguyên vẹn.
                </div>
              </div>

              <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:18px; margin-bottom:24px;">
                <div style="font-size:13px; color:#1e40af; font-weight:600;">Số tiền cần thanh toán ngay để giữ kho:</div>
                <div style="font-size:28px; font-weight:800; color:#1e40af; margin-top:4px;">1.500.000 VNĐ</div>
                <div style="font-size:12px; color:#3b82f6; margin-top:4px;">(Tiền thuê tháng đầu có thể trả lúc đến nhận kho tại quầy)</div>
              </div>
            </div>

            <button class="btn btn-primary" style="padding:16px; font-size:15px; font-weight:700;">
              Xác Nhận Đặt Giữ Chỗ & Sang Thanh Toán Cọc ➔
            </button>
          </div>
        </div>
      </main>
    `
  },

  // 3. CUSTOMER: PAYMENT & INVOICES
  {
    fileName: 'SCR_05_Customer_Payment_Invoices.png',
    title: 'SCR-05: Thanh Toán Tiền Cọc, Cước Thuê & Phụ Phí (VietQR / Thẻ)',
    html: `
      ${getCustomerHeader('payment')}
      <main class="content-body">
        <div style="margin-bottom:20px;">
          <span class="badge badge-warning">HÓA ĐƠN ĐANG CHỜ THANH TOÁN</span>
          <h1 style="font-size:24px; font-weight:800; margin-top:6px;">Trung Tâm Thanh Toán Phí Thuê Kho</h1>
          <p style="font-size:14px; color:#64748b;">Hỗ trợ chuyển khoản nhanh 24/7 qua VietQR tự động hoặc thẻ ATM/Visa nội địa.</p>
        </div>

        <div class="grid-2">
          <!-- INVOICE -->
          <div class="ui-card">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:14px; margin-bottom:18px;">
              <div>
                <span class="badge badge-warning">🟡 UNPAID (CHỜ THANH TOÁN)</span>
                <h3 style="font-size:18px; font-weight:800; margin-top:8px;">Hóa Đơn Cọc Giữ Chỗ Kho</h3>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px; color:#64748b;">Mã hóa đơn:</div>
                <div style="font-family:'JetBrains Mono'; font-size:15px; font-weight:800; color:#1e40af;">INV-2026-0924-01</div>
              </div>
            </div>

            <table class="data-table" style="margin-bottom:20px;">
              <thead>
                <tr>
                  <th>Nội dung thanh toán</th>
                  <th style="text-align:right;">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tiền cọc giữ chỗ phòng kho Medium 5.0m² (Đơn: RSV-8821)</td>
                  <td style="text-align:right; font-weight:700;">1.500.000 đ</td>
                </tr>
                <tr>
                  <td style="color:#64748b;">Thuế VAT (8%)</td>
                  <td style="text-align:right; color:#64748b;">0 đ (Cọc miễn VAT)</td>
                </tr>
                <tr style="background:#f8fafc; font-size:16px;">
                  <td style="font-weight:800;">TỔNG CẦN THANH TOÁN:</td>
                  <td style="text-align:right; font-weight:800; color:#1e40af;">1.500.000 VNĐ</td>
                </tr>
              </tbody>
            </table>

            <div style="background:#f8fafc; border-radius:8px; padding:14px; font-size:13px; line-height:1.6; color:#475569;">
              <div>• Khách hàng: <strong>Trần Văn Bảo</strong> (CCCD: 001202019988)</div>
              <div>• Cơ sở thuê: <strong>Cầu Giấy, Hà Nội</strong> • Thời gian hẹn: <strong>14:00 Hôm nay</strong></div>
              <div>• Thời gian giữ chỗ: Còn lại <strong>23 giờ 45 phút</strong></div>
            </div>
          </div>

          <!-- QR PANEL -->
          <div class="ui-card" style="text-align:center;">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:12px; text-align:left;">Quét mã VietQR chuyển khoản nhanh 24/7</h3>
            
            <div style="background:#f8fafc; border:2px dashed #2563eb; border-radius:12px; padding:20px; display:inline-block; margin-bottom:16px;">
              <svg width="170" height="170" viewBox="0 0 100 100" fill="#0f172a">
                <rect x="0" y="0" width="30" height="30" fill="#0f172a"/>
                <rect x="5" y="5" width="20" height="20" fill="white"/>
                <rect x="9" y="9" width="12" height="12" fill="#0f172a"/>
                <rect x="70" y="0" width="30" height="30" fill="#0f172a"/>
                <rect x="75" y="5" width="20" height="20" fill="white"/>
                <rect x="79" y="9" width="12" height="12" fill="#0f172a"/>
                <rect x="0" y="70" width="30" height="30" fill="#0f172a"/>
                <rect x="5" y="75" width="20" height="20" fill="white"/>
                <rect x="9" y="79" width="12" height="12" fill="#0f172a"/>
                <rect x="40" y="10" width="10" height="20"/>
                <rect x="10" y="40" width="20" height="10"/>
                <rect x="40" y="40" width="20" height="20"/>
                <rect x="70" y="40" width="15" height="10"/>
                <rect x="40" y="70" width="20" height="15"/>
                <rect x="70" y="70" width="25" height="25"/>
              </svg>
              <div style="font-family:'JetBrains Mono'; font-size:14px; font-weight:800; color:#1e40af; margin-top:8px;">
                NỘI DUNG: TT COC RSV 8821
              </div>
            </div>

            <div style="font-size:13px; color:#475569; margin-bottom:20px;">
              Ngân hàng: <strong>MBBank</strong> • STK: <strong>0987654321001</strong> • Thụ hưởng: <strong>SELF STORAGE VN</strong>
            </div>

            <button class="btn btn-success" style="width:100%; padding:14px; font-weight:700;">
              ✓ Xác Nhận Thanh Toán Thành Công & Xem Thẻ Check-in
            </button>
          </div>
        </div>
      </main>
    `
  },

  // 4. CUSTOMER: CHECK-IN PASS
  {
    fileName: 'SCR_06_Customer_Scheduled_Checkin_Pass.png',
    title: 'SCR-06: Thẻ Tiếp Đón Check-in Nhận Phòng Kho Theo Lịch Hẹn',
    html: `
      ${getCustomerHeader('pass')}
      <main class="content-body" style="align-items:center; justify-content:center;">
        <div style="width:760px; background:white; border-radius:16px; border:2px dashed #93c5fd; padding:32px; box-shadow:0 20px 40px rgba(37,99,235,0.12);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #e2e8f0; padding-bottom:20px; margin-bottom:24px;">
            <div>
              <span class="badge badge-success">🟢 ĐÃ XÁC NHẬN CỌC - ĐÃ GÁN PHÒNG KHO</span>
              <h1 style="font-size:24px; font-weight:800; color:#0f172a; margin-top:8px;">THẺ HẸN CHECK-IN NHẬN KHO</h1>
              <div style="font-size:14px; color:#64748b; margin-top:4px;">Mã đặt chỗ: <strong style="font-family:'JetBrains Mono'; color:#1e40af;">RSV-8821</strong></div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px; color:#64748b;">Số phòng kho chính thức:</div>
              <div style="font-family:'JetBrains Mono'; font-size:32px; font-weight:900; color:#1e40af;">UNIT A-102</div>
            </div>
          </div>

          <div class="grid-3" style="margin-bottom:28px;">
            <div class="ui-card" style="padding:16px; background:#f8fafc;">
              <div style="font-size:12px; color:#64748b;">Khung giờ hẹn đón tiếp:</div>
              <div style="font-size:15px; font-weight:800; color:#0f172a; margin-top:4px;">14:00 - 15:00 Hôm nay</div>
              <div style="font-size:11px; color:#10b981; margin-top:2px;">Nhân viên đã sẵn sàng đón</div>
            </div>
            <div class="ui-card" style="padding:16px; background:#f8fafc;">
              <div style="font-size:12px; color:#64748b;">Cơ sở chi nhánh:</div>
              <div style="font-size:15px; font-weight:800; color:#0f172a; margin-top:4px;">120 Duy Tân, Cầu Giấy</div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">Tầng 1 - Khu kho A</div>
            </div>
            <div class="ui-card" style="padding:16px; background:#f8fafc;">
              <div style="font-size:12px; color:#64748b;">Nhân viên trực ca:</div>
              <div style="font-size:15px; font-weight:800; color:#0f172a; margin-top:4px;">Nguyễn Văn Tuấn</div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">Hotline: 0912.345.678</div>
            </div>
          </div>

          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px; display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
            <div>
              <div style="font-size:15px; font-weight:800; color:#1e40af;">Mã QR tiếp đón tại quầy lễ tân</div>
              <div style="font-size:13px; color:#3b82f6; margin-top:2px;">Đưa mã này cho nhân viên cơ sở để hoàn tất thủ tục bàn giao chìa khóa & mã PIN.</div>
            </div>
            <div style="background:white; padding:10px; border-radius:10px; border:1px solid #cbd5e1;">
              <svg width="70" height="70" viewBox="0 0 100 100" fill="#0f172a">
                <rect x="0" y="0" width="30" height="30"/>
                <rect x="70" y="0" width="30" height="30"/>
                <rect x="0" y="70" width="30" height="30"/>
                <rect x="40" y="40" width="20" height="20"/>
              </svg>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; padding-top:18px;">
            <span style="font-size:13px; color:#64748b;">Trạng thái kho: <strong>Đã dọn sạch vệ sinh, sẵn sàng bàn giao</strong></span>
            <button class="btn btn-outline">Xem bản đồ chỉ dẫn lối vào kho A-102</button>
          </div>
        </div>
      </main>
    `
  },

  // 5. CUSTOMER: MY RENTED UNITS
  {
    fileName: 'SCR_07_Customer_My_Rented_Units.png',
    title: 'SCR-07: Quản Lý Các Kho Đang Thuê & Mã PIN Mở Cửa Điện Tử',
    html: `
      ${getCustomerHeader('rentals')}
      <main class="content-body">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
          <div>
            <span class="badge badge-success">02 PHÒNG KHO ĐANG HOẠT ĐỘNG</span>
            <h1 style="font-size:24px; font-weight:800; margin-top:6px;">Quản Lý Kho Đang Thuê & Mã PIN Điện Tử</h1>
            <p style="font-size:14px; color:#64748b;">Xem mã mở khóa an ninh, thời hạn hợp đồng, yêu cầu gia hạn hoặc gửi lịch hẹn trả kho.</p>
          </div>
          <button class="btn btn-outline">+ Thuê thêm kho mới</button>
        </div>

        <div class="grid-2">
          <!-- UNIT 1: A-102 -->
          <div class="ui-card" style="border-top:4px solid #10b981;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
              <div>
                <span class="badge badge-success">🟢 ĐANG SỬ DỤNG (ACTIVE)</span>
                <h3 style="font-size:20px; font-weight:800; margin-top:6px;">PHÒNG KHO UNIT A-102</h3>
                <div style="font-size:13px; color:#64748b;">Cơ sở Cầu Giấy (Tầng 1) • Kho Medium (5.0 m²)</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px; color:#64748b;">Hợp đồng:</div>
                <div style="font-family:'JetBrains Mono'; font-weight:800; color:#1e40af;">CTR-2026-001</div>
              </div>
            </div>

            <!-- PIN DISPLAY -->
            <div style="background:#0f172a; border-radius:12px; padding:18px; color:white; margin-bottom:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; color:#94a3b8;">MÃ PIN ĐIỆN TỬ MỞ KHÓA (ACCESS CODE):</span>
                <span style="font-size:12px; color:#38bdf8;">Đang mở khóa</span>
              </div>
              <div style="font-family:'JetBrains Mono'; font-size:32px; font-weight:900; letter-spacing:8px; text-align:center; padding:14px 0; color:#38bdf8;">
                8 9 4 2 1 0
              </div>
              <div style="display:flex; justify-content:space-between; font-size:12px; color:#94a3b8;">
                <span>Ổ khóa cơ: Khóa số LOC-8812</span>
                <span style="color:#38bdf8; cursor:pointer; font-weight:600;">[Đổi mã PIN mới]</span>
              </div>
            </div>

            <div style="font-size:13px; display:flex; justify-content:space-between; margin-bottom:18px; color:#475569; background:#f8fafc; padding:12px; border-radius:8px;">
              <div>Hạn hợp đồng: <strong>24/12/2026</strong> (Còn 90 ngày)</div>
              <div>Cọc đang giữ: <strong style="color:#10b981;">1.500.000 đ</strong></div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
              <button class="btn btn-outline">Gia hạn thuê</button>
              <button class="btn btn-outline">Yêu cầu trả kho</button>
              <button class="btn btn-primary">Báo sự cố</button>
            </div>
          </div>

          <!-- UNIT 2: B-205 -->
          <div class="ui-card" style="border-top:4px solid #10b981;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
              <div>
                <span class="badge badge-success">🟢 ĐANG SỬ DỤNG (ACTIVE)</span>
                <h3 style="font-size:20px; font-weight:800; margin-top:6px;">PHÒNG KHO UNIT B-205</h3>
                <div style="font-size:13px; color:#64748b;">Cơ sở Quận 7, TP.HCM (Tầng 2) • Kho Large (8.0 m²)</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px; color:#64748b;">Hợp đồng:</div>
                <div style="font-family:'JetBrains Mono'; font-weight:800; color:#1e40af;">CTR-2026-089</div>
              </div>
            </div>

            <!-- PIN DISPLAY -->
            <div style="background:#0f172a; border-radius:12px; padding:18px; color:white; margin-bottom:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; color:#94a3b8;">MÃ PIN ĐIỆN TỬ MỞ KHÓA:</span>
                <span style="font-size:12px; color:#10b981;">● Đã kích hoạt</span>
              </div>
              <div style="font-family:'JetBrains Mono'; font-size:32px; font-weight:900; letter-spacing:8px; text-align:center; padding:14px 0; color:#a7f3d0;">
                5 2 9 1 0 4
              </div>
              <div style="display:flex; justify-content:space-between; font-size:12px; color:#94a3b8;">
                <span>Thẻ từ RFID: CRD-1029</span>
                <span style="color:#64748b;">Khóa tự động sau 10s</span>
              </div>
            </div>

            <div style="font-size:13px; display:flex; justify-content:space-between; margin-bottom:18px; color:#475569; background:#f8fafc; padding:12px; border-radius:8px;">
              <div>Hạn hợp đồng: <strong>15/10/2026</strong> (Còn 21 ngày)</div>
              <div>Cọc đang giữ: <strong style="color:#10b981;">2.500.000 đ</strong></div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
              <button class="btn btn-outline">Gia hạn thuê</button>
              <button class="btn btn-outline">Yêu cầu trả kho</button>
              <button class="btn btn-primary">Báo sự cố</button>
            </div>
          </div>
        </div>
      </main>
    `
  },

  // 6. CUSTOMER: SUPPORT TICKET
  {
    fileName: 'SCR_09_Customer_Support_Ticket.png',
    title: 'SCR-09: Gửi Yêu Cầu Hỗ Trợ Sự Cố (Khóa, Mã PIN, Phòng Kho, Hàng Hóa)',
    html: `
      ${getCustomerHeader('support')}
      <main class="content-body">
        <div style="margin-bottom:20px;">
          <span class="badge badge-primary">TRUNG TÂM TIẾP NHẬN HỖ TRỢ KỸ THUẬT</span>
          <h1 style="font-size:24px; font-weight:800; margin-top:6px;">Gửi Yêu Cầu Hỗ Trợ & Xử Lý Sự Cố</h1>
          <p style="font-size:14px; color:#64748b;">Xử lý sự cố: quên mã PIN, kẹt ổ khóa cơ, lỗi thẻ từ, rò rỉ ẩm phòng kho hoặc kiểm tra hàng hóa.</p>
        </div>

        <div class="grid-2">
          <!-- FORM -->
          <div class="ui-card">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; color:#1e40af;">Tạo phiếu yêu cầu hỗ trợ mới</h3>
            <div class="form-group">
              <label class="form-label">Phòng kho cần hỗ trợ</label>
              <select class="form-control" style="font-weight:600;">
                <option>Unit A-102 (Chi nhánh Cầu Giấy, Hà Nội)</option>
                <option>Unit B-205 (Chi nhánh Quận 7, TP.HCM)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Phân loại sự cố (Category)</label>
              <select class="form-control" style="font-weight:600;">
                <option>🔢 Quên hoặc Lỗi mã PIN truy cập điện tử</option>
                <option>🔐 Sự cố Ổ khóa cơ / Thẻ từ bị kẹt</option>
                <option>💧 Vấn đề phòng kho (Thấm ẩm, cửa cuốn kẹt, đèn hỏng)</option>
                <option>💳 Thắc mắc cước phí & Hóa đơn thanh toán</option>
                <option>📦 Yêu cầu kiểm tra bảo quản hàng hóa</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Mức độ ưu tiên</label>
              <div style="display:flex; gap:20px; font-size:14px; margin-top:6px;">
                <label style="display:flex; align-items:center; gap:6px;"><input type="radio" name="p" checked> Bình thường</label>
                <label style="display:flex; align-items:center; gap:6px; color:#ef4444; font-weight:700;"><input type="radio" name="p"> Khẩn cấp (Cần mở kho gấp)</label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Mô tả chi tiết sự cố hiện trường</label>
              <textarea class="form-control" rows="3" style="font-weight:500;">Bàn phím mã PIN tại kho A-102 nhấp nháy đèn đỏ báo lỗi, tôi không nhập được mã để mở cửa kho...</textarea>
            </div>
            <button class="btn btn-primary" style="width:100%; padding:14px; font-weight:700;">
              Gửi Yêu Cầu Tới Nhân Viên Trực Ca Ngay
            </button>
          </div>

          <!-- LIST -->
          <div class="ui-card">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:16px;">Lịch sử yêu cầu hỗ trợ đã gửi</h3>
            
            <div style="border:1px solid #bfdbfe; background:#eff6ff; border-radius:10px; padding:16px; margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span class="badge badge-warning">🟡 ĐANG XỬ LÝ TẠI CHỖ</span>
                <span style="font-size:12px; color:#64748b;">Hôm nay, 13:10</span>
              </div>
              <div style="font-size:15px; font-weight:800; color:#0f172a;">#TK-115: Quên mã PIN mở kho Unit A-102</div>
              <div style="font-size:13px; color:#334155; margin-top:6px;">
                Nhân viên <strong>Nguyễn Văn Tuấn</strong> (Facility Staff) đang tiến hành xác minh và cấp mã tạm thời.
              </div>
            </div>

            <div style="border:1px solid #e2e8f0; background:#f8fafc; border-radius:10px; padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span class="badge badge-success">🟢 ĐÃ GIẢI QUYẾT</span>
                <span style="font-size:12px; color:#64748b;">20/09/2026</span>
              </div>
              <div style="font-size:15px; font-weight:800; color:#0f172a;">#TK-102: Yêu cầu cấp thêm 01 thẻ từ ra vào cổng 24/7</div>
              <div style="font-size:13px; color:#64748b; margin-top:6px;">
                Đã bàn giao thẻ phụ CRD-0420 tại quầy tiếp tân cơ sở Cầu Giấy.
              </div>
            </div>
          </div>
        </div>
      </main>
    `
  },

  // 7. STAFF: DAILY TASK BOARD
  {
    fileName: 'SCR_10_Staff_Daily_Task_Board.png',
    title: 'SCR-10: Bàn Làm Việc Theo Dõi Lịch Công Việc Ca Trực Hàng Ngày',
    html: `
      ${getStaffHeader('daily')}
      <main class="content-body">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <span class="badge badge-primary">CA TRỰC: 08:00 - 17:00</span>
            <h1 style="font-size:24px; font-weight:800; margin-top:6px;">Bàn Làm Việc Ca Trực Hàng Ngày (Daily Operations)</h1>
            <p style="font-size:14px; color:#64748b;">Chi nhánh: <strong>Hà Nội - Cơ sở Cầu Giấy</strong> • Ngày làm việc: <strong>24/09/2026</strong></p>
          </div>
          <button class="btn btn-outline" style="border-color:#334155; color:#cbd5e1; background:#0f172a;">
            🔍 Tra cứu đơn đặt mới
          </button>
        </div>

        <!-- 4 CARDS -->
        <div class="grid-4" style="margin-bottom:24px;">
          <div class="ui-card" style="border-left:4px solid #3b82f6;">
            <div style="font-size:12px; color:#64748b; font-weight:700;">HẸN CHECK-IN HÔM NAY</div>
            <div style="font-size:28px; font-weight:900; color:#0f172a; margin:4px 0;">05 Khách</div>
            <div style="font-size:12px; color:#10b981; font-weight:600;">🟢 02 Đã nhận • 03 Đang đợi</div>
          </div>
          <div class="ui-card" style="border-left:4px solid #f59e0b;">
            <div style="font-size:12px; color:#64748b; font-weight:700;">HẸN TRẢ KHO & NGHIỆM THU</div>
            <div style="font-size:28px; font-weight:900; color:#0f172a; margin:4px 0;">02 Lịch</div>
            <div style="font-size:12px; color:#d97706; font-weight:600;">🟡 Cần kiểm tra hoàn cọc</div>
          </div>
          <div class="ui-card" style="border-left:4px solid #ef4444;">
            <div style="font-size:12px; color:#64748b; font-weight:700;">SỰ CỐ CẦN XỬ LÝ TẠI CHỖ</div>
            <div style="font-size:28px; font-weight:900; color:#ef4444; margin:4px 0;">03 Ticket</div>
            <div style="font-size:12px; color:#ef4444; font-weight:600;">🔴 01 Khẩn cấp kẹt mã PIN</div>
          </div>
          <div class="ui-card" style="border-left:4px solid #10b981;">
            <div style="font-size:12px; color:#64748b; font-weight:700;">TỶ LỆ LẤP ĐẦY KHO</div>
            <div style="font-size:28px; font-weight:900; color:#10b981; margin:4px 0;">102 / 120</div>
            <div style="font-size:12px; color:#64748b; font-weight:600;">Còn trống 18 phòng kho (15%)</div>
          </div>
        </div>

        <!-- TABLE -->
        <div class="ui-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="font-size:16px; font-weight:800;">Danh sách khách hẹn tiếp đón & nhận kho hôm nay</h3>
            <span class="badge badge-primary">3 Khách trong hàng đợi</span>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Giờ hẹn</th>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Số điện thoại</th>
                <th>Phòng kho gán</th>
                <th>Tiền cọc</th>
                <th>Trạng thái</th>
                <th style="text-align:right;">Thao tác ca trực</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background:#eff6ff;">
                <td><strong style="color:#1e40af; font-size:15px;">14:00</strong></td>
                <td><span style="font-family:'JetBrains Mono'; font-weight:800;">RSV-8821</span></td>
                <td><strong>Trần Văn Bảo</strong></td>
                <td>0987.654.321</td>
                <td><span class="badge badge-primary">UNIT A-102</span></td>
                <td><span style="color:#10b981; font-weight:700;">Đã nộp 1.500.000đ</span></td>
                <td><span class="badge badge-warning">Đang đến quầy</span></td>
                <td style="text-align:right;">
                  <button class="btn btn-primary" style="padding:6px 14px; font-size:13px;">Tiếp Đón & Bàn Giao Kho</button>
                </td>
              </tr>
              <tr>
                <td>14:30</td>
                <td><span style="font-family:'JetBrains Mono';">RSV-8825</span></td>
                <td>Nguyễn Thu Thủy</td>
                <td>0912.111.222</td>
                <td><span class="badge badge-primary">UNIT A-105</span></td>
                <td><span style="color:#10b981; font-weight:700;">Đã nộp 800.000đ</span></td>
                <td><span class="badge badge-success">Đã chuẩn bị kho</span></td>
                <td style="text-align:right;">
                  <button class="btn btn-outline" style="padding:6px 14px; font-size:13px;">Xem hồ sơ</button>
                </td>
              </tr>
              <tr>
                <td>16:00</td>
                <td><span style="font-family:'JetBrains Mono';">RSV-8830</span></td>
                <td>Cty TNHH Ánh Dương</td>
                <td>024.3999.8888</td>
                <td><span class="badge badge-primary">UNIT B-101</span></td>
                <td><span style="color:#10b981; font-weight:700;">Đã nộp 3.200.000đ</span></td>
                <td><span class="badge badge-warning">Chờ gán xe nâng</span></td>
                <td style="text-align:right;">
                  <button class="btn btn-outline" style="padding:6px 14px; font-size:13px;">Xem hồ sơ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    `
  },

  // 8. STAFF: RESERVATION LOOKUP
  {
    fileName: 'SCR_11_Staff_Reservation_Lookup.png',
    title: 'SCR-11: Tra Cứu & Xác Thực Đơn Đặt Chỗ Khi Khách Đến Cơ Sở',
    html: `
      ${getStaffHeader('lookup')}
      <main class="content-body">
        <div style="margin-bottom:20px;">
          <span class="badge badge-primary">TIẾP ĐÓN KHÁCH HÀNG TẠI QUẦY</span>
          <h1 style="font-size:24px; font-weight:800; margin-top:6px;">Tra Cứu & Xác Thực Đơn Đặt Chỗ</h1>
          <p style="font-size:14px; color:#64748b;">Nhập mã đơn, CCCD, SĐT hoặc quét mã QR Pass để kiểm tra điều kiện nhận bàn giao kho.</p>
        </div>

        <!-- SEARCH -->
        <div class="ui-card" style="margin-bottom:24px; background:#eff6ff; border:1px solid #bfdbfe;">
          <div style="display:flex; gap:16px;">
            <input type="text" class="form-control" value="RSV-8821" style="font-size:16px; font-weight:700; padding:12px 18px; flex:1;">
            <button class="btn btn-primary" style="padding:12px 24px;">Kiểm Tra Đơn Đặt</button>
            <button class="btn btn-outline">Quét QR Pass</button>
          </div>
        </div>

        <div class="grid-2">
          <!-- DOSSIER -->
          <div class="ui-card">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; color:#1e40af; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
              1. Hồ sơ định danh khách hàng
            </h3>
            <div style="display:flex; gap:16px; margin-bottom:18px;">
              <div class="avatar" style="width:60px; height:60px; font-size:22px;">TB</div>
              <div>
                <h4 style="font-size:18px; font-weight:800; color:#0f172a;">Trần Văn Bảo</h4>
                <div style="font-size:13px; color:#64748b; margin-top:2px;">CCCD: <strong style="color:#0f172a;">001202019988</strong></div>
                <div style="font-size:13px; color:#64748b;">Điện thoại: <strong style="color:#0f172a;">0987.654.321</strong></div>
                <span class="badge badge-success" style="margin-top:6px;">Đã xác minh danh tính</span>
              </div>
            </div>

            <div style="background:#f8fafc; border-radius:8px; padding:14px; font-size:13px; line-height:1.6; color:#475569;">
              <div>• Lịch hẹn đón tiếp: <strong>Hôm nay: 14:00 - 15:00</strong> (Đúng hẹn)</div>
              <div>• Thời hạn thuê: <strong>3 Tháng</strong> (24/09/2026 - 24/12/2026)</div>
              <div>• Tiền cọc đã nộp: <strong style="color:#10b981;">1.500.000 VNĐ</strong> (VietQR MBBank)</div>
            </div>
          </div>

          <!-- ASSIGNED UNIT -->
          <div class="ui-card">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; color:#1e40af; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
              2. Trạng thái phòng kho được gán
            </h3>

            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:18px; margin-bottom:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:12px; color:#1e40af; font-weight:700;">MÃ PHÒNG KHO CHÍNH THỨC:</div>
                  <div style="font-family:'JetBrains Mono'; font-size:26px; font-weight:900; color:#1e40af;">UNIT A-102</div>
                </div>
                <span class="badge badge-success">🟢 SẴN SÀNG BÀN GIAO</span>
              </div>
              <div style="font-size:13px; color:#3b82f6; margin-top:6px;">
                Vị trí: Tầng 1 (Khu A) • Loại: Kho Medium 5.0m² • Đã dọn vệ sinh.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Thu cước thuê kỳ đầu (Tháng 10/2026) tại quầy</label>
              <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 16px; border-radius:8px; border:1px solid #cbd5e1;">
                <span>Số tiền: <strong>1.500.000 đ</strong></span>
                <span class="badge badge-primary">Khách chọn trả tại quầy</span>
              </div>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:14px; font-weight:700; margin-top:10px;">
              Xác Nhận & Bắt Đầu Thủ Tục Bàn Giao Kho ➔
            </button>
          </div>
        </div>
      </main>
    `
  },

  // 9. STAFF: CHECK-IN & HANDOVER
  {
    fileName: 'SCR_12_Staff_Checkin_Handover.png',
    title: 'SCR-12: Hỗ Trợ Check-in & Biên Bản Bàn Giao Kho, Khóa, Thẻ, PIN',
    html: `
      ${getStaffHeader('handover')}
      <main class="content-body">
        <div style="margin-bottom:20px;">
          <span class="badge badge-primary">QUY TRÌNH THỰC ĐỊA</span>
          <h1 style="font-size:24px; font-weight:800; margin-top:6px;">Biên Bản Kiểm Tra Hiện Trường & Bàn Giao Kho (Handover)</h1>
          <p style="font-size:14px; color:#64748b;">Nhân viên cùng khách hàng kiểm tra thực tế tại phòng kho, cấp phát chìa khóa, thẻ từ và kích hoạt mã PIN.</p>
        </div>

        <div class="grid-2">
          <!-- CHECKLIST -->
          <div class="ui-card">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; color:#1e40af;">1. Checklist kiểm tra hiện trạng vật lý kho A-102</h3>
            
            <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border-radius:8px;">
                <input type="checkbox" checked style="width:18px; height:18px;">
                <span>1. Sàn kho sạch sẽ, khô ráo, không có rác tồn đọng</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border-radius:8px;">
                <input type="checkbox" checked style="width:18px; height:18px;">
                <span>2. Cửa cuốn kéo êm, chốt an toàn hoạt động trơn tru</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border-radius:8px;">
                <input type="checkbox" checked style="width:18px; height:18px;">
                <span>3. Đèn LED cảm ứng chiếu sáng tự động bật sáng khi mở</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border-radius:8px;">
                <input type="checkbox" checked style="width:18px; height:18px;">
                <span>4. Vách ngăn kim loại kiên cố, không bị móp méo hay gỉ sét</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border-radius:8px;">
                <input type="checkbox" checked style="width:18px; height:18px;">
                <span>5. Cảm biến báo khói PCCC và vòi phun đạt chuẩn an toàn</span>
              </div>
            </div>
          </div>

          <!-- ASSETS & SIGN-OFF -->
          <div class="ui-card">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; color:#1e40af;">2. Bàn giao thiết bị & Kích hoạt mã bảo mật</h3>
            
            <div class="form-group">
              <label class="form-label">Mã ổ khóa cơ bàn giao</label>
              <input type="text" class="form-control" value="LOC-8812 (Kèm 02 chìa khóa mới nguyên niêm phong)" readonly style="background:#f8fafc; font-weight:600;">
            </div>

            <div class="form-group">
              <label class="form-label">Mã thẻ từ ra vào cổng 24/7</label>
              <input type="text" class="form-control" value="CRD-0419 (Đã kích hoạt quyền vào tòa nhà 24/7)" readonly style="background:#f8fafc; font-weight:600;">
            </div>

            <div class="form-group">
              <label class="form-label">Kích hoạt Mã PIN điện tử 6 số</label>
              <input type="text" class="form-control" value="894 210" style="font-family:'JetBrains Mono'; font-weight:800; font-size:20px; color:#1e40af; background:#f8fafc;" readonly>
              <span style="font-size:12px; color:#64748b; margin-top:4px; display:block;">Mã PIN sẽ hiển thị ngay lập tức trên app khách hàng.</span>
            </div>

            <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:12px; margin-bottom:18px; font-size:13px;">
              <div>• Nhân viên bàn giao: <strong>Nguyễn Văn Tuấn</strong> (Đã ký điện tử)</div>
              <div>• Khách hàng nhận: <strong>Trần Văn Bảo</strong> (Xác nhận trên Tablet)</div>
            </div>

            <button class="btn btn-success" style="width:100%; padding:14px; font-weight:700;">
              ✓ Hoàn Tất Bàn Giao & Cập Nhật Kho Sang OCCUPIED
            </button>
          </div>
        </div>
      </main>
    `
  },

  // 10. STAFF: UNIT STATUS MATRIX
  {
    fileName: 'SCR_16_Staff_Unit_Status_Matrix.png',
    title: 'SCR-16: Sơ Đồ Mặt Bằng Phòng Kho & Cập Nhật Trạng Thái Thời Gian Thực',
    html: `
      ${getStaffHeader('matrix')}
      <main class="content-body">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <span class="badge badge-primary">MẶT BẰNG CHI NHÁNH CẦU GIẤY</span>
            <h1 style="font-size:24px; font-weight:800; margin-top:6px;">Sơ Đồ Mặt Bằng & Cập Nhật Trạng Thái Phòng Kho</h1>
            <p style="font-size:14px; color:#64748b;">Nhấp vào ô kho để cập nhật: Trống (Available), Đã đặt (Reserved), Đang dùng (Occupied), Bảo trì (Maintenance).</p>
          </div>
          <div style="display:flex; gap:16px; font-size:13px;">
            <span style="display:flex; align-items:center; gap:6px;"><span style="width:14px; height:14px; background:#10b981; border-radius:4px;"></span> Trống (Available): 18</span>
            <span style="display:flex; align-items:center; gap:6px;"><span style="width:14px; height:14px; background:#f59e0b; border-radius:4px;"></span> Đã đặt (Reserved): 6</span>
            <span style="display:flex; align-items:center; gap:6px;"><span style="width:14px; height:14px; background:#ef4444; border-radius:4px;"></span> Đang thuê (Occupied): 92</span>
            <span style="display:flex; align-items:center; gap:6px;"><span style="width:14px; height:14px; background:#64748b; border-radius:4px;"></span> Bảo trì (Maintenance): 4</span>
          </div>
        </div>

        <div class="ui-card">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:20px;">
            <div style="font-weight:800; color:#1e40af; font-size:16px;">TẦNG 1 - KHU VỰC A (KHO MINI & TIÊU CHUẨN)</div>
            <select class="form-control" style="width:180px; font-weight:600;">
              <option>Tầng 1 (Khu A)</option>
              <option>Tầng 2 (Khu B)</option>
              <option>Tầng 3 (Khu C)</option>
            </select>
          </div>

          <!-- 18 UNITS GRID -->
          <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:16px;">
            <div style="background:#ecfdf5; border:2px solid #10b981; border-radius:10px; padding:16px; color:#065f46;">
              <div style="font-weight:800; font-size:16px;">A-101</div>
              <div style="font-size:12px;">Kho S (2.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">AVAILABLE</div>
            </div>
            <div style="background:#fef2f2; border:2px solid #ef4444; border-radius:10px; padding:16px; color:#991b1b;">
              <div style="font-weight:800; font-size:16px;">A-102</div>
              <div style="font-size:12px;">Kho M (5.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">OCCUPIED (Trần Văn Bảo)</div>
            </div>
            <div style="background:#ecfdf5; border:2px solid #10b981; border-radius:10px; padding:16px; color:#065f46;">
              <div style="font-weight:800; font-size:16px;">A-103</div>
              <div style="font-size:12px;">Kho S (2.5 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">AVAILABLE</div>
            </div>
            <div style="background:#fffbeb; border:2px solid #f59e0b; border-radius:10px; padding:16px; color:#92400e;">
              <div style="font-weight:800; font-size:16px;">A-104</div>
              <div style="font-size:12px;">Kho M (5.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">RESERVED</div>
            </div>
            <div style="background:#ecfdf5; border:2px solid #10b981; border-radius:10px; padding:16px; color:#065f46;">
              <div style="font-weight:800; font-size:16px;">A-105</div>
              <div style="font-size:12px;">Kho M (5.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">AVAILABLE</div>
            </div>
            <div style="background:#fef2f2; border:2px solid #ef4444; border-radius:10px; padding:16px; color:#991b1b;">
              <div style="font-weight:800; font-size:16px;">A-106</div>
              <div style="font-size:12px;">Kho L (10.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">OCCUPIED</div>
            </div>
            <div style="background:#f1f5f9; border:2px solid #64748b; border-radius:10px; padding:16px; color:#334155;">
              <div style="font-weight:800; font-size:16px;">A-107</div>
              <div style="font-size:12px;">Kho S (2.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">MAINTENANCE (Thay bóng đèn)</div>
            </div>
            <div style="background:#fef2f2; border:2px solid #ef4444; border-radius:10px; padding:16px; color:#991b1b;">
              <div style="font-weight:800; font-size:16px;">A-108</div>
              <div style="font-size:12px;">Kho M (5.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">OCCUPIED (Hẹn trả 15:30)</div>
            </div>
            <div style="background:#ecfdf5; border:2px solid #10b981; border-radius:10px; padding:16px; color:#065f46;">
              <div style="font-weight:800; font-size:16px;">A-109</div>
              <div style="font-size:12px;">Kho L (8.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">AVAILABLE</div>
            </div>
            <div style="background:#ecfdf5; border:2px solid #10b981; border-radius:10px; padding:16px; color:#065f46;">
              <div style="font-weight:800; font-size:16px;">A-110</div>
              <div style="font-size:12px;">Kho S (3.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">AVAILABLE</div>
            </div>
            <div style="background:#fef2f2; border:2px solid #ef4444; border-radius:10px; padding:16px; color:#991b1b;">
              <div style="font-weight:800; font-size:16px;">A-111</div>
              <div style="font-size:12px;">Kho M (6.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">OCCUPIED</div>
            </div>
            <div style="background:#ecfdf5; border:2px solid #10b981; border-radius:10px; padding:16px; color:#065f46;">
              <div style="font-weight:800; font-size:16px;">A-112</div>
              <div style="font-size:12px;">Kho M (5.0 m²)</div>
              <div style="font-size:11px; font-weight:800; margin-top:8px;">AVAILABLE</div>
            </div>
          </div>
        </div>
      </main>
    `
  },

  // 11. STAFF: RETURN INSPECTION
  {
    fileName: 'SCR_13_Staff_Return_Inspection.png',
    title: 'SCR-13: Biên Bản Nghiệm Thu Khi Khách Trả Kho & Hoàn Tiền Cọc',
    html: `
      ${getStaffHeader('return')}
      <main class="content-body">
        <div style="margin-bottom:20px;">
          <span class="badge badge-warning">THỦ TỤC THANH LÝ HỢP ĐỒNG THUÊ</span>
          <h1 style="font-size:24px; font-weight:800; margin-top:6px;">Biên Bản Nghiệm Thu Hiện Trường Khi Khách Trả Kho (Checkout)</h1>
          <p style="font-size:14px; color:#64748b;">Kiểm tra dọn dẹp hàng hóa, đối soát hư hỏng/vệ sinh, thu hồi chìa khóa cơ/thẻ từ và duyệt hoàn tiền cọc.</p>
        </div>

        <div class="grid-2">
          <!-- AUDIT -->
          <div class="ui-card">
            <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; color:#1e40af;">1. Kiểm tra hiện trường phòng kho A-102</h3>
            <div class="form-group">
              <label class="form-label">Thông tin hợp đồng & Phòng kho trả</label>
              <input type="text" class="form-control" value="UNIT A-102 (Trần Văn Bảo - CTR-2026-001)" readonly style="background:#f8fafc; font-weight:700;">
            </div>

            <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border-radius:8px;">
                <input type="checkbox" checked style="width:18px; height:18px;">
                <span>1. Khách đã dọn sạch toàn bộ đồ đạc và hàng hóa cá nhân</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border-radius:8px;">
                <input type="checkbox" checked style="width:18px; height:18px;">
                <span>2. Tường vách, sàn kho, đèn cảm ứng và cửa cuốn nguyên vẹn, không hư hỏng</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border-radius:8px;">
                <input type="checkbox" checked style="width:18px; height:18px;">
                <span>3. Đã thu hồi đủ 02 chìa khóa cơ (LOC-8812) và 01 thẻ từ (CRD-0419)</span>
              </div>
            </div>

            <div class="form-group" style="margin-top:16px;">
              <label class="form-label">Ghi chú hiện trường nghiệm thu</label>
              <textarea class="form-control" rows="2" style="font-weight:500;">Phòng kho được dọn dẹp sạch sẽ, cửa và khóa nguyên vẹn, đủ điều kiện hoàn trả cọc.</textarea>
            </div>
          </div>

          <!-- SETTLEMENT -->
          <div class="ui-card" style="background:#f8fafc; border:1px solid #cbd5e1; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
                2. Quyết toán tài chính & Hoàn tiền cọc
              </h3>

              <div style="display:flex; flex-direction:column; gap:12px; font-size:14px; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between;">
                  <span>Tiền cọc bảo đảm đang giữ:</span>
                  <span style="font-weight:700;">+ 1.500.000 đ</span>
                </div>
                <div style="display:flex; justify-content:space-between; color:#ef4444;">
                  <span>Khấu trừ phí vệ sinh kho tồn đọng:</span>
                  <span style="font-weight:700;">- 0 đ</span>
                </div>
                <div style="display:flex; justify-content:space-between; color:#ef4444;">
                  <span>Khấu trừ bồi thường hư hại ổ khóa/vách:</span>
                  <span style="font-weight:700;">- 0 đ</span>
                </div>
                <div style="border-top:1px dashed #cbd5e1; padding-top:12px; display:flex; justify-content:space-between; font-size:18px;">
                  <span style="font-weight:800;">SỐ TIỀN CỌC HOÀN LẠI:</span>
                  <span style="font-weight:900; color:#10b981;">1.500.000 VNĐ</span>
                </div>
              </div>

              <div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:14px; font-size:13px; line-height:1.6; margin-bottom:20px;">
                <div>Tài khoản hoàn tiền: <strong>MBBank - 0987654321</strong></div>
                <div>Chủ tài khoản: <strong>TRAN VAN BAO</strong> (Khách hàng)</div>
              </div>
            </div>

            <button class="btn btn-danger" style="padding:16px; font-weight:700; font-size:15px;">
              ✓ Xác Nhận Nghiệm Thu, Vô Hiệu Hóa PIN & Đổi Kho Sang CLEANING
            </button>
          </div>
        </div>
      </main>
    `
  },

  // 12. STAFF: ON-SITE INCIDENT DESK
  {
    fileName: 'SCR_14_Staff_Onsite_Incident_Desk.png',
    title: 'SCR-14: Tiếp Nhận & Xử Lý Sự Cố Tại Chỗ (Mất Chìa, Reset PIN, Hư Hỏng)',
    html: `
      ${getStaffHeader('incident')}
      <main class="content-body">
        <div style="margin-bottom:20px;">
          <span class="badge badge-danger">XỬ LÝ SỰ CỐ TẠI QUẦY & HIỆN TRƯỜNG</span>
          <h1 style="font-size:24px; font-weight:800; margin-top:6px;">Bàn Xử Lý Sự Cố Khẩn Cấp Tại Chi Nhánh</h1>
          <p style="font-size:14px; color:#64748b;">Hỗ trợ khách hàng: cấp lại mã PIN tạm thời, xử lý mất chìa, mở khóa khẩn cấp, khắc phục hư hỏng.</p>
        </div>

        <!-- 3 ACTIONS -->
        <div style="display:flex; gap:16px; margin-bottom:24px;">
          <button class="btn btn-primary" style="padding:14px 20px;">
            🔢 Cấp Lại Mã PIN Khẩn Cấp (Hiệu lực 60 phút)
          </button>
          <button class="btn btn-outline" style="padding:14px 20px;">
            🔑 Ghi Nhận Mất Chìa & Thu Phí Thay Ổ Khóa
          </button>
          <button class="btn btn-outline" style="padding:14px 20px;">
            🛠️ Tạo Phiếu Yêu Cầu Kỹ Thuật Bảo Trì
          </button>
        </div>

        <!-- TABLE -->
        <div class="ui-card">
          <h3 style="font-size:16px; font-weight:800; margin-bottom:16px;">Danh sách sự cố phát sinh tại cơ sở hôm nay</h3>

          <table class="data-table">
            <thead>
              <tr>
                <th>Mã Ticket</th>
                <th>Phòng kho</th>
                <th>Khách hàng</th>
                <th>Loại sự cố</th>
                <th>Ưu tiên</th>
                <th>Tiến độ xử lý</th>
                <th style="text-align:right;">Thao tác xử lý</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background:#eff6ff;">
                <td><strong style="font-family:'JetBrains Mono'; font-size:15px;">#TK-115</strong></td>
                <td><span class="badge badge-primary">UNIT A-102</span></td>
                <td><strong>Trần Văn Bảo</strong></td>
                <td>Quên mã PIN mở khóa cửa</td>
                <td><span class="badge badge-danger">Khẩn cấp</span></td>
                <td><span class="badge badge-warning">Đang hỗ trợ tại quầy</span></td>
                <td style="text-align:right;">
                  <button class="btn btn-primary" style="padding:6px 14px; font-size:13px;">Reset Mã PIN</button>
                </td>
              </tr>
              <tr>
                <td><strong style="font-family:'JetBrains Mono';">#TK-108</strong></td>
                <td><span class="badge badge-primary">UNIT B-205</span></td>
                <td>Lê Hải Đăng</td>
                <td>Mất 01 chìa khóa cơ</td>
                <td><span class="badge badge-warning">Trung bình</span></td>
                <td><span class="badge badge-success">Đã thay khóa mới</span></td>
                <td style="text-align:right;">
                  <button class="btn btn-outline" style="padding:6px 14px; font-size:13px;">Xem biên lai</button>
                </td>
              </tr>
              <tr>
                <td><strong style="font-family:'JetBrains Mono';">#TK-104</strong></td>
                <td><span class="badge badge-primary">DÃY KHO A</span></td>
                <td>Ban Quản Lý</td>
                <td>Đèn hành lang chập chờn</td>
                <td><span class="badge badge-warning">Bình thường</span></td>
                <td><span class="badge badge-success">Kỹ thuật đã sửa</span></td>
                <td style="text-align:right;">
                  <button class="btn btn-outline" style="padding:6px 14px; font-size:13px;">Chi tiết</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    `
  }
];

// GENERATE HTML TEMPLATES
screens.forEach(s => {
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${s.title}</title>
      <style>${commonStyles}</style>
    </head>
    <body>
      ${s.html}
    </body>
    </html>
  `;
  fs.writeFileSync(path.join(htmlDir, s.fileName.replace('.png', '.html')), fullHtml, 'utf8');
});

console.log('Generated 12 HTML templates successfully!');

// SCREENSHOT EACH FILE WITH HEADLESS EDGE
const userDataDir = path.join(os.tmpdir(), 'edge_capture_profile');
screens.forEach((s, idx) => {
  const htmlFile = path.join(htmlDir, s.fileName.replace('.png', '.html'));
  const pngTarget = path.join(outDir, s.fileName);
  const tempPng = path.join(os.tmpdir(), 'scr_' + idx + '.png');

  console.log(`[${idx+1}/12] Capturing: ${s.fileName}...`);
  try {
    execFileSync(edgePath, [
      '--headless',
      '--no-sandbox',
      '--disable-gpu',
      '--user-data-dir=' + userDataDir,
      '--screenshot=' + tempPng,
      '--window-size=1440,900',
      '--hide-scrollbars',
      'file:///' + htmlFile.replace(/\\/g, '/')
    ]);

    if (fs.existsSync(tempPng)) {
      fs.copyFileSync(tempPng, pngTarget);
      console.log(` -> Saved: ${pngTarget} (${fs.statSync(pngTarget).size} bytes)`);
    } else {
      console.error(` -> Failed to find temp screenshot for: ${s.fileName}`);
    }
  } catch (err) {
    console.error(` -> Error capturing ${s.fileName}:`, err.message);
  }
});

console.log('ALL 12 SCREENS RENDERED SUCCESSFULLY INTO PNG!');
