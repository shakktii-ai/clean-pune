import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import { DEMO_COMPLAINTS } from '@/lib/demoData';

import { PUNE_BOUNDS, isWithinPune } from '@/lib/geoBounds';

export { PUNE_BOUNDS, isWithinPune };

/**
 * Deterministic geographic privacy snapping (approx. 100-150m)
 * used for public reports where anonymous or privacy protection is enabled.
 */
function applyGeoPrivacy(lat, lng, complaintId) {
  let hash = 0;
  for (let i = 0; i < complaintId.length; i++) {
    hash = (hash << 5) - hash + complaintId.charCodeAt(i);
    hash |= 0;
  }
  const offsetLat = ((hash % 100) / 100 - 0.5) * 0.0015;
  const offsetLng = (((hash >> 8) % 100) / 100 - 0.5) * 0.0015;

  const fuzzedLat = Number((lat + offsetLat).toFixed(5));
  const fuzzedLng = Number((lng + offsetLng).toFixed(5));

  // Ensure fuzzed coordinates stay strictly within Pune boundaries
  return {
    latitude: Math.min(Math.max(fuzzedLat, PUNE_BOUNDS.minLat), PUNE_BOUNDS.maxLat),
    longitude: Math.min(Math.max(fuzzedLng, PUNE_BOUNDS.minLng), PUNE_BOUNDS.maxLng),
    isFuzzed: true,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const wardParam = searchParams.get('ward');
    const timeRange = searchParams.get('timeRange'); // '7d', '30d', 'all'

    const hasDb = await isMongoAvailable();
    if (hasDb) {
      try {
        await connectToDatabase();

        // Strictly enforce public visibility and Pune geographical bounds at the database query level
        const filter = {
          isPublic: true,
          isSensitive: { $ne: true },
          'location.latitude': {
            $exists: true,
            $ne: null,
            $gte: PUNE_BOUNDS.minLat,
            $lte: PUNE_BOUNDS.maxLat,
          },
          'location.longitude': {
            $exists: true,
            $ne: null,
            $gte: PUNE_BOUNDS.minLng,
            $lte: PUNE_BOUNDS.maxLng,
          },
        };

        if (statusParam && statusParam !== 'ALL') {
          filter.status = statusParam;
        }
        if (categoryParam && categoryParam !== 'ALL') {
          filter.category = categoryParam;
        }
        if (priorityParam && priorityParam !== 'ALL') {
          filter.priority = priorityParam;
        }
        if (wardParam && wardParam !== 'ALL') {
          filter.ward = wardParam;
        }

        if (timeRange && timeRange !== 'all') {
          const days = timeRange === '7d' ? 7 : 30;
          const dateCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          filter.createdAt = { $gte: dateCutoff };
        }

        const complaints = await Complaint.find(filter)
          .populate('category', 'name code slaHours')
          .populate('department', 'name code')
          .populate('ward', 'name wardNumber')
          .select(
            'complaintId title description category department ward location priority status evidence beforePhotos afterPhotos slaDeadline createdAt isAnonymous isSensitive isPublic'
          )
          .limit(200)
          .lean();

        const safeMapPoints = complaints
          .filter((c) => {
            const lat = c.location?.latitude || (c.location?.geo?.coordinates ? c.location.geo.coordinates[1] : null);
            const lng = c.location?.longitude || (c.location?.geo?.coordinates ? c.location.geo.coordinates[0] : null);
            return isWithinPune(lat, lng);
          })
          .map((c) => {
            const rawLat = c.location?.latitude || (c.location?.geo?.coordinates ? c.location.geo.coordinates[1] : 18.5204);
            const rawLng = c.location?.longitude || (c.location?.geo?.coordinates ? c.location.geo.coordinates[0] : 73.8567);

            const needsFuzzing = c.isAnonymous;
            const geo = needsFuzzing ? applyGeoPrivacy(rawLat, rawLng, c.complaintId) : { latitude: rawLat, longitude: rawLng, isFuzzed: false };

            // Gather all non-sensitive evidence photos
            const evidenceUrls = Array.isArray(c.evidence)
              ? c.evidence.map((e) => (typeof e === 'string' ? e : e?.url)).filter(Boolean)
              : [];
            const beforeList = Array.isArray(c.beforePhotos) ? c.beforePhotos.filter(Boolean) : [];
            const afterList = Array.isArray(c.afterPhotos) ? c.afterPhotos.filter(Boolean) : [];
            const allPhotos = [...new Set([...evidenceUrls, ...beforeList, ...afterList])];
            const thumbnail = allPhotos[0] || null;

            return {
              id: c._id.toString(),
              complaintId: c.complaintId,
              title: c.title,
              description: c.description || '',
              category: c.category?.name || 'General Civic Issue',
              department: c.department?.name || 'Municipal Works',
              ward: c.ward?.name || (c.ward?.wardNumber ? `Ward ${c.ward.wardNumber}` : 'Pune'),
              priority: c.priority,
              status: c.status,
              latitude: geo.latitude,
              longitude: geo.longitude,
              address: c.location?.address || 'Pune, Maharashtra',
              landmark: c.location?.landmark || '',
              thumbnail,
              photos: allPhotos,
              slaDeadline: c.slaDeadline,
              createdAt: c.createdAt,
              isFuzzed: geo.isFuzzed,
            };
          });

        return NextResponse.json({
          success: true,
          source: 'database',
          boundedToPune: true,
          bounds: PUNE_BOUNDS,
          count: safeMapPoints.length,
          complaints: safeMapPoints,
        });
      } catch (dbErr) {
        console.error('Map complaints DB query error:', dbErr);
      }
    }

    // Demo Data Fallback with Pune Coordinate Validation
    const demoSafe = DEMO_COMPLAINTS
      .filter((c) => {
        const lat = c.location?.latitude;
        const lng = c.location?.longitude;
        return isWithinPune(lat, lng);
      })
      .map((c) => {
        const photos = c.images && Array.isArray(c.images) ? c.images : [];
        return {
          id: c.complaintId,
          complaintId: c.complaintId,
          title: c.title,
          description: c.description || '',
          category: c.categoryName || c.categoryCode || c.category || 'General Civic Issue',
          department: c.departmentName || c.departmentCode || c.department || 'Municipal Works',
          ward: c.wardName || (c.wardNumber ? `Ward ${c.wardNumber}` : (c.ward || 'Pune')),
          priority: c.priority,
          status: c.status,
          latitude: c.location?.latitude || 18.5204,
          longitude: c.location?.longitude || 73.8567,
          address: c.location?.address || 'Pune, Maharashtra',
          landmark: c.location?.landmark || '',
          thumbnail: photos[0] || null,
          photos,
          slaDeadline: c.slaDeadline,
          createdAt: c.createdAt,
          isFuzzed: false,
        };
      });

    return NextResponse.json({
      success: true,
      source: 'demo_data',
      isDemoData: true,
      boundedToPune: true,
      bounds: PUNE_BOUNDS,
      count: demoSafe.length,
      complaints: demoSafe,
    });
  } catch (error) {
    console.error('Map complaints error:', error);
    return NextResponse.json({ error: 'Failed to retrieve map complaints' }, { status: 500 });
  }
}
