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
 * Interface for field validation errors
 */
export interface FieldError {
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

/**
 * Error for additional field validations (complements Encore validations)
 * Such as duplicates, complex rules, async validations, etc.
 */
export class FieldValidationError extends ValidationError {
  public readonly fieldErrors: FieldError[];

  constructor(fieldErrors: FieldError | FieldError[]) {
    const errors = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];
    const message =
      errors.length === 1
        ? `Validation failed for field '${errors[0].field}'`
        : `Validation failed for ${errors.length} fields`;

    super(message);
    this.name = 'FieldValidationError';
    this.fieldErrors = errors;
  }

  /**
   * Create error for a single field
   */
  static field(
    field: string,
    code: string,
    message: string,
    value?: unknown,
  ): FieldValidationError {
    return new FieldValidationError({ field, code, message, value });
  }

  /**
   * Create error for multiple fields
   */
  static fields(fieldErrors: FieldError[]): FieldValidationError {
    return new FieldValidationError(fieldErrors);
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
 * Base error class for foreign key constraint violations
 */
export class ForeignKeyError extends Error {
  public readonly field: string;
  public readonly referenceTable: string;

  constructor(message: string, field: string, referenceTable: string) {
    super(message);
    this.name = 'ForeignKeyError';
    this.field = field;
    this.referenceTable = referenceTable;
  }
}
