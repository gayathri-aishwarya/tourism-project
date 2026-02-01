// src/routes/booking.routes.js
const express = require('express')
const router = express.Router()
const controller = require('../controllers/booking.controller')
const { protect, isMasterAdmin } = require('../middlewares/auth.middleware')

// All routes below require logged-in user
router.use(protect)

// Customer: list own bookings (uses req.user.userId)
router.get('/me', controller.getMyBookings)

// Customer: get one of own bookings by id
router.get('/me/:id', controller.getMyBookingById)

// Customer: update own pending booking (edit dates/quantity)
router.put('/me/:id', controller.updateMyBooking)

// Customer: delete own pending booking
router.delete('/me/:id', controller.deleteMyBooking)

// Public & protected routes
router.post('/', protect, controller.createBooking) //done

// Employee routes (require x-employee header)
router.get('/branch/:branchId', protect, controller.getBookingsByBranch) //done-employee access

// Customer personal bookings
router.get('/my-bookings/:id', protect, controller.getMyBookings) //done with no body,and no booking []

// Single booking details (employee x-employee_true or customer(done) with user_id true)
router.get('/booking/:id', protect, controller.getBookingById) //done with no body,and no booking []

// Update booking status (employee)
router.put('/:id/status', protect, controller.updateBookingStatus)

// Update payment status
router.put('/:id/payment-status', protect, controller.updatePaymentStatus)

// admin: get all bookings
router.get('/', protect, controller.getAllBookings)

module.exports = router
