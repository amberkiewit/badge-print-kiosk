import { NextResponse } from 'next/server';
import { getStats, initializeDatabase } from '@/lib/db-server';

export async function GET() {
  try {
    // Ensure table exists
    await initializeDatabase();
    
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
