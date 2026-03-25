/**
 * Returns the first character of a string, uppercased.
 * Useful for avatar fallback initials.
 */
export function getInitials(value: string): string {
  return value.charAt(0).toUpperCase();
}
