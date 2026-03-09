const mongoose = require('mongoose');

const BusBookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    trip_instance_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripInstance',
      required: true
    },
    booking_reference: {
      type: String,
      unique: true,
      default: function() {
        return 'BB' + Date.now() + Math.floor(Math.random() * 1000);
      }
    },
    phone: {
      type: String,
      required: true,
      match: [/^(010|011|012|015)\d{8}$/, 'Please enter a valid Egyptian phone number']
    },
    total_fare: { 
      type: Number, 
      required: true,
      min: 0 
    },
    // ✅ ADD THESE PAYMENT FIELDS
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    payment_intent_id: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null values
    },
    payment_method: {
      type: String,
      enum: ['card', 'cash'],
      default: 'card'
    },
    booking_status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending' // Changed from 'confirmed' to 'pending'
    },
    booking_date: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for seats
BusBookingSchema.virtual('seats', {
  ref: 'BusBookingSeat',
  localField: '_id',
  foreignField: 'busbooking_id'
});

// Index for faster queries
BusBookingSchema.index({ payment_intent_id: 1 });
BusBookingSchema.index({ payment_status: 1 });
BusBookingSchema.index({ booking_status: 1 });

module.exports = mongoose.model('BusBooking', BusBookingSchema);