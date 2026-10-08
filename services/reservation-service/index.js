/**
 * RESERVATION SERVICE - MODEL & BUSINESS LOGIC & REST ROUTER
 */

const express = require('express');
const router = express.Router();

let reservations = [
  { id: 'RSV-8821', customer: 'Trần Văn Bảo', phone: '0987.654.321', cccd: '001202019988', facility: 'Hà Nội - Cầu Giấy', unitType: 'M', unitAssigned: 'A-102', durationMonths: 3, deposit: 1450000, status: 'RESERVED', appointment: '14:00 - 15:00 Hôm nay' },
  { id: 'RSV-8824', customer: 'Lê Hoàng Nam', phone: '0912.888.999', cccd: '001201088776', facility: 'Hà Nội - Cầu Giấy', unitType: 'M', unitAssigned: 'A-103', durationMonths: 6, deposit: 1450000, status: 'RESERVED', appointment: '15:30 Hôm nay' },
  { id: 'RSV-8830', customer: 'Nguyễn Kiều Oanh', phone: '0988.123.456', cccd: '079201998811', facility: 'Hà Nội - Cầu Giấy', unitType: 'M', unitAssigned: 'A-115', durationMonths: 1, deposit: 1450000, status: 'PENDING_PAYMENT', appointment: '16:45 Hôm nay' }
];

class ReservationService {
  getAllReservations() {
    return reservations;
  }

  getReservationById(id) {
    return reservations.find(r => r.id === id);
  }

  calculateCost(monthlyRate, durationMonths) {
    let discountRate = 0;
    if (durationMonths === 3) discountRate = 0.05;
    else if (durationMonths === 6) discountRate = 0.10;
    else if (durationMonths === 12) discountRate = 0.15;

    const discountAmount = Math.round(monthlyRate * durationMonths * discountRate);
    const totalRent = (monthlyRate * durationMonths) - discountAmount;
    const depositAmount = monthlyRate;

    return {
      monthlyRate,
      durationMonths,
      discountRate,
      discountAmount,
      totalRent,
      depositAmount,
      payNowAmount: depositAmount
    };
  }

  createReservation(data) {
    const newRsv = {
      id: `RSV-${Math.floor(8800 + Math.random() * 1000)}`,
      customer: data.customer || 'Trần Văn Bảo',
      phone: data.phone || '0987.654.321',
      facility: data.facility || 'Hà Nội - Cầu Giấy',
      unitType: data.unitType || 'M',
      unitAssigned: data.unitAssigned || 'A-102',
      durationMonths: data.durationMonths || 3,
      deposit: data.deposit || 1450000,
      status: 'PENDING_PAYMENT',
      appointment: data.appointment || '14:00 - 15:00 Hôm nay'
    };
    reservations.unshift(newRsv);
    return newRsv;
  }

  assignUnit(rsvId, unitCode) {
    const rsv = this.getReservationById(rsvId);
    if (!rsv) throw new Error('Không tìm thấy đơn đặt chỗ');
    rsv.unitAssigned = unitCode;
    rsv.status = 'RESERVED';
    return rsv;
  }
}

const reservationService = new ReservationService();

// GET /api/reservations
router.get('/', (req, res) => {
  res.json({ success: true, count: reservations.length, data: reservationService.getAllReservations() });
});

// GET /api/reservations/:id
router.get('/:id', (req, res) => {
  const rsv = reservationService.getReservationById(req.params.id);
  if (!rsv) return res.status(404).json({ success: false, message: 'Reservation not found' });
  res.json({ success: true, data: rsv });
});

// POST /api/reservations/calculate
router.post('/calculate', (req, res) => {
  const { monthlyRate, durationMonths } = req.body;
  const result = reservationService.calculateCost(Number(monthlyRate), Number(durationMonths));
  res.json({ success: true, data: result });
});

// POST /api/reservations
router.post('/', (req, res) => {
  const newRsv = reservationService.createReservation(req.body);
  res.status(201).json({ success: true, data: newRsv });
});

// PATCH /api/reservations/:id/assign
router.patch('/:id/assign', (req, res) => {
  try {
    const updated = reservationService.assignUnit(req.params.id, req.body.unitCode);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

module.exports = router;
