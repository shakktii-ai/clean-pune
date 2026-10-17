import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';

export async function GET() {
  try {
    await connectToDatabase();

    let config = await SystemConfig.findOne({ key: 'GLOBAL_PLATFORM_CONFIG' });
    if (!config) {
      config = await SystemConfig.create({ key: 'GLOBAL_PLATFORM_CONFIG' });
    }

    return NextResponse.json({
      success: true,
      config: {
        platformName: config.platformName,
        organizationName: config.organizationName,
        supportEmail: config.supportEmail,
        supportPhone: config.supportPhone,
        defaultLanguage: config.defaultLanguage,
        featureFlags: config.featureFlags,
      },
    });
  } catch (error) {
    console.error('SystemConfig GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve system configuration' },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Forbidden: Platform configuration modification is restricted to internal operational deployments.' },
    { status: 403 }
  );
}
