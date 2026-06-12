import fs from 'fs';
import path from 'path';

/**
 * Shared CSV parser utility.
 * Supports quoted fields and custom delimiters.
 */
export function parseCSV(filePath: string, delimiter = ','): Record<string, string | null>[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(delimiter).map(h => h.trim());
  const rows: Record<string, string | null>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let insideQuote = false;
    let current = '';

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === delimiter && !insideQuote) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string | null> = {};
    headers.forEach((header, idx) => {
      let val = values[idx];
      if (val !== undefined) val = val.replace(/^"|"$/g, '').trim();
      row[header] = val || null;
    });
    rows.push(row);
  }

  return rows;
}

/** Convert empty/undefined to null */
export const toNull = (val: string | null | undefined): string | null =>
  val === '' || val === undefined ? null : val;
