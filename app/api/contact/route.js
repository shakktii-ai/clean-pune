import { NextResponse } from 'next/server';
import { connectToDatabase, isMongoAvailable } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`contact_${ip}`, 30);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many inquiries submitted. Please wait.' }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, phone = '', subject, category = 'TECHNICAL', message } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Your name is required.' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }
    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Inquiry subject is required.' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    const ticketId = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const hasDb = await isMongoAvailable();
    if (hasDb) {
      try {
        await connectToDatabase();
        const ticketDoc = await SupportTicket.create({
          ticketId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim(),
          category,
          message: message.trim(),
          status: 'OPEN',
          ipAddress: ip,
        });

        return NextResponse.json(
          {
            success: true,
            message: 'Your inquiry has been received. Our support team will reply within 24 hours.',
            ticketId: ticketDoc.ticketId,
          },
          { status: 201 }
        );
      } catch (dbErr) {
        console.error('Support ticket DB error:', dbErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        source: 'demo_data',
        message: 'Inquiry logged in demo mode.',
        ticketId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Support ticket error:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
