import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import { DEMO_COMPLAINTS } from '@/lib/demoData';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cleanId = (id || '').trim();

    if (!cleanId) {
      return NextResponse.json({ error: 'Complaint identifier is required.' }, { status: 400 });
    }

    const hasDb = await isMongoAvailable();
    if (hasDb) {
      try {
        await connectToDatabase();

        // Search by trackingToken, complaintId, or _id
        const isObjectId = cleanId.match(/^[0-9a-fA-F]{24}$/);
        const queryOr = [
          { trackingToken: cleanId },
          { complaintId: cleanId.toUpperCase() },
        ];
        if (isObjectId) {
          queryOr.push({ _id: cleanId });
        }

        const doc = await Complaint.findOne({ $or: queryOr })
          .populate('category')
          .populate('department')
          .populate('ward');

        if (doc) {
          const accessedViaToken = doc.trackingToken === cleanId;

          // Privacy guard: Non-public or sensitive grievances require confidential tracking token
          if (!doc.isPublic || doc.isSensitive) {
            if (!accessedViaToken) {
              return NextResponse.json(
                {
                  error:
                    'Access denied: This grievance is private or sensitive and can only be accessed using its confidential tracking token.',
                },
                { status: 403 }
              );
            }
          }

          const obj = doc.toObject();

          // Internal operational notes are never exposed publicly
          delete obj.internalNotes;

          // Mask citizen contact details
          if (obj.citizenContact) {
            if (accessedViaToken) {
              if (obj.citizenContact.phone) {
                obj.citizenContact.phone = obj.citizenContact.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
              }
              if (obj.citizenContact.email) {
                obj.citizenContact.email = '***@***.***';
              }
            } else {
              // Redact completely for public ID lookups
              obj.citizenContact = {
                name: 'Concerned Citizen',
                phone: '',
                email: '',
              };
            }
          }

          return NextResponse.json({
            success: true,
            source: 'database',
            complaint: obj,
            accessLevel: accessedViaToken ? 'TOKEN_VERIFIED' : 'PUBLIC',
          });
        }
      } catch (dbErr) {
        console.error('Database single complaint error:', dbErr);
      }
    }

    // Demo data fallback
    const demoFound = DEMO_COMPLAINTS.find(
      (c) =>
        c.complaintId.toUpperCase() === cleanId.toUpperCase() ||
        c._id === cleanId ||
        c.trackingToken === cleanId
    );

    if (demoFound) {
      return NextResponse.json({
        success: true,
        source: 'demo_data',
        isDemoData: true,
        complaint: demoFound,
        accessLevel: demoFound.trackingToken === cleanId ? 'TOKEN_VERIFIED' : 'PUBLIC',
      });
    }

    return NextResponse.json(
      { error: `No complaint found matching identifier "${cleanId}".` },
      { status: 404 }
    );
  } catch (error) {
    console.error('Complaint lookup error:', error);
    return NextResponse.json({ error: 'Failed to look up complaint' }, { status: 500 });
  }
}

export async function PATCH() {
  // Public users cannot directly edit complaint parameters
  return NextResponse.json(
    { error: 'Direct modification of grievance records is restricted to internal operational workflows.' },
    { status: 403 }
  );
}
