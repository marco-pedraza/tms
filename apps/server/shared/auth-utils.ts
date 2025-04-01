import { hash, compare } from 'bcrypt';
import type { User, SafeUser } from '../users/users/users.types';
import { secret } from 'encore.dev/config';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../users/auth/auth.types';

const SALT_ROUNDS = 10;

// JWT configuration
// In a production environment, these should be stored in environment variables
const JWT_SECRET = secret('JWT_SECRET');
const ACCESS_TOKEN_EXPIRY = '30m'; // 30 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

/**
 * Hashes a plain text password
 * @param password Plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, SALT_ROUNDS);
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
 * Generates a JWT access token for the given user
 * @param user User to generate token for
 * @returns JWT access token
 */
export const generateAccessToken = async (user: User): Promise<string> => {
  const payload: JwtPayload = {
    sub: user.id,
    tenantId: user.tenantId,
    username: user.username,
    isSystemAdmin: user.isSystemAdmin,
    type: 'access',
  };

  const secretKey = await JWT_SECRET.get();
  return jwt.sign(payload, secretKey, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

/**
 * Generates a JWT refresh token for the given user
 * @param user User to generate token for
 * @returns JWT refresh token
 */
export const generateRefreshToken = async (user: User): Promise<string> => {
  const payload: JwtPayload = {
    sub: user.id,
    tenantId: user.tenantId,
    username: user.username,
    isSystemAdmin: user.isSystemAdmin,
    type: 'refresh',
  };

  const secretKey = await JWT_SECRET.get();
  return jwt.sign(payload, secretKey, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token JWT token to verify
 * @param expectedType Expected token type ('access' or 'refresh')
 * @returns Decoded JWT payload if valid
 * @throws Error if token is invalid or expired
 */
export const verifyToken = async (
  token: string,
  expectedType: 'access' | 'refresh',
): Promise<JwtPayload> => {
  try {
    const secretKey = await JWT_SECRET.get();
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
