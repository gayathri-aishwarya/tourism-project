const mongoose = require("mongoose");
const { Schema } = mongoose;

// This schema uses a polymorphic "details" field to store type-specific data.
const productSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["bus", "hotel", "flight", "activity"],
    },
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
      ref: "Location",
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    // The details object's structure depends on the 'type' field.
    // The application layer is responsible for validating this object.
    details: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

/*
Example 'details' objects based on product type:

// For type: 'bus'
details: {
  departure_time: Date,
  arrival_time: Date,
  total_seats: Number,
  price_per_seat: Number
}

// For type: 'hotel'
details: {
  rooms: [
    {
      type: String, // "Single", "Double", "Suite"
      total_available: Number,
      price_per_night: Number,
      amenities: [String]
    }
  ]
}

// For type: 'flight'
details: {
  airline: String,
  flight_number: String,
  departure_airport: String,
  arrival_airport: String,
  departure_time: Date,
  arrival_time: Date,
  price_per_ticket: Number
}

// For type: 'activity'
details: {
  duration_hours: Number,
  start_time: Date,
  price_per_person: Number
}

*/

module.exports = mongoose.model("Product", productSchema);
