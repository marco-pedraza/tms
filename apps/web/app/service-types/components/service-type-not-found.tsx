'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function ServiceTypeNotFound() {
  const t = useTranslations('serviceTypes.errors.notFound');
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
      <h1 className="text-2xl font-semibold mb-2">{t('title')}</h1>
      <p className="text-gray-600 mb-6">{t('description')}</p>
      <Link href="/service-types">
        <Button>{tCommon('actions.backToList')}</Button>
      </Link>
    </div>
  );
}
