import Complaint, { COMPLAINT_STATUS } from '../models/Complaint.js';
import SlaRule from '../models/SlaRule.js';
import Notification, { NOTIFICATION_TYPES } from '../models/Notification.js';
import { sendMultiChannelNotification } from '../lib/notifications/index.js';

/**
 * Default fallback SLA turnaround targets (in hours)
 */
export const DEFAULT_SLA_HOURS = {
  CRITICAL: 12,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72,
};

/**
 * Calculates the target deadline date based on priority, category, and business hours.
 * Note: These are platform-defined service targets, not official statutory government deadlines.
 */
export function calculateTargetDeadline(priority = 'MEDIUM', baseHours = null, startDate = new Date(), options = {}) {
  const hours = baseHours || DEFAULT_SLA_HOURS[priority] || DEFAULT_SLA_HOURS.MEDIUM;
  const { businessHoursOnly = false, businessHoursStart = 9, businessHoursEnd = 18 } = options;

  if (!businessHoursOnly) {
    // 24x7 municipal calendar for emergency civic issues
    return new Date(startDate.getTime() + hours * 60 * 60 * 1000);
  }

  // Business hours progression
  let current = new Date(startDate);
  let remainingHours = hours;

  while (remainingHours > 0) {
    const day = current.getDay(); // 0=Sun, 6=Sat
    const isWeekend = day === 0 || day === 6;

    if (isWeekend) {
      // Advance to next Monday 9 AM
      current.setDate(current.getDate() + (day === 0 ? 1 : 2));
      current.setHours(businessHoursStart, 0, 0, 0);
      continue;
    }

    const currentHour = current.getHours() + current.getMinutes() / 60;

    if (currentHour < businessHoursStart) {
      current.setHours(businessHoursStart, 0, 0, 0);
      continue;
    }

    if (currentHour >= businessHoursEnd) {
      // Advance to next day at business start
      current.setDate(current.getDate() + 1);
      current.setHours(businessHoursStart, 0, 0, 0);
      continue;
    }

    const availableToday = businessHoursEnd - currentHour;
    if (remainingHours <= availableToday) {
      current = new Date(current.getTime() + remainingHours * 60 * 60 * 1000);
      remainingHours = 0;
    } else {
      remainingHours -= availableToday;
      current.setDate(current.getDate() + 1);
      current.setHours(businessHoursStart, 0, 0, 0);
    }
  }

  return current;
}

/**
 * Pause SLA countdown when complaint is placed ON_HOLD
 */
export function pauseSlaCountdown(complaint, reason = '') {
  if (!complaint.onHoldPeriods) {
    complaint.onHoldPeriods = [];
  }
  complaint.onHoldPeriods.push({
    pausedAt: new Date(),
    resumedAt: null,
    reason: reason || 'Grievance placed on hold',
  });
}

/**
 * Resume SLA countdown when complaint transitions out of ON_HOLD
 * Extends the deadline by the exact paused duration.
 */
export function resumeSlaCountdown(complaint) {
  if (!complaint.onHoldPeriods || complaint.onHoldPeriods.length === 0) return;

  const currentPeriod = complaint.onHoldPeriods[complaint.onHoldPeriods.length - 1];
  if (!currentPeriod || currentPeriod.resumedAt) return;

  const now = new Date();
  currentPeriod.resumedAt = now;
  const pausedDurationMs = now.getTime() - new Date(currentPeriod.pausedAt).getTime();

  // Extend SLA deadline by paused duration
  if (complaint.slaDeadline && pausedDurationMs > 0) {
    complaint.slaDeadline = new Date(new Date(complaint.slaDeadline).getTime() + pausedDurationMs);
  }
}

/**
 * Calculates active elapsed time in milliseconds, excluding on-hold durations.
 */
export function getActiveElapsedMs(complaint, now = new Date()) {
  const createdAt = new Date(complaint.createdAt || Date.now());
  let totalElapsed = now.getTime() - createdAt.getTime();

  let pausedMs = 0;
  if (complaint.onHoldPeriods && Array.isArray(complaint.onHoldPeriods)) {
    complaint.onHoldPeriods.forEach((period) => {
      const start = new Date(period.pausedAt).getTime();
      const end = period.resumedAt ? new Date(period.resumedAt).getTime() : now.getTime();
      if (end > start) {
        pausedMs += end - start;
      }
    });
  }

  return Math.max(0, totalElapsed - pausedMs);
}

/**
 * Idempotent batch scan for SLA escalations.
 * Detects Level 1 (Warning at 75%) and Level 2 (Breach at 100%).
 * Prevents duplicate alerts and updates escalationHistory.
 */
export async function scanAndEscalateComplaints() {
  const activeStatuses = [
    COMPLAINT_STATUS.SUBMITTED,
    COMPLAINT_STATUS.UNDER_REVIEW,
    COMPLAINT_STATUS.VERIFIED,
    COMPLAINT_STATUS.ASSIGNED,
    COMPLAINT_STATUS.IN_PROGRESS,
    COMPLAINT_STATUS.UNDER_VERIFICATION,
    COMPLAINT_STATUS.REOPENED,
  ];

  const complaints = await Complaint.find({
    status: { $in: activeStatuses },
  })
    .populate('category', 'name slaHours')
    .populate('ward', 'name wardNumber');

  const now = new Date();
  const results = {
    scanned: complaints.length,
    escalatedL1: 0,
    escalatedL2: 0,
    alreadyEscalated: 0,
  };

  for (const complaint of complaints) {
    const slaHours = complaint.slaHours || complaint.category?.slaHours || DEFAULT_SLA_HOURS[complaint.priority] || 48;
    const totalTargetMs = slaHours * 60 * 60 * 1000;
    const activeElapsedMs = getActiveElapsedMs(complaint, now);
    const percentElapsed = (activeElapsedMs / totalTargetMs) * 100;

    let targetLevel = 0;
    if (percentElapsed >= 100) {
      targetLevel = 2; // Level 2: Breached
    } else if (percentElapsed >= 75) {
      targetLevel = 1; // Level 1: Warning
    }

    const currentLevel = complaint.escalationLevel || 0;

    // Only escalate if target level is strictly higher than current level
    if (targetLevel > currentLevel) {
      complaint.escalationLevel = targetLevel;

      const escalationReason =
        targetLevel === 2
          ? `SLA Breached (${Math.round(percentElapsed)}% elapsed) - Automated Level 2 Priority Escalation recorded.`
          : `SLA Target Approaching (${Math.round(percentElapsed)}% elapsed) - Automated Warning recorded.`;

      complaint.escalationHistory.push({
        level: targetLevel,
        escalatedAt: now,
        reason: escalationReason,
        notifiedRoles: ['SYSTEM'],
      });

      complaint.timeline.push({
        status: complaint.status,
        title: targetLevel === 2 ? '⚠️ SLA Target Breached (Level 2 Escalation)' : '⚡ SLA Escalation Warning (Level 1)',
        description: escalationReason,
        performedBy: 'Automated Platform SLA Monitor',
        timestamp: now,
      });

      await complaint.save();

      // Dispatch notification if citizen contact exists
      if (complaint.citizenContact?.email || complaint.citizenContact?.phone || complaint.citizen) {
        try {
          await sendMultiChannelNotification({
            recipient: {
              _id: complaint.citizen || null,
              email: complaint.citizenContact?.email,
              phone: complaint.citizenContact?.phone,
              name: complaint.citizenContact?.name || 'Citizen',
            },
            type: NOTIFICATION_TYPES.SLA_WARNING || NOTIFICATION_TYPES.STATUS_CHANGE,
            title: `[Level ${targetLevel} Escalation] ${complaint.complaintId} - ${complaint.title}`,
            message: `${escalationReason} Issue is prioritized for municipal attention.`,
            link: `/track?token=${complaint.trackingToken}`,
            channels: ['in_app', 'email', 'sms'],
          });
        } catch (notifErr) {
          console.warn('[SLA Service] Notification delivery notice:', notifErr.message);
        }
      }

      if (targetLevel === 2) {
        results.escalatedL2++;
      } else {
        results.escalatedL1++;
      }
    } else {
      results.alreadyEscalated++;
    }
  }

  return results;
}
