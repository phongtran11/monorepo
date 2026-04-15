'use client';

import { cn } from '@admin/lib/utils';
import { formatVND } from '@lam-thinh-ecommerce/shared';
import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Strips the currency symbol from `formatVND` output and returns just the
 * numeric display string (e.g. "250.000 ₫" → "250.000").
 */
function toDisplayString(num: number): string {
  return formatVND(num)
    .replace(/\s*₫\s*$/, '')
    .trim();
}

/**
 * Parses a display string back to a number by stripping all non-digit chars.
 * Returns `null` for empty input.
 */
function parseDisplay(display: string): number | null {
  const digits = display.replace(/\D/g, '');
  if (!digits) return null;
  const num = parseInt(digits, 10);
  return isNaN(num) ? null : num;
}

/**
 * Given a formatted string and a target digit count, returns the character
 * index in the string right after the `targetDigits`-th digit.
 * Falls back to `string.length` if there aren't enough digits.
 */
function cursorPosFromDigitCount(
  formatted: string,
  targetDigits: number,
): number {
  if (targetDigits === 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++;
      if (seen === targetDigits) return i + 1;
    }
  }
  return formatted.length;
}

export interface CurrencyInputProps extends Omit<
  React.ComponentProps<'input'>,
  'value' | 'onChange' | 'type'
> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
}

/**
 * A controlled input for currency amounts in VND.
 * Displays a formatted number with thousand separators and a "₫" suffix.
 * Preserves cursor position when editing in the middle of the value.
 * Fires `onChange` with the raw numeric value (or `null` when empty).
 */
export function CurrencyInput({
  value,
  onChange,
  id,
  disabled,
  placeholder = '0',
  className,
  ...props
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Stores the desired number of digits before cursor after the next render.
  const pendingCursorDigits = useRef<number | null>(null);

  // Local edit string — only active while the user is focused on the input.
  const [editDisplay, setEditDisplay] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Derive display: use local edit state while focused, external value otherwise.
  // This avoids setState inside useEffect for external value syncs (e.g. form reset).
  const display = isEditing
    ? editDisplay
    : value != null
      ? toDisplayString(value)
      : '';

  // Restore cursor position synchronously after each render caused by typing.
  useLayoutEffect(() => {
    const el = inputRef.current;
    const target = pendingCursorDigits.current;
    if (el === null || target === null) return;
    pendingCursorDigits.current = null;
    const pos = cursorPosFromDigitCount(display, target);
    el.setSelectionRange(pos, pos);
  }, [display]);

  const handleFocus = () => {
    setEditDisplay(value != null ? toDisplayString(value) : '');
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const cursorPos = el.selectionStart ?? el.value.length;

    // Count digits before the cursor in the browser-updated (pre-reformat) value.
    const digitsBeforeCursor = el.value
      .slice(0, cursorPos)
      .replace(/\D/g, '').length;

    const digits = el.value.replace(/\D/g, '');
    if (!digits) {
      pendingCursorDigits.current = 0;
      setEditDisplay('');
      onChange(null);
      return;
    }

    const num = parseInt(digits, 10);
    if (!isNaN(num)) {
      pendingCursorDigits.current = digitsBeforeCursor;
      setEditDisplay(toDisplayString(num));
      onChange(num);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(parseDisplay(editDisplay));
  };

  return (
    <div className="relative flex items-center">
      <input
        {...props}
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'h-9 w-full min-w-0 rounded-md border border-input bg-transparent py-1 pl-2.5 pr-8 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
          className,
        )}
      />
      <span className="pointer-events-none absolute right-2.5 select-none text-sm text-muted-foreground">
        ₫
      </span>
    </div>
  );
}
