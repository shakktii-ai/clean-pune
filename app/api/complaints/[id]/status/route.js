import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Complaint, { COMPLAINT_STATUS } from '@/models/Complaint';
import { getClientIp } from '@/lib/rateLimit';
import {
  validateTransitionPermissions,
  executeStatusTransition,
} from '@/lib/complaintLifecycle';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { targetStatus, remarks, reason, trackingToken } = body;

    if (!targetStatus) {
      return NextResponse.json({ error: 'Target status is required.' }, { status: 400 });
    }

    // Only citizen cancellation with valid tracking token is publicly permitted
    if (targetStatus !== COMPLAINT_STATUS.CANCELLED) {
      return NextResponse.json(
        {
          error:
            'Status transitions such as verification, assignment, or resolution are restricted to municipal administrative workflows and cannot be triggered by public visitors.',
        },
        { status: 403 }
      );
    }

    const tokenToCheck = (trackingToken || id || '').trim();
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    const hasDb = await isMongoAvailable();
    if (!hasDb) {
      return NextResponse.json(
        {
          success: true,
          isDemoMode: true,
          message: `[DEMO MODE] Status changed to ${targetStatus}`,
          complaint: { id, status: targetStatus, remarks },
        },
        { status: 200 }
      );
    }

    await connectToDatabase();
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const complaint = await Complaint.findOne({
      $or: [
        { trackingToken: id },
        { complaintId: id.toUpperCase() },
        ...(isObjectId ? [{ _id: id }] : []),
      ],
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    // Validate permission and lifecycle rules
    const validation = validateTransitionPermissions(
      { role: 'PUBLIC' },
      complaint,
      targetStatus,
      {
        trackingToken: tokenToCheck,
        reason,
        remarks,
      }
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    // Execute cancellation atomically
    const { complaint: updatedComplaint, historyRecord } = await executeStatusTransition({
      complaint,
      targetStatus,
      user: { name: 'Public Reporter', role: 'PUBLIC' },
      remarks: remarks || reason || 'Cancelled by reporter.',
      reason,
      internalOnly: false,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Complaint successfully cancelled.',
      complaint: updatedComplaint,
      history: historyRecord,
    });
  } catch (error) {
    console.error('Status transition error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update complaint status.' },
      { status: 500 }
    );
  }
}
