import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableActionsCellProps {
  detailsHref: string;
  editHref: string;
  onDelete: () => void;
}

export default function DataTableActionsCell({
  detailsHref,
  editHref,
  onDelete,
}: DataTableActionsCellProps) {
  const tCommon = useTranslations('common');
  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={detailsHref}>
        <Button variant="ghost" size="sm">
          {tCommon('actions.view')}
        </Button>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{tCommon('actions.more')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href={editHref}>
            <Button variant="ghost" className="w-full justify-start">
              {tCommon('actions.edit')}
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={onDelete}
          >
            {tCommon('actions.delete')}
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
