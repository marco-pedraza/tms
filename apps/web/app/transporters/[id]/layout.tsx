'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import TransporterNotFound from '@/transporters/components/transporter-not-found';
import useQueryTransporter from '@/transporters/hooks/use-query-transporter';
import useTransporterDetailsParams from '@/transporters/hooks/use-transporter-details-params';

export default function TransporterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tTransporters = useTranslations('transporters');
  const { transporterId, isValidId } = useTransporterDetailsParams();
  const { status, error } = useQueryTransporter({
    transporterId,
    enabled: isValidId,
  });
  const isTransporterNotFound = !isValidId || error?.code === 'not_found';

  if (isTransporterNotFound) {
    return <TransporterNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref="/transporters"
        backLabel={tTransporters('actions.backToList')}
      />
    );
  }

  return children;
}
