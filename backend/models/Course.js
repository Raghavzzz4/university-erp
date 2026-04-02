const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  capacity: { type: Number, required: true },
  
  // --- NO MORE STRING. IT IS NOW AN OBJECT ---
  timeSlot: {
    day: { type: String, default: "Monday" },
    time: { type: String, default: "10:00" },
    duration: { type: String, default: "1" }
  },
  
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isFree: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  paidStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Course", courseSchema);