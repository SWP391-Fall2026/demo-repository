/**
 * AUTH SERVICE - CONTROLLER & REST API ROUTER
 */

const express = require('express');
const router = express.Router();
const authService = require('./auth.service');

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
