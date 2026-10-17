import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      unique: true,
      index: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required (1-5)'],
      min: 1,
      max: 5,
    },
    satisfied: {
      type: Boolean,
      required: true,
    },
    comments: {
      type: String,
      default: '',
      trim: true,
    },
    speedRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    qualityRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
