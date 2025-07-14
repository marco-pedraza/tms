'use client';

import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import isNumber from '@/utils/is-number';

interface CollectionItemPageParams extends Params {
  id: string;
}

interface UseCollectionItemDetailsParamsResult {
  itemId: number;
  isValidId: boolean;
}

/**
 * Custom hook for extracting and validating collection item details from URL parameters.
 *
 * This hook retrieves the 'id' parameter from the URL and validates it as a valid number.
 * It provides the validated collection item ID and a boolean indicating whether the ID is valid.
 */
export default function useCollectionItemDetailsParams(): UseCollectionItemDetailsParamsResult {
  const params = useParams<CollectionItemPageParams>();
  const idParam = params?.id || '';
  const itemId = Number.parseInt(idParam, 10);
  const isValidId = isNumber(idParam);

  return {
    itemId,
    isValidId,
  };
}
