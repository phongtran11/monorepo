/**
 * Formats a numeric amount into a localized currency string.
 *
 * @param amount - The numeric amount to format.
 * @param currency - ISO 4217 currency code (default: `'VND'`).
 * @param locale - BCP 47 locale string (default: `'vi-VN'`).
 * @returns A formatted currency string.
 */
export function formatCurrency(
  amount: number,
  currency = 'VND',
  locale = 'vi-VN',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a numeric amount as Vietnamese Dong (₫).
 *
 * @param amount - The numeric amount to format.
 * @returns A formatted VND currency string (e.g. `"250.000 ₫"`).
 */
export function formatVND(amount: number): string {
  return formatCurrency(amount);
}
