const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  vehicle_no: { type: String, required: true, unique: true },
  bus_type: { type: String, enum: ['seater', 'sleeper', 'semi-sleeper'], required: true },
  total_seats: { type: Number, required: true },
seat_layout: {
  type: [[String]], // 2D array, rows x columns
  default: []       // empty if not set
}}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);
