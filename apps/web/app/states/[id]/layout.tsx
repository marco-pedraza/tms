'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import StateNotFound from '@/states/components/state-not-found';
import useQueryState from '@/states/hooks/use-query-state';
import useStateDetailsParams from '@/states/hooks/use-state-details-params';

export default function StateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tStates = useTranslations('states');
  const { stateId, isValidId } = useStateDetailsParams();
  const { status, error } = useQueryState({
    stateId,
    enabled: isValidId,
  });
  const isStateNotFound = !isValidId || error?.code === 'not_found';

  if (isStateNotFound) {
    return <StateNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError backHref="/states" backLabel={tStates('actions.backToList')} />
    );
  }

  return children;
}
