import { hash, compare } from 'bcrypt';
import type { User, SafeUser } from '../users/users/users.types';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../users/auth/auth.types';

const DEFAULT_SALT_ROUNDS = 10;

/**
 * Hashes a plain text password
 * @param password Plain text password to hash
 * @param saltRounds Optional number of salt rounds, defaults to 10
 * @returns Promise resolving to the hashed password
 */
export const hashPassword = async (
  password: string,
  saltRounds?: number,
): Promise<string> => {
  return hash(password, saltRounds || DEFAULT_SALT_ROUNDS);
};

/**
 * Compares a plain text password with a hashed password
 * @param password Plain text password to compare
 * @param hashedPassword Hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 */
export const comparePasswords = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return compare(password, hashedPassword);
};

/**
 * Removes the password hash from a user object
 * @param user User object with password hash
 * @returns User object without password hash
 */
export const omitPasswordHash = (user: User): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

/**
 * Generates a JWT token for the given user
 * @param user User to generate token for
 * @param tokenType Type of token ('access' or 'refresh')
 * @param secretKey JWT secret key
 * @param expiresIn Token expiry time
 * @returns JWT token
 */
const generateToken = async (
  user: User,
  tokenType: 'access' | 'refresh',
  secretKey: string,
  expiresIn: string,
): Promise<string> => {
  const payload: JwtPayload = {
    sub: user.id,
    tenantId: user.tenantId,
    username: user.username,
    isSystemAdmin: user.isSystemAdmin,
    type: tokenType,
  };

  return jwt.sign(payload, secretKey, { expiresIn });
};

/**
 * Generates a JWT access token for the given user
 * @param user User to generate token for
 * @param secretKey JWT secret key
 * @param expiresIn Token expiry time
 * @returns JWT access token
 */
export const generateAccessToken = async (
  user: User,
  secretKey: string,
  expiresIn: string,
): Promise<string> => {
  return generateToken(user, 'access', secretKey, expiresIn);
};

/**
 * Generates a JWT refresh token for the given user
 * @param user User to generate token for
 * @param secretKey JWT secret key
 * @param expiresIn Token expiry time
 * @returns JWT refresh token
 */
export const generateRefreshToken = async (
  user: User,
  secretKey: string,
  expiresIn: string,
): Promise<string> => {
  return generateToken(user, 'refresh', secretKey, expiresIn);
};

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token JWT token to verify
 * @param expectedType Expected token type ('access' or 'refresh')
 * @param secretKey JWT secret key
 * @returns Decoded JWT payload if valid
 * @throws Error if token is invalid or expired
 */
export const verifyToken = async (
  token: string,
  expectedType: 'access' | 'refresh',
  secretKey: string,
): Promise<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, secretKey) as JwtPayload;

    // Verify token type
    if (decoded.type !== expectedType) {
      throw new Error(`Invalid token type. Expected ${expectedType} token.`);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};
