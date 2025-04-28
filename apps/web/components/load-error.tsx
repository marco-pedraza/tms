import Link from 'next/link';
import { ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadErrorProps {
  title?: string;
  description?: string;
  backHref: string;
  retryLabel?: string;
  backLabel?: string;
}

export default function LoadError({
  title = 'Algo salió mal.',
  description = 'No pudimos cargar el recurso que buscas.',
  backHref,
  backLabel = 'Volver',
  retryLabel = 'Reintentar',
}: LoadErrorProps) {
  const onRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
      <ServerCrash className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            {backLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
