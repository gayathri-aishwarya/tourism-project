const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')

const { protect, isMasterAdmin } = require('../middlewares/auth.middleware')

router.post('/employees', protect, isMasterAdmin, userController.createEmployee)

router.get('/employees', protect, isMasterAdmin, userController.getAllEmployees)

router.delete(
    '/employees/:id',
    protect,
    isMasterAdmin,
    userController.deleteEmployee
)

router.put(
    '/employees/:id/permissions',
    protect,
    isMasterAdmin,
    userController.updateEmployeePermissions
)
router.get('/:id', protect, userController.getUserById)

module.exports = router
