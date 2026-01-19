import { NextResponse } from 'next/server';
import { clearAllAttendees } from '@/lib/db-server';

export async function DELETE() {
  try {
    await clearAllAttendees();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear attendees:', error);
    return NextResponse.json(
      { error: 'Failed to clear attendees' },
      { status: 500 }
    );
  }
}
