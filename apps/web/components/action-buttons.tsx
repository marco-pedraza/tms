import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ActionButtonsProps {
  viewHref?: string;
  editHref?: string;
  onDelete?: () => void;
  small?: boolean;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
}

export default function ActionButtons({
  viewHref,
  editHref,
  onDelete,
  small = false,
  viewLabel = 'Ver',
  editLabel = 'Editar',
  deleteLabel = 'Eliminar',
}: ActionButtonsProps) {
  const size = small ? 'sm' : 'default';

  return (
    <div className="flex gap-2">
      {viewHref && (
        <Link href={viewHref}>
          <Button variant="outline" size={size}>
            {viewLabel}
          </Button>
        </Link>
      )}
      {editHref && (
        <Link href={editHref}>
          <Button variant="outline" size={size}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            {editLabel}
          </Button>
        </Link>
      )}
      {onDelete && (
        <Button variant="destructive" size={size} onClick={onDelete}>
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          {deleteLabel}
        </Button>
      )}
    </div>
  );
}
