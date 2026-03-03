const express = require('express');
const router = express.Router();
const {
  addTripTemplate,
  getTripTemplates,
  getTripTemplate,
  updateTripTemplate,
  deleteTripTemplate
} = require('../../controllers/triptemplate.controller');

const { protect } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');

// Add Trip Template (employee + master_admin)
router.post('/', protect, requireRoles('employee', 'master_admin'), addTripTemplate);

// Get all Trip Templates (any authenticated user)
router.get('/', protect, getTripTemplates);

// Get single Trip Template by ID
router.get('/:id', protect, getTripTemplate);

// Update Trip Template (employee + master_admin)
router.put('/:id', protect, requireRoles('employee', 'master_admin'), updateTripTemplate);

// Delete Trip Template (employee + master_admin)
router.delete('/:id', protect, requireRoles('employee', 'master_admin'), deleteTripTemplate);

module.exports = router;
