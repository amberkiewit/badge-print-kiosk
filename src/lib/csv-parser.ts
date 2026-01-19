import { z } from 'zod';

const AttendeeRowSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  meal_preference: z.string().optional().default(''),
});

export type AttendeeRow = z.infer<typeof AttendeeRowSchema>;

// Map common CSV column name variations to our expected fields
const COLUMN_MAPPINGS: Record<string, string> = {
  // First name variations
  'firstname': 'first_name',
  'first name': 'first_name',
  'first': 'first_name',
  'fname': 'first_name',
  'given name': 'first_name',
  
  // Last name variations
  'lastname': 'last_name',
  'last name': 'last_name',
  'last': 'last_name',
  'lname': 'last_name',
  'surname': 'last_name',
  'family name': 'last_name',
  
  // Meal preference variations
  'meal_preference': 'meal_preference',
  'meal preference': 'meal_preference',
  'meal': 'meal_preference',
  'dietary': 'meal_preference',
  'dietary preference': 'meal_preference',
  'dietary_preference': 'meal_preference',
  'diet': 'meal_preference',
  'food preference': 'meal_preference',
  'food_preference': 'meal_preference',
};

function normalizeColumnName(col: string): string {
  const normalized = col.toLowerCase().trim();
  return COLUMN_MAPPINGS[normalized] || normalized;
}

// Simple CSV parser that works in the browser
function parseCSVString(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(normalizeColumnName);

  // Parse rows
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    records.push(record);
  }

  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

export interface ParseResult {
  success: boolean;
  attendees: AttendeeRow[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export function parseCSV(csvContent: string): ParseResult {
  const errors: string[] = [];
  const attendees: AttendeeRow[] = [];

  try {
    const records = parseCSVString(csvContent);

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // +2 because of header row and 1-based indexing

      try {
        // Clean up values - remove BOM, trim whitespace, normalize
        const cleanString = (s: string) => s?.replace(/[\ufeff\u200b\u00a0]/g, '').trim() || '';
        
        const validated = AttendeeRowSchema.parse({
          first_name: cleanString(row.first_name),
          last_name: cleanString(row.last_name),
          meal_preference: cleanString(row.meal_preference),
        });
        attendees.push(validated);
      } catch (e) {
        if (e instanceof z.ZodError) {
          const issues = e.issues.map((issue) => issue.message).join(', ');
          errors.push(`Row ${rowNum}: ${issues}`);
        }
      }
    }

    return {
      success: attendees.length > 0,
      attendees,
      errors,
      totalRows: records.length,
      validRows: attendees.length,
    };
  } catch (e) {
    return {
      success: false,
      attendees: [],
      errors: [`Failed to parse CSV: ${e instanceof Error ? e.message : 'Unknown error'}`],
      totalRows: 0,
      validRows: 0,
    };
  }
}
