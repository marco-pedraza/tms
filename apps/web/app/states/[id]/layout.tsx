'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import StateNotFound from '@/states/components/state-not-found';
import { useQueryState } from '@/states/hooks/use-query-state';
import useStateDetailsParams from '@/states/hooks/use-state-details-params';

export default function StateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { stateId, isValidId } = useStateDetailsParams();
  const { status, error } = useQueryState({
    stateId,
    enabled: isValidId,
  });

  // Handle invalid parameters
  if (!isValidId) {
    return <StateNotFound />;
  }

  // Handle error states
  if (status === 'error') {
    return <LoadError backHref="/states" />;
  }

  // Render children, letting them handle their own loading states
  return children;
}
