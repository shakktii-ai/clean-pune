import Complaint, { COMPLAINT_STATUS } from '../models/Complaint.js';
import ComplaintHistory from '../models/ComplaintHistory.js';
import Notification, { NOTIFICATION_TYPES } from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

export { COMPLAINT_STATUS };

/**
 * Valid state transitions map
 */
export const ALLOWED_TRANSITIONS = {
  [COMPLAINT_STATUS.SUBMITTED]: [
    COMPLAINT_STATUS.UNDER_REVIEW,
    COMPLAINT_STATUS.VERIFIED,
    COMPLAINT_STATUS.REJECTED,
    COMPLAINT_STATUS.CANCELLED,
  ],
  [COMPLAINT_STATUS.UNDER_REVIEW]: [
    COMPLAINT_STATUS.VERIFIED,
    COMPLAINT_STATUS.REJECTED,
    COMPLAINT_STATUS.ASSIGNED,
    COMPLAINT_STATUS.CANCELLED,
  ],
  [COMPLAINT_STATUS.VERIFIED]: [
    COMPLAINT_STATUS.ASSIGNED,
    COMPLAINT_STATUS.REJECTED,
    COMPLAINT_STATUS.ON_HOLD,
    COMPLAINT_STATUS.CANCELLED,
  ],
  [COMPLAINT_STATUS.REJECTED]: [
    COMPLAINT_STATUS.REOPENED,
    COMPLAINT_STATUS.UNDER_REVIEW,
  ],
  [COMPLAINT_STATUS.ASSIGNED]: [
    COMPLAINT_STATUS.IN_PROGRESS,
    COMPLAINT_STATUS.ON_HOLD,
    COMPLAINT_STATUS.ASSIGNED, // Reassignment
    COMPLAINT_STATUS.REJECTED,
    COMPLAINT_STATUS.CANCELLED,
  ],
  [COMPLAINT_STATUS.IN_PROGRESS]: [
    COMPLAINT_STATUS.RESOLUTION_SUBMITTED,
    COMPLAINT_STATUS.ON_HOLD,
    COMPLAINT_STATUS.ASSIGNED,
  ],
  [COMPLAINT_STATUS.ON_HOLD]: [
    COMPLAINT_STATUS.IN_PROGRESS,
    COMPLAINT_STATUS.ASSIGNED,
    COMPLAINT_STATUS.CANCELLED,
  ],
  [COMPLAINT_STATUS.RESOLUTION_SUBMITTED]: [
    COMPLAINT_STATUS.UNDER_VERIFICATION,
    COMPLAINT_STATUS.RESOLVED,
    COMPLAINT_STATUS.IN_PROGRESS, // Rejected resolution proof
  ],
  [COMPLAINT_STATUS.UNDER_VERIFICATION]: [
    COMPLAINT_STATUS.RESOLVED,
    COMPLAINT_STATUS.IN_PROGRESS, // Re-work needed
  ],
  [COMPLAINT_STATUS.RESOLVED]: [
    COMPLAINT_STATUS.REOPENED,
  ],
  [COMPLAINT_STATUS.REOPENED]: [
    COMPLAINT_STATUS.UNDER_REVIEW,
    COMPLAINT_STATUS.VERIFIED,
    COMPLAINT_STATUS.ASSIGNED,
    COMPLAINT_STATUS.IN_PROGRESS,
  ],
  [COMPLAINT_STATUS.CANCELLED]: [
    COMPLAINT_STATUS.REOPENED,
    COMPLAINT_STATUS.UNDER_REVIEW,
  ],
};

/**
 * Validate whether a user has permission to trigger a specific transition
 */
/**
 * Validate whether a transition is permitted in the role-free architecture.
 *
 * Rules:
 * 1. State machine rules (ALLOWED_TRANSITIONS) must be satisfied.
 * 2. Automated background tasks (isSystem: true) may execute state transitions.
 * 3. Public visitors possessing the valid high-entropy tracking token may:
 *    - CANCEL if complaint is currently in SUBMITTED or UNDER_REVIEW.
 *    - REOPEN if complaint is currently in RESOLVED (with mandatory non-empty reason).
 * 4. Administrative and field status transitions (VERIFIED, ASSIGNED, IN_PROGRESS, RESOLUTION_SUBMITTED, RESOLVED, REJECTED)
 *    are internal operational workflows and cannot be triggered by public visitors.
 */
export function validateTransitionPermissions(requester, complaint, targetStatus, options = {}) {
  const currentStatus = complaint.status;

  // 1. Is transition allowed by the state machine?
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid transition from "${currentStatus}" to "${targetStatus}". Allowed next states: ${allowedNext.join(', ') || 'none'}.`,
    };
  }

  // 2. Automated platform system tasks can execute valid transitions
  if (requester?.isSystem || requester?.role === 'SYSTEM') {
    return { valid: true };
  }

  const tokenMatches =
    Boolean(options.trackingToken) &&
    options.trackingToken === complaint.trackingToken;

  // 3. Public user permission gates
  switch (targetStatus) {
    case COMPLAINT_STATUS.CANCELLED:
      if (!tokenMatches) {
        return {
          valid: false,
          error: 'Valid tracking token required to cancel a complaint.',
        };
      }
      if (
        currentStatus !== COMPLAINT_STATUS.SUBMITTED &&
        currentStatus !== COMPLAINT_STATUS.UNDER_REVIEW
      ) {
        return {
          valid: false,
          error: 'Complaints cannot be cancelled once work has been verified or assigned.',
        };
      }
      return { valid: true };

    case COMPLAINT_STATUS.REOPENED:
      if (!tokenMatches) {
        return {
          valid: false,
          error: 'Valid tracking token required to reopen a complaint.',
        };
      }
      if (currentStatus !== COMPLAINT_STATUS.RESOLVED) {
        return {
          valid: false,
          error: 'Only resolved complaints can be requested for reopening.',
        };
      }
      if (!options.reason || !options.reason.trim()) {
        return {
          valid: false,
          error: 'Please provide a reason explaining why the issue is not satisfactorily resolved.',
        };
      }
      return { valid: true };

    default:
      return {
        valid: false,
        error:
          'Status transitions such as verification, assignment, or resolution are restricted to municipal administrative workflows and cannot be triggered by public requests.',
      };
  }
}

/**
 * Execute a status transition atomically, recording audit logs, complaint history,
 * and creating in-app notification.
 */
export async function executeStatusTransition({
  complaint,
  targetStatus,
  user = {},
  remarks = '',
  reason = '',
  internalOnly = false,
  metadata = null,
  ipAddress = '',
  userAgent = '',
}) {
  const previousStatus = complaint.status;

  // Update complaint properties
  complaint.status = targetStatus;
  complaint.optimisticVersion = (complaint.optimisticVersion || 0) + 1;

  if (targetStatus === COMPLAINT_STATUS.REJECTED) {
    complaint.rejectionReason = reason;
  } else if (targetStatus === COMPLAINT_STATUS.ON_HOLD) {
    complaint.onHoldReason = reason;
  } else if (targetStatus === COMPLAINT_STATUS.REOPENED) {
    complaint.reopenReason = reason;
  } else if (targetStatus === COMPLAINT_STATUS.CANCELLED) {
    complaint.cancellationReason = reason;
  } else if (targetStatus === COMPLAINT_STATUS.RESOLVED) {
    complaint.resolvedAt = new Date();
    if (remarks) {
      complaint.resolutionNotes = remarks;
    }
  } else if (targetStatus === COMPLAINT_STATUS.VERIFIED) {
    complaint.verifiedAt = new Date();
  }

  const actorName = user?.name || (user?.isSystem ? 'System Automation' : 'Public Reporter');
  const actorRole = user?.role || (user?.isSystem ? 'SYSTEM' : 'PUBLIC');

  // Push to embedded timeline
  complaint.timeline.push({
    status: targetStatus,
    title: getStatusTitle(targetStatus),
    description: remarks || reason || `Status transitioned to ${targetStatus}`,
    performedBy: actorName,
    timestamp: new Date(),
  });

  await complaint.save();

  // Create permanent history record
  const historyRecord = await ComplaintHistory.create({
    complaint: complaint._id,
    trackingToken: complaint.trackingToken,
    actor: user.userId || null,
    actorName,
    actorRole,
    action: 'STATUS_CHANGE',
    previousStatus,
    newStatus: targetStatus,
    remarks: remarks || reason || '',
    internalOnly,
    metadata,
    timestamp: new Date(),
  });

  // Create Notification if citizen reference exists
  if (complaint.citizen) {
    try {
      await Notification.create({
        recipient: complaint.citizen,
        complaint: complaint._id,
        title: `Complaint Updated: ${complaint.complaintId}`,
        message: `Status changed from ${previousStatus.replace('_', ' ')} to ${targetStatus.replace('_', ' ')}. ${remarks || reason || ''}`,
        type:
          targetStatus === COMPLAINT_STATUS.RESOLVED
            ? NOTIFICATION_TYPES.STATUS_CHANGE
            : targetStatus === COMPLAINT_STATUS.REOPENED
            ? NOTIFICATION_TYPES.REOPENED
            : NOTIFICATION_TYPES.STATUS_CHANGE,
        link: `/track?token=${complaint.trackingToken}`,
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }
  }

  // Create Audit Log
  try {
    await AuditLog.create({
      user: user.userId || null,
      userName: actorName,
      userRole: actorRole,
      action: 'STATUS_CHANGE',
      entityType: 'COMPLAINT',
      entityId: complaint.complaintId,
      details: {
        previousStatus,
        newStatus: targetStatus,
        reason,
        remarks,
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (auditErr) {
    console.error('Failed to create audit log:', auditErr);
  }

  return { complaint, historyRecord };
}

function getStatusTitle(status) {
  switch (status) {
    case COMPLAINT_STATUS.UNDER_REVIEW:
      return 'Under Review by Operations';
    case COMPLAINT_STATUS.VERIFIED:
      return 'Grievance Verified & Approved';
    case COMPLAINT_STATUS.REJECTED:
      return 'Complaint Rejected / Duplicate';
    case COMPLAINT_STATUS.ASSIGNED:
      return 'Assigned to Ward / Field Crew';
    case COMPLAINT_STATUS.IN_PROGRESS:
      return 'On-Site Repair In Progress';
    case COMPLAINT_STATUS.ON_HOLD:
      return 'Temporarily Placed On Hold';
    case COMPLAINT_STATUS.RESOLUTION_SUBMITTED:
      return 'Resolution Proof Submitted by Technician';
    case COMPLAINT_STATUS.UNDER_VERIFICATION:
      return 'Under Supervisory Ground Verification';
    case COMPLAINT_STATUS.RESOLVED:
      return 'Issue Successfully Resolved';
    case COMPLAINT_STATUS.REOPENED:
      return 'Complaint Reopened by Citizen / Admin';
    case COMPLAINT_STATUS.CANCELLED:
      return 'Complaint Cancelled';
    case COMPLAINT_STATUS.SUBMITTED:
    default:
      return 'Complaint Registered';
  }
}
