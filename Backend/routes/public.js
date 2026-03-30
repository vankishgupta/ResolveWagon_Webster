const express = require('express');
const Complaint = require('../models/Complaint');

const router = express.Router();

// GET /api/public/stats — Unauthenticated public statistics
router.get('/stats', async (req, res) => {
  try {
    const results = await Complaint.aggregate([
      {
        $facet: {
          // Total count
          total: [{ $count: 'count' }],

          // Status breakdown
          statusBreakdown: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],

          // Category breakdown
          categoryBreakdown: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],

          // Average resolution time (only resolved complaints)
          avgResolution: [
            { $match: { status: 'resolved', resolvedAt: { $exists: true, $ne: null } } },
            {
              $project: {
                resolutionTimeMs: { $subtract: ['$resolvedAt', '$createdAt'] }
              }
            },
            {
              $group: {
                _id: null,
                avgTimeMs: { $avg: '$resolutionTimeMs' }
              }
            }
          ]
        }
      }
    ]);

    const data = results[0];

    // Format the response
    const totalComplaints = data.total[0]?.count || 0;

    // Convert status breakdown array to object
    const statusBreakdown = {};
    data.statusBreakdown.forEach(item => {
      statusBreakdown[item._id] = item.count;
    });

    // Convert category breakdown array to object
    const categoryBreakdown = {};
    data.categoryBreakdown.forEach(item => {
      categoryBreakdown[item._id] = item.count;
    });

    // Calculate average resolution time in hours
    const avgTimeMs = data.avgResolution[0]?.avgTimeMs || 0;
    const averageResolutionTimeHours = Math.round((avgTimeMs / (1000 * 60 * 60)) * 10) / 10;

    // Calculate resolution rate
    const resolvedCount = statusBreakdown['resolved'] || 0;
    const resolutionRate = totalComplaints > 0
      ? Math.round((resolvedCount / totalComplaints) * 100 * 10) / 10
      : 0;

    res.json({
      totalComplaints,
      statusBreakdown,
      categoryBreakdown,
      averageResolutionTimeHours,
      resolutionRate
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
