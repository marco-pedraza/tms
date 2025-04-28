import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import isNumber from '@/utils/is-number';

interface CountryPageParams extends Params {
  id: string;
}

interface UseCountryDetailsParamsResult {
  countryId: number;
  isValidId: boolean;
}

/**
 * Custom hook for extracting and validating country details from URL parameters.
 *
 * This hook retrieves the 'id' parameter from the URL and validates it as a valid number.
 * It provides the validated country ID and a boolean indicating whether the ID is valid.
 *
 */
export default function useCountryDetailsParams(): UseCountryDetailsParamsResult {
  const params = useParams<CountryPageParams>();
  const idParam = params?.id || '';
  const countryId = Number.parseInt(idParam, 10);
  const isValidId = isNumber(idParam);

  return {
    countryId,
    isValidId,
  };
}
