



const express = require('express');
const Complaint = require('../models/Complaint');
const Note = require('../models/Note');
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createObjectCsvWriter } = require('csv-writer');
require('dotenv').config();

const router = express.Router();

// Get all complaints (staff/admin/citizen can see all)
router.get('/', auth, async (req, res) => {
  try {
    let complaints = await Complaint.find().sort({ createdAt: -1 });;
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
      photoUrl: req.file ? req.file.path : undefined // Cloudinary returns secure_url in 'path'
    });

    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Update complaint (staff/admin only)
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

    const updateData = { 
      status, 
      priority,
      updatedAt: new Date()
    };

    if (assignedStaffId) {
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

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
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





// Generate CSV report (admin only) - Using csv-writer
router.get('/export/csv', auth, requireRole(['admin']), async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });

    // Format data for CSV
    const csvData = complaints.map(complaint => ({
      id: complaint._id.toString(),
      title: complaint.title,
      description: complaint.description,
      category: complaint.category
        ? complaint.category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        : '',
      status: complaint.status ? complaint.status.toUpperCase() : '',
      priority: complaint.priority ? complaint.priority.toUpperCase() : '',
      citizenName: complaint.citizenName,
      assignedStaff: complaint.assignedStaffName || 'Unassigned',
      createdDate: new Date(complaint.createdAt).toLocaleDateString('en-US'),
      updatedDate: new Date(complaint.updatedAt).toLocaleDateString('en-US'),
      resolvedDate: complaint.resolvedAt
        ? new Date(complaint.resolvedAt).toLocaleDateString('en-US')
        : 'Not Resolved',
      locationLat: complaint.locationLat || 'N/A',
      locationLng: complaint.locationLng || 'N/A',
      hasPhoto: complaint.photoUrl ? complaint.photoUrl : 'N/A'
    }));

    // Define CSV headers
    const csvWriter = createObjectCsvWriter({
      path: 'complaints-report.csv', // ✅ temporary file path
      header: [
        { id: 'id', title: 'ID' },
        { id: 'title', title: 'Title' },
        { id: 'description', title: 'Description' },
        { id: 'category', title: 'Category' },
        { id: 'status', title: 'Status' },
        { id: 'priority', title: 'Priority' },
        { id: 'citizenName', title: 'Citizen Name' },
        { id: 'assignedStaff', title: 'Assigned Staff' },
        { id: 'createdDate', title: 'Created Date' },
        { id: 'updatedDate', title: 'Updated Date' },
        { id: 'resolvedDate', title: 'Resolved Date' },
        { id: 'locationLat', title: 'Location Latitude' },
        { id: 'locationLng', title: 'Location Longitude' },
        { id: 'hasPhoto', title: 'Image Url' }
      ]
    });

    // ✅ Write the data to a CSV file
    await csvWriter.writeRecords(csvData);

    // ✅ Send the file as a download
    res.download('complaints-report.csv', 'complaints-report.csv', err => {
      if (err) {
        console.error('File download error:', err);
        res.status(500).json({ message: 'Error sending CSV file' });
      }
    });

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
