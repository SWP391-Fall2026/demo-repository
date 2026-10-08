/**
 * AUDIT SERVICE - MODEL & BUSINESS LOGIC & REST ROUTER
 */

const express = require('express');
const router = express.Router();

let logs = [
  { time: '12:35:10 Hôm nay', user: 'Nguyễn Văn Tuấn', role: 'STAFF', action: 'HANDOVER_UNIT', detail: 'Hoàn tất bàn giao kho A-102 cho khách Trần Văn Bảo (RSV-8821)', ip: '192.168.1.45', status: 'SUCCESS' },
  { time: '12:15:02 Hôm nay', user: 'Trần Văn Bảo', role: 'CUSTOMER', action: 'PAYMENT_CONFIRM', detail: 'Thanh toán cọc 1.450.000 VNĐ qua VietQR TxID: 998124', ip: '113.190.23.8', status: 'SUCCESS' },
  { time: '11:50:40 Hôm nay', user: 'Phạm Hải Đăng', role: 'FACILITY_MGR', action: 'ASSIGN_UNIT', detail: 'Gán kho A-102 cho đơn đặt chỗ RSV-8821', ip: '192.168.1.12', status: 'SUCCESS' },
  { time: '10:30:15 Hôm nay', user: 'Trần Văn Bảo', role: 'CUSTOMER', action: 'CREATE_RESERVATION', detail: 'Tạo đơn đặt giữ chỗ Kho M (5.0m²) tại Cầu Giấy', ip: '113.190.23.8', status: 'SUCCESS' },
  { time: '09:40:22 Hôm nay', user: 'Đặng Hoàng Long', role: 'OPS_MGR', action: 'UPDATE_POLICY', detail: 'Cập nhật mức chiết khấu thuê 12 tháng lên 15%', ip: '192.168.0.2', status: 'SUCCESS' },
  { time: '08:15:00 Hôm nay', user: 'Admin Hệ thống', role: 'SYSTEM_ADMIN', action: 'USER_LOGIN', detail: 'Đăng nhập vào bảng điều khiển quản trị tập trung', ip: '192.168.0.1', status: 'SUCCESS' }
];

// GET /api/audit-logs
router.get('/', (req, res) => {
  res.json({ success: true, count: logs.length, data: logs });
});

// POST /api/audit-logs
router.post('/', (req, res) => {
  const { user, role, action, detail, ip, status } = req.body;
  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}:${now.getSeconds() < 10 ? '0' : ''}${now.getSeconds()} Hôm nay`;
  const entry = {
    time: timeStr,
    user: user || 'Anonymous',
    role: role || 'SYSTEM',
    action: action || 'EVENT',
    detail: detail || '',
    ip: ip || '192.168.1.1',
    status: status || 'SUCCESS'
  };
  logs.unshift(entry);
  res.status(201).json({ success: true, data: entry });
});

module.exports = router;
