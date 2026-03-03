// src/routes/bus.routes.js
const express = require('express');
const router = express.Router();

const {
  addBus,
  getBuses,
  getBus,
  getBusByIdPublic,  
  updateBus,
  deleteBus
} = require('../../controllers/bus.controller');

const { protect } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');

router.get('/public/:id', getBusByIdPublic);
// Add Bus (employee + master_admin)
router.post(
  '/',
  protect,
  requireRoles('employee', 'master_admin'),
  addBus
);

router.get('/', protect,requireRoles('employee', 'master_admin'), getBuses);

// Get single bus by vehicle number (any logged-in user)
router.get('/:vehicle_no', protect, requireRoles('employee', 'master_admin'), getBus);

// Update bus by vehicle number (employee + master_admin)
router.put(
  '/:vehicle_no',
  protect,
  requireRoles('employee', 'master_admin'),
  updateBus
);

// Delete bus by vehicle number (employee + master_admin)
router.delete(
  '/:vehicle_no',
  protect,
  requireRoles( 'master_admin'),
  deleteBus
);

module.exports = router;
