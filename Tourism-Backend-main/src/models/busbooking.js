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
    booking_status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed'
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

module.exports = mongoose.model('BusBooking', BusBookingSchema);