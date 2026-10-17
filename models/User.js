import mongoose from 'mongoose';

/**
 * Historical User Model.
 * Note: Active login and user role systems have been completely removed.
 * This model is preserved exclusively for historical referential integrity of past complaints.
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Citizen / Reporter',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
