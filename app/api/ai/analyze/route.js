import { NextResponse } from 'next/server';
import { analyzeComplaintIntelligence, detectDuplicateCandidates } from '@/services/aiIntelligenceService';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import AuditLog from '@/models/AuditLog';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`ai_${ip}`, 60); // 60 AI queries per minute
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'AI advisor query rate limit exceeded. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { title = '', description = '', text = '', wardNumber = null, language = 'en' } = body;
    const finalDescription = description || text;

    if (!finalDescription && !title) {
      return NextResponse.json(
        { error: 'Please provide a title or description to analyze.' },
        { status: 400 }
      );
    }

    // 1. Run AI / NLP Analysis
    const analysis = await analyzeComplaintIntelligence({ title, description: finalDescription, language });

    // 2. Duplicate Detection against recent complaints
    let duplicateCandidates = [];
    const hasDb = await isMongoAvailable();
    if (hasDb) {
      try {
        await connectToDatabase();
        const recentComplaints = await Complaint.find({
          status: { $nin: ['RESOLVED', 'CANCELLED'] },
        })
          .select('complaintId title description ward location status createdAt')
          .limit(50)
          .lean();

        duplicateCandidates = detectDuplicateCandidates(
          { title, description, wardNumber },
          recentComplaints
        );
      } catch (dbErr) {
        console.warn('Duplicate detection DB query error:', dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      duplicateCandidates,
      disclaimer:
        'All AI outputs are strictly ADVISORY. Final categorization, priority, and operational decisions are made by authorized municipal coordinators.',
    });
  } catch (error) {
    console.error('AI analysis route error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI advisory analysis' },
      { status: 500 }
    );
  }
}
