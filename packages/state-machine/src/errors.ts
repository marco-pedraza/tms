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
 * Error thrown when an invalid state transition is attempted
 */
export class InvalidStateTransitionError extends Error {
  constructor(fromState: string, toState: string, entityName = 'Entity') {
    super(
      `Invalid ${entityName.toLowerCase()} status transition from ${fromState} to ${toState}`,
    );
    this.name = 'InvalidStateTransitionError';
  }
}
