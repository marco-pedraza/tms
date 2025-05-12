import jwt from 'jsonwebtoken';
import { createBaseRepository } from '@repo/base-repo';
import { errors } from '../../shared/errors';
import { db } from '../db-service';
import { User } from '../users/users.types';
import { refreshTokens } from './auth.schema';
import {
  CreateRefreshToken,
  RefreshToken,
  UpdateRefreshToken,
} from './auth.types';

// Error message constants
const ERROR_MESSAGES = {
  REFRESH_TOKEN_NOT_FOUND: 'Refresh token not found',
  INVALID_OR_REVOKED_TOKEN: 'Invalid or revoked refresh token',
  TOKEN_WRONG_USER: 'Refresh token does not belong to this user',
};

// Default refresh token expiry in milliseconds
const DEFAULT_REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

/**
 * Creates a repository for managing refresh tokens
 * @returns {Object} An object containing refresh token operations
 */
export function createAuthRepository() {
  // Create base repository for refresh tokens
  const baseRepository = createBaseRepository<
    RefreshToken,
    CreateRefreshToken,
    UpdateRefreshToken,
    typeof refreshTokens
  >(db, refreshTokens, 'RefreshToken');

  /**
   * Saves a refresh token to the database
   * @param user User the token belongs to
   * @param token JWT refresh token
   * @returns The saved token record
   * @throws {APIError} If token is in invalid format
   */
  async function saveRefreshToken(
    user: User,
    token: string,
  ): Promise<RefreshToken> {
    // Decode token to get expiration
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string' || !('exp' in decoded)) {
      throw errors.invalidArgument('Invalid token format');
    }
    const expiresAt = decoded.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + DEFAULT_REFRESH_TOKEN_EXPIRY);

    return await baseRepository.create({
      userId: user.id,
      token,
      expiresAt,
      isRevoked: false,
    });
  }

  /**
   * Finds a refresh token by its token string
   * @param token JWT refresh token
   * @returns The token record if found
   */
  async function findRefreshToken(token: string): Promise<RefreshToken | null> {
    return await baseRepository.findBy(refreshTokens.token, token);
  }

  /**
   * Revokes a refresh token
   * @param token JWT refresh token
   * @returns The updated token record
   * @throws {APIError} If the token is not found
   */
  async function revokeRefreshToken(token: string): Promise<RefreshToken> {
    const tokenRecord = await findRefreshToken(token);

    if (!tokenRecord) {
      throw errors.notFound(ERROR_MESSAGES.REFRESH_TOKEN_NOT_FOUND);
    }

    return await baseRepository.update(tokenRecord.id, { isRevoked: true });
  }

  /**
   * Revokes all refresh tokens for a user
   * @param userId User ID
   * @returns Number of tokens revoked
   */
  async function revokeAllUserTokens(userId: number): Promise<number> {
    const tokensToRevoke = await baseRepository.findAllBy(
      refreshTokens.userId,
      userId,
      { orderBy: [] },
    );

    // Only update tokens that are not already revoked
    const updatePromises = tokensToRevoke
      .filter((token) => !token.isRevoked)
      .map((token) => baseRepository.update(token.id, { isRevoked: true }));

    const results = await Promise.all(updatePromises);
    return results.length;
  }

  /**
   * Replaces a refresh token with a new one
   * @param oldToken Old refresh token to replace
   * @param user User the token belongs to
   * @param newToken New refresh token to save
   * @returns New refresh token and record
   * @throws {APIError} If the old token is not found, is revoked, or belongs to a different user
   */
  async function rotateRefreshToken(
    oldToken: string,
    user: User,
    newToken: string,
  ): Promise<{ token: string; record: RefreshToken }> {
    // Check if old token exists and is valid
    const tokenRecord = await findRefreshToken(oldToken);

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw errors.notFound(ERROR_MESSAGES.INVALID_OR_REVOKED_TOKEN);
    }

    // Check if token belongs to the user
    if (tokenRecord.userId !== user.id) {
      throw errors.permissionDenied(ERROR_MESSAGES.TOKEN_WRONG_USER);
    }

    // Revoke old token
    await revokeRefreshToken(oldToken);

    // Save the new token
    const newRecord = await saveRefreshToken(user, newToken);

    return { token: newToken, record: newRecord };
  }

  /**
   * Checks if a refresh token is valid (exists and not revoked)
   * @param token JWT refresh token
   * @returns Whether the token is valid
   */
  async function isRefreshTokenValid(token: string): Promise<boolean> {
    const tokenRecord = await findRefreshToken(token);
    return !!tokenRecord && !tokenRecord.isRevoked;
  }

  return {
    ...baseRepository,
    saveRefreshToken,
    findRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    rotateRefreshToken,
    isRefreshTokenValid,
  };
}

// Export the auth repository instance
export const authRepository = createAuthRepository();
