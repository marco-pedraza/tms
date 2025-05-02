'use client';

import { useTranslations } from 'next-intl';
import CityNotFound from '@/cities/components/city-not-found';
import useCityDetailsParams from '@/cities/hooks/use-city-details-params';
import useQueryCity from '@/cities/hooks/use-query-city';
import LoadError from '@/components/load-error';

/**
 * Layout component for city detail pages
 *
 * Handles common error states and resource not found cases,
 * while allowing children to handle their own loading states
 */
export default function CityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tCities = useTranslations('cities');
  const { cityId, isValidId } = useCityDetailsParams();
  const { status, error } = useQueryCity({
    cityId,
    enabled: isValidId,
  });
  const isCityNotFound = !isValidId || error?.code === 'not_found';

  if (isCityNotFound) {
    return <CityNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError backHref="/cities" backLabel={tCities('actions.backToList')} />
    );
  }

  return children;
}
