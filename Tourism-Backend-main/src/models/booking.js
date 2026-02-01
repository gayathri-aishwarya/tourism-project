const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "paid", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    items: [
      {
        product_id: { type: Schema.Types.ObjectId, ref: "Product" },

        name: { type: String },
        amount: { type: Number },
        description: { type: String },
        type: { type: String },
        details: { type: Object },
        
        quantity: { type: Number },
      },
    ],
    total_price: {
      type: Number,
      required: true,
    },
    // An audit trail for tracking status changes and employee actions..
    history: [
      {
        timestamp: { type: Date, default: Date.now },
        employee_id: { type: Schema.Types.ObjectId, ref: "User" },
        action: String, // e.g., "Status changed from 'pending' to 'confirmed'."
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
