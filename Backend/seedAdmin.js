const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resolvewagon');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@resolvewagon.com' });
    
    if (!existingAdmin) {
      const adminUser = new User({
        name: 'System Administrator',
        email: 'admin@resolvewagon.com',
        password: 'Admin@123', // This will be hashed by the User model pre-save hook
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully');
      console.log('Email: admin@resolvewagon.com');
      console.log('Password: Admin@123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();