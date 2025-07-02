'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import PopulationNotFound from '@/populations/components/population-not-found';
import usePopulationDetailsParams from '@/populations/hooks/use-population-details-params';
import useQueryPopulation from '@/populations/hooks/use-query-population';
import routes from '@/services/routes';

/**
 * Layout component for population detail pages
 *
 * Handles common error states and resource not found cases,
 * while allowing children to handle their own loading states
 */
export default function PopulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tPopulations = useTranslations('populations');
  const { populationId, isValidId } = usePopulationDetailsParams();
  const { status, error } = useQueryPopulation({
    populationId,
    enabled: isValidId,
  });
  const isPopulationNotFound = !isValidId || error?.code === 'not_found';

  if (isPopulationNotFound) {
    return <PopulationNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.populations.index}
        backLabel={tPopulations('actions.backToList')}
      />
    );
  }

  return children;
}
