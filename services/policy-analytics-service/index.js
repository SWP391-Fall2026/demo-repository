/**
 * POLICY & ANALYTICS SERVICE - MODEL & BUSINESS LOGIC & REST ROUTER
 */

const express = require('express');
const router = express.Router();

let pricingPolicies = {
  basePrices: {
    S: 800000,
    M: 1450000,
    L: 2800000,
    CLIMATE: 2200000
  },
  depositRule: '1_MONTH',
  durationDiscounts: {
    3: 0.05,
    6: 0.10,
    12: 0.15
  },
  extraFees: {
    cleaning: 200000,
    newLock: 150000,
    overduePenaltyPerDay: 50000
  }
};

let chainStats = {
  totalBranches: 5,
  totalUnits: 560,
  occupiedUnits: 432,
  availableUnits: 128,
  occupancyRate: '77.1%',
  monthlyRevenue: 648500000,
  heldDepositFunds: 626400000
};

// GET /api/policies
router.get('/', (req, res) => {
  res.json({ success: true, data: pricingPolicies });
});

// PATCH /api/policies
router.patch('/', (req, res) => {
  pricingPolicies = { ...pricingPolicies, ...req.body };
  res.json({ success: true, data: pricingPolicies });
});

// GET /api/policies/stats
router.get('/stats', (req, res) => {
  res.json({ success: true, data: chainStats });
});

module.exports = router;
