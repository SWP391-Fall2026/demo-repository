require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.resolve(__dirname, '..')));

// Microservices API routes
app.use('/api/auth', require('../services/auth-service'));
app.use('/api/facilities', require('../services/facility-service'));
app.use('/api/reservations', require('../services/reservation-service'));
app.use('/api/payments', require('../services/payment-service'));
app.use('/api/contracts', require('../services/contract-service'));
app.use('/api/tasks', require('../services/task-incident-service'));
app.use('/api/policies', require('../services/policy-analytics-service'));
app.use('/api/audit-logs', require('../services/audit-service'));

// Health check & service list
app.get('/api/services', (req, res) => {
  res.json({
    status: 'ok',
    services: [
      { name: 'Auth & User Service', endpoint: '/api/auth' },
      { name: 'Facility & Unit Service', endpoint: '/api/facilities' },
      { name: 'Reservation Service', endpoint: '/api/reservations' },
      { name: 'Payment Service', endpoint: '/api/payments' },
      { name: 'Contract & Handover Service', endpoint: '/api/contracts' },
      { name: 'Task & Incident Service', endpoint: '/api/tasks' },
      { name: 'Policy & Analytics Service', endpoint: '/api/policies' },
      { name: 'Audit Log Service', endpoint: '/api/audit-logs' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
