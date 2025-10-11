const express = require('express');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Get all staff members
router.get('/staff', auth, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const staff = await User.find({ 
      role: { $in: ['staff', 'admin'] } 
    }).select('name email role');
    
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
