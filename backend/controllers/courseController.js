// backend/controllers/courseController.js
const Course = require("../models/Course");
const User = require("../models/User");

// --- HELPER FUNCTION: THE AUTO-CONVERTER ---
// This guarantees the database ALWAYS gets a clean object, 
// even if the frontend accidentally sends a string.
const formatTimeSlot = (incomingData) => {
  // 1. If it's already a clean object, let it through!
  if (typeof incomingData === 'object' && incomingData !== null) {
    return incomingData;
  }
  
  // 2. If it's a string, automatically parse it and convert it to an object!
  let obj = { day: "Monday", time: "10:00", duration: "1" };
  if (typeof incomingData === 'string' && incomingData.includes('|')) {
    try {
      const parts = incomingData.split('|');
      obj.day = parts[0].trim();
      
      const rest = parts[1].split('(');
      obj.time = rest[0].trim();
      
      if (rest[1]) {
        obj.duration = rest[1].split(' ')[0];
      }
    } catch (e) {
      console.log("Safely handled a formatting error");
    }
  }
  return obj;
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description, capacity, isFree, price } = req.body;
    
    // 🛑 PASS THE DATA THROUGH THE AUTO-CONVERTER
    const cleanTimeSlot = formatTimeSlot(req.body.timeSlot);
    
    const course = new Course({ 
      title, 
      description, 
      capacity, 
      isFree, 
      price, 
      timeSlot: cleanTimeSlot // Saved perfectly every time
    });
    
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { capacity, enrolledStudents, isFree, price } = req.body;
    
    // 🛑 PASS THE DATA THROUGH THE AUTO-CONVERTER
    const cleanTimeSlot = formatTimeSlot(req.body.timeSlot);

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { capacity, enrolledStudents, isFree, price, timeSlot: cleanTimeSlot },
      { returnDocument: 'after' } 
    );
    res.json({ message: "Course updated", course: updatedCourse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.registerForCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.enrolledStudents.length >= course.capacity) return res.status(400).json({ message: "Course is full" });
    if (course.enrolledStudents.includes(req.user.id)) return res.status(400).json({ message: "Already registered" });

    course.enrolledStudents.push(req.user.id);

    if (course.isFree && !course.paidStudents.includes(req.user.id)) {
      course.paidStudents.push(req.user.id);
    }

    await course.save();
    res.json({ message: "Successfully registered!", course });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.markAsPaid = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!course.paidStudents.includes(req.user.id)) {
      course.paidStudents.push(req.user.id);
      user.paymentHistory.push({ courseTitle: course.title, amount: course.price, type: "payment", status: "Completed" });
      await course.save();
      await user.save();
    }
    res.json({ message: "Payment Successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.unenrollFromCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!course.enrolledStudents.includes(req.user.id)) return res.status(400).json({ message: "Not registered" });

    course.enrolledStudents = course.enrolledStudents.filter(id => id.toString() !== req.user.id);

    let refundInitiated = false;
    if (course.paidStudents.includes(req.user.id)) {
      course.paidStudents = course.paidStudents.filter(id => id.toString() !== req.user.id);
      if (!course.isFree) {
        refundInitiated = true; 
        user.paymentHistory.push({ courseTitle: course.title, amount: course.price, type: "refund", status: "Processing (5-7 Days)" });
      }
    }
    
    await course.save();
    await user.save();
    
    res.json({ message: "Unenrolled", refundInitiated });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};