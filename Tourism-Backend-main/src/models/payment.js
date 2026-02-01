const mongoose = require('mongoose')
const { Schema } = mongoose

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        booking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
            default: 'EGP',
        },
        paymobTransactionId: {
            type: String,
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        clientSecret: {
            type: String,
        },
        paymobOrderId: {
            type: String,
        },
    },
    { timestamps: true }
)

const Payment = mongoose.model('Payment', paymentSchema)

module.exports = Payment
