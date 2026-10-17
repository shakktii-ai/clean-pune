import mongoose from 'mongoose';

export const CATEGORY_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    nameMr: {
      type: String,
      trim: true,
      default: '',
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    slaHours: {
      type: Number,
      default: 48,
      min: [1, 'SLA must be at least 1 hour'],
    },
    priority: {
      type: String,
      enum: Object.values(CATEGORY_PRIORITY),
      default: CATEGORY_PRIORITY.MEDIUM,
    },
    iconName: {
      type: String,
      default: 'AlertCircle',
    },
    subcategories: {
      type: [
        {
          name: { type: String, required: true },
          nameMr: { type: String, default: '' },
          code: { type: String, required: true },
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
