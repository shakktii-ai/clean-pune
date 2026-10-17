import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import ComplaintHistory from '@/models/ComplaintHistory';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cleanId = (id || '').trim();

    const hasDb = await isMongoAvailable();
    if (!hasDb) {
      return NextResponse.json({
        success: true,
        isDemoMode: true,
        history: [],
      });
    }

    await connectToDatabase();
    const isObjectId = cleanId.match(/^[0-9a-fA-F]{24}$/);
    const complaint = await Complaint.findOne({
      $or: [
        { trackingToken: cleanId },
        { complaintId: cleanId.toUpperCase() },
        ...(isObjectId ? [{ _id: cleanId }] : []),
      ],
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    // Confidentiality check: non-public complaints require the tracking token
    if (!complaint.isPublic && complaint.trackingToken !== cleanId) {
      return NextResponse.json(
        { error: 'Tracking token required to view private complaint history.' },
        { status: 403 }
      );
    }

    // Only non-internal history records are returned publicly
    const history = await ComplaintHistory.find({
      complaint: complaint._id,
      internalOnly: false,
    })
      .sort({ timestamp: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve complaint history.' }, { status: 500 });
  }
}
