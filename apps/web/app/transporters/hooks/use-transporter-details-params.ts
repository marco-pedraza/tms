import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import isNumber from '@/utils/is-number';

interface TransporterPageParams extends Params {
  id: string;
}

interface UseTransporterDetailsParamsResult {
  transporterId: number;
  isValidId: boolean;
}
/**
 * Custom hook for extracting and validating transporter details from URL parameters.
 *
 * This hook retrieves the 'id' parameter from the URL and validates it as a valid number.
 * It provides the validated transporter ID and a boolean indicating whether the ID is valid.
 *
 */
export default function useTransporterDetailsParams(): UseTransporterDetailsParamsResult {
  const params = useParams<TransporterPageParams>();
  const idParam = params?.id || '';
  const transporterId = Number.parseInt(idParam, 10);
  const isValidId = isNumber(idParam);

  return {
    transporterId,
    isValidId,
  };
}
