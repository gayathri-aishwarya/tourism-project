const express = require('express');
const router = express.Router();
const {
  addTripInstance,
  searchAvailableTrips,
  getTripInstances,
  getTripInstance,  // Make sure this is imported
  updateTripInstance,
  deleteTripInstance,
  generateTripInstances
} = require('../controllers/tripinstance.controller');

const { protect } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/role.middleware');

// Admin only
router.post('/', protect, requireRoles('employee', 'master_admin'), addTripInstance);
router.put('/:id', protect, requireRoles('employee', 'master_admin'), updateTripInstance);
router.delete('/:id', protect, requireRoles('employee', 'master_admin'), deleteTripInstance);

// Public endpoints (no auth required)
router.get('/search', searchAvailableTrips);
router.get('/:id', getTripInstance);  // ✅ ADD THIS LINE - public or protected?

// Protected endpoints
router.get('/', protect, getTripInstances);  // Get all (protected)
router.post('/generate', protect, requireRoles('employee', 'master_admin'), generateTripInstances);

module.exports = router;