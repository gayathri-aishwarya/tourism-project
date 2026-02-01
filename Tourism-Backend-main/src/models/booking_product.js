const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @typedef {Object} BookingProductDetails
 * This is the "snapshot" data for a specific line item.
 * The structure will vary based on product type.
 */
const bookingProductSchema = new Schema(
    {
        booking_id: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        product_id: {
            type: Schema.Types.ObjectId,
            ref: 'Product', // This could be a Product or a Bundle
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        unit_price: {
            type: Number,
            required: true,
        },
        total_amount: {
            type: Number,
            required: true,
        },
        details: {
            type: Schema.Types.Mixed,
            required: true,
        },
    },
    { timestamps: true }
);

// This composite index ensures each product is unique within a single booking.
bookingProductSchema.index({ booking_id: 1, product_id: 1 }, { unique: true });

module.exports = mongoose.model('BookingProduct', bookingProductSchema);