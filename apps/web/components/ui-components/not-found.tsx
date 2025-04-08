import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface NotFoundProps {
  title?: string;
  description?: string;
  backHref: string;
  backLabel?: string;
}

export default function NotFound({
  title = 'Recurso no encontrado',
  description = 'No pudimos encontrar el recurso que buscas.',
  backHref,
  backLabel = 'Volver',
}: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
      <FileX className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Link href={backHref}>
        <Button variant="outline" size="sm">
          {backLabel}
        </Button>
      </Link>
    </div>
  );
}
