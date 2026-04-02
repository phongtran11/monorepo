import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@web/lib/helper/cn.helper';

const linkVariants = cva(
  'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      variant: {
        default: 'font-medium text-zinc-950 dark:text-zinc-50',
        primary:
          'h-12 w-full rounded-full bg-foreground px-5 text-background hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-auto',
        outline:
          'h-12 w-full rounded-full border border-solid border-black/[.08] px-5 hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof linkVariants>;

function Link({ className, variant, ...props }: LinkProps) {
  return (
    <a
      data-slot="link"
      className={cn(linkVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Link, linkVariants };
