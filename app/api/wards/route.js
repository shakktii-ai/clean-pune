import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Ward from '@/models/Ward';
import { DEMO_WARDS } from '@/lib/demoData';

export async function GET() {
  try {
    const hasDb = await isMongoAvailable();
    if (hasDb) {
      try {
        await connectToDatabase();
        const wards = await Ward.find({ isActive: true }).sort({ wardNumber: 1 });
        if (wards && wards.length > 0) {
          return NextResponse.json({ success: true, wards });
        }
      } catch (err) {
        console.error('DB fetch wards fallback');
      }
    }

    return NextResponse.json({
      success: true,
      isDemoData: true,
      wards: DEMO_WARDS,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wards' }, { status: 500 });
  }
}
