/**
 * AUTH SERVICE - CONTROLLER & REST API ROUTER
 */

const express = require('express');
const router = express.Router();
const authService = require('./auth.service');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const device = req.headers['user-agent'] || 'Web Browser';
    const user = await authService.login(username, password, ip, device);
    res.json({
      success: true,
      message: `Đăng nhập thành công! Chào mừng ${user.name}`,
      data: user,
      token: `demo-token-${user.id}-${Date.now()}`
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const user = await authService.register(req.body, ip);
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Bạn có thể sử dụng hệ thống ngay bây giờ.',
      data: user,
      token: `demo-token-${user.id}-${Date.now()}`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/auth/login-history
router.get('/login-history', (req, res) => {
  try {
    const history = authService.getLoginHistory();
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/users
router.get('/users', (req, res) => {
  try {
    const users = authService.getAllUsers();
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/users
router.post('/users', (req, res) => {
  try {
    const newUser = authService.createUser(req.body);
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/auth/users/:id/toggle-lock
router.patch('/users/:id/toggle-lock', (req, res) => {
  try {
    const updated = authService.toggleLockUser(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// GET /api/auth/rbac-matrix
router.get('/rbac-matrix', (req, res) => {
  try {
    const matrix = authService.getRBACMatrix();
    res.json({ success: true, data: matrix });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
