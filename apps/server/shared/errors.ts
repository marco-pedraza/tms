import { APIError, ErrCode } from 'encore.dev/api';

/**
 * Base error class for resources not found
 */
export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Base error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Base error class for duplicate resource errors
 */
export class DuplicateError extends Error {
  constructor(
    message: string = 'Resource with this name or code already exists',
  ) {
    super(message);
    this.name = 'DuplicateError';
  }
}

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
 * - NotFoundError -> ErrCode.NotFound
 * - ValidationError -> ErrCode.InvalidArgument
 * - DuplicateError -> ErrCode.AlreadyExists
 * - AuthenticationError -> ErrCode.Unauthenticated
 * - UnauthorizedError -> ErrCode.PermissionDenied
 * - Other errors -> ErrCode.Internal
 */
export const parseApiError = (error: unknown) => {
  if (error instanceof NotFoundError) {
    return new APIError(ErrCode.NotFound, error.message);
  }
  if (error instanceof ValidationError) {
    return new APIError(ErrCode.InvalidArgument, error.message);
  }
  if (error instanceof DuplicateError) {
    return new APIError(ErrCode.AlreadyExists, error.message);
  }
  if (error instanceof AuthenticationError) {
    return new APIError(ErrCode.Unauthenticated, error.message);
  }
  if (error instanceof UnauthorizedError) {
    return new APIError(ErrCode.PermissionDenied, error.message);
  }
  return new APIError(ErrCode.Internal, 'Internal server error');
};
