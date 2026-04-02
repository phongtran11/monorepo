import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@web/lib/helper/cn.helper';

const textVariants = cva('text-zinc-600 dark:text-zinc-400', {
  variants: {
    size: {
      sm: 'text-sm leading-6',
      base: 'text-base leading-7',
      lg: 'text-lg leading-8',
    },
  },
  defaultVariants: {
    size: 'base',
  },
});

type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants>;

function Text({ className, size, ...props }: TextProps) {
  return (
    <p
      data-slot="text"
      className={cn(textVariants({ size, className }))}
      {...props}
    />
  );
}

export { Text, textVariants };
