/**
 * TASK & INCIDENT SERVICE - MODEL & BUSINESS LOGIC & REST ROUTER
 */

const express = require('express');
const router = express.Router();

let dailyTasks = [
  { id: 'TSK-101', title: 'Bàn giao tiếp đón kho A-102', staff: 'Nguyễn Văn Tuấn', deadline: '15:00', status: 'IN_PROGRESS' },
  { id: 'TSK-102', title: 'Nghiệm thu kho trả A-106', staff: 'Lê Thị Mai', deadline: '17:30', status: 'PENDING' },
  { id: 'TSK-103', title: 'Vệ sinh chuyên sâu kho A-108', staff: 'Nguyễn Văn Tuấn', deadline: '14:30', status: 'COMPLETED' }
];

let incidentTickets = [
  { id: 'TK-115', unitCode: 'A-102', customer: 'Trần Văn Bảo', title: 'Cửa cuốn Unit A-102 kẹt chốt, khó kéo lên', priority: 'URGENT', status: 'IN_PROGRESS', staffAssigned: 'Nguyễn Văn Tuấn', notes: 'Đang mang bộ dụng cụ tra dầu và khóa phụ đến kiểm tra.' },
  { id: 'TK-108', unitCode: 'B-205', customer: 'Trần Văn Bảo', title: 'Quên mã PIN kho B-205', priority: 'NORMAL', status: 'RESOLVED', staffAssigned: 'Nguyễn Văn Tuấn', notes: 'Cấp lại mã PIN mới lúc 09:45.' }
];

class TaskService {
  getDailyTasks() {
    return dailyTasks;
  }

  dispatchTask(title, staff, deadline) {
    const task = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title,
      staff,
      deadline: deadline || '17:00',
      status: 'PENDING'
    };
    dailyTasks.unshift(task);
    return task;
  }

  getTickets() {
    return incidentTickets;
  }

  createTicket(data) {
    const ticket = {
      id: `TK-${Math.floor(116 + Math.random() * 50)}`,
      unitCode: data.unitCode || 'A-102',
      customer: data.customer || 'Trần Văn Bảo',
      title: data.title,
      priority: data.priority || 'NORMAL',
      status: 'IN_PROGRESS',
      staffAssigned: 'Nguyễn Văn Tuấn',
      notes: 'Đã phân công nhân viên ca trực tiếp nhận.'
    };
    incidentTickets.unshift(ticket);
    return ticket;
  }

  generateEmergencyPin(unitCode) {
    return {
      unitCode,
      tempPin: Math.floor(100000 + Math.random() * 900000).toString(),
      expiresInMinutes: 60,
      timestamp: new Date().toLocaleTimeString('vi-VN')
    };
  }
}

const taskService = new TaskService();

// GET /api/tasks/daily
router.get('/daily', (req, res) => {
  res.json({ success: true, count: dailyTasks.length, data: taskService.getDailyTasks() });
});

// POST /api/tasks/dispatch
router.post('/dispatch', (req, res) => {
  const { title, staff, deadline } = req.body;
  const task = taskService.dispatchTask(title, staff, deadline);
  res.status(201).json({ success: true, data: task });
});

// GET /api/tasks/tickets
router.get('/tickets', (req, res) => {
  res.json({ success: true, count: incidentTickets.length, data: taskService.getTickets() });
});

// POST /api/tasks/tickets
router.post('/tickets', (req, res) => {
  const ticket = taskService.createTicket(req.body);
  res.status(201).json({ success: true, data: ticket });
});

// POST /api/tasks/emergency-pin
router.post('/emergency-pin', (req, res) => {
  const pinData = taskService.generateEmergencyPin(req.body.unitCode);
  res.json({ success: true, data: pinData });
});

module.exports = router;
