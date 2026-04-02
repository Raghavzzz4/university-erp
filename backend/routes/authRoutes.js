// backend/routes/authRoutes.js
const express = require("express");
const { register, login, getMe, getAllTransactions } = require("../controllers/authController");
const { protect } = require("../middleware/auth"); 
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe); // <--- NEW ROUTE
router.get("/transactions", protect, getAllTransactions);
module.exports = router;