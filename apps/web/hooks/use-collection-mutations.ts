import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import type { CrudRoute } from '@/services/routes';

export interface CreateCollectionMutations<
  CollectionModel extends { id: number },
  CreateCollectionPayload,
> {
  queryKey: string[];
  translationKey: string;
  createMutationFn: (
    payload: CreateCollectionPayload,
  ) => Promise<CollectionModel>;
  deleteMutationFn: (id: number) => Promise<CollectionModel>;
  updateMutationFn: (
    id: number,
    payload: Partial<CreateCollectionPayload>,
  ) => Promise<CollectionModel>;
  routes: CrudRoute;
}

export default function createCollectionMutations<
  CollectionModel extends { id: number },
  CreateCollectionPayload,
>({
  queryKey,
  translationKey,
  createMutationFn,
  deleteMutationFn,
  updateMutationFn,
  routes,
}: CreateCollectionMutations<CollectionModel, CreateCollectionPayload>) {
  function useCollectionMutations() {
    const t = useTranslations(translationKey);
    const router = useRouter();
    const queryClient = useQueryClient();

    const invalidateCollectionQuery = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    const createMessages = {
      loading: t('messages.create.loading'),
      success: t('messages.create.success'),
      error: t('messages.create.error'),
    };

    const createMutation = useMutation({
      mutationFn: (payload: CreateCollectionPayload) =>
        createMutationFn(payload),
    });

    const createWithToast = useToastMutation({
      mutation: createMutation,
      messages: createMessages,
      onSuccess: (data: CollectionModel) => {
        invalidateCollectionQuery();
        router.push(routes.getDetailsRoute(data.id.toString()));
      },
    });

    const deleteMutation = useMutation({
      mutationFn: (id: number) => deleteMutationFn(id),
    });

    const deleteMessages = {
      loading: t('messages.delete.loading'),
      success: t('messages.delete.success'),
      error: t('messages.delete.error'),
    };

    const deleteWithToast = useToastMutation({
      mutation: deleteMutation,
      messages: deleteMessages,
      onSuccess: () => {
        invalidateCollectionQuery();
        router.push(routes.index);
      },
    });

    const updateMutation = useMutation({
      mutationFn: ({
        id,
        values,
      }: {
        id: number;
        values: Partial<CreateCollectionPayload>;
      }) => updateMutationFn(id, values),
    });

    const updateMessages = {
      loading: t('messages.update.loading'),
      success: t('messages.update.success'),
      error: t('messages.update.error'),
    };

    const updateWithToast = useToastMutation({
      mutation: updateMutation,
      messages: updateMessages,
      onSuccess: (data: CollectionModel) => {
        invalidateCollectionQuery();
        router.push(routes.getDetailsRoute(data.id.toString()));
      },
    });

    return {
      create: createWithToast,
      delete: deleteWithToast,
      update: updateWithToast,
    };
  }

  return useCollectionMutations;
}
