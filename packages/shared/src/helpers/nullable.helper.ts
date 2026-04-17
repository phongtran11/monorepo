/**
 * Normalizes an optional/nullable field value for create and update payloads
 * where the backend distinguishes three states:
 *
 * - `undefined` → field absent from payload → backend leaves the field unchanged
 * - `null`      → explicit clear signal     → backend sets the field to null
 * - `T`         → new value                 → backend sets the field to that value
 *
 * Without this, using `value || null` collapses `undefined` into `null`,
 * causing the backend to clear fields the user never touched.
 *
 * @param value - The raw field value from the form (string | null | undefined).
 * @returns `undefined` if the field was never set, `null` if it should be cleared,
 *          or the original value if it should be updated.
 *
 * @example
 * toNullableField(undefined)   // → undefined  (omitted from JSON, backend skips it)
 * toNullableField(null)        // → null       (backend clears the field)
 * toNullableField('')          // → null       (treated as an explicit clear)
 * toNullableField('some-uuid') // → 'some-uuid'
 */
export function toNullableField<T>(
  value: T | null | undefined,
): T | null | undefined {
  if (value === undefined) return undefined;
  return value || null;
}
