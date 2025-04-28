import Link from 'next/link';
import { ServerCrash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface LoadErrorProps {
  title?: string;
  description?: string;
  backHref: string;
  retryLabel?: string;
  backLabel?: string;
}

export default function LoadError({
  title = '',
  description = '',
  backHref,
  backLabel = '',
  retryLabel = '',
}: LoadErrorProps) {
  const tCommon = useTranslations('common');

  const onRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
      <ServerCrash className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">
        {title || tCommon('errors.somethingWentWrong')}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {description || tCommon('errors.noResourceFound')}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onRetry}>
          {retryLabel || tCommon('actions.retry')}
        </Button>
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            {backLabel || tCommon('actions.backToList')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
