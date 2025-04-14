import { APIError } from 'encore.dev/api';
import {
  NotFoundError,
  ValidationError,
  DuplicateError,
  ForeignKeyError,
} from '@repo/base-repo';
import { InvalidStateTransitionError } from '@repo/state-machine';

/**
 * Utility for standardized API error creation
 */
export const errors = {
  notFound: (message = 'Resource not found', details?: unknown) =>
    APIError.notFound(message).withDetails(details),

  invalidArgument: (message = 'Invalid argument provided', details?: unknown) =>
    APIError.invalidArgument(message).withDetails(details),

  alreadyExists: (
    message = 'Resource with this name or code already exists',
    details?: unknown,
  ) => APIError.alreadyExists(message).withDetails(details),

  unauthenticated: (message = 'Authentication failed', details?: unknown) =>
    APIError.unauthenticated(message).withDetails(details),

  permissionDenied: (message = 'Access denied', details?: unknown) =>
    APIError.permissionDenied(message).withDetails(details),

  canceled: (message = 'Operation was canceled', details?: unknown) =>
    APIError.canceled(message).withDetails(details),

  unknown: (message = 'An unknown error occurred', details?: unknown) =>
    APIError.unknown(message).withDetails(details),

  deadlineExceeded: (
    message = 'Operation deadline exceeded',
    details?: unknown,
  ) => APIError.deadlineExceeded(message).withDetails(details),

  resourceExhausted: (
    message = 'Resource has been exhausted',
    details?: unknown,
  ) => APIError.resourceExhausted(message).withDetails(details),

  failedPrecondition: (
    message = 'Operation failed due to failed precondition',
    details?: unknown,
  ) => APIError.failedPrecondition(message).withDetails(details),

  aborted: (message = 'Operation was aborted', details?: unknown) =>
    APIError.aborted(message).withDetails(details),

  outOfRange: (
    message = 'Operation was attempted past valid range',
    details?: unknown,
  ) => APIError.outOfRange(message).withDetails(details),

  unimplemented: (
    message = 'Operation is not implemented',
    details?: unknown,
  ) => APIError.unimplemented(message).withDetails(details),

  internal: (message = 'Internal server error', details?: unknown) =>
    APIError.internal(message).withDetails(details),

  unavailable: (
    message = 'Service is currently unavailable',
    details?: unknown,
  ) => APIError.unavailable(message).withDetails(details),

  dataLoss: (
    message = 'Unrecoverable data loss or corruption',
    details?: unknown,
  ) => APIError.dataLoss(message).withDetails(details),
};

/**
 * Base error class for authentication errors
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Base error class for authorization errors (lack of permissions)
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Access denied: insufficient permissions') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Maps domain-specific errors to APIError instances
 *
 * @param error - The error to parse
 * @returns {APIError} An APIError with the appropriate error code and message
 * - NotFoundError -> notFound
 * - ValidationError -> invalidArgument
 * - DuplicateError -> alreadyExists
 * - ForeignKeyError -> notFound (maps to NotFound for consistent API behavior)
 * - AuthenticationError -> unauthenticated
 * - UnauthorizedError -> permissionDenied
 * - InvalidStatusTransitionError -> failedPrecondition
 * - InvalidStateTransitionError -> failedPrecondition
 * - Other errors -> internal
 */
export const parseApiError = (error: unknown): APIError => {
  if (error instanceof NotFoundError) {
    return errors.notFound(error.message);
  }
  if (error instanceof ValidationError) {
    return errors.invalidArgument(error.message);
  }
  if (error instanceof DuplicateError) {
    return errors.alreadyExists(error.message);
  }
  if (error instanceof ForeignKeyError) {
    // Map foreign key errors to NotFound for consistent API behavior
    return errors.notFound(error.message);
  }
  if (error instanceof AuthenticationError) {
    return errors.unauthenticated(error.message);
  }
  if (error instanceof UnauthorizedError) {
    return errors.permissionDenied(error.message);
  }
  if (error instanceof InvalidStateTransitionError) {
    return errors.failedPrecondition(error.message);
  }
  return errors.internal(
    error instanceof Error ? error.message : 'An unexpected error occurred',
  );
};

// Re-export errors from @repo/base-repo to maintain backward compatibility
export { NotFoundError, ValidationError, DuplicateError, ForeignKeyError };
