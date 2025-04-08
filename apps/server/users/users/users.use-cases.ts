import { secret } from 'encore.dev/config';
import { userRepository } from './users.repository';
import type {
  UpdateUserPayload,
  SafeUser,
  ChangePasswordPayload,
} from './users.types';
import { comparePasswords, hashPassword } from '../../shared/auth-utils';
import { ValidationError } from '../../shared/errors';

const SALT_ROUNDS = parseInt(secret('SALT_ROUNDS')());

// Error message constants
const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  INVALID_PASSWORD: 'Current password is invalid',
};

/**
 * Creates user use cases to handle user business logic
 * @returns Object containing user use cases
 */
export const createUserUseCases = () => {
  /**
   * Changes a user's password
   * @param id The ID of the user
   * @param data Password change payload
   * @returns Updated user (without password hash)
   * @throws {ValidationError} If user not found or current password is invalid
   */
  const changePassword = async (
    id: number,
    data: ChangePasswordPayload,
  ): Promise<SafeUser> => {
    const user = await userRepository.findOneWithPassword(id);
    if (!user) {
      throw new ValidationError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const isValid = await comparePasswords(
      data.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_PASSWORD);
    }

    const passwordHash = await hashPassword(data.newPassword, SALT_ROUNDS);
    return await userRepository.update(id, {
      passwordHash,
    } as UpdateUserPayload);
  };

  return {
    changePassword,
  };
};

export const userUseCases = createUserUseCases();
