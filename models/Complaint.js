import mongoose from 'mongoose';

export const COMPLAINT_STATUS = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  RESOLUTION_SUBMITTED: 'RESOLUTION_SUBMITTED',
  UNDER_VERIFICATION: 'UNDER_VERIFICATION',
  RESOLVED: 'RESOLVED',
  REOPENED: 'REOPENED',
  CANCELLED: 'CANCELLED',
};

export const COMPLAINT_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

const EvidenceSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileType: { type: String, default: 'image' },
    mimeType: { type: String },
    sizeBytes: { type: Number },
    originalName: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InternalNoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    authorName: { type: String, default: 'Operational System' },
    authorRole: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TimelineEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    performedBy: {
      type: String,
      default: 'System / Coordinator',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ComplaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    trackingToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: true,
      index: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    citizenContact: {
      name: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
    },
    location: {
      address: { type: String, required: true, trim: true },
      landmark: { type: String, default: '', trim: true },
      geo: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        // [longitude, latitude] format for GeoJSON
        coordinates: {
          type: [Number],
          required: true,
          default: [73.8567, 18.5204], // Pune central default coordinates
        },
      },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITY),
      default: COMPLAINT_PRIORITY.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.SUBMITTED,
      index: true,
    },
    evidence: {
      type: [EvidenceSchema],
      default: [],
    },
    assignedSupervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    internalNotes: {
      type: [InternalNoteSchema],
      default: [],
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    onHoldReason: {
      type: String,
      default: '',
      trim: true,
    },
    reopenReason: {
      type: String,
      default: '',
      trim: true,
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
    },
    reworkReason: {
      type: String,
      default: '',
      trim: true,
    },
    reworkInstructions: {
      type: String,
      default: '',
      trim: true,
    },
    beforePhotos: {
      type: [String],
      default: [],
    },
    afterPhotos: {
      type: [String],
      default: [],
    },
    workStartedAt: {
      type: Date,
      default: null,
    },
    resolutionProof: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResolutionProof',
      default: null,
    },
    escalationLevel: {
      type: Number,
      default: 0,
      index: true,
    },
    escalationHistory: [
      {
        level: { type: Number, required: true },
        escalatedAt: { type: Date, default: Date.now },
        reason: { type: String, default: '' },
        notifiedRoles: [{ type: String }],
      },
    ],
    onHoldPeriods: [
      {
        pausedAt: { type: Date, default: Date.now },
        resumedAt: { type: Date, default: null },
        reason: { type: String, default: '' },
      },
    ],
    slaHours: {
      type: Number,
      default: 48,
    },
    slaDeadline: {
      type: Date,
      index: true,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    timeline: {
      type: [TimelineEventSchema],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isSensitive: {
      type: Boolean,
      default: false,
    },
    feedbackRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    feedbackComments: {
      type: String,
      default: '',
    },
    feedbackSatisfied: {
      type: Boolean,
      default: null,
    },
    optimisticVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// GeoJSON 2dsphere index for location spatial queries
ComplaintSchema.index({ 'location.geo': '2dsphere' });
// Compound index for department and status queries
ComplaintSchema.index({ department: 1, status: 1 });
// Compound index for citizen history
ComplaintSchema.index({ citizen: 1, createdAt: -1 });

export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
