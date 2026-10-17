import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'DISCONNECTED';
  let dbLatencyMs = null;

  try {
    const db = await connectToDatabase();
    if (mongoose.connection.readyState === 1) {
      dbStatus = 'CONNECTED';
      // Measure ping latency
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - pingStart;
    } else {
      dbStatus = 'CONNECTING';
    }
  } catch (err) {
    dbStatus = 'ERROR';
  }

  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const isHealthy = dbStatus === 'CONNECTED';
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      environment: process.env.NODE_ENV || 'development',
      version: '4.0.0',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        name: mongoose.connection?.name || 'pune_civic',
      },
      services: {
        aiProvider: process.env.GEMINI_API_KEY ? 'GEMINI_1_5_FLASH' : 'OFFLINE_BILINGUAL_NLP',
        storageProvider: process.env.CLOUDINARY_CLOUD_NAME ? 'CLOUDINARY' : 'LOCAL_FILESYSTEM',
        notifications: process.env.SMTP_SERVER ? 'SMTP_ACTIVE' : 'AUDIT_LOG_FALLBACK',
      },
      system: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
      },
      totalDurationMs: Date.now() - startTime,
    },
    { status: statusCode }
  );
}
