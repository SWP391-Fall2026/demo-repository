/**
 * PAYMENT SERVICE - MODEL & BUSINESS LOGIC & REST ROUTER
 */

const express = require('express');
const router = express.Router();

const bankInfo = {
  bankName: 'Ngân hàng TMCP Quân Đội (MBBank)',
  accountNo: '0988 7766 5522',
  accountName: 'CONG TY CP SELF STORAGE VIET NAM',
  gateway: 'VietQR / Napas247'
};

let transactions = [
  { id: 'TXN-998124', reservationId: 'RSV-8821', amount: 1450000, type: 'DEPOSIT', method: 'VietQR Napas247', time: '12:15 Hôm nay', status: 'SUCCESS' }
];

class PaymentService {
  getBankInfo() {
    return bankInfo;
  }

  getTransactions() {
    return transactions;
  }

  simulatePayment(data) {
    const txn = {
      id: `TXN-${Math.floor(900000 + Math.random() * 100000)}`,
      reservationId: data.reservationId || 'RSV-8821',
      amount: data.amount || 1450000,
      type: data.type || 'DEPOSIT',
      method: 'VietQR Napas247',
      time: new Date().toLocaleTimeString('vi-VN'),
      status: 'SUCCESS'
    };
    transactions.unshift(txn);
    return txn;
  }
}

const paymentService = new PaymentService();

// GET /api/payments/bank-info
router.get('/bank-info', (req, res) => {
  res.json({ success: true, data: paymentService.getBankInfo() });
});

// GET /api/payments/transactions
router.get('/transactions', (req, res) => {
  res.json({ success: true, count: transactions.length, data: paymentService.getTransactions() });
});

// POST /api/payments/simulate
router.post('/simulate', (req, res) => {
  const txn = paymentService.simulatePayment(req.body);
  res.status(201).json({ success: true, data: txn });
});

module.exports = router;
