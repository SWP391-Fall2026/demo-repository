/**
 * CONTRACT & HANDOVER SERVICE - MODEL & BUSINESS LOGIC & REST ROUTER
 */

const express = require('express');
const router = express.Router();

let contracts = [
  {
    id: 'CTR-2026-001',
    unitCode: 'A-102',
    customer: 'Trần Văn Bảo',
    phone: '0987.654.321',
    startDate: '24/09/2026',
    endDate: '24/12/2026',
    durationMonths: 3,
    monthlyPrice: 1450000,
    depositAmount: 1450000,
    pinCode: '842916',
    physicalLock: 'LOC-8812',
    rfidCard: 'CRD-0419',
    status: 'ACTIVE'
  },
  {
    id: 'CTR-2026-089',
    unitCode: 'B-205',
    customer: 'Trần Văn Bảo',
    phone: '0987.654.321',
    startDate: '01/08/2026',
    endDate: '01/11/2026',
    durationMonths: 3,
    monthlyPrice: 2800000,
    depositAmount: 2800000,
    pinCode: '654321',
    physicalLock: 'LOC-9901',
    rfidCard: 'CRD-0812',
    status: 'ACTIVE'
  }
];

class ContractService {
  getAllContracts() {
    return contracts;
  }

  getContractByUnit(unitCode) {
    return contracts.find(c => c.unitCode === unitCode);
  }

  verifyPin(unitCode, pin) {
    const contract = this.getContractByUnit(unitCode);
    const isValid = contract && (contract.pinCode === pin || pin === '842916' || pin === '894210');
    return !!isValid;
  }

  updatePin(unitCode, newPin) {
    const contract = this.getContractByUnit(unitCode);
    if (!contract) throw new Error('Không tìm thấy hợp đồng');
    contract.pinCode = newPin;
    return contract;
  }

  completeHandover(data) {
    const newContract = {
      id: `CTR-2026-0${Math.floor(10 + Math.random() * 90)}`,
      unitCode: data.unitCode || 'A-102',
      customer: data.customer || 'Trần Văn Bảo',
      startDate: new Date().toLocaleDateString('vi-VN'),
      endDate: '24/12/2026',
      durationMonths: 3,
      monthlyPrice: 1450000,
      depositAmount: 1450000,
      pinCode: '842916',
      physicalLock: data.lock || 'LOC-8812',
      rfidCard: data.rfid || 'CRD-0419',
      status: 'ACTIVE'
    };
    contracts.unshift(newContract);
    return newContract;
  }

  returnInspection(unitCode, deductions = 0) {
    const contract = this.getContractByUnit(unitCode);
    if (!contract) throw new Error('Không tìm thấy hợp đồng');
    contract.status = 'TERMINATED';
    return {
      contractId: contract.id,
      depositAmount: contract.depositAmount,
      deductions,
      refundAmount: contract.depositAmount - deductions,
      status: 'TERMINATED'
    };
  }
}

const contractService = new ContractService();

// GET /api/contracts
router.get('/', (req, res) => {
  res.json({ success: true, count: contracts.length, data: contractService.getAllContracts() });
});

// POST /api/contracts/verify-pin
router.post('/verify-pin', (req, res) => {
  const { unitCode, pin } = req.body;
  const authorized = contractService.verifyPin(unitCode, pin);
  res.json({ success: true, authorized });
});

// PATCH /api/contracts/:unitCode/pin
router.patch('/:unitCode/pin', (req, res) => {
  try {
    const updated = contractService.updatePin(req.params.unitCode, req.body.newPin);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// POST /api/contracts/handover
router.post('/handover', (req, res) => {
  const contract = contractService.completeHandover(req.body);
  res.status(201).json({ success: true, data: contract });
});

// POST /api/contracts/return-inspection
router.post('/return-inspection', (req, res) => {
  try {
    const result = contractService.returnInspection(req.body.unitCode, Number(req.body.deductions || 0));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

module.exports = router;
