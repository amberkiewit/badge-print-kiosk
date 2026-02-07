import { sql } from '@vercel/postgres';

export interface Attendee {
  id: number;
  first_name: string;
  last_name: string;
  meal_preference: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

// Initialize the database table
export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS attendees (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      meal_preference TEXT DEFAULT '',
      checked_in BOOLEAN DEFAULT FALSE,
      checked_in_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// Add attendees from CSV import
export async function addAttendees(
  attendees: { first_name: string; last_name: string; meal_preference: string }[]
): Promise<number> {
  let count = 0;

  for (const attendee of attendees) {
    try {
      await sql`
        INSERT INTO attendees (first_name, last_name, meal_preference)
        VALUES (${attendee.first_name}, ${attendee.last_name}, ${attendee.meal_preference || ''})
      `;
      count++;
    } catch (e) {
      console.error('Error inserting attendee:', e);
    }
  }

  return count;
}

// Search attendees by name
export async function searchAttendees(query: string): Promise<Attendee[]> {
  const searchTerm = `%${query}%`;

  const result = await sql`
    SELECT * FROM attendees 
    WHERE first_name ILIKE ${searchTerm}
       OR last_name ILIKE ${searchTerm}
    ORDER BY last_name, first_name
    LIMIT 50
  `;

  return result.rows as Attendee[];
}

// Get attendee by ID
export async function getAttendeeById(id: number): Promise<Attendee | null> {
  const result = await sql`
    SELECT * FROM attendees WHERE id = ${id}
  `;

  return (result.rows[0] as Attendee) || null;
}

// Check in an attendee
export async function checkInAttendee(id: number): Promise<{ success: boolean; alreadyCheckedIn: boolean }> {
  // First check if already checked in
  const existing = await sql`SELECT checked_in FROM attendees WHERE id = ${id}`;
  
  if (existing.rows.length === 0) {
    return { success: false, alreadyCheckedIn: false };
  }

  if (existing.rows[0].checked_in) {
    return { success: false, alreadyCheckedIn: true };
  }

  // Check in the attendee
  await sql`
    UPDATE attendees 
    SET checked_in = TRUE, checked_in_at = CURRENT_TIMESTAMP 
    WHERE id = ${id}
  `;

  return { success: true, alreadyCheckedIn: false };
}

// Undo check-in for an attendee
export async function undoCheckIn(id: number): Promise<{ success: boolean }> {
  const result = await sql`
    UPDATE attendees
    SET checked_in = FALSE, checked_in_at = NULL
    WHERE id = ${id}
  `;
  return { success: (result.rowCount ?? 0) > 0 };
}

// Get statistics
export async function getStats(): Promise<{ total: number; checkedIn: number }> {
  const totalResult = await sql`SELECT COUNT(*) as count FROM attendees`;
  const checkedInResult = await sql`SELECT COUNT(*) as count FROM attendees WHERE checked_in = TRUE`;

  return {
    total: parseInt(totalResult.rows[0].count) || 0,
    checkedIn: parseInt(checkedInResult.rows[0].count) || 0,
  };
}

// Clear all attendees
export async function clearAllAttendees(): Promise<void> {
  await sql`DELETE FROM attendees`;
}
