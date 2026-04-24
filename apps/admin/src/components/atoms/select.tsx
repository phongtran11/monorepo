import { cn } from '@admin/lib/utils';

import {
  Select as ShadcnSelect,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export type SelectProps = {
  value?: string | null;
  onValueChange: (value: string) => void;
  options: { value: string; label: string; depth?: number }[];
  /** Form field name — used as the trigger's `id`. Optional outside of forms. */
  name?: string;
  /** Whether the field is in an invalid state — sets `aria-invalid` on the trigger. */
  invalid?: boolean;
  placeholder?: string;
  /**
   * Whether to show the empty "— Không giá trị —" option.
   * Defaults to `true`. Set to `false` for required fields that always have a value.
   */
  showEmpty?: boolean;
  /** Extra className forwarded to the `<SelectTrigger>`. Defaults to `w-full`. */
  className?: string;
};

const NO_VALUE = '__none__';
const DEFAULT_PLACEHOLDER = '— Không giá trị —';

export function Select({
  value,
  onValueChange,
  options,
  name,
  invalid,
  placeholder = DEFAULT_PLACEHOLDER,
  showEmpty = true,
  className,
}: SelectProps) {
  return (
    <ShadcnSelect
      value={showEmpty ? value || NO_VALUE : value || undefined}
      onValueChange={(val) => onValueChange(val === NO_VALUE ? '' : val)}
    >
      <SelectTrigger
        id={name}
        aria-invalid={invalid}
        className={cn('w-full', className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {showEmpty && <SelectItem value={NO_VALUE}>{placeholder}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.depth && option.depth > 0
                ? '  '.repeat(option.depth)
                : null}
              {option.depth && option.depth > 0 ? '└ ' : ''}
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </ShadcnSelect>
  );
}
