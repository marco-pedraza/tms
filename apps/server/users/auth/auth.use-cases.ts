import { secret } from 'encore.dev/config';
import { userRepository } from '../users/users.repository';
import { authRepository } from './auth.repository';
import {
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from '../../shared/auth-utils';
import type {
  LoginPayload,
  LoginResponse,
  RefreshTokenPayload,
  LogoutPayload,
  JwtPayload,
} from './auth.types';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from '../../shared/errors';
import { User } from '../users/users.types';

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
export const createAuthUseCases = () => {
  /**
   * Authenticates a user and generates JWT tokens
   * @param credentials User login credentials
   * @returns User data and authentication tokens
   * @throws {AuthenticationError} If credentials are invalid
   */
  const authenticateUser = async (
    credentials: LoginPayload,
  ): Promise<LoginResponse> => {
    const { username, password } = credentials;

    // Find user by username
    const user = await userRepository.findByUsername(username);

    if (!user) {
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError(ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }

    // Verify password
    const passwordValid = await comparePasswords(password, user.passwordHash);

    if (!passwordValid) {
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
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
  };

  /**
   * Refreshes an access token using a valid refresh token
   * @param params Refresh token data
   * @returns New access and refresh tokens
   * @throws {AuthenticationError} If refresh token is invalid
   */
  const refreshUserToken = async (
    params: RefreshTokenPayload,
  ): Promise<Omit<LoginResponse, 'user'>> => {
    const { refreshToken: token } = params;

    try {
      // Verify refresh token
      const decoded = await verifyToken(token, 'refresh', JWT_SECRET);

      // Check if token is in database and not revoked
      const isValid = await authRepository.isRefreshTokenValid(token);

      if (!isValid) {
        throw new AuthenticationError(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
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
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }
  };

  /**
   * Logs out a user by revoking their refresh token
   * @param params Refresh token to revoke
   * @returns Success message
   */
  const logoutUser = async (
    params: LogoutPayload,
  ): Promise<{ message: string }> => {
    const { refreshToken } = params;

    try {
      // Revoke the refresh token
      await authRepository.revokeRefreshToken(refreshToken);
      return { message: ERROR_MESSAGES.LOGOUT_SUCCESS };
    } catch (error) {
      if (error instanceof NotFoundError) {
        // Return success even if token not found to prevent leak of information
        return { message: ERROR_MESSAGES.LOGOUT_SUCCESS };
      }
      throw error;
    }
  };

  /**
   * Revokes all refresh tokens for a user
   * @param userId User ID
   * @returns Number of tokens revoked
   * @throws {ValidationError} If userId is invalid
   * @throws {NotFoundError} If user does not exist
   */
  const revokeAllUserTokens = async (
    userId: number,
  ): Promise<{ count: number }> => {
    // Validate userId
    if (!userId || isNaN(Number(userId))) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_USER_ID);
    }

    // Check if user exists
    await userRepository.findOne(userId);

    // Revoke all tokens
    const count = await authRepository.revokeAllUserTokens(userId);

    return { count };
  };

  /**
   * Generate a new refresh token for a user
   * @param user User to generate token for
   * @returns Generated refresh token
   */
  const generateNewRefreshToken = async (user: User): Promise<string> => {
    return generateRefreshToken(user, JWT_SECRET, REFRESH_TOKEN_EXPIRY);
  };

  /**
   * Verify a token and return its payload
   * @param token JWT token to verify
   * @param expectedType Type of token to expect
   * @returns Decoded token payload
   */
  const verifyAuthToken = async (
    token: string,
    expectedType: 'access' | 'refresh',
  ): Promise<JwtPayload> => {
    return verifyToken(token, expectedType, JWT_SECRET);
  };

  return {
    authenticateUser,
    refreshUserToken,
    logoutUser,
    revokeAllUserTokens,
    generateNewRefreshToken,
    verifyAuthToken,
  };
};

export const authUseCases = createAuthUseCases();
