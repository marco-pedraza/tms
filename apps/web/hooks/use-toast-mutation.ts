import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UseToastMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  messages: {
    loading?: string;
    success: string;
    error: string;
  };
  onSuccess?: (data: TData) => void;
  invalidateQueries?: string[];
  redirectTo?: string | ((data: TData) => string);
}

export function useToastMutation<TData, TVariables>({
  mutationFn,
  messages,
  onSuccess,
  invalidateQueries = [],
  redirectTo,
}: UseToastMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn,
    onSuccess: (data) => {
      // Invalidar queries si es necesario
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }

      // Redirigir si es necesario
      if (redirectTo) {
        const path =
          typeof redirectTo === 'function' ? redirectTo(data) : redirectTo;
        router.push(path);
      }

      // Ejecutar callback adicional si existe
      if (onSuccess) {
        onSuccess(data);
      }
    },
  });

  const mutateWithToast = async (variables: TVariables) => {
    return toast.promise(mutation.mutateAsync(variables), {
      loading: messages.loading ?? 'Procesando...',
      success: messages.success,
      error: messages.error,
    });
  };

  return {
    ...mutation,
    mutateWithToast,
  };
}
