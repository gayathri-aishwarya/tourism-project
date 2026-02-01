const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  name: String,
  description: String,
  date: Date,
  type: [String],
});

module.exports = mongoose.model("Holiday", holidaySchema);
