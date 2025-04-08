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
