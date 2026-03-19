/**
 * Returns the current year-month as a string in `YYYY-MM` format.
 * Useful for grouping uploads or records into monthly batches.
 *
 * @param date - Optional date to format. Defaults to the current date.
 * @returns A string in `YYYY-MM` format, e.g. `"2026-03"`.
 */
export function formatYearMonth(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7);
}
