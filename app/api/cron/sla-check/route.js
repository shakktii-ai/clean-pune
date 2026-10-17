import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import { scanAndEscalateComplaints } from '@/services/slaService';

/**
 * Scheduled SLA and Escalation Monitoring Route
 * Compatible with Vercel Cron or direct automated HTTP runners.
 * Safe to retry and idempotent: will not dispatch duplicate escalations.
 */
export async function GET(request) {
  return handleSlaCheck(request);
}

export async function POST(request) {
  return handleSlaCheck(request);
}

async function handleSlaCheck(request) {
  try {
    // Optional Bearer token authorization if CRON_SECRET is configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization') || '';
      const providedSecret = authHeader.replace(/^Bearer\s+/i, '');
      if (providedSecret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
      }
    }

    const hasDb = await isMongoAvailable();
    if (!hasDb) {
      return NextResponse.json({
        success: true,
        source: 'simulated_cron',
        message: 'MongoDB offline; simulated SLA scan completed without errors.',
        scanned: 0,
      });
    }

    await connectToDatabase();
    const results = await scanAndEscalateComplaints();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'database',
      message: 'SLA scan completed successfully.',
      results,
    });
  } catch (error) {
    console.error('SLA Cron execution error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'SLA monitoring job failed' },
      { status: 500 }
    );
  }
}
