/**
 * SLA Test Seeder
 * 
 * Creates 3 test complaints with different SLA states to verify the engine:
 *   1. Tier 3 complaint with SLA expiring in 6 hours → Worker should promote to Tier 2
 *   2. Tier 3 complaint with SLA already expired → Worker should escalate to Tier 1 (BREACHED)
 *   3. Normal Tier 3 complaint with 72h deadline → Should stay Tier 3
 * 
 * Usage: node seedSLATest.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Complaint = require('./models/Complaint');
const User = require('./models/User');

async function seedSLATestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resolve-wagon');
    console.log('Connected to MongoDB');

    // Find a citizen user to use as submitter
    const citizen = await User.findOne({ role: 'citizen' });
    if (!citizen) {
      console.error('No citizen user found. Register a citizen first, then run this script.');
      process.exit(1);
    }

    const now = new Date();

    const testComplaints = [
      {
        title: '[SLA TEST] Approaching Deadline - Should become Tier 2',
        description: 'This complaint has only 6 hours left on its SLA. The worker should promote it from Tier 3 to Tier 2 on the next run.',
        category: 'water_leakage',
        status: 'open',
        priority: 'normal',
        priorityTier: 3,
        slaDeadline: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
        citizenId: citizen._id,
        citizenName: citizen.name,
        locationLat: 28.6139,
        locationLng: 77.2090,
      },
      {
        title: '[SLA TEST] Expired Deadline - Should become Tier 1 BREACHED',
        description: 'This complaint SLA expired 2 hours ago. The worker should escalate it to Tier 1 and mark isBreached = true.',
        category: 'electrical',
        status: 'open',
        priority: 'normal',
        priorityTier: 3,
        slaDeadline: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        isBreached: false,
        citizenId: citizen._id,
        citizenName: citizen.name,
        locationLat: 28.6200,
        locationLng: 77.2150,
      },
      {
        title: '[SLA TEST] Fresh Complaint - Should stay Tier 3',
        description: 'This complaint has the full 72-hour SLA. It should remain at Tier 3 with no changes.',
        category: 'garbage',
        status: 'open',
        priority: 'normal',
        priorityTier: 3,
        slaDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000), // 72 hours from now
        citizenId: citizen._id,
        citizenName: citizen.name,
        locationLat: 28.6100,
        locationLng: 77.2000,
      }
    ];

    const results = await Complaint.insertMany(testComplaints);
    
    console.log('\n✅ Created 3 test complaints:\n');
    results.forEach((c, i) => {
      const hoursLeft = Math.round((new Date(c.slaDeadline) - now) / (1000 * 60 * 60) * 10) / 10;
      console.log(`  ${i + 1}. "${c.title}"`);
      console.log(`     Tier: ${c.priorityTier} | SLA: ${hoursLeft > 0 ? hoursLeft + 'h remaining' : Math.abs(hoursLeft) + 'h overdue'}`);
      console.log('');
    });

    console.log('📋 What to expect on next worker run (within 5 minutes):');
    console.log('   • Complaint #1 → Tier 3 → Tier 2 (approaching deadline)');
    console.log('   • Complaint #2 → Tier 3 → Tier 1 + BREACHED (expired)');
    console.log('   • Complaint #3 → Stays Tier 3 (fresh)');
    console.log('\n🔄 Open the Staff Dashboard to see the changes after the worker runs.');
    console.log('   Watch the backend console for "[SLA Worker]" log messages.\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedSLATestData();
