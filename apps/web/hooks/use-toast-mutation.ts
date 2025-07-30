import { UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * A hook that enhances a React Query mutation with toast notifications.
 *
 * This hook wraps a standard React Query mutation to provide visual feedback through
 * toast notifications during the mutation lifecycle (loading, success, error).
 * It also handles executing business logic after successful mutations.
 *
 * @template TData - The type of data returned by the mutation
 * @template TVariables - The type of variables accepted by the mutation
 *
 * @param options - Configuration options for the enhanced mutation
 * @param options.mutation - The base React Query mutation result to enhance
 * @param options.messages - Toast notification messages for different mutation states
 * @param options.messages.loading - Message to display while the mutation is loading
 * @param options.messages.success - Message to display when the mutation succeeds
 * @param options.messages.error - Message to display when the mutation fails
 * @param options.onSuccess - Callback function to execute after a successful mutation
 *
 * @returns An enhanced mutation object with all original properties plus a `mutateWithToast` method
 */
export function useToastMutation<TData, TVariables>({
  mutation,
  messages,
  onSuccess: onStandaloneSuccess,
  onError: onStandaloneError,
}: {
  mutation: UseMutationResult<TData, Error, TVariables>;
  messages: {
    loading: string;
    success: string;
    error: string;
  };
  onSuccess: (data: TData) => void;
  onError?: (error: unknown, variables: TVariables) => void;
}) {
  /**
   * Executes the mutation with toast notifications for each state.
   *
   * @param variables - The variables to pass to the mutation function
   * @param options - Options for the mutation
   * @param options.standalone - Whether to use the mutation standalone or not.
   * If true, it will trigger the onSuccess and onError callbacks.
   * If false, it will expect that success and error cases are handled by the caller.
   * @default true
   * @returns A promise that resolves with the mutation result
   * @throws Will throw an error if the mutation fails
   */
  const mutateWithToast = async (
    variables: TVariables,
    {
      standalone = true,
      onError,
      onSuccess,
    }: {
      standalone?: boolean;
      onError?: (error: unknown, variables: TVariables) => void;
      onSuccess?: (data: TData) => void;
    } = {},
  ) => {
    try {
      const promise = toast.promise(mutation.mutateAsync(variables), {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      });

      // Unwrap the result to get the actual data
      const response = await promise.unwrap();

      // Handle business logic
      if (standalone) {
        onStandaloneSuccess(response);
      } else {
        onSuccess?.(response);
      }
      return response;
    } catch (error) {
      if (standalone) {
        onStandaloneError?.(error, variables);
      } else {
        onError?.(error, variables);
      }
      /**
       * Re-throw should not be needed since this method is not meant to be used
       * in a try-catch block.
       *
       * @todo Check usages of this method and remove this re-throw when possible
       */
      throw error;
    }
  };

  return {
    ...mutation,
    mutateWithToast,
  };
}
