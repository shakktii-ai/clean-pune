import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Department from '@/models/Department';
import { DEMO_DEPARTMENTS } from '@/lib/demoData';

export async function GET() {
  try {
    const hasDb = await isMongoAvailable();
    if (hasDb) {
      try {
        await connectToDatabase();
        const departments = await Department.find({ isActive: true });
        if (departments && departments.length > 0) {
          return NextResponse.json({ success: true, departments });
        }
      } catch (err) {
        console.error('DB fetch departments fallback');
      }
    }

    return NextResponse.json({
      success: true,
      isDemoData: true,
      departments: DEMO_DEPARTMENTS,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}
