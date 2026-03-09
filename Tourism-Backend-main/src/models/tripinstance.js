// Tourism-Backend-main/src/models/TripInstance.js
const mongoose = require('mongoose');

const TripInstanceSchema = new mongoose.Schema(
  {
    trip_template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripTemplate',
      required: true
    },
    travel_date: { 
      type: Date, 
      required: true 
    },
    booked_seats: { 
      type: [String], 
      default: [] 
    },
    all_seats: { 
      type: [String], 
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'All seats array cannot be empty'
      }
    },
    available_seats: { 
      type: Number, 
      required: true,
      min: 0 
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active'
    }
  },
  { 
    timestamps: true,
    indexes: [
      { trip_template_id: 1, travel_date: 1 },
      { travel_date: 1 },
      { status: 1 }
    ]
  }
);

// Ensure unique trip per date
TripInstanceSchema.index({ trip_template_id: 1, travel_date: 1 }, { unique: true });

// ✅ FIXED: Use 'TripInstance' with capital T to match the import
module.exports = mongoose.model('TripInstance', TripInstanceSchema);