import { refreshTokens } from './auth.schema';
import { User } from '../users/users.types';
import jwt from 'jsonwebtoken';
import {
  JwtPayload,
  RefreshToken,
  CreateRefreshToken,
  UpdateRefreshToken,
} from './auth.types';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/db';

// Error message constants
const ERROR_MESSAGES = {
  REFRESH_TOKEN_NOT_FOUND: 'Refresh token not found',
  INVALID_OR_REVOKED_TOKEN: 'Invalid or revoked refresh token',
  TOKEN_WRONG_USER: 'Refresh token does not belong to this user',
};

// Default refresh token expiry in milliseconds
const DEFAULT_REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

export const createAuthRepository = () => {
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
   */
  const saveRefreshToken = async (
    user: User,
    token: string,
  ): Promise<RefreshToken> => {
    // Decode token to get expiration
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string' || !('exp' in decoded)) {
      throw new ValidationError('Invalid token format');
    }
    const expiresAt = decoded.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + DEFAULT_REFRESH_TOKEN_EXPIRY);

    return baseRepository.create({
      userId: user.id,
      token,
      expiresAt,
      isRevoked: false,
    });
  };

  /**
   * Finds a refresh token by its token string
   * @param token JWT refresh token
   * @returns The token record if found
   */
  const findRefreshToken = async (
    token: string,
  ): Promise<RefreshToken | null> => {
    return baseRepository.findBy(refreshTokens.token, token);
  };

  /**
   * Revokes a refresh token
   * @param token JWT refresh token
   * @returns The updated token record
   * @throws {NotFoundError} If the token is not found
   */
  const revokeRefreshToken = async (token: string): Promise<RefreshToken> => {
    const tokenRecord = await findRefreshToken(token);

    if (!tokenRecord) {
      throw new NotFoundError(ERROR_MESSAGES.REFRESH_TOKEN_NOT_FOUND);
    }

    return baseRepository.update(tokenRecord.id, { isRevoked: true });
  };

  /**
   * Revokes all refresh tokens for a user
   * @param userId User ID
   * @returns Number of tokens revoked
   */
  const revokeAllUserTokens = async (userId: number): Promise<number> => {
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
  };

  /**
   * Replaces a refresh token with a new one
   * @param oldToken Old refresh token to replace
   * @param user User the token belongs to
   * @param newToken New refresh token to save
   * @returns New refresh token and record
   * @throws {NotFoundError} If the old token is not found or is revoked
   */
  const rotateRefreshToken = async (
    oldToken: string,
    user: User,
    newToken: string,
  ): Promise<{ token: string; record: RefreshToken }> => {
    // Check if old token exists and is valid
    const tokenRecord = await findRefreshToken(oldToken);

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new NotFoundError(ERROR_MESSAGES.INVALID_OR_REVOKED_TOKEN);
    }

    // Check if token belongs to the user
    if (tokenRecord.userId !== user.id) {
      throw new NotFoundError(ERROR_MESSAGES.TOKEN_WRONG_USER);
    }

    // Revoke old token
    await revokeRefreshToken(oldToken);

    // Save the new token
    const newRecord = await saveRefreshToken(user, newToken);

    return { token: newToken, record: newRecord };
  };

  /**
   * Checks if a refresh token is valid (exists and not revoked)
   * @param token JWT refresh token
   * @returns Whether the token is valid
   */
  const isRefreshTokenValid = async (token: string): Promise<boolean> => {
    const tokenRecord = await findRefreshToken(token);
    return !!tokenRecord && !tokenRecord.isRevoked;
  };

  return {
    ...baseRepository,
    saveRefreshToken,
    findRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    rotateRefreshToken,
    isRefreshTokenValid,
  };
};

export const authRepository = createAuthRepository();
