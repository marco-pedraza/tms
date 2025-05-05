import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import isNumber from '@/utils/is-number';

interface TerminalPageParams extends Params {
  id: string;
}

interface UseTerminalDetailsParamsResult {
  terminalId: number;
  isValidId: boolean;
}

/**
 * Custom hook for extracting and validating terminal details from URL parameters.
 *
 * This hook retrieves the 'id' parameter from the URL and validates it as a valid number.
 * It provides the validated terminal ID and a boolean indicating whether the ID is valid.
 *
 */
export default function useTerminalDetailsParams(): UseTerminalDetailsParamsResult {
  const params = useParams<TerminalPageParams>();
  const idParam = params?.id || '';
  const terminalId = Number.parseInt(idParam, 10);
  const isValidId = isNumber(idParam);

  return {
    terminalId,
    isValidId,
  };
}
