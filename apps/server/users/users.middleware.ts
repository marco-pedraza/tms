import { MiddlewareRequest, middleware } from 'encore.dev/api';
import log from 'encore.dev/log';
import { APICallMeta } from 'encore.dev';
import { getAuthData } from '~encore/auth';
import { errors } from '@/shared/errors';
import { ENDPOINT_TO_MODULES } from '@/shared/permissions';
import { auditsRepository } from './audits/audits.repository';
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
      throw errors.unauthenticated(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    // TODO add drizzles 'with' when importing schema
    const user = await userPermissionsRepository.getUserWithPermissions(
      Number(auth.userID),
    );

    // Get the current service and endpoint from the request
    const service = currentRequest.api.service;
    const endpoint = currentRequest.api.endpoint;

    // Create audit entry for this action - non-blocking to avoid affecting request performance
    auditsRepository
      .create({
        userId: user.id,
        service: service,
        endpoint: endpoint,
        details: currentRequest.parsedPayload,
        ipAddress: req.data.ip,
        userAgent: req.data.userAgent,
      })
      .catch((error) => {
        // Log the error but don't fail the request
        log.error('Failed to create audit entry', { error });
      });

    // Skip permission check if user is system admin
    if (user.isSystemAdmin) {
      req.data.currentUser = user;
      return await next(req);
    }

    // Get required module permissions for this endpoint
    const requiredEndpointKey = `${service}:${endpoint}`;
    const requiredModulePermissions = ENDPOINT_TO_MODULES[requiredEndpointKey];

    // Check if endpoint is explicitly defined in the permissions mapping
    if (!(requiredEndpointKey in ENDPOINT_TO_MODULES)) {
      // If endpoint not mapped at all, deny access (fail-secure)
      throw errors.permissionDenied(
        `No permission mapping found for endpoint: ${requiredEndpointKey}`,
      );
    }

    // If endpoint is explicitly defined with empty array, allow access
    if (requiredModulePermissions.length === 0) {
      // This handles public endpoints like login, logout, timezones, etc.
      req.data.currentUser = user;
      return await next(req);
    }

    // Check if user has any of the required module permissions
    const hasPermission = user.effectivePermissions.some((permission) =>
      requiredModulePermissions.includes(permission.code),
    );

    if (!hasPermission) {
      throw errors.permissionDenied(
        ERROR_MESSAGES.PERMISSION_DENIED(requiredModulePermissions.join(', ')),
      );
    }

    req.data.currentUser = user;
    return await next(req);
  },
);
