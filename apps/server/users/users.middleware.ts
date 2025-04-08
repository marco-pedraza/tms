import {
  APIError,
  middleware,
  MiddlewareRequest,
  APICallMeta,
} from 'encore.dev/api';
import { getAuthData } from '~encore/auth';
import { userPermissionsRepository } from './user-permissions/user-permissions.repository';
/**
 * Error messages for authorization failures
 */
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required',
  PERMISSION_DENIED: (permission: string) =>
    `Access denied: Required permission "${permission}" not found`,
};

/**
 * Unified permissions middleware
 * This single middleware can handle various permission requirements:
 * - Basic authentication check
 * - Permission-based access control
 * - Role-based access control
 */
export const usersMiddleware = middleware(
  { target: { auth: true } },
  async (req: MiddlewareRequest, next) => {
    const currentRequest = req.requestMeta as APICallMeta;
    const auth = getAuthData();

    // Check basic authentication
    if (!auth || !auth.userID) {
      throw APIError.unauthenticated(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    // TODO add drizzles 'with' when importing schema
    const user = await userPermissionsRepository.getUserWithPermissions(
      Number(auth.userID),
    );

    // Get the current service and endpoint from the request
    const service = currentRequest.api.service;
    const endpoint = currentRequest.api.endpoint;

    // Create permission code in format "service:endpoint"
    const requiredPermission = `${service}:${endpoint}`;

    // Skip permission check if user is system admin
    if (user.isSystemAdmin) {
      return await next(req);
    }

    // Check if user has the required permission
    const hasPermission = user.effectivePermissions.some(
      (permission) => permission.code === requiredPermission,
    );

    if (!hasPermission) {
      throw APIError.permissionDenied(
        ERROR_MESSAGES.PERMISSION_DENIED(requiredPermission),
      );
    }

    req.data.currentUser = user;
    return await next(req);
  },
);
