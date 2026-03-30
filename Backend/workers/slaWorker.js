/**
 * SLA Worker — Development Fallback (No Redis/BullMQ)
 * 
 * Uses setInterval to run MLFQ aging and auto-escalation jobs every 5 minutes.
 * In production, replace with BullMQ + Redis for distributed processing.
 * 
 * MLFQ Tiers:
 *   Tier 3 (Normal)   — Default queue, SLA = 72 hours
 *   Tier 2 (High)     — Auto-promoted when < 12 hours remain on SLA
 *   Tier 1 (Critical) — Auto-escalated when SLA is breached
 */

const Complaint = require('../models/Complaint');

const SLA_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const AGING_THRESHOLD_HOURS = 12; // Promote to Tier 2 when < 12h remain

let isRunning = false;

/**
 * MLFQ Aging Job — Promote Tier 3 → Tier 2
 * Queries complaints that are not resolved, still in Tier 3,
 * and have less than 12 hours remaining before SLA deadline.
 */
async function runAgingJob() {
  const threshold = new Date(Date.now() + AGING_THRESHOLD_HOURS * 60 * 60 * 1000);

  try {
    const result = await Complaint.updateMany(
      {
        status: { $ne: 'resolved' },
        priorityTier: 3,
        slaDeadline: { $lt: threshold, $gt: new Date() } // Less than 12h left but not yet breached
      },
      {
        $set: { priorityTier: 2, updatedAt: new Date() }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[SLA Worker] AGING: Promoted ${result.modifiedCount} complaint(s) from Tier 3 → Tier 2`);
    }
  } catch (error) {
    console.error('[SLA Worker] Aging job error:', error.message);
  }
}

/**
 * Auto-Escalation Job — Escalate to Tier 1
 * Queries complaints that are not resolved, not yet marked as breached,
 * and whose SLA deadline has passed.
 */
async function runEscalationJob() {
  try {
    const result = await Complaint.updateMany(
      {
        status: { $ne: 'resolved' },
        isBreached: false,
        slaDeadline: { $lt: new Date() } // Deadline has passed
      },
      {
        $set: { priorityTier: 1, isBreached: true, updatedAt: new Date() },
        $inc: { escalationCount: 1 }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[SLA Worker] ESCALATION: Escalated ${result.modifiedCount} complaint(s) to Tier 1 (BREACHED)`);
    }
  } catch (error) {
    console.error('[SLA Worker] Escalation job error:', error.message);
  }
}

/**
 * Run both jobs sequentially
 */
async function processSLAJobs() {
  if (isRunning) return; // Prevent overlapping runs
  isRunning = true;

  try {
    await runAgingJob();
    await runEscalationJob();
  } catch (error) {
    console.error('[SLA Worker] Unexpected error:', error.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the SLA worker with setInterval
 */
function startSLAWorker() {
  console.log(`[SLA Worker] Started (interval: ${SLA_CHECK_INTERVAL_MS / 1000}s, no Redis)`);

  // Run immediately on startup
  processSLAJobs();

  // Then repeat every 5 minutes
  const intervalId = setInterval(processSLAJobs, SLA_CHECK_INTERVAL_MS);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log('[SLA Worker] Stopped');
  };
}

module.exports = { startSLAWorker };
