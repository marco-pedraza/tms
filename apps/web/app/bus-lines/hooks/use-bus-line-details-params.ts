import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import isNumber from '@/utils/is-number';

interface BusLinePageParams extends Params {
  id: string;
}

interface UseBusLineDetailsParamsResult {
  busLineId: number;
  isValidId: boolean;
}
/**
 * Custom hook for extracting and validating bus line details from URL parameters.
 *
 * This hook retrieves the 'id' parameter from the URL and validates it as a valid number.
 * It provides the validated bus line ID and a boolean indicating whether the ID is valid.
 *
 */
export default function useBusLineDetailsParams(): UseBusLineDetailsParamsResult {
  const params = useParams<BusLinePageParams>();
  const idParam = params?.id || '';
  const busLineId = Number.parseInt(idParam, 10);
  const isValidId = isNumber(idParam);

  return {
    busLineId,
    isValidId,
  };
}
