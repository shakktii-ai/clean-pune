import mongoose from 'mongoose';

const SystemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'GLOBAL_PLATFORM_CONFIG',
    },
    platformName: {
      type: String,
      default: 'Pune Civic Platform',
    },
    organizationName: {
      type: String,
      default: 'Independent Civic Technology Initiative',
    },
    supportEmail: {
      type: String,
      default: 'support@punecivic.org',
    },
    supportPhone: {
      type: String,
      default: '+91 20 6600 0000',
    },
    defaultLanguage: {
      type: String,
      enum: ['en', 'mr'],
      default: 'en',
    },
    // Feature Flags
    featureFlags: {
      enableAiAssistance: { type: Boolean, default: true },
      enableSmsNotifications: { type: Boolean, default: false },
      enableWhatsAppNotifications: { type: Boolean, default: false },
      enableEmailNotifications: { type: Boolean, default: true },
      requireBeforePhotos: { type: Boolean, default: false },
      strictSlaEnforcement: { type: Boolean, default: true },
      allowPublicMapSearch: { type: Boolean, default: true },
      enableGeoPrivacyFuzzing: { type: Boolean, default: true },
    },
    // Public Data Visibility & Retention
    securitySettings: {
      geoFuzzDistanceMeters: { type: Number, default: 150 },
      fileRetentionDays: { type: Number, default: 180 },
      maxEvidenceUploads: { type: Number, default: 5 },
      maxPhotoSizeBytes: { type: Number, default: 5242880 }, // 5 MB
      maxVideoSizeBytes: { type: Number, default: 26214400 }, // 25 MB
      rateLimitPerMinute: { type: Number, default: 60 },
    },
    // Notification Templates
    notificationTemplates: {
      complaintRegistered: {
        type: String,
        default: 'Your grievance has been logged successfully with tracking token {token}.',
      },
      taskAssigned: {
        type: String,
        default: 'A field technician has been dispatched to inspect your reported issue.',
      },
      resolutionVerified: {
        type: String,
        default: 'The reported issue has been verified and marked as RESOLVED by ward supervisors.',
      },
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SystemConfig || mongoose.model('SystemConfig', SystemConfigSchema);
