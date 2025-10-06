import { FieldErrorCollector, NotFoundError } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { permissionRepository } from '../permissions/permissions.repository';
import { roles } from './roles.schema';
import type {
  AssignPermissionsToRolePayload,
  CreateRolePayload,
  UpdateRolePayload,
} from './roles.types';
import { roleRepository } from './roles.repository';

/**
 * Validate uniqueness constraints for role data
 * @param payload - Role data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateRoleUniqueness(
  payload: CreateRolePayload | UpdateRolePayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.code) {
    fieldsToCheck.push({
      field: roles.code,
      value: payload.code,
    });
  }

  if (payload.name) {
    fieldsToCheck.push({
      field: roles.name,
      value: payload.name,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await roleRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Role',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates that all permission IDs exist in the database
 * @param permissionIds - Array of permission IDs to validate
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validatePermissionsExist(
  permissionIds: number[],
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Validate all permissions exist
  await Promise.all(
    permissionIds.map(async (permissionId) => {
      try {
        await permissionRepository.findOne(permissionId);
      } catch (error) {
        if (error instanceof NotFoundError) {
          collector.addError(
            'permissionIds',
            'NOT_FOUND',
            `Permission with id ${permissionId} not found`,
            permissionId,
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
 * Validates role data according to business rules
 * @param payload - Role data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateRole(
  payload: CreateRolePayload | UpdateRolePayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateRoleUniqueness(payload, currentId);
  validator.throwIfErrors();
}

/**
 * Validates permissions assignment to a role
 * @param payload - Permission IDs to assign
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validatePermissionsAssignment(
  payload: AssignPermissionsToRolePayload,
): Promise<void> {
  const validator = await validatePermissionsExist(payload.permissionIds);
  validator.throwIfErrors();
}
