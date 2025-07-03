'use client';

import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import isNumber from '@/utils/is-number';

interface NodePageParams extends Params {
  id: string;
}

interface UseNodeDetailsParamsResult {
  nodeId: number;
  isValidId: boolean;
}

/**
 * Custom hook for extracting and validating population details from URL parameters.
 *
 * This hook retrieves the 'id' parameter from the URL and validates it as a valid number.
 * It provides the validated population ID and a boolean indicating whether the ID is valid.
 */
export default function useNodeDetailsParams(): UseNodeDetailsParamsResult {
  const params = useParams<NodePageParams>();
  const idParam = params?.id || '';
  const nodeId = Number.parseInt(idParam, 10);
  const isValidId = isNumber(idParam);

  return {
    nodeId,
    isValidId,
  };
}
