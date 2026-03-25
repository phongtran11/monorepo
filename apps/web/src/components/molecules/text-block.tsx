import { cn } from '@web/lib/helper/cn.helper';

type TextBlockProps = React.HTMLAttributes<HTMLDivElement>;

function TextBlock({ className, children, ...props }: TextBlockProps) {
  return (
    <div
      data-slot="text-block"
      className={cn(
        'flex flex-col items-center gap-6 text-center sm:items-start sm:text-left',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { TextBlock, type TextBlockProps };
