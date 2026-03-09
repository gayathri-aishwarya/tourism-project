const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createBusPaymentIntent,
  confirmBusBooking,
  handleBusPaymentWebhook
} = require('../controllers/buspayment.controller');

// 🟢 PUBLIC webhook endpoint - raw body already handled in server.js
router.post('/webhook', handleBusPaymentWebhook);

// 🔒 Protected routes (use express.json() for these - body already parsed)
router.post('/create-intent', protect, createBusPaymentIntent);
router.post('/confirm-booking', protect, confirmBusBooking);

module.exports = router;