import { NextRequest, NextResponse } from 'next/server';
import { searchAttendees } from '@/lib/db-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ attendees: [] });
    }

    const attendees = await searchAttendees(query);
    return NextResponse.json({ attendees });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
