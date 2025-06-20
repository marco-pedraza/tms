import { FieldValidationError, type FieldError } from './errors';

/**
 * Enhanced collector to accumulate field validation errors
 * Supports simple fields, arrays, and nested objects
 */
export class FieldErrorCollector {
  private errors: FieldError[] = [];

  /**
   * Add a field validation error
   */
  addError(
    field: string,
    code: string,
    message: string,
    value?: unknown,
  ): void {
    this.errors.push({ field, code, message, value });
  }

  /**
   * Add an error if the condition is true
   */
  addIf(
    condition: boolean,
    field: string,
    code: string,
    message: string,
    value?: unknown,
  ): void {
    if (condition) {
      this.addError(field, code, message, value);
    }
  }

  /**
   * Add error for array element with index context
   */
  addArrayError(
    arrayField: string,
    index: number,
    field: string,
    code: string,
    message: string,
    value?: unknown,
  ): void {
    this.addError(
      `${arrayField}[${index}].${field}`,
      code,
      `Item ${index + 1}: ${message}`,
      value,
    );
  }

  /**
   * Add array error if condition is true
   */
  addArrayIf(
    condition: boolean,
    arrayField: string,
    index: number,
    field: string,
    code: string,
    message: string,
    value?: unknown,
  ): void {
    if (condition) {
      this.addArrayError(arrayField, index, field, code, message, value);
    }
  }

  /**
   * Add error for nested object fields
   */
  addNestedError(
    objectPath: string,
    field: string,
    code: string,
    message: string,
    value?: unknown,
  ): void {
    this.addError(`${objectPath}.${field}`, code, message, value);
  }

  /**
   * Add nested error if condition is true
   */
  addNestedIf(
    condition: boolean,
    objectPath: string,
    field: string,
    code: string,
    message: string,
    value?: unknown,
  ): void {
    if (condition) {
      this.addNestedError(objectPath, field, code, message, value);
    }
  }

  /**
   * Add multiple errors at once
   */
  addErrors(errors: FieldError[]): void {
    this.errors.push(...errors);
  }

  /**
   * Check if there are errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Throw exception if there are errors
   */
  throwIfErrors(): void {
    if (this.hasErrors()) {
      throw FieldValidationError.fields(this.errors);
    }
  }

  /**
   * Get all errors
   */
  getErrors(): FieldError[] {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Get errors count
   */
  getErrorCount(): number {
    return this.errors.length;
  }
}
