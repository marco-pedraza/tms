import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

interface CreateCollectionItemQueryProps<CollectionItemModel extends object> {
  collectionQueryKey: string[];
  queryFn: (itemId: number) => Promise<CollectionItemModel>;
}

export interface UseQueryCollectionItemParams {
  itemId: number;
  enabled?: boolean;
}

export default function createCollectionItemQuery<
  CollectionItemModel extends { id: number },
  CollectionModel extends { data: CollectionItemModel[] },
  ErrorType,
>({
  collectionQueryKey,
  queryFn,
}: CreateCollectionItemQueryProps<CollectionItemModel>) {
  function useQueryCollectionItem({
    itemId,
    enabled = true,
  }: UseQueryCollectionItemParams): UseQueryResult<
    CollectionItemModel,
    ErrorType
  > {
    const queryClient = useQueryClient();

    return useQuery({
      queryKey: [...collectionQueryKey, itemId],
      queryFn: () => queryFn(itemId),
      enabled,
      initialData: () =>
        queryClient
          .getQueryData<CollectionModel>(collectionQueryKey)
          ?.data.find((item) => item.id === itemId),
      initialDataUpdatedAt: () =>
        queryClient.getQueryState<CollectionModel>(collectionQueryKey)
          ?.dataUpdatedAt,
    });
  }

  return useQueryCollectionItem;
}
