const mongoose = require('mongoose')
const { Schema } = mongoose

const bundleSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        location_id: {
            type: Schema.Types.ObjectId,
            ref: 'Location',
            required: true,
        },
        product_ids: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        // A fixed price for the entire bundle, potentially offering a discount.
        price: {
            type: Number,
            required: true,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Bundle', bundleSchema)
