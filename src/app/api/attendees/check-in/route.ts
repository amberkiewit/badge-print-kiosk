import { NextRequest, NextResponse } from 'next/server';
import { checkInAttendee, getAttendeeById } from '@/lib/db-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Attendee ID required' },
        { status: 400 }
      );
    }

    const result = await checkInAttendee(id);

    if (result.alreadyCheckedIn) {
      const attendee = await getAttendeeById(id);
      return NextResponse.json({
        success: false,
        alreadyCheckedIn: true,
        attendee,
        message: 'This person has already checked in'
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Attendee not found' },
        { status: 404 }
      );
    }

    const attendee = await getAttendeeById(id);
    return NextResponse.json({ success: true, attendee });
  } catch (error) {
    console.error('Check-in failed:', error);
    return NextResponse.json(
      { error: 'Check-in failed' },
      { status: 500 }
    );
  }
}
