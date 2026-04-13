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
  name: string;
  invalid: boolean;
  placeholder?: string;
};

const NO_VALUE = '__none__';

export function LSelect({
  value,
  onValueChange,
  options,
  name,
  invalid,
  placeholder,
}: LSelectProps) {
  return (
    <Select
      value={value || NO_VALUE}
      onValueChange={(val) => onValueChange(val === NO_VALUE ? '' : val)}
    >
      <SelectTrigger id={name} aria-invalid={invalid} className="w-full">
        <SelectValue placeholder={placeholder ?? '— Không giá trị —'} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={NO_VALUE}>— Không giá trị —</SelectItem>
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
