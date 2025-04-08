'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  createHref?: string;
  createLabel?: string;
  backHref?: string;
}

export function PageHeader({
  title,
  description,
  createHref,
  createLabel = 'Create New',
  backHref,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex gap-2">
        {backHref && (
          <Link href={backHref}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {createHref && (
        <Link href={createHref}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {createLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}

interface ActionButtonsProps {
  viewHref?: string;
  editHref?: string;
  onDelete?: () => void;
  small?: boolean;
}

export function ActionButtons({
  viewHref,
  editHref,
  onDelete,
  small = false,
}: ActionButtonsProps) {
  const size = small ? 'sm' : 'default';

  return (
    <div className="flex gap-2">
      {viewHref && (
        <Link href={viewHref}>
          <Button variant="outline" size={size}>
            Ver
          </Button>
        </Link>
      )}
      {editHref && (
        <Link href={editHref}>
          <Button variant="outline" size={size}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Editar
          </Button>
        </Link>
      )}
      {onDelete && (
        <Button variant="destructive" size={size} onClick={onDelete}>
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Eliminar
        </Button>
      )}
    </div>
  );
}
