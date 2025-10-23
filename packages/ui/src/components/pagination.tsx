import { ComponentProps, forwardRef } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

const Pagination = ({ className, ...props }: ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

const PaginationContent = forwardRef<HTMLUListElement, ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  ),
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = forwardRef<HTMLLIElement, ComponentProps<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('', className)} {...props} />
  ),
);
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
  isArrow?: boolean;
} & ComponentProps<'a'>;

const PaginationLink = ({
  className,
  isActive,
  isArrow = false,
  ...props
}: PaginationLinkProps) => {
  const baseStyles =
    'inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7';

  const numberLinkStyles = isArrow ? '' : 'text-xs font-medium';

  const variantStyles = isActive
    ? 'border border-input bg-primary hover:bg-primary/90 text-white'
    : 'hover:bg-accent hover:text-accent-foreground';

  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cn(baseStyles, numberLinkStyles, variantStyles, className)}
      {...props}
    />
  );
};
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = ({
  className,
  ...props
}: ComponentProps<typeof PaginationLink>) => (
  <PaginationLink className={cn('mr-1', className)} isArrow={true} {...props}>
    <ChevronLeft className="h-3 w-3" strokeWidth={3} />
  </PaginationLink>
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({
  className,
  ...props
}: ComponentProps<typeof PaginationLink>) => (
  <PaginationLink className={cn('ml-1', className)} isArrow={true} {...props}>
    <ChevronRight className="h-3 w-3" strokeWidth={3} />
  </PaginationLink>
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({
  className,
  ...props
}: ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex items-center justify-center h-7 w-7', className)}
    {...props}
  >
    <MoreHorizontal className="h-3 w-3" />
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
