const axios = require('axios')
const Payment = require('../models/payment')
const User = require('../models/user')
const Booking = require('../models/booking')
const ApiError = require('../utils/apiError')
const crypto = require('crypto')

const PAYMOB_API_URL =
    process.env.PAYMOB_API_URL || 'https://accept.paymob.com/v1/intention/'

const createPaymentIntention = async (userId, bookingId, currency = 'EGP') => {
    const user = await User.findById(userId)
    console.log(user)
    const booking = await Booking.findById(bookingId).populate(
        'items.product_id'
    )

    if (!user || !booking) {
        throw new ApiError(404, 'User or Booking not found')
    }

    if (!['EGP', 'USD'].includes(currency.toUpperCase())) {
        throw new ApiError(
            400,
            'Invalid currency provided. Must be EGP or USD.'
        )
    }
    // Paymob expects amount in cents, so we multiply by 100
    const amountInCents = booking.total_price * 100

    // Create a pending payment record in our database:
    const newPayment = await Payment.create({
        user: userId,
        booking: bookingId,
        amount: booking.total_price,
        currency: currency.toUpperCase(),
        status: 'pending',
    })

    // const notificationUrl = `${process.env.BACKEND_URL}/api/payments/webhook`
    const notificationUrl = `https://7a1824011e7f.ngrok-free.app/api/payments/webhook`
    // const redirectionUrl = `${process.env.FRONTEND_URL}/booking/status?payment_id=${newPayment._id}`
    const redirectionUrl = process.env.FRONTEND_URL

    // Construct items array for PayMob from booking items
    const paymobItems = booking.items.map((item) => ({
        name: item.name,
        amount: item.amount * 100, // item price in cents
        description: item.description || 'Product description',
        // quantity: item.quantity,
        quantity: 1,
    }))

    const requestBody = {
        amount: amountInCents,
        currency: currency.toUpperCase(),
        payment_methods: [parseInt(process.env.PAYMOB_INTEGRATION_ID)],
        items: paymobItems,
        billing_data: {
            apartment: 'dummy',
            email: user.email,
            floor: 'dummy',
            first_name: user.firstName,
            // last_name: user.lastName,
            last_name: 'mohamed',
            street: 'dummy',
            building: 'dummy',
            phone_number: user.phone || '+201234567890', // A valid phone is required
            city: 'dummy',
            country: 'EG', // Assuming Egypt, can be made dynamic
            state: 'dummy',
        },
        notification_url: notificationUrl,
        redirection_url: redirectionUrl,
    }

    try {
        const response = await axios.post(PAYMOB_API_URL, requestBody, {
            headers: {
                Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        })

        const { client_secret, id: paymobTransactionId } = response.data

        console.log(
            'PayMob API Response:',
            JSON.stringify(response.data, null, 2)
        )

        // Save the client secret and PayMob transaction ID to our payment record
        newPayment.clientSecret = client_secret
        newPayment.paymobTransactionId = paymobTransactionId
        // Store the intention_order_id for webhook matching
        if (response.data.intention_order_id) {
            newPayment.paymobOrderId =
                response.data.intention_order_id.toString()
        }
        await newPayment.save()

        console.log('Payment record saved:', {
            _id: newPayment._id,
            clientSecret: newPayment.clientSecret,
            paymobTransactionId: newPayment.paymobTransactionId,
            paymobOrderId: newPayment.paymobOrderId,
        })

        return client_secret
    } catch (error) {
        console.error(
            'PayMob API Error:',
            error.response ? error.response.data : error.message
        )
        throw new ApiError(500, 'Failed to create payment intention')
    }
}

const processWebhook = async (webhookData, hmac) => {
    console.log('=== PayMob Webhook Received ===')
    console.log('Webhook Data:', JSON.stringify(webhookData, null, 2))
    console.log('HMAC:', hmac)

    const { obj: transaction, type } = webhookData

    if (type !== 'TRANSACTION') {
        console.log('Received non-transaction webhook, skipping.')
        return
    }

    // 1. HMAC Verification (Skip in development if HMAC_SECRET is not set)
    if (process.env.PAYMOB_HMAC_SECRET) {
        console.log('Verifying HMAC...')
        const hmacFields = [
            transaction.amount_cents,
            transaction.created_at,
            transaction.currency,
            transaction.error_occured,
            transaction.has_parent_transaction,
            transaction.id,
            transaction.integration_id,
            transaction.is_3d_secure,
            transaction.is_auth,
            transaction.is_capture,
            transaction.is_refunded,
            transaction.is_standalone_payment,
            transaction.is_voided,
            transaction.order.id,
            transaction.owner,
            transaction.pending,
            transaction.source_data.pan,
            transaction.source_data.sub_type,
            transaction.source_data.type,
            transaction.success,
        ].join('')

        console.log('HMAC Fields:', hmacFields)

        const calculatedHmac = crypto
            .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
            .update(hmacFields)
            .digest('hex')

        console.log('Calculated HMAC:', calculatedHmac)
        console.log('Received HMAC:', hmac)

        if (calculatedHmac !== hmac) {
            console.error('HMAC verification failed!')
            throw new ApiError(
                401,
                'Invalid HMAC signature. Webhook tampered or from an untrusted source.'
            )
        }
        console.log('HMAC verification passed!')
    } else {
        console.log('HMAC verification skipped (no secret configured)')
    }

    // 2. Process the verified webhook
    const transactionId = transaction.id
    const paymobOrderId = transaction.order.id

    console.log(
        `Looking for payment with transaction ID: ${transactionId} or order ID: ${paymobOrderId}`
    )

    // Try multiple ways to find the payment
    let payment = await Payment.findOne({
        paymobTransactionId: transactionId, // Try transaction ID first
    })

    if (!payment) {
        console.log(
            'Payment not found by transaction ID, trying order ID in paymobTransactionId...'
        )
        payment = await Payment.findOne({
            paymobTransactionId: paymobOrderId,
        })
    }

    if (!payment) {
        console.log(
            'Payment not found by order ID in paymobTransactionId, trying paymobOrderId field...'
        )
        payment = await Payment.findOne({
            paymobOrderId: paymobOrderId.toString(),
        })
    }

    if (!payment) {
        console.log('Payment not found by order ID, trying client secret...')
        payment = await Payment.findOne({
            clientSecret: transaction.client_secret,
        })

        if (payment) {
            console.log(
                'Payment found by client secret, updating transaction ID...'
            )
            payment.paymobTransactionId = transactionId // Store the actual transaction ID
            await payment.save()
        }
    }

    if (!payment) {
        console.error('Payment not found with any identifier!')
        console.error('Transaction ID:', transactionId)
        console.error('Order ID:', paymobOrderId)
        console.error('Client Secret:', transaction.client_secret)

        // Debug: Show recent payments for troubleshooting
        console.log('=== Debug: Recent payments in database ===')
        const recentPayments = await Payment.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
        recentPayments.forEach((p) => {
            console.log(
                `Payment ${p._id}: paymobTransactionId=${p.paymobTransactionId}, paymobOrderId=${p.paymobOrderId}, clientSecret=${p.clientSecret}`
            )
        })
        console.log('=== End Debug ===')

        throw new ApiError(404, 'Payment not found for this transaction')
    }

    console.log(
        `Found payment: ${payment._id}, current status: ${payment.status}`
    )

    // Don't process payments that are already completed or failed
    if (payment.status !== 'pending') {
        console.log(
            `Webhook for already processed payment ${payment._id} received. Current status: ${payment.status}.`
        )
        return
    }

    // 3. Update Status based on transaction success
    console.log(
        `Transaction success: ${transaction.success}, pending: ${transaction.pending}`
    )

    if (transaction.success === true && transaction.pending === false) {
        console.log('Payment successful, updating status to completed...')
        payment.status = 'completed'

        // Also update the associated booking
        const bookingUpdate = await Booking.findByIdAndUpdate(
            payment.booking,
            {
                paymentStatus: 'paid',
                status: 'paid', // <-- Also update the main operational status
            },
            { new: true }
        )

        console.log('Booking updated:', bookingUpdate?._id)
    } else {
        console.log(
            'Payment failed or still pending, updating status to failed...'
        )
        payment.status = 'failed'

        await Booking.findByIdAndUpdate(payment.booking, {
            paymentStatus: 'failed',
        })
    }

    await payment.save()
    console.log(`Payment ${payment._id} status updated to: ${payment.status}`)
    console.log('=== Webhook Processing Complete ===')
}

module.exports = {
    createPaymentIntention,
    processWebhook, // Export the new function
}
