import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Complaint, { COMPLAINT_STATUS } from '@/models/Complaint';
import { DEMO_COMPLAINTS } from '@/lib/demoData';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      remarks = 'Issue resolved and verified on site.',
      photos = [],
      performedBy = 'PMC Field Operations Desk',
      trackingToken,
    } = body;

    const cleanId = (id || '').trim();
    if (!cleanId) {
      return NextResponse.json({ error: 'Complaint ID is required.' }, { status: 400 });
    }

    // Ensure photos is an array of strings
    const photoUrls = Array.isArray(photos)
      ? photos.map((p) => (typeof p === 'string' ? p : p?.url)).filter(Boolean)
      : typeof photos === 'string' && photos
      ? [photos]
      : [];

    const hasDb = await isMongoAvailable();
    if (hasDb) {
      try {
        await connectToDatabase();
        const isObjectId = cleanId.match(/^[0-9a-fA-F]{24}$/);
        const queryOr = [
          { trackingToken: cleanId },
          { complaintId: cleanId.toUpperCase() },
          ...(isObjectId ? [{ _id: cleanId }] : []),
        ];

        const complaint = await Complaint.findOne({ $or: queryOr })
          .populate('category')
          .populate('department')
          .populate('ward');

        if (complaint) {
          complaint.status = COMPLAINT_STATUS.RESOLVED;
          complaint.resolvedAt = new Date();
          complaint.resolutionNotes = remarks;

          if (photoUrls.length > 0) {
            complaint.afterPhotos = photoUrls;
            photoUrls.forEach((url) => {
              if (!complaint.evidence.some((e) => e.url === url)) {
                complaint.evidence.push({
                  url,
                  fileType: 'image',
                  originalName: 'resolution_proof.jpg',
                  uploadedAt: new Date(),
                });
              }
            });
          }

          if (!complaint.timeline) {
            complaint.timeline = [];
          }

          complaint.timeline.push({
            status: COMPLAINT_STATUS.RESOLVED,
            title: 'Issue Resolved & Verified on Site',
            description: remarks,
            performedBy: performedBy || 'PMC Field Operations Team',
            timestamp: new Date(),
          });

          await complaint.save();

          return NextResponse.json({
            success: true,
            message: 'Complaint successfully marked as RESOLVED with photographic proof.',
            complaint: complaint.toObject(),
          });
        }
      } catch (dbErr) {
        console.error('Database resolution error:', dbErr);
      }
    }

    // Fallback: update in-memory DEMO_COMPLAINTS
    const demoFound = DEMO_COMPLAINTS.find(
      (c) =>
        c.complaintId.toUpperCase() === cleanId.toUpperCase() ||
        c._id === cleanId ||
        c.trackingToken === cleanId
    );

    if (demoFound) {
      demoFound.status = 'RESOLVED';
      demoFound.resolvedAt = new Date().toISOString();
      demoFound.resolutionNotes = remarks;
      const finalPhotos = photoUrls.length > 0 ? photoUrls : ['/uploads/pothole_repaired_fc_road.jpg'];
      demoFound.afterPhotos = finalPhotos;

      // Add to evidence array if missing
      if (!demoFound.evidence) demoFound.evidence = [];
      finalPhotos.forEach((url) => {
        if (!demoFound.evidence.some((e) => e.url === url)) {
          demoFound.evidence.push({
            url,
            fileType: 'image',
            originalName: 'resolution_proof.jpg',
            uploadedAt: new Date().toISOString(),
          });
        }
      });

      if (!demoFound.timeline) demoFound.timeline = [];
      demoFound.timeline.push({
        status: 'RESOLVED',
        title: 'Issue Resolved & Verified on Site',
        description: remarks,
        performedBy: performedBy || 'PMC Field Operations Team',
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Complaint successfully marked as RESOLVED with photographic proof.',
        complaint: demoFound,
      });
    }

    return NextResponse.json({ error: `Complaint "${cleanId}" not found.` }, { status: 404 });
  } catch (err) {
    console.error('Resolution API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to resolve complaint' }, { status: 500 });
  }
}
