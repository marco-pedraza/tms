import { api } from 'encore.dev/api';
import type { 
  LoginPayload, 
  LoginResponse, 
  RefreshTokenPayload,
  LogoutPayload
} from './auth.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { authUseCases } from './auth.use-cases';

const withErrorHandling = createControllerErrorHandler('AuthController');

/**
 * Authenticates a user and generates JWT tokens
 * @param params Login credentials
 * @returns User data and authentication tokens
 * @throws {APIError} If authentication fails
 */
export const login = api(
  { method: 'POST', path: '/auth/login', expose: true },
  async (params: LoginPayload): Promise<LoginResponse> => {
    return withErrorHandling('login', () => authUseCases.authenticateUser(params));
  }
);

/**
 * Refreshes an access token using a valid refresh token
 * @param params Refresh token
 * @returns New access and refresh tokens
 * @throws {APIError} If refresh token is invalid
 */
export const refreshToken = api(
  { method: 'POST', path: '/auth/refresh-token', expose: true },
  async (params: RefreshTokenPayload): Promise<Omit<LoginResponse, 'user'>> => {
    return withErrorHandling('refreshToken', () => authUseCases.refreshUserToken(params));
  }
);

/**
 * Logs out a user by revoking their refresh token
 * @param params Refresh token to revoke
 * @returns Success message
 * @throws {APIError} If logout fails
 */
export const logout = api(
  { method: 'POST', path: '/auth/logout', expose: true },
  async (params: LogoutPayload): Promise<{ message: string }> => {
    return withErrorHandling('logout', () => authUseCases.logoutUser(params));
  }
);

/**
 * Revokes all refresh tokens for a user
 * @param params User ID
 * @returns Number of tokens revoked
 * @throws {APIError} If operation fails
 */
export const revokeAllTokens = api(
  { method: 'POST', path: '/auth/revoke-all/:userId', expose: true },
  async ({ userId }: { userId: number }): Promise<{ count: number }> => {
    return withErrorHandling('revokeAllTokens', () => authUseCases.revokeAllUserTokens(userId));
  }
); 