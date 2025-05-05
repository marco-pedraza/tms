'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function StateNotFound() {
  const t = useTranslations('states');

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-2xl font-bold">{t('errors.notFound.title')}</h2>
      <p className="text-muted-foreground mt-2">
        {t('errors.notFound.description')}
      </p>
      <Link href="/states" className="mt-6">
        <Button variant="secondary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.backToList')}
        </Button>
      </Link>
    </div>
  );
}
