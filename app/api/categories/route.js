import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import Category from '@/models/Category';
import { DEMO_CATEGORIES } from '@/lib/demoData';

export async function GET() {
  try {
    const hasDb = await isMongoAvailable();
    if (hasDb) {
      try {
        await connectToDatabase();
        const categories = await Category.find({ isActive: true }).populate('department');
        if (categories && categories.length > 0) {
          return NextResponse.json({ success: true, categories });
        }
      } catch (err) {
        console.error('DB fetch categories fallback');
      }
    }

    return NextResponse.json({
      success: true,
      isDemoData: true,
      categories: DEMO_CATEGORIES,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
