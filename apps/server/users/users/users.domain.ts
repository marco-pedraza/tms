import { FieldErrorCollector, NotFoundError } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { roleRepository } from '../roles/roles.repository';
import { users } from './users.schema';
import type { CreateUserPayload, UpdateUserPayload } from './users.types';
import { userRepository } from './users.repository';

/**
 * Validate uniqueness constraints for user data
 * @param payload - User data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateUserUniqueness(
  payload: CreateUserPayload | UpdateUserPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.email) {
    fieldsToCheck.push({
      field: users.email,
      value: payload.email,
    });
  }

  if ('username' in payload && payload.username) {
    fieldsToCheck.push({
      field: users.username,
      value: payload.username,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await userRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'User',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates that all role IDs exist in the database
 * @param roleIds - Array of role IDs to validate
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateRolesExist(
  roleIds: number[],
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Validate all roles exist
  await Promise.all(
    roleIds.map(async (roleId) => {
      try {
        await roleRepository.findOne(roleId);
      } catch (error) {
        if (error instanceof NotFoundError) {
          collector.addError(
            'roleIds',
            'NOT_FOUND',
            `Role with id ${roleId} not found`,
            roleId,
          );
        } else {
          throw error;
        }
      }
    }),
  );

  return collector;
}

/**
 * Validates user data according to business rules
 * @param payload - User data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateUser(
  payload: CreateUserPayload | UpdateUserPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateUserUniqueness(payload, currentId);

  // Validate roles if they are provided
  if (payload.roleIds && payload.roleIds.length > 0) {
    await validateRolesExist(payload.roleIds, validator);
  }

  validator.throwIfErrors();
}
