import mongoose from 'mongoose';

const SlaRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'ALL'],
      default: 'ALL',
      index: true,
    },
    targetDurationHours: {
      type: Number,
      required: true,
      min: 1,
    },
    businessHoursOnly: {
      type: Boolean,
      default: false,
    },
    businessHoursStart: {
      type: String,
      default: '09:00', // HH:MM in IST (UTC+5:30)
    },
    businessHoursEnd: {
      type: String,
      default: '18:00',
    },
    businessDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // 1=Mon, 5=Fri
    },
    warningThresholdPercent: {
      type: Number,
      default: 75, // 75% elapsed -> Level 1 escalation to Supervisor
    },
    breachThresholdPercent: {
      type: Number,
      default: 100, // 100% elapsed -> Level 2 escalation to Operations Admin
    },
    escalationChannels: {
      type: [String],
      default: ['SYSTEM', 'EMAIL'],
    },
    description: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SlaRuleSchema.index({ category: 1, priority: 1, active: 1 });

export default mongoose.models.SlaRule || mongoose.model('SlaRule', SlaRuleSchema);
