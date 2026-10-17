import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    notifications: [],
    unreadCount: 0,
  });
}

export async function PATCH() {
  return NextResponse.json({
    success: true,
    message: 'Notification state updated.',
  });
}
