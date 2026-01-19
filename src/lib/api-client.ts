// Client-side API functions that call the server endpoints

export interface Attendee {
  id: number;
  first_name: string;
  last_name: string;
  meal_preference: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

export async function searchAttendees(query: string): Promise<Attendee[]> {
  const response = await fetch(`/api/attendees/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data.attendees || [];
}

export async function checkInAttendee(id: number): Promise<{ 
  success: boolean; 
  alreadyCheckedIn?: boolean; 
  attendee?: Attendee;
  message?: string;
}> {
  const response = await fetch('/api/attendees/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return response.json();
}

export async function importCSV(csvContent: string): Promise<{
  success: boolean;
  insertedCount?: number;
  totalRows?: number;
  validRows?: number;
  errors?: string[];
}> {
  const response = await fetch('/api/attendees/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvContent }),
  });
  return response.json();
}

export async function getStats(): Promise<{ total: number; checkedIn: number }> {
  const response = await fetch('/api/attendees/stats');
  return response.json();
}

export async function clearAllAttendees(): Promise<{ success: boolean }> {
  const response = await fetch('/api/attendees/clear', {
    method: 'DELETE',
  });
  return response.json();
}
