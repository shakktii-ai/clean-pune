import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Complaint, { COMPLAINT_STATUS } from '@/models/Complaint';
import Category from '@/models/Category';
import Department from '@/models/Department';
import Ward from '@/models/Ward';
import ComplaintHistory from '@/models/ComplaintHistory';
import AuditLog from '@/models/AuditLog';
import { generateTrackingToken, generateDisplayId } from '@/lib/tokens';
import { getClientIp } from '@/lib/rateLimit';
import { DEMO_COMPLAINTS, DEMO_CATEGORIES, DEMO_DEPARTMENTS, DEMO_WARDS } from '@/lib/demoData';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const wardParam = searchParams.get('ward');
    const categoryParam = searchParams.get('category');
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const departmentParam = searchParams.get('department');
    const scopeParam = searchParams.get('scope'); // 'my' | 'all'
    const query = searchParams.get('q')?.toLowerCase()?.trim();
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const hasDb = await isMongoAvailable();

    if (hasDb) {
      try {
        await connectToDatabase();
        const filter = { isPublic: true };

        // Filters
        if (statusParam && statusParam !== 'ALL') {
          filter.status = statusParam;
        }
        if (priorityParam && priorityParam !== 'ALL') {
          filter.priority = priorityParam;
        }
        if (departmentParam && departmentParam !== 'ALL') {
          // Check if code or ObjectId
          const deptDoc = await Department.findOne({
            $or: [{ code: departmentParam.toUpperCase() }, { _id: departmentParam.match(/^[0-9a-fA-F]{24}$/) ? departmentParam : null }],
          });
          if (deptDoc) filter.department = deptDoc._id;
        }
        if (categoryParam && categoryParam !== 'ALL') {
          const catDoc = await Category.findOne({
            $or: [{ code: categoryParam.toUpperCase() }, { _id: categoryParam.match(/^[0-9a-fA-F]{24}$/) ? categoryParam : null }],
          });
          if (catDoc) filter.category = catDoc._id;
        }
        if (wardParam && wardParam !== 'ALL') {
          const wardDoc = await Ward.findOne({
            $or: [{ wardNumber: Number(wardParam) }, { _id: wardParam.match(/^[0-9a-fA-F]{24}$/) ? wardParam : null }],
          });
          if (wardDoc) filter.ward = wardDoc._id;
        }

        if (query) {
          filter.$or = [
            { complaintId: { $regex: query, $options: 'i' } },
            { trackingToken: { $regex: query, $options: 'i' } },
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { 'location.address': { $regex: query, $options: 'i' } },
            { 'location.landmark': { $regex: query, $options: 'i' } },
          ];
        }

        const skip = (page - 1) * limit;

        const [complaints, total] = await Promise.all([
          Complaint.find(filter)
            .populate('category', 'name nameMr code slaHours iconName')
            .populate('department', 'name nameMr code')
            .populate('ward', 'wardNumber name nameMr zone')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit),
          Complaint.countDocuments(filter),
        ]);

        // Hide internal notes and mask contact details from public list
        const safeComplaints = complaints.map((doc) => {
          const obj = doc.toObject();
          delete obj.internalNotes;
          if (obj.citizenContact) {
            if (obj.citizenContact.phone) {
              obj.citizenContact.phone = obj.citizenContact.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
            }
            if (obj.citizenContact.email) {
              obj.citizenContact.email = '***@***.***';
            }
          }
          return obj;
        });

        return NextResponse.json({
          success: true,
          source: 'database',
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
          complaints: safeComplaints,
        });
      } catch (dbErr) {
        console.error('Database query fallback:', dbErr);
      }
    }

    // Fallback to demo data
    let filtered = [...DEMO_COMPLAINTS];

    if (wardParam && wardParam !== 'ALL') {
      filtered = filtered.filter((c) => String(c.wardNumber) === String(wardParam));
    }
    if (categoryParam && categoryParam !== 'ALL') {
      filtered = filtered.filter((c) => c.categoryCode === categoryParam);
    }
    if (statusParam && statusParam !== 'ALL') {
      filtered = filtered.filter((c) => c.status === statusParam);
    }
    if (priorityParam && priorityParam !== 'ALL') {
      filtered = filtered.filter((c) => c.priority === priorityParam);
    }
    if (query) {
      filtered = filtered.filter(
        (c) =>
          c.complaintId.toLowerCase().includes(query) ||
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.location.address.toLowerCase().includes(query)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      source: 'demo_data',
      isDemoData: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      complaints: paginated,
    });
  } catch (error) {
    console.error('Complaints GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve complaints' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';
    const body = await request.json();

    const {
      title,
      description,
      categoryCode,
      categoryId,
      category,
      subcategory,
      wardNumber,
      wardId,
      ward,
      address,
      landmark,
      latitude,
      longitude,
      priority,
      citizenName,
      citizenPhone,
      citizenEmail,
      isAnonymous,
      isSensitive,
      evidence = [],
    } = body;

    const catKey = categoryCode || categoryId || category;
    const wardKey = (wardNumber !== undefined && wardNumber !== null && wardNumber !== '') ? wardNumber : (wardId || ward || 1);

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Complaint title is required.' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Detailed description is required.' }, { status: 400 });
    }
    if (!catKey) {
      return NextResponse.json({ error: 'Please select an issue category.' }, { status: 400 });
    }
    if (!address || !address.trim()) {
      return NextResponse.json({ error: 'Street address or location is required.' }, { status: 400 });
    }

    // Geolocation coordinates
    const lat = Number(latitude) || 18.5204;
    const lng = Number(longitude) || 73.8567;

    // Generate Display ID and unguessable cryptographic tracking token
    const complaintId = generateDisplayId();
    const trackingToken = generateTrackingToken();

    // Calculate SLA
    const matchingCategory = DEMO_CATEGORIES.find((c) => c.code === catKey || c.id === catKey || c.name === catKey) || DEMO_CATEGORIES[0];
    const slaHours = matchingCategory?.slaHours || 48;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const hasDb = await isMongoAvailable();

    if (hasDb) {
      try {
        await connectToDatabase();

        const isCatObjId = mongoose.isValidObjectId(catKey);
        const catFilter = isCatObjId ? { _id: catKey } : { $or: [{ code: catKey }, { name: catKey }] };
        const catDoc = await Category.findOne(catFilter) || await Category.findOne();

        const isWardObjId = mongoose.isValidObjectId(wardKey);
        const wardNum = !isNaN(Number(wardKey)) ? Number(wardKey) : null;
        const wardFilter = isWardObjId ? { _id: wardKey } : (wardNum !== null ? { wardNumber: wardNum } : { name: wardKey });
        const wardDoc = await Ward.findOne(wardFilter) || await Ward.findOne();

        let deptDoc = catDoc?.department ? await Department.findById(catDoc.department) : null;
        if (!deptDoc) {
          deptDoc = await Department.findOne();
        }

        if (catDoc && wardDoc && deptDoc) {
          const normalizedEvidence = (evidence || [])
            .map((ev) => {
              const url = ev.url || ev.fileUrl || '';
              const isVideo = (ev.fileType || ev.mimeType || '').includes('video') || url.match(/\.(mp4|webm|mov)$/i);
              return {
                url,
                fileType: isVideo ? 'video' : 'image',
                mimeType: ev.mimeType || ev.fileType || (isVideo ? 'video/mp4' : 'image/jpeg'),
                sizeBytes: ev.sizeBytes || 0,
                originalName: ev.originalName || ev.fileName || 'evidence',
                uploadedAt: ev.uploadedAt || new Date(),
              };
            })
            .filter((ev) => Boolean(ev.url));

          const complaintDoc = await Complaint.create({
            complaintId,
            trackingToken,
            title: title.trim(),
            description: description.trim(),
            category: catDoc._id,
            subcategory: subcategory?.trim() || '',
            department: deptDoc._id,
            ward: wardDoc._id,
            citizen: null,
            citizenContact: {
              name: isAnonymous ? 'Anonymous Citizen' : (citizenName?.trim() || 'Citizen'),
              phone: isAnonymous ? '' : (citizenPhone?.trim() || ''),
              email: isAnonymous ? '' : (citizenEmail?.trim() || ''),
            },
            location: {
              address: address.trim(),
              landmark: landmark?.trim() || '',
              geo: {
                type: 'Point',
                coordinates: [lng, lat],
              },
              latitude: lat,
              longitude: lng,
            },
            priority: priority || catDoc.priority || 'MEDIUM',
            status: COMPLAINT_STATUS.SUBMITTED,
            evidence: normalizedEvidence,
            slaHours,
            slaDeadline,
            isPublic: !isSensitive,
            isAnonymous: Boolean(isAnonymous),
            isSensitive: Boolean(isSensitive),
            timeline: [
              {
                status: COMPLAINT_STATUS.SUBMITTED,
                title: 'Complaint Registered',
                description: 'Logged via Pune Civic Platform public intake.',
                performedBy: isAnonymous ? 'Citizen (Anonymous)' : (citizenName?.trim() || 'Citizen'),
                timestamp: new Date(),
              },
            ],
          });

          // Create ComplaintHistory record
          await ComplaintHistory.create({
            complaint: complaintDoc._id,
            trackingToken,
            actor: null,
            actorName: isAnonymous ? 'Anonymous Citizen' : (citizenName?.trim() || 'Citizen'),
            actorRole: 'PUBLIC',
            action: 'CREATED',
            previousStatus: null,
            newStatus: COMPLAINT_STATUS.SUBMITTED,
            remarks: 'Complaint registered by citizen.',
            internalOnly: false,
            timestamp: new Date(),
          });

          // Create AuditLog record
          await AuditLog.create({
            user: null,
            userName: isAnonymous ? 'Anonymous Citizen' : (citizenName?.trim() || 'Citizen'),
            userRole: 'PUBLIC',
            action: 'CREATE_COMPLAINT',
            entityType: 'COMPLAINT',
            entityId: complaintId,
            details: {
              trackingToken,
              category: catDoc.name,
              ward: wardDoc.name,
              priority,
            },
            ipAddress: ip,
            userAgent,
            timestamp: new Date(),
          });

          return NextResponse.json({
            success: true,
            source: 'database',
            message: 'Complaint submitted successfully and indexed for tracking.',
            complaint: {
              _id: complaintDoc._id.toString(),
              complaintId: complaintDoc.complaintId,
              trackingToken: complaintDoc.trackingToken,
              title: complaintDoc.title,
              status: complaintDoc.status,
              priority: complaintDoc.priority,
              departmentName: deptDoc.name,
              wardName: wardDoc.name,
              wardNumber: wardDoc.wardNumber,
              slaDeadline,
              trackingUrl: `/track?token=${trackingToken}`,
            },
          }, { status: 201 });
        }
      } catch (dbErr) {
        console.error('Database complaint creation error:', dbErr);
      }
    }

    // Demo Mode Response
    return NextResponse.json({
      success: true,
      source: 'demo_data',
      message: 'Complaint registered successfully.',
      complaint: {
        _id: `comp_${Date.now()}`,
        complaintId,
        trackingToken,
        title: title.trim(),
        description: description.trim(),
        categoryCode,
        subcategory,
        wardNumber,
        departmentName: 'Roads & Infrastructure',
        wardName: `Ward ${wardNumber}`,
        status: COMPLAINT_STATUS.SUBMITTED,
        priority: priority || 'MEDIUM',
        evidence: evidence || [],
        slaDeadline,
        trackingUrl: `/track?token=${trackingToken}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create complaint error:', error);
    return NextResponse.json({ error: 'Failed to process complaint submission.' }, { status: 500 });
  }
}
