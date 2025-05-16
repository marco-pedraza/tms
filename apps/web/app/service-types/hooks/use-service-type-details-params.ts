import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import isNumber from '@/utils/is-number';

interface ServiceTypePageParams extends Params {
  id: string;
}

interface UseServiceTypeDetailsParamsResult {
  serviceTypeId: number;
  isValidId: boolean;
}

/**
 * Custom hook for extracting and validating service type details from URL parameters.
 */
export default function useServiceTypeDetailsParams(): UseServiceTypeDetailsParamsResult {
  const params = useParams<ServiceTypePageParams>();
  const idParam = params?.id || '';
  const serviceTypeId = Number.parseInt(idParam, 10);
  const isValidId = isNumber(idParam);

  return {
    serviceTypeId,
    isValidId,
  };
}
