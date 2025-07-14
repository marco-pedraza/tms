'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import InstallationTypeNotFound from '@/installation-types/components/installation-type-not-found';
import useQueryInstallationType from '@/installation-types/hooks/use-query-installation-type';
import routes from '@/services/routes';

/**
 * Layout component for population detail pages
 *
 * Handles common error states and resource not found cases,
 * while allowing children to handle their own loading states
 */
export default function InstallationTypeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tInstallationTypes = useTranslations('installationTypes');
  const { itemId: installationTypeId, isValidId } =
    useCollectionItemDetailsParams();
  const { status, error } = useQueryInstallationType({
    itemId: installationTypeId,
    enabled: isValidId,
  });
  const isInstallationTypeNotFound = !isValidId || error?.code === 'not_found';

  if (isInstallationTypeNotFound) {
    return <InstallationTypeNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.installationTypes.index}
        backLabel={tInstallationTypes('actions.backToList')}
      />
    );
  }

  return children;
}
