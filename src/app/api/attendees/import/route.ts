import { NextRequest, NextResponse } from 'next/server';
import { addAttendees, initializeDatabase } from '@/lib/db-server';
import { parseCSV } from '@/lib/csv-parser';

export async function POST(request: NextRequest) {
  try {
    // Ensure table exists
    await initializeDatabase();

    const body = await request.json();
    const { csvContent } = body;

    if (!csvContent) {
      return NextResponse.json(
        { error: 'CSV content required' },
        { status: 400 }
      );
    }

    const parseResult = parseCSV(csvContent);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        errors: parseResult.errors,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
      });
    }

    const insertedCount = await addAttendees(parseResult.attendees);

    return NextResponse.json({
      success: true,
      insertedCount,
      totalRows: parseResult.totalRows,
      validRows: parseResult.validRows,
      errors: parseResult.errors,
    });
  } catch (error) {
    console.error('Import failed:', error);
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    );
  }
}
