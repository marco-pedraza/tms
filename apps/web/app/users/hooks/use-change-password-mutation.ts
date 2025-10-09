import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

interface ChangePasswordParams {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

export default function useChangePasswordMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const tUsers = useTranslations('users');

  const changePasswordMutation = useMutation({
    mutationFn: async ({
      userId,
      currentPassword,
      newPassword,
    }: ChangePasswordParams) => {
      return await imsClient.users.changePassword(userId, {
        currentPassword,
        newPassword,
      });
    },
  });

  const changePasswordWithToast = useToastMutation({
    mutation: changePasswordMutation,
    messages: {
      loading: tUsers('messages.changePassword.loading'),
      success: tUsers('messages.changePassword.success'),
      error: tUsers('messages.changePassword.error'),
    },
    onSuccess: () => {
      // Invalidate user query to refresh data
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Redirect to user list after successful password change
      router.push(routes.users.index);
    },
  });

  return changePasswordWithToast;
}
