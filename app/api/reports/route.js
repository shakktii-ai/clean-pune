import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import Category from '@/models/Category';
import Department from '@/models/Department';
import Ward from '@/models/Ward';
import { PLATFORM_METRICS_DEMO, DEMO_COMPLAINTS } from '@/lib/demoData';

/**
 * Sanitizes a cell string against CSV Formula Injection.
 * Prefixes sensitive formula trigger characters (=, +, -, @, \t, \r) with a single quote '.
 */
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // Formula injection prevention
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes and enclose in quotes
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); // 'csv' or 'json'
    const statusParam = searchParams.get('status');
    const wardParam = searchParams.get('ward');
    const categoryParam = searchParams.get('category');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const hasDb = await isMongoAvailable();

    if (hasDb) {
      try {
        await connectToDatabase();
        const filter = {};

        if (statusParam && statusParam !== 'ALL') {
          filter.status = statusParam;
        }
        if (categoryParam && categoryParam !== 'ALL') {
          filter.category = categoryParam;
        }
        if (wardParam && wardParam !== 'ALL') {
          filter.ward = wardParam;
        }
        if (startDateParam || endDateParam) {
          filter.createdAt = {};
          if (startDateParam) filter.createdAt.$gte = new Date(startDateParam);
          if (endDateParam) filter.createdAt.$lte = new Date(endDateParam);
        }

        // If CSV format requested
        if (format === 'csv') {
          const complaints = await Complaint.find(filter)
            .populate('category', 'name code')
            .populate('department', 'name code')
            .populate('ward', 'wardNumber name zone')
            .sort({ createdAt: -1 })
            .limit(500);

          const headers = [
            'Complaint ID',
            'Tracking Token',
            'Title',
            'Category',
            'Department',
            'Ward Number',
            'Ward Name',
            'Status',
            'Priority',
            'Address',
            'Landmark',
            'Latitude',
            'Longitude',
            'Date Reported',
            'SLA Hours',
            'Resolved At',
          ];

          const rows = complaints.map((c) => [
            sanitizeCsvCell(c.complaintId),
            sanitizeCsvCell(c.trackingToken),
            sanitizeCsvCell(c.title),
            sanitizeCsvCell(c.category?.name || ''),
            sanitizeCsvCell(c.department?.name || ''),
            sanitizeCsvCell(c.ward?.wardNumber || ''),
            sanitizeCsvCell(c.ward?.name || ''),
            sanitizeCsvCell(c.status),
            sanitizeCsvCell(c.priority),
            sanitizeCsvCell(c.location?.address || ''),
            sanitizeCsvCell(c.location?.landmark || ''),
            sanitizeCsvCell(c.location?.latitude || ''),
            sanitizeCsvCell(c.location?.longitude || ''),
            sanitizeCsvCell(c.createdAt ? new Date(c.createdAt).toISOString() : ''),
            sanitizeCsvCell(c.slaHours || 48),
            sanitizeCsvCell(c.resolvedAt ? new Date(c.resolvedAt).toISOString() : ''),
          ]);

          const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

          return new NextResponse(csvContent, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="pune-civic-report-${Date.now()}.csv"`,
            },
          });
        }

        // Aggregate statistics for JSON reports
        const [
          totalComplaints,
          statusAggregations,
          categoryAggregations,
          wardAggregations,
          overdueCount,
        ] = await Promise.all([
          Complaint.countDocuments(filter),
          Complaint.aggregate([
            { $match: filter },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
          Complaint.aggregate([
            { $match: filter },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryDoc' } },
            { $unwind: '$categoryDoc' },
            { $project: { name: '$categoryDoc.name', code: '$categoryDoc.code', count: 1 } },
          ]),
          Complaint.aggregate([
            { $match: filter },
            { $group: { _id: '$ward', count: { $sum: 1 } } },
            { $lookup: { from: 'wards', localField: '_id', foreignField: '_id', as: 'wardDoc' } },
            { $unwind: '$wardDoc' },
            { $project: { wardNumber: '$wardDoc.wardNumber', name: '$wardDoc.name', count: 1 } },
          ]),
          Complaint.countDocuments({
            ...filter,
            status: { $nin: ['RESOLVED', 'REJECTED', 'CANCELLED'] },
            slaDeadline: { $lt: new Date() },
          }),
        ]);

        const statusMap = {};
        statusAggregations.forEach((item) => {
          statusMap[item._id] = item.count;
        });

        return NextResponse.json({
          success: true,
          source: 'database',
          metrics: {
            total: totalComplaints,
            submitted: statusMap.SUBMITTED || 0,
            underReview: statusMap.UNDER_REVIEW || 0,
            verified: statusMap.VERIFIED || 0,
            rejected: statusMap.REJECTED || 0,
            assigned: statusMap.ASSIGNED || 0,
            inProgress: statusMap.IN_PROGRESS || 0,
            onHold: statusMap.ON_HOLD || 0,
            resolutionSubmitted: statusMap.RESOLUTION_SUBMITTED || 0,
            underVerification: statusMap.UNDER_VERIFICATION || 0,
            resolved: statusMap.RESOLVED || 0,
            reopened: statusMap.REOPENED || 0,
            cancelled: statusMap.CANCELLED || 0,
            overdue: overdueCount,
          },
          categoryBreakdown: categoryAggregations,
          wardBreakdown: wardAggregations,
        });
      } catch (dbErr) {
        console.error('Report DB aggregation error:', dbErr);
      }
    }

    // Demo Mode Response
    if (format === 'csv') {
      const headers = ['Complaint ID', 'Title', 'Category', 'Ward', 'Status', 'Priority', 'Address'];
      const rows = DEMO_COMPLAINTS.map((c) => [
        sanitizeCsvCell(c.complaintId),
        sanitizeCsvCell(c.title),
        sanitizeCsvCell(c.categoryName),
        sanitizeCsvCell(`Ward ${c.wardNumber}`),
        sanitizeCsvCell(c.status),
        sanitizeCsvCell(c.priority),
        sanitizeCsvCell(c.location.address),
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pune-civic-demo-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      source: 'demo_data',
      isDemoData: true,
      metrics: {
        total: PLATFORM_METRICS_DEMO.totalComplaints,
        submitted: 52,
        underReview: 14,
        verified: 28,
        rejected: 6,
        assigned: 45,
        inProgress: PLATFORM_METRICS_DEMO.inProgressComplaints,
        onHold: 8,
        resolutionSubmitted: 12,
        underVerification: 15,
        resolved: PLATFORM_METRICS_DEMO.resolvedComplaints,
        reopened: 9,
        cancelled: 4,
        overdue: 11,
      },
    });
  } catch (error) {
    console.error('Report GET error:', error);
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }
}
