import {
  NotFoundError,
  ValidationError,
  DuplicateError,
  ForeignKeyError,
} from './errors';

/**
 * Type guard for PostgreSQL errors
 */
interface PgError {
  code: string;
  detail?: string;
}

/**
 * PostgreSQL error codes
 */
export const PG_ERROR_CODES = {
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
  CHECK_VIOLATION: '23514',
  NOT_NULL_VIOLATION: '23502',
} as const;

/**
 * Regular expressions for parsing PostgreSQL error details
 */
const ERROR_PATTERNS = {
  FOREIGN_KEY: /Key \((\w+)\)=\((\d+)\) is not present in table "(\w+)"/,
  UNIQUE_CONSTRAINT: /Key \((.+)\)=\((.+)\) already exists/,
  NOT_NULL: /null value in column "(\w+)"/,
};

/**
 * Main function to handle PostgreSQL errors and transform them into domain errors
 * @param error - The caught error
 * @param entityName - The name of the entity being operated on
 * @param operation - The operation being performed (create, update, delete)
 * @returns {Error} Domain-specific error that can be thrown by the caller
 */
export function handlePostgresError(
  error: unknown,
  entityName: string,
  operation: string,
): Error {
  if (!isPgError(error)) {
    // If not a recognized PostgreSQL error
    return new ValidationError(
      `Failed to ${operation} ${entityName}: ${getErrorMessage(error)}`,
    );
  }

  const pgError = error as PgError;
  const errorCode = pgError.code;
  const errorDetail = pgError.detail || '';

  // Use a switch statement for different error codes
  switch (errorCode) {
    case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      return handleForeignKeyViolation(errorDetail);

    case PG_ERROR_CODES.UNIQUE_VIOLATION:
      return handleUniqueViolation(errorDetail, entityName);

    case PG_ERROR_CODES.CHECK_VIOLATION:
      return new ValidationError(
        `Invalid data: ${errorDetail || 'check constraint violated'}`,
      );

    case PG_ERROR_CODES.NOT_NULL_VIOLATION:
      return handleNotNullViolation(errorDetail);

    default:
      // For other PostgreSQL errors
      return new ValidationError(
        `Database error (${errorCode}): ${errorDetail || 'Unknown database error'}`,
      );
  }
}

/**
 * Handles foreign key constraint violations
 * @returns {ForeignKeyError|ValidationError} Appropriate error based on the detail
 */
function handleForeignKeyViolation(errorDetail: string): Error {
  const matches = errorDetail.match(ERROR_PATTERNS.FOREIGN_KEY);
  if (matches && matches[1] && matches[2] && matches[3]) {
    const field = matches[1];
    const value = matches[2];
    const refTable = matches[3];
    return new ForeignKeyError(
      `${field} with value ${value} does not exist in ${refTable}`,
      field,
      refTable,
    );
  }

  // If we couldn't parse the foreign key error details
  return new ValidationError(`Invalid foreign key: ${errorDetail}`);
}

/**
 * Handles unique constraint violations
 * @returns {DuplicateError} Appropriate error for unique constraint violation
 */
function handleUniqueViolation(errorDetail: string, entityName: string): Error {
  const matches = errorDetail.match(ERROR_PATTERNS.UNIQUE_CONSTRAINT);
  if (matches && matches[1] && matches[2]) {
    const field = matches[1];
    const value = matches[2];
    return new DuplicateError(
      `${entityName} with ${field} '${value}' already exists`,
    );
  }

  // If we couldn't parse the unique constraint error details
  return new DuplicateError(`${entityName} already exists: ${errorDetail}`);
}

/**
 * Handles not null constraint violations
 * @returns {ValidationError} Appropriate error for not null constraint violation
 */
function handleNotNullViolation(errorDetail: string): Error {
  const matches = errorDetail.match(ERROR_PATTERNS.NOT_NULL);
  if (matches && matches[1]) {
    const field = matches[1];
    return new ValidationError(`${field} is required`);
  }

  // If we couldn't parse the not null error details
  return new ValidationError(`Required field missing: ${errorDetail}`);
}

/**
 * Checks if an error is a PostgreSQL error
 */
export function isPgError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Safely extracts error message from any error object
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Checks if an error is already an application error
 */
export function isApplicationError(error: unknown): boolean {
  return (
    error instanceof NotFoundError ||
    error instanceof ValidationError ||
    error instanceof DuplicateError ||
    error instanceof ForeignKeyError
  );
}
