const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'resolve_wagon_super_secret_key_2024_@#$%_make_this_very_long_and_secure_12345', {
    expiresIn: '7d'
  });
};

//register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, registrationKey } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    // Prevent admin registration through normal flow
    if (role === 'admin') {
      return res.status(400).json({ 
        message: 'Admin registration is not allowed through this method' 
      });
    }
    // Secret key validation for staff  roles
    const STAFF_REGISTRATION_KEY = process.env.STAFF_REGISTRATION_KEY || 'RESOLVE_WAGON_STAFF_2024';
    
     if (role === 'staff') {
      if (!registrationKey) {
        return res.status(400).json({ 
          message: 'Registration key is required for staff accounts' 
        });
      }
      
      if (registrationKey !== STAFF_REGISTRATION_KEY) {
        return res.status(400).json({ 
          message: 'Invalid registration key' 
        });
      }
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: role || 'citizen'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin
    }
  });
});

module.exports = router;
