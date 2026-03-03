const mongoose = require('mongoose');

const tripTemplateSchema = new mongoose.Schema(
  {
    bus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true
    },
    from_location: { type: String, required: true },
    to_location: { type: String, required: true },
    departure_time: { type: String, required: true }, // storing as HH:MM
    arrival_time: { type: String, required: true },
    duration: { type: Number }, // in minutes
    ticket_price: { 
      type: Number, 
      required: true, // ✅ ticket_price is mandatory
      min: 0 
    },
    schedule_type: { 
      type: String, 
      enum: ['never', 'daily', 'weekly', 'monthly'], 
      default: 'never' 
    },
    schedule_meta: { type: String },
    is_active: { type: Boolean, default: true },
    created_by: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('TripTemplate', tripTemplateSchema);
