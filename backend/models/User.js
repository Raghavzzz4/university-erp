// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin", "accountant"], default: "student" },
  // <--- NEW FIELD: Financial Ledger --->
  paymentHistory: [{
    courseTitle: String,
    amount: Number,
    type: { type: String, enum: ["payment", "refund"] },
    status: { type: String }, // "Completed" or "Processing (5-7 Days)"
    date: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model("User", userSchema);