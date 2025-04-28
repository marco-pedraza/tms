'use client';

import CountryNotFound from '@/countries/components/country-not-found';
import useCountryDetailsParams from '@/countries/hooks/use-country-details-params';
import useQueryCountry from '@/countries/hooks/use-query-country';

export default function CountryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { countryId, isValidId } = useCountryDetailsParams();
  const { status, error } = useQueryCountry({
    countryId,
    enabled: isValidId,
  });
  const isCountryNotFound = !isValidId || error?.code === 'not_found';

  if (isCountryNotFound) {
    return <CountryNotFound />;
  }

  if (status === 'error') {
    return <div>Error</div>;
  }

  return children;
}
