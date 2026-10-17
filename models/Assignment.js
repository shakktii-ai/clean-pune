import mongoose from 'mongoose';

export const ASSIGNMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  REASSIGNED: 'REASSIGNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const AssignmentSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    assignedRole: {
      type: String,
      default: '',
    },
    instructions: {
      type: String,
      default: '',
      trim: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(ASSIGNMENT_STATUS),
      default: ASSIGNMENT_STATUS.ACTIVE,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

AssignmentSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);
