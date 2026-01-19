import type { Database as DatabaseType } from 'sql.js';

let db: DatabaseType | null = null;
let initPromise: Promise<DatabaseType> | null = null;

export async function getDatabase(): Promise<DatabaseType> {
  if (db) return db;
  
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const initSqlJs = (await import('sql.js')).default;
    
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });

    db = new SQL.Database();

    // Create attendees table
    db.run(`
      CREATE TABLE IF NOT EXISTS attendees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        meal_preference TEXT,
        checked_in INTEGER DEFAULT 0,
        checked_in_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return db;
  })();

  return initPromise;
}

export interface Attendee {
  id: number;
  first_name: string;
  last_name: string;
  meal_preference: string;
  checked_in: number;
  checked_in_at: string | null;
  created_at: string;
}

export async function addAttendees(attendees: Omit<Attendee, 'id' | 'checked_in' | 'checked_in_at' | 'created_at'>[]): Promise<number> {
  const database = await getDatabase();
  let count = 0;

  for (const attendee of attendees) {
    try {
      database.run(
        `INSERT INTO attendees (first_name, last_name, meal_preference)
         VALUES (?, ?, ?)`,
        [
          attendee.first_name,
          attendee.last_name,
          attendee.meal_preference || '',
        ]
      );
      count++;
    } catch (e) {
      console.error('Error inserting attendee:', e);
    }
  }

  return count;
}

export async function searchAttendees(query: string): Promise<Attendee[]> {
  const database = await getDatabase();
  const searchTerm = `%${query}%`;

  const results = database.exec(
    `SELECT * FROM attendees 
     WHERE first_name LIKE ? 
        OR last_name LIKE ?
     ORDER BY last_name, first_name
     LIMIT 50`,
    [searchTerm, searchTerm]
  );

  if (!results.length) return [];

  const columns = results[0].columns;
  return results[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as Attendee;
  });
}

export async function getAttendeeById(id: number): Promise<Attendee | null> {
  const database = await getDatabase();

  const results = database.exec(
    `SELECT * FROM attendees WHERE id = ?`,
    [id]
  );

  if (!results.length || !results[0].values.length) return null;

  const columns = results[0].columns;
  const row = results[0].values[0];
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return obj as Attendee;
}

export async function checkInAttendee(id: number): Promise<void> {
  const database = await getDatabase();
  database.run(
    `UPDATE attendees SET checked_in = 1, checked_in_at = datetime('now') WHERE id = ?`,
    [id]
  );
}

export async function getStats(): Promise<{ total: number; checkedIn: number }> {
  const database = await getDatabase();

  const totalResult = database.exec(`SELECT COUNT(*) FROM attendees`);
  const checkedInResult = database.exec(`SELECT COUNT(*) FROM attendees WHERE checked_in = 1`);

  return {
    total: (totalResult[0]?.values[0]?.[0] as number) || 0,
    checkedIn: (checkedInResult[0]?.values[0]?.[0] as number) || 0,
  };
}

export async function clearAllAttendees(): Promise<void> {
  const database = await getDatabase();
  database.run(`DELETE FROM attendees`);
}
