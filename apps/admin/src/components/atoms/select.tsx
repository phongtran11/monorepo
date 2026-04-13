import { cn } from '@admin/lib/utils';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export type LSelectProps = {
  value?: string | null;
  onValueChange: (value: string) => void;
  options: { value: string; label: string; depth?: number }[];
  /** Form field name — used as the trigger's `id`. Optional outside of forms. */
  name?: string;
  /** Whether the field is in an invalid state — sets `aria-invalid` on the trigger. */
  invalid?: boolean;
  placeholder?: string;
  /** Extra className forwarded to the `<SelectTrigger>`. Defaults to `w-full`. */
  className?: string;
};

const NO_VALUE = '__none__';
const DEFAULT_PLACEHOLDER = '— Không giá trị —';

export function LSelect({
  value,
  onValueChange,
  options,
  name,
  invalid,
  placeholder = DEFAULT_PLACEHOLDER,
  className,
}: LSelectProps) {
  return (
    <Select
      value={value || NO_VALUE}
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
          <SelectItem value={NO_VALUE}>{placeholder}</SelectItem>
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
    </Select>
  );
}
