import { secret } from 'encore.dev/config';
import {
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from '../../shared/auth-utils';
import { errors } from '../../shared/errors';
import { userRepository } from '../users/users.repository';
import { SafeUser } from '../users/users.types';
import type {
  JwtPayload,
  LoginPayload,
  LoginResponse,
  LogoutPayload,
  RefreshTokenPayload,
} from './auth.types';
import { authRepository } from './auth.repository';

// JWT configuration
const JWT_SECRET = secret('JWT_SECRET')();
const ACCESS_TOKEN_EXPIRY = secret('ACCESS_TOKEN_EXPIRY')();
const REFRESH_TOKEN_EXPIRY = secret('REFRESH_TOKEN_EXPIRY')();

// Error message constants
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  ACCOUNT_INACTIVE: 'Account is inactive',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  INVALID_USER_ID: 'Invalid user ID',
  LOGOUT_SUCCESS: 'Logged out successfully',
};

/**
 * Creates auth use cases to handle authentication business logic
 * @returns Object containing authentication use cases
 */
export function createAuthUseCases() {
  /**
   * Authenticates a user and generates JWT tokens
   * @param credentials User login credentials
   * @returns User data and authentication tokens
   * @throws {APIError} If credentials are invalid
   */
  async function authenticateUser(
    credentials: LoginPayload,
  ): Promise<LoginResponse> {
    const { username, password } = credentials;

    // Find user by username
    const user = await userRepository.findByUsername(username);

    if (!user) {
      throw errors.unauthenticated(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      throw errors.unauthenticated(ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }

    // Verify password
    const passwordValid = await comparePasswords(password, user.passwordHash);

    if (!passwordValid) {
      throw errors.unauthenticated(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const accessToken = await generateAccessToken(
      user,
      JWT_SECRET,
      ACCESS_TOKEN_EXPIRY,
    );
    const refreshToken = await generateRefreshToken(
      user,
      JWT_SECRET,
      REFRESH_TOKEN_EXPIRY,
    );

    // Save refresh token to database
    await authRepository.saveRefreshToken(user, refreshToken);

    // Update last login timestamp
    await userRepository.update(user.id, {
      lastLogin: new Date(),
    });

    // Return user data and tokens
    return {
      user: {
        ...user,
        passwordHash: undefined,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes an access token using a valid refresh token
   * @param params Refresh token data
   * @returns New access and refresh tokens
   * @throws {APIError} If refresh token is invalid
   */
  async function refreshUserToken(
    params: RefreshTokenPayload,
  ): Promise<Omit<LoginResponse, 'user'>> {
    const { refreshToken: token } = params;

    try {
      // Verify refresh token
      const decoded = await verifyToken(token, 'refresh', JWT_SECRET);

      // Check if token is in database and not revoked
      const isValid = await authRepository.isRefreshTokenValid(token);

      if (!isValid) {
        throw errors.unauthenticated(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
      }

      // Find user
      const user = await userRepository.findOneWithPassword(decoded.sub);

      // Generate new refresh token
      const newRefreshToken = await generateRefreshToken(
        user,
        JWT_SECRET,
        REFRESH_TOKEN_EXPIRY,
      );

      // Rotate refresh token (revoke old one and create new one)
      const { token: rotatedToken } = await authRepository.rotateRefreshToken(
        token,
        user,
        newRefreshToken,
      );

      // Generate new access token
      const newAccessToken = await generateAccessToken(
        user,
        JWT_SECRET,
        ACCESS_TOKEN_EXPIRY,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: rotatedToken,
      };
    } catch {
      throw errors.unauthenticated(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }
  }

  /**
   * Logs out a user by revoking their refresh token
   * @param params Refresh token to revoke
   * @returns Success message
   */
  async function logoutUser(
    params: LogoutPayload,
  ): Promise<{ message: string }> {
    const { refreshToken } = params;

    try {
      // Revoke the refresh token
      await authRepository.revokeRefreshToken(refreshToken);
      return { message: ERROR_MESSAGES.LOGOUT_SUCCESS };
    } catch {
      return { message: ERROR_MESSAGES.LOGOUT_SUCCESS };
    }
  }

  /**
   * Revokes all refresh tokens for a user
   * @param userId User ID
   * @returns Number of tokens revoked
   * @throws {APIError} If userId is invalid or user doesn't exist
   */
  async function revokeAllUserTokens(
    userId: number,
  ): Promise<{ count: number }> {
    // Validate userId
    if (!userId || isNaN(Number(userId))) {
      throw errors.invalidArgument(ERROR_MESSAGES.INVALID_USER_ID);
    }

    // Check if user exists
    await userRepository.findOne(userId);

    // Revoke all tokens
    const count = await authRepository.revokeAllUserTokens(userId);

    return { count };
  }

  /**
   * Verify a token and return its payload
   * @param token JWT token to verify
   * @param expectedType Type of token to expect
   * @returns Decoded token payload
   */
  async function verifyAuthToken(
    token: string,
    expectedType: 'access' | 'refresh',
  ): Promise<JwtPayload> {
    return await verifyToken(token, expectedType, JWT_SECRET);
  }

  /**
   * Verifies a token and checks if the corresponding user exists and is active
   * @param token JWT token to verify
   * @param expectedType Type of token to expect
   * @returns User object without sensitive data if token is valid
   * @throws {APIError} If token is invalid or user is not found/inactive
   */
  async function validateTokenAndUser(
    token: string,
    expectedType: 'access' | 'refresh',
  ): Promise<SafeUser> {
    // Verify token
    const decoded = await verifyToken(token, expectedType, JWT_SECRET);

    // Check if user exists and is active
    const user = await userRepository.findOne(decoded.sub);

    if (!user) {
      throw errors.unauthenticated('User not found');
    }

    if (!user.isActive) {
      throw errors.unauthenticated('User account is inactive');
    }

    // Return the user object (without password hash)
    return user;
  }

  return {
    authenticateUser,
    refreshUserToken,
    logoutUser,
    revokeAllUserTokens,
    verifyAuthToken,
    validateTokenAndUser,
  };
}

export const authUseCases = createAuthUseCases();
