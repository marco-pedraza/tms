import { useSession } from 'next-auth/react';
import type { permissions } from '@repo/ims-client';

interface UseUserPermissionsReturn {
  permissions: permissions.Permission[];
  isSystemAdmin: boolean;
  isLoading: boolean;
  hasModuleAccess: (moduleCode: string) => boolean;
  hasAnyAccess: (moduleCodes: string[]) => boolean;
}

/**
 * Hook to get current user's permissions from session
 * Provides helper methods for permission checks
 */
export function useUserPermissions(): UseUserPermissionsReturn {
  const { data: session, status } = useSession();

  // Return empty permissions if session is invalid
  const permissions = session?.user?.invalid
    ? []
    : (session?.user?.permissions ?? []);
  const isSystemAdmin = session?.user?.invalid
    ? false
    : (session?.user?.isSystemAdmin ?? false);
  const isLoading = status === 'loading';

  /**
   * Check if user has access to a specific module
   */
  const hasModuleAccess = (moduleCode: string): boolean => {
    if (isSystemAdmin) return true;
    return permissions.some((p) => p.code === moduleCode);
  };

  /**
   * Check if user has access to at least one of the specified modules
   */
  const hasAnyAccess = (moduleCodes: string[]): boolean => {
    if (isSystemAdmin) return true;
    return moduleCodes.some((code) => hasModuleAccess(code));
  };

  return {
    permissions,
    isSystemAdmin,
    isLoading,
    hasModuleAccess,
    hasAnyAccess,
  };
}
