// backend/controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    // 🛑 NEW CODE: Generate token and send back the user object so the frontend can log them in immediately!
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    
    res.status(201).json({ 
      token, 
      user: { id: user._id, name: user.name, role: user.role } 
    });
    
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
// Add to the bottom of backend/controllers/authController.js
exports.getMe = async (req, res) => {
  try {
    // Return user details except the password
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// backend/controllers/authController.js

exports.getAllTransactions = async (req, res) => {
  try {
    // Find all users who have at least one transaction
    const users = await User.find({ "paymentHistory.0": { $exists: true } });
    
    let allTransactions = [];
    let totalBalance = 0;

    users.forEach(user => {
      user.paymentHistory.forEach(txn => {
        // Push the transaction with the student's details attached
        allTransactions.push({
          _id: txn._id,
          studentName: user.name,
          studentEmail: user.email,
          courseTitle: txn.courseTitle,
          amount: txn.amount,
          type: txn.type,
          status: txn.status,
          date: txn.date
        });

        // Calculate Bank Balance
        if (txn.type === "payment") {
          totalBalance += txn.amount;
        } else if (txn.type === "refund") {
          totalBalance -= txn.amount;
        }
      });
    });

    // Sort transactions from newest to oldest
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ totalBalance, transactions: allTransactions });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};