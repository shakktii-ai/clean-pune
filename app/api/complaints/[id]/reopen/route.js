import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Complaint, { COMPLAINT_STATUS } from '@/models/Complaint';
import { getClientIp } from '@/lib/rateLimit';
import { executeStatusTransition, validateTransitionPermissions } from '@/lib/complaintLifecycle';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason, remarks, trackingToken } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'A mandatory reason is required explaining why the resolution was unsatisfactory.' },
        { status: 400 }
      );
    }

    const tokenToCheck = (trackingToken || id || '').trim();
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

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

    const validation = validateTransitionPermissions(
      { role: 'PUBLIC' },
      complaint,
      COMPLAINT_STATUS.REOPENED,
      {
        trackingToken: tokenToCheck,
        reason: reason.trim(),
        remarks: remarks || reason.trim(),
      }
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    const { complaint: updatedComplaint } = await executeStatusTransition({
      complaint,
      targetStatus: COMPLAINT_STATUS.REOPENED,
      user: { name: 'Public Reporter', role: 'PUBLIC' },
      reason: reason.trim(),
      remarks: remarks || reason.trim(),
      internalOnly: false,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Complaint has been reopened and queued for reinspection.',
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error('Reopen POST error:', error);
    return NextResponse.json({ error: 'Failed to reopen complaint.' }, { status: 500 });
  }
}
