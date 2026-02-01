const catchAsync = require('../utils/catchAsync')
const paymentService = require('../services/payment.service')
const { successResponse } = require('../utils/responseHandlers')

const createPaymentIntention = catchAsync(async (req, res) => {
    // Assuming userId is available from an authentication middleware (req.user.id)
    // const userId = req.user.userId
    const { bookingId, currency, userId } = req.body

    const clientSecret = await paymentService.createPaymentIntention(
        userId,
        bookingId,
        currency
    )

    successResponse(
        res,
        { clientSecret },
        201,
        'Payment intention created successfully'
    )
})

const handlePaymobWebhook = catchAsync(async (req, res) => {
    console.log('=== PayMob Webhook Controller ===')
    console.log('Query params:', req.query)
    console.log('Headers:', req.headers)
    console.log('Body:', JSON.stringify(req.body, null, 2))

    // The HMAC is sent as a query parameter
    const hmac = req.query.hmac
    const webhookData = req.body

    if (!webhookData) {
        console.error('No webhook data received')
        return res.status(400).send({ message: 'No webhook data received' })
    }

    try {
        await paymentService.processWebhook(webhookData, hmac)

        // It's crucial to send a 200 OK response to PayMob
        // to let them know you've successfully received the webhook.
        // If you don't, they will keep retrying.
        console.log('Webhook processed successfully')
        res.status(200).send({ message: 'Webhook processed successfully' })
    } catch (error) {
        console.error('Webhook processing failed:', error.message)
        console.error('Stack:', error.stack)

        // Still return 200 to prevent PayMob from retrying if it's our internal error
        // Only return error status for validation issues
        if (error.statusCode === 401) {
            res.status(401).send({ message: error.message })
        } else {
            res.status(200).send({
                message: 'Webhook received but processing failed',
            })
        }
    }
})

module.exports = {
    createPaymentIntention,
    handlePaymobWebhook,
}
