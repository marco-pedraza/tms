import { api } from 'encore.dev/api';
import type {
  LoginPayload,
  LoginResponse,
  LogoutPayload,
  RefreshTokenPayload,
} from './auth.types';
import { authUseCases } from './auth.use-cases';

/**
 * Authenticates a user and generates JWT tokens
 * @param params Login credentials
 * @returns User data and authentication tokens
 * @throws {APIError} If authentication fails
 */
export const login = api(
  { method: 'POST', path: '/auth/login', expose: true, auth: false },
  async (params: LoginPayload): Promise<LoginResponse> => {
    return await authUseCases.authenticateUser(params);
  },
);

/**
 * Refreshes an access token using a valid refresh token
 * @param params Refresh token
 * @returns New access and refresh tokens
 * @throws {APIError} If refresh token is invalid
 */
export const refreshToken = api(
  { method: 'POST', path: '/auth/refresh-token', expose: true, auth: false },
  async (params: RefreshTokenPayload): Promise<Omit<LoginResponse, 'user'>> => {
    return await authUseCases.refreshUserToken(params);
  },
);

/**
 * Logs out a user by revoking their refresh token
 * @param params Refresh token to revoke
 * @returns Success message
 * @throws {APIError} If logout fails
 */
export const logout = api(
  { method: 'POST', path: '/auth/logout', expose: true, auth: false },
  async (params: LogoutPayload): Promise<{ message: string }> => {
    return await authUseCases.logoutUser(params);
  },
);

/**
 * Revokes all refresh tokens for a user
 * @param params User ID
 * @returns Number of tokens revoked
 * @throws {APIError} If operation fails
 */
export const revokeAllTokens = api(
  {
    method: 'POST',
    path: '/auth/revoke-all/:userId',
    expose: true,
    auth: true,
  },
  async ({ userId }: { userId: number }): Promise<{ count: number }> => {
    return await authUseCases.revokeAllUserTokens(userId);
  },
);
