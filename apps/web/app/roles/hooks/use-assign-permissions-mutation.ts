import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { APIError, roles } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

interface AssignPermissionsParams {
  roleId: number;
  permissionIds: number[];
}

/**
 * Custom hook for assigning permissions to a role.
 * Handles mutation, cache invalidation, and toast notifications.
 */
export default function useAssignPermissionsMutation() {
  const queryClient = useQueryClient();
  const t = useTranslations('roles');

  const assignPermissionsMutation = useMutation<
    roles.RoleWithPermissions,
    APIError,
    AssignPermissionsParams
  >({
    mutationFn: ({ roleId, permissionIds }) =>
      imsClient.users.assignPermissionsToRole(roleId, { permissionIds }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({
        queryKey: ['roles', data.id.toString()],
      });
    },
  });

  const assignPermissionsWithToast = useToastMutation({
    mutation: assignPermissionsMutation,
    messages: {
      loading: t('messages.assignPermissions.loading'),
      success: t('messages.assignPermissions.success'),
      error: t('messages.assignPermissions.error'),
    },
  });

  return assignPermissionsWithToast;
}
