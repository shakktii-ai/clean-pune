import mongoose from 'mongoose';

const ResolutionProofSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    beforePhotos: {
      type: [String],
      default: [],
    },
    afterPhotos: {
      type: [String],
      default: [],
    },
    videoUrl: {
      type: String,
      default: '',
    },
    gpsAccuracyMeters: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      required: [true, 'Resolution work notes are required'],
      trim: true,
    },
    reworkInstructions: {
      type: String,
      default: '',
      trim: true,
    },
    locationAtResolution: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [73.8567, 18.5204],
      },
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ResolutionProof ||
  mongoose.model('ResolutionProof', ResolutionProofSchema);
