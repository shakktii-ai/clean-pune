import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Complaint, { COMPLAINT_STATUS } from '@/models/Complaint';
import Feedback from '@/models/Feedback';
import ComplaintHistory from '@/models/ComplaintHistory';
import AuditLog from '@/models/AuditLog';
import { getClientIp } from '@/lib/rateLimit';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, satisfied, comments, speedRating, qualityRating, trackingToken } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Please provide a valid rating between 1 and 5 stars.' }, { status: 400 });
    }
    if (satisfied === undefined) {
      return NextResponse.json({ error: 'Please indicate whether you are satisfied with the resolution.' }, { status: 400 });
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

    if (complaint.trackingToken !== tokenToCheck) {
      return NextResponse.json(
        { error: 'Valid tracking token required to submit feedback for this complaint.' },
        { status: 403 }
      );
    }

    if (complaint.status !== COMPLAINT_STATUS.RESOLVED) {
      return NextResponse.json(
        { error: 'Feedback can only be submitted after an issue has been marked Resolved.' },
        { status: 400 }
      );
    }

    // Check if feedback already submitted
    const existingFeedback = await Feedback.findOne({ complaint: complaint._id });
    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback has already been recorded for this complaint.' },
        { status: 409 }
      );
    }

    // Create Feedback record
    const feedbackDoc = await Feedback.create({
      complaint: complaint._id,
      citizen: null,
      rating: Number(rating),
      satisfied: Boolean(satisfied),
      comments: comments?.trim() || '',
      speedRating: speedRating ? Number(speedRating) : null,
      qualityRating: qualityRating ? Number(qualityRating) : null,
    });

    // Update complaint record
    complaint.feedbackRating = Number(rating);
    complaint.feedbackSatisfied = Boolean(satisfied);
    complaint.feedbackComments = comments?.trim() || '';
    await complaint.save();

    // Log history
    await ComplaintHistory.create({
      complaint: complaint._id,
      trackingToken: complaint.trackingToken,
      actor: null,
      actorName: 'Public Reporter',
      actorRole: 'PUBLIC',
      action: 'FEEDBACK_SUBMITTED',
      previousStatus: complaint.status,
      newStatus: complaint.status,
      remarks: `Citizen rated ${rating}/5 stars. Satisfied: ${satisfied ? 'Yes' : 'No'}. Note: ${comments || 'None'}`,
      internalOnly: false,
      timestamp: new Date(),
    });

    // Audit log
    await AuditLog.create({
      user: null,
      userName: 'Public Reporter',
      userRole: 'PUBLIC',
      action: 'SUBMIT_FEEDBACK',
      entityType: 'FEEDBACK',
      entityId: complaint.complaintId,
      details: { rating, satisfied, comments },
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! It helps improve Pune civic services.',
      feedback: feedbackDoc,
    });
  } catch (error) {
    console.error('Feedback POST error:', error);
    return NextResponse.json({ error: 'Failed to record feedback.' }, { status: 500 });
  }
}
