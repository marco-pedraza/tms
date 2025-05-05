import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import isNumber from '@/utils/is-number';

interface StatePageParams extends Params {
  id: string;
}

interface UseStateDetailsParamsResult {
  stateId: number;
  isValidId: boolean;
}
/**
 * Custom hook for extracting and validating state details from URL parameters.
 *
 * This hook retrieves the 'id' parameter from the URL and validates it as a valid number.
 * It provides the validated state ID and a boolean indicating whether the ID is valid.
 *
 */
export default function useStateDetailsParams(): UseStateDetailsParamsResult {
  const params = useParams<StatePageParams>();
  const idParam = params?.id || '';
  const stateId = Number.parseInt(idParam, 10);
  const isValidId = isNumber(idParam);

  return {
    stateId,
    isValidId,
  };
}
