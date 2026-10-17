import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Manual assignment endpoint is disabled. Operations assignment is handled via internal administrative workflows.',
    },
    { status: 403 }
  );
}
