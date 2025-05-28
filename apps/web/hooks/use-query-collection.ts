import {
  UseQueryResult,
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { SortBy } from '@/types/sort-by';

export interface CollectionQueryParams<CollectionModel extends object> {
  page: number;
  pageSize: number;
  searchTerm: string;
  orderBy: SortBy<CollectionModel>;
  filters: Partial<CollectionModel>;
}

export interface CreateCollectionQueryProps<
  CollectionModel extends object,
  QueryResult,
> {
  queryKey: (string | number)[];
  queryFn: (
    params: CollectionQueryParams<CollectionModel>,
  ) => Promise<QueryResult>;
}

export default function createCollectionQuery<
  CollectionModel extends object,
  QueryResult,
  ErrorType,
>({
  queryKey,
  queryFn,
}: CreateCollectionQueryProps<CollectionModel, QueryResult>) {
  function useQueryCollection(
    params: CollectionQueryParams<CollectionModel>,
  ): UseQueryResult<QueryResult, ErrorType> {
    const queryClient = useQueryClient();
    const query = useQuery<QueryResult, ErrorType>({
      queryKey: [...queryKey, params],
      queryFn: () => queryFn(params),
      placeholderData: keepPreviousData,
      initialData: () =>
        queryClient.getQueryData<QueryResult>([...queryKey, params]),
      initialDataUpdatedAt: () =>
        queryClient.getQueryState<QueryResult>([...queryKey, params])
          ?.dataUpdatedAt,
    });

    return query;
  }

  return useQueryCollection;
}
