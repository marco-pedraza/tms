import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import isNumber from '@/utils/is-number';

interface CityPageParams extends Params {
  id: string;
}

interface UseCityDetailsParamsResult {
  cityId: number;
  isValidId: boolean;
}

/**
 * Custom hook for extracting and validating city details from URL parameters.
 *
 * This hook retrieves the 'id' parameter from the URL and validates it as a valid number.
 * It provides the validated city ID and a boolean indicating whether the ID is valid.
 */
export default function useCityDetailsParams(): UseCityDetailsParamsResult {
  const params = useParams<CityPageParams>();
  const idParam = params?.id || '';
  const cityId = Number.parseInt(idParam, 10);
  const isValidId = isNumber(idParam);

  return {
    cityId,
    isValidId,
  };
}
