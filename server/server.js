/**
 * SELF-STORAGE MANAGEMENT SYSTEM - API GATEWAY & STATIC SERVER
 * Mounts all 8 domain services from their dedicated service folders
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.resolve(__dirname, '..')));

// ==========================================================================
// MOUNT INDIVIDUAL MICRO-SERVICES FROM THEIR RESPECTIVE FOLDERS
// ==========================================================================

// 1. Auth & User Service
app.use('/api/auth', require('../services/auth-service'));

// 2. Facility & Unit Service
app.use('/api/facilities', require('../services/facility-service'));

// 3. Reservation & Booking Service
app.use('/api/reservations', require('../services/reservation-service'));

// 4. Payment & VietQR Service
app.use('/api/payments', require('../services/payment-service'));

// 5. Contract & Handover Service
app.use('/api/contracts', require('../services/contract-service'));

// 6. Task & Incident Service
app.use('/api/tasks', require('../services/task-incident-service'));

// 7. Policy & Analytics Service
app.use('/api/policies', require('../services/policy-analytics-service'));

// 8. Audit Log Service
app.use('/api/audit-logs', require('../services/audit-service'));

// Healthcheck & Service Registry Directory
app.get('/api/services', (req, res) => {
  res.json({
    system: 'Self-Storage Facility Rental & Management System',
    version: '2.0.0',
    services: [
      { name: 'Auth & User Service', folder: 'services/auth-service', endpoint: '/api/auth' },
      { name: 'Facility & Unit Service', folder: 'services/facility-service', endpoint: '/api/facilities' },
      { name: 'Reservation Service', folder: 'services/reservation-service', endpoint: '/api/reservations' },
      { name: 'Payment Service', folder: 'services/payment-service', endpoint: '/api/payments' },
      { name: 'Contract & Handover Service', folder: 'services/contract-service', endpoint: '/api/contracts' },
      { name: 'Task & Incident Service', folder: 'services/task-incident-service', endpoint: '/api/tasks' },
      { name: 'Policy & Analytics Service', folder: 'services/policy-analytics-service', endpoint: '/api/policies' },
      { name: 'Audit Log Service', folder: 'services/audit-service', endpoint: '/api/audit-logs' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`SelfStorage PRO - Micro-Services Gateway running on port ${PORT}`);
  console.log(`Frontend Application: http://localhost:${PORT}`);
  console.log(`Service Discovery:    http://localhost:${PORT}/api/services`);
  console.log(`=======================================================`);
});
