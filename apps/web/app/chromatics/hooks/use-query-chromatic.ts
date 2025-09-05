import type { APIError, chromatics } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

export default createCollectionItemQuery<
  chromatics.Chromatic,
  chromatics.PaginatedListChromaticsResult,
  APIError
>({
  collectionQueryKey: ['chromatics'],
  queryFn: (chromaticId) => imsClient.inventory.getChromatic(chromaticId),
});
