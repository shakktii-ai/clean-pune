import mongoose from 'mongoose';

const WardSchema = new mongoose.Schema(
  {
    wardNumber: {
      type: Number,
      required: [true, 'Ward number is required'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Ward name is required'],
      trim: true,
    },
    nameMr: {
      type: String,
      trim: true,
      default: '',
    },
    zone: {
      type: String,
      required: [true, 'Administrative zone is required'],
      trim: true,
      index: true,
    },
    officeAddress: {
      type: String,
      default: '',
    },
    contactPhone: {
      type: String,
      default: '',
    },
    contactEmail: {
      type: String,
      default: '',
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude coordinate is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude coordinate is required'],
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

export default mongoose.models.Ward || mongoose.model('Ward', WardSchema);
