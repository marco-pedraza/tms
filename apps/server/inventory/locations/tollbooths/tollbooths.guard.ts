import { ValidationError } from '@repo/base-repo';
import type { Tollbooth } from './tollbooths.types';

const TOLLBOOTH_ERRORS = {
  MISSING_TOLL_PRICE: (nodeId: number) =>
    `Tollbooth ${nodeId} is missing required property 'toll_price'`,
  INVALID_TOLL_PRICE: (nodeId: number, value: number) =>
    `Tollbooth ${nodeId} has invalid toll_price: ${value} (must be >= 0)`,
  MISSING_IAVE_ENABLED: (nodeId: number) =>
    `Tollbooth ${nodeId} is missing required property 'iave_enabled'`,
};

/**
 * Validates that a tollbooth has valid business data
 *
 * @param tollbooth - The tollbooth to validate
 * @throws {ValidationError} If tollbooth data is invalid
 */
export function assertIsValidTollbooth(tollbooth: Tollbooth): void {
  // Validate toll_price
  if (tollbooth.tollPrice === null || tollbooth.tollPrice === undefined) {
    throw new ValidationError(
      TOLLBOOTH_ERRORS.MISSING_TOLL_PRICE(tollbooth.id),
    );
  }

  if (tollbooth.tollPrice < 0) {
    throw new ValidationError(
      TOLLBOOTH_ERRORS.INVALID_TOLL_PRICE(tollbooth.id, tollbooth.tollPrice),
    );
  }

  // Validate iave_enabled
  if (tollbooth.iaveEnabled === null || tollbooth.iaveEnabled === undefined) {
    throw new ValidationError(
      TOLLBOOTH_ERRORS.MISSING_IAVE_ENABLED(tollbooth.id),
    );
  }
}

/**
 * Validates multiple tollbooths
 *
 * @param tollbooths - Array of tollbooths to validate
 * @throws {ValidationError} If any tollbooth is invalid
 */
export function assertAreValidTollbooths(tollbooths: Tollbooth[]): void {
  const errors: string[] = [];

  for (const tollbooth of tollbooths) {
    try {
      assertIsValidTollbooth(tollbooth);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(`- Node ${tollbooth.id}: ${error.message}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Invalid tollbooths found:\n${errors.join('\n')}`,
    );
  }
}
