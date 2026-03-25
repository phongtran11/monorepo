import { cn } from '@web/lib/helper/cn.helper';

type ActionGroupProps = React.HTMLAttributes<HTMLDivElement>;

function ActionGroup({ className, children, ...props }: ActionGroupProps) {
  return (
    <div
      data-slot="action-group"
      className={cn(
        'flex flex-col gap-4 text-base font-medium sm:flex-row',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { ActionGroup, type ActionGroupProps };
