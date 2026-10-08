/**
 * FACILITY SERVICE - BUSINESS LOGIC & REST ROUTER
 */

const express = require('express');
const router = express.Router();
const { facilities, unitTypes, units } = require('./facility.model');

class FacilityService {
  getAllFacilities() {
    return facilities;
  }

  getUnitTypes() {
    return unitTypes;
  }

  getAllUnits() {
    return units;
  }

  getUnitByCode(code) {
    return units.find(u => u.code === code);
  }

  updateUnitStatus(code, newStatus, tenant = null) {
    const unit = this.getUnitByCode(code);
    if (!unit) throw new Error('Không tìm thấy phòng kho');
    unit.status = newStatus;
    if (tenant !== undefined) unit.tenant = tenant;
    return unit;
  }
}

const facilityService = new FacilityService();

// GET /api/facilities
router.get('/', (req, res) => {
  res.json({ success: true, count: facilities.length, data: facilityService.getAllFacilities() });
});

// GET /api/facilities/unit-types
router.get('/unit-types', (req, res) => {
  res.json({ success: true, count: unitTypes.length, data: facilityService.getUnitTypes() });
});

// GET /api/facilities/units
router.get('/units', (req, res) => {
  res.json({ success: true, count: units.length, data: facilityService.getAllUnits() });
});

// PATCH /api/facilities/units/:code/status
router.patch('/units/:code/status', (req, res) => {
  try {
    const { status, tenant } = req.body;
    const updated = facilityService.updateUnitStatus(req.params.code, status, tenant);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

module.exports = router;
