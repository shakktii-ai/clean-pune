import mongoose from 'mongoose';

export const ABUSE_REASONS = {
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  DUPLICATE_OR_SPAM: 'DUPLICATE_OR_SPAM',
  MISLEADING_LOCATION: 'MISLEADING_LOCATION',
  PRIVACY_VIOLATION: 'PRIVACY_VIOLATION',
  FRAUDULENT_COMPLETION: 'FRAUDULENT_COMPLETION',
  OTHER: 'OTHER',
};

export const MODERATION_STATUS = {
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
  DISMISSED: 'DISMISSED',
  ACTION_TAKEN: 'ACTION_TAKEN',
};

const ReportAbuseSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['COMPLAINT', 'RESOLUTION_PROOF', 'FEEDBACK', 'COMMENT'],
      required: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    complaintId: {
      type: String,
      default: '',
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporterEmail: {
      type: String,
      trim: true,
      default: '',
    },
    reason: {
      type: String,
      enum: Object.values(ABUSE_REASONS),
      required: true,
    },
    details: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(MODERATION_STATUS),
      default: MODERATION_STATUS.PENDING,
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderationNotes: {
      type: String,
      default: '',
    },
    actionTaken: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

ReportAbuseSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.ReportAbuse || mongoose.model('ReportAbuse', ReportAbuseSchema);
