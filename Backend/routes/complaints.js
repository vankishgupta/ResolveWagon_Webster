const express = require('express');
const Complaint = require('../models/Complaint');
const Note = require('../models/Note');
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
require('dotenv').config();

const router = express.Router();

// Get all complaints — sorted by priorityTier (Tier 1 first = Preemptive Priority)
router.get('/', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ priorityTier: 1, slaDeadline: 1, createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create complaint
router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    const { title, description, category, locationLat, locationLng } = req.body;

    if (req.user.role !== 'citizen') {
      return res.status(403).json({ message: 'Only citizens can create complaints' });
    }

    const complaint = new Complaint({
      title,
      description,
      category,
      citizenId: req.user._id,
      citizenName: req.user.name,
      locationLat: locationLat ? parseFloat(locationLat) : undefined,
      locationLng: locationLng ? parseFloat(locationLng) : undefined,
      photoUrl: req.file ? req.file.path : undefined
    });

    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Update complaint (staff/admin only) — with P-Priority enforcement
router.put('/:id', auth, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const { status, priority, assignedStaffId } = req.body;
    
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if complaint is already assigned to another staff (lock mechanism)
    if (complaint.assignedStaffId && 
        complaint.assignedStaffId.toString() !== req.user._id.toString() && 
        complaint.assignedStaffId.toString() !== assignedStaffId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Complaint is already assigned to another staff member and cannot be reassigned' 
      });
    }

    // === STAFF SELF-ASSIGN ONLY ===
    // Staff can only assign complaints to themselves, not to other staff.
    // Only admins can assign to any staff member.
    if (assignedStaffId && 
        req.user.role === 'staff' && 
        assignedStaffId !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Staff can only assign complaints to themselves. Contact an admin to assign to another staff member.'
      });
    }

    // === P-PRIORITY ENFORCEMENT ===
    // If staff is trying to pick up a non-Tier-1 complaint,
    // check if there are unassigned Tier 1 complaints in the system.
    // This blocks Tier 2 AND Tier 3 assignments when Tier 1 is pending.
    if (assignedStaffId && 
        (complaint.priorityTier || 3) > 1 && 
        req.user.role !== 'admin') {
      const unassignedCritical = await Complaint.countDocuments({
        status: { $ne: 'resolved' },
        priorityTier: 1,
        $or: [
          { assignedStaffId: { $exists: false } },
          { assignedStaffId: null }
        ]
      });

      if (unassignedCritical > 0) {
        return res.status(403).json({
          message: 'Cannot pick up this complaint while Critical (Tier 1) complaints are unassigned. Please handle critical issues first.',
          code: 'P_PRIORITY_VIOLATION'
        });
      }
    }
    // === END P-PRIORITY ===

    const updateData = { 
      status, 
      priority,
      updatedAt: new Date()
    };

    if (assignedStaffId) {
      // Staff: self-assign (already validated above)
      // Admin: assign to any valid staff/admin
      const User = require('../models/User');
      const staff = await User.findById(assignedStaffId);
      if (staff && (staff.role === 'staff' || staff.role === 'admin')) {
        updateData.assignedStaffId = staff._id;
        updateData.assignedStaffName = staff.name;
      }
    } else {
      // If unassigning, only allow if admin or the currently assigned staff
      if (complaint.assignedStaffId && 
          complaint.assignedStaffId.toString() !== req.user._id.toString() && 
          req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Only admin or the assigned staff can unassign this complaint' 
        });
      }
      updateData.assignedStaffId = undefined;
      updateData.assignedStaffName = undefined;
    }

    // When resolving, reset SLA state
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.priorityTier = 3;
      updateData.isBreached = false;
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get complaint notes
router.get('/:id/notes', auth, async (req, res) => {
  try {
    const notes = await Note.find({ complaintId: req.params.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add note to complaint
router.post('/:id/notes', auth, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const { note } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if staff is assigned to this complaint or is admin
    if (req.user.role !== 'admin' && 
        complaint.assignedStaffId && 
        complaint.assignedStaffId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Only the assigned staff or admin can add notes to this complaint' 
      });
    }

    const newNote = new Note({
      complaintId: req.params.id,
      note,
      staffId: req.user._id,
      staffName: req.user.name
    });

    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Get complaint locations for heatmap (minimal payload)
router.get('/locations', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .select('_id locationLat locationLng status');
    
    // Filter out complaints without location data
    const locatedComplaints = complaints.filter(c => c.locationLat && c.locationLng);
    res.json(locatedComplaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Generate CSV report (admin only) - Stream CSV directly to response
router.get('/export/csv', auth, requireRole(['admin']), async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });

    // Define CSV headers
    const headers = [
      'ID', 'Title', 'Description', 'Category', 'Status', 'Priority', 'Tier',
      'SLA Deadline', 'Breached', 'Escalation Count',
      'Citizen Name', 'Assigned Staff', 'Created Date', 'Updated Date',
      'Resolved Date', 'Location Latitude', 'Location Longitude', 'Image Url'
    ];

    // Helper to escape CSV values
    const escapeCSV = (value) => {
      const str = String(value ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV rows
    const rows = complaints.map(complaint => [
      complaint._id.toString(),
      complaint.title,
      complaint.description,
      complaint.category
        ? complaint.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : '',
      complaint.status ? complaint.status.toUpperCase() : '',
      complaint.priority ? complaint.priority.toUpperCase() : '',
      `Tier ${complaint.priorityTier || 3}`,
      complaint.slaDeadline ? new Date(complaint.slaDeadline).toISOString() : 'N/A',
      complaint.isBreached ? 'YES' : 'NO',
      complaint.escalationCount || 0,
      complaint.citizenName,
      complaint.assignedStaffName || 'Unassigned',
      new Date(complaint.createdAt).toLocaleDateString('en-US'),
      new Date(complaint.updatedAt).toLocaleDateString('en-US'),
      complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleDateString('en-US') : 'Not Resolved',
      complaint.locationLat || 'N/A',
      complaint.locationLng || 'N/A',
      complaint.photoUrl || 'N/A'
    ].map(escapeCSV).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Send CSV directly as response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints-report.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
