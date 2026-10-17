import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import ReportAbuse, { ABUSE_REASONS } from '@/models/ReportAbuse';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`abuse_${ip}`, 30);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many abuse reports submitted. Please wait.' }, { status: 429 });
    }

    const body = await request.json();
    const { targetType = 'COMPLAINT', targetId, complaintId = '', reason, details, reporterEmail = '', reporterName = '' } = body;
    const finalTargetId = targetId || complaintId;

    if (!finalTargetId) {
      return NextResponse.json({ error: 'Complaint reference is required.' }, { status: 400 });
    }
    if (!reason || !Object.values(ABUSE_REASONS).includes(reason)) {
      return NextResponse.json({ error: 'Please select a valid reason for flagging content.' }, { status: 400 });
    }
    if (!details || !details.trim()) {
      return NextResponse.json({ error: 'Please explain the concern or violation in detail.' }, { status: 400 });
    }

    const hasDb = await isMongoAvailable();
    if (hasDb) {
      try {
        await connectToDatabase();
        const abuseDoc = await ReportAbuse.create({
          targetType,
          targetId: finalTargetId,
          complaintId: complaintId || finalTargetId,
          reportedBy: null,
          reporterEmail: reporterEmail.trim(),
          reporterName: reporterName.trim() || 'Concerned Citizen',
          reason,
          details: details.trim(),
          ipAddress: ip,
        });

        return NextResponse.json(
          {
            success: true,
            message: 'Concern submitted successfully. Our municipal moderation desk will review this content.',
            reportId: abuseDoc._id.toString(),
          },
          { status: 201 }
        );
      } catch (dbErr) {
        console.error('Report abuse database error:', dbErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        source: 'demo_data',
        message: 'Concern received and queued for review in demo mode.',
        reportId: `demo_abuse_${Date.now()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Report abuse error:', error);
    return NextResponse.json({ error: 'Failed to record moderation flag' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Forbidden: Moderation queue is restricted to internal operational review.' },
    { status: 403 }
  );
}
