// backend/routes/courseRoutes.js
const express = require("express");
const { getCourses, createCourse, registerForCourse, deleteCourse, updateCourse, unenrollFromCourse, markAsPaid } = require("../controllers/courseController");
const { protect, adminOnly } = require("../middleware/auth");
const router = express.Router();

router.get("/", getCourses);
router.post("/", protect, adminOnly, createCourse);
router.post("/:id/register", protect, registerForCourse);
router.post("/:id/unenroll", protect, unenrollFromCourse);
router.post("/:id/pay", protect, markAsPaid);
// Admin Management Routes
router.delete("/:id", protect, adminOnly, deleteCourse);
router.put("/:id", protect, adminOnly, updateCourse); // New unified update route

module.exports = router;