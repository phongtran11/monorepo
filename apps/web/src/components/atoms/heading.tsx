import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@web/lib/helper/cn.helper';

const headingVariants = cva(
  'font-semibold tracking-tight text-black dark:text-zinc-50',
  {
    variants: {
      size: {
        h1: 'text-3xl leading-10',
        h2: 'text-2xl leading-9',
        h3: 'text-xl leading-8',
        h4: 'text-lg leading-7',
      },
    },
    defaultVariants: {
      size: 'h1',
    },
  },
);

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  };

function Heading({ className, size, as, ...props }: HeadingProps) {
  const Component = as ?? 'h1';

  return (
    <Component
      data-slot="heading"
      className={cn(headingVariants({ size, className }))}
      {...props}
    />
  );
}

export { Heading, headingVariants };
