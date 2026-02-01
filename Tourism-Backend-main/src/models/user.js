const mongoose = require('mongoose')
const { Schema } = mongoose

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
        },

        profileImage: {
            type: String,
        },
        phone: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
        },
        role: {
            type: String,
            enum: ['customer', 'employee', 'master_admin'],
            required: true,
            default: 'customer',
        },
        branch_id: {
            type: Schema.Types.ObjectId,
            ref: 'Branch',
            // This is only required if the role is 'employee'
        },
        permissions: [
            {
                type: String,
                // e.g., ['manage_bookings', 'edit_products', 'view_reports']
                // This is only relevant for the 'employee' role.
            },
        ],
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            required: true,
            default: 'local',
        },

        resetPasswordToken: {
            type: String, // 6-digit OTP stored as string
        },
        resetPasswordExpires: {
            type: Date, // OTP expiry timestamp
        },
        otpRequestCount: {
            type: Number,
            default: 0, // counts how many OTP requests in the current window
        },
        otpRequestTime: {
            type: Date, // start of the 10-min window for resend limit
        },
        isOtpVerified: {
            type: Boolean,
            default: false,
        },

    },
    { timestamps: true }
)

// Virtual for user's full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`
})

// Pre-save hook to ensure password is encrypted before saving
// Example:
// userSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
//     this.password = await bcrypt.hash(this.password, 12);
//     next();
// });

module.exports = mongoose.model('User', userSchema)
