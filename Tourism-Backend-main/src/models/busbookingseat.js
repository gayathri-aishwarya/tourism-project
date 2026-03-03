const mongoose = require('mongoose');

const BusBookingSeatSchema = new mongoose.Schema(
  {
    busbooking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'busbooking',
      required: true
    },
    seat_number: { type: String, required: true },
    passenger_name: { type: String, required: true },
    age: { type: Number, required: true }, // ✅ required
    price_paid: { type: Number, required: true } // ✅ store actual price paid
  },
  { timestamps: true }
);

module.exports = mongoose.model('BusBookingSeat', BusBookingSeatSchema);
