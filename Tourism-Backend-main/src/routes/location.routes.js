const express = require('express')
const router = express.Router()
const locationController = require('../controllers/location.controller')
const { protect, isMasterAdmin } = require('../middlewares/auth.middleware')
const upload = require('../middlewares/uploads')

router.post(
    '/',
    protect,
    isMasterAdmin,
    upload.single('heroImage'),
    locationController.createLocation
)
router.get('/', locationController.getLocations)
router.get('/:id', locationController.getLocation)
router.put(
    '/:id',
    protect,
    upload.single('heroImage'),
    locationController.updateLocation
)
router.delete('/:id', protect, isMasterAdmin, locationController.deleteLocation)

module.exports = router
