const mongoose = require('mongoose')
const { Schema } = mongoose

const locationSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        description: {
            type: String,
        },

        heroImage: {
            type: String,
        },
    },
    { timestamps: true }
)

locationSchema.pre('remove', async function (next) {
    const Product = this.model('Product')
    await Product.deleteMany({ location_id: this._id })
    next()
})

locationSchema.pre(
    'deleteOne',
    { document: true, query: false },
    async function (next) {
        const Product = this.model('Product')
        await Product.deleteMany({ location_id: this._id })
        next()
    }
)

module.exports = mongoose.model('Location', locationSchema)
