import mongoose from 'mongoose';
import '@/models/User';
import '@/models/Department';
import '@/models/Category';
import '@/models/Ward';
import '@/models/Complaint';
import '@/models/ComplaintHistory';
import '@/models/Assignment';
import '@/models/ResolutionProof';
import '@/models/Feedback';
import '@/models/Notification';
import '@/models/AuditLog';
import '@/models/SlaRule';
import '@/models/SystemConfig';
import '@/models/ReportAbuse';
import '@/models/SupportTicket';

/**
 * Global cache for Mongoose connection across Next.js API routes
 * and Serverless invocations.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable in .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 4000, // Quick timeout to prevent hanging when offline
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

/**
 * Safe helper to check if MongoDB is currently connected or reachable.
 * Useful for graceful fallback to demo datasets when working in offline/development mode.
 */
export async function isMongoAvailable() {
  try {
    const conn = await connectToDatabase();
    return conn && conn.connection && conn.connection.readyState === 1;
  } catch (error) {
    return false;
  }
}
