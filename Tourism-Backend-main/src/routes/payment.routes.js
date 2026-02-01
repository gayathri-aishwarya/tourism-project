const express = require('express')
const paymentController = require('../controllers/payment.controller')
const { protect } = require('../middlewares/auth.middleware') // Assuming you have auth middleware

const router = express.Router()

// protect middleware ensures only logged-in users can create a payment
router.post(
    '/create-intention',
    protect,
    paymentController.createPaymentIntention
)

// This endpoint is for PayMob to send updates. It should not be protected.
router.post('/webhook', paymentController.handlePaymobWebhook)

// Test endpoint to verify webhook URL is reachable
router.get('/webhook-test', (req, res) => {
    console.log('Webhook test endpoint hit!')
    res.status(200).json({
        message: 'Webhook endpoint is reachable',
        timestamp: new Date().toISOString(),
        url: req.originalUrl,
    })
})

module.exports = router
