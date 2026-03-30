const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['broken_pathway', 'water_leakage', 'garbage', 'electrical', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['normal', 'high'],
    default: 'normal'
  },

  // === SLA & MLFQ Fields ===
  priorityTier: {
    type: Number,
    default: 3,
    min: 1,
    max: 3
  },
  slaDeadline: {
    type: Date
  },
  escalationCount: {
    type: Number,
    default: 0
  },
  isBreached: {
    type: Boolean,
    default: false
  },
  // === End SLA Fields ===

  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  citizenName: {
    type: String,
    required: true
  },
  assignedStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedStaffName: String,
  locationLat: Number,
  locationLng: Number,
  photoUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date
});

// Auto-calculate slaDeadline on new complaint creation (72 hours from now)
complaintSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Only set slaDeadline on initial creation
  if (this.isNew && !this.slaDeadline) {
    const SLA_HOURS = 72;
    this.slaDeadline = new Date(Date.now() + SLA_HOURS * 60 * 60 * 1000);
  }

  next();
});

// Compound index for optimized SLA worker queries
complaintSchema.index({ status: 1, slaDeadline: 1, priorityTier: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);