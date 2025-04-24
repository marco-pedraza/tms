'use client';

import useQueryCountry from '@/countries/hooks/use-query-country';
import CountryNotFound from '@/countries/components/country-not-found';
import useCountryDetailsParams from '@/countries/hooks/use-country-details-params';

export default function CountryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { countryId, isValidId } = useCountryDetailsParams();
  const { data, status, error } = useQueryCountry({
    countryId,
    enabled: isValidId,
  });
  console.log({ data, status, error });
  // @ts-expect-error - error is not defined in the type
  const isCountryNotFound = !isValidId || error?.code === 'not_found';

  if (isCountryNotFound) {
    console.log('Country not found from layout');
    return <CountryNotFound />;
  }

  if (status === 'error') {
    console.log('Country fetch error from layout');
    return <div>Error</div>;
  }

  return children;
}
