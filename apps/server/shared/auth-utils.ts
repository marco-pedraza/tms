import { hash, compare } from 'bcrypt';
import type { User, SafeUser } from '../users/users/users.types';

const SALT_ROUNDS = 10;

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
