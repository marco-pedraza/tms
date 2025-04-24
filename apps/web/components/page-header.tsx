import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  createHref?: string;
  createLabel?: string;
  backHref?: string;
  backLabel?: string;
}

export default function PageHeader({
  title,
  description,
  createHref,
  createLabel = 'Create New',
  backHref,
  backLabel,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex gap-2">
        {backHref && (
          <Link href={backHref}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              {backLabel && <span className="sr-only">{backLabel}</span>}
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
