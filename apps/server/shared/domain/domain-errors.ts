import { FieldErrorCollector } from '@repo/base-repo';

/**
 * Supported types for error values
 */
export type ErrorValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>;

/**
 * Generic domain error helper type
 * @param collector - The field error collector
 * @param value - The error value (typically the invalid field value)
 */
export type DomainErrorHelper = (
  collector: FieldErrorCollector,
  value?: ErrorValue,
) => void;

/**
 * Creates domain error helpers from error message constants
 * @param errorMessages - Object with error message constants
 * @returns Object with error helper functions
 */
export function createDomainErrorHelpers<T extends Record<string, string>>(
  errorMessages: T,
): Record<keyof T, DomainErrorHelper> {
  return Object.entries(errorMessages).reduce<
    Record<string, DomainErrorHelper>
  >((helpers, [key, message]) => {
    helpers[key] = (collector: FieldErrorCollector, value?: ErrorValue) => {
      // Default field name based on error key (can be overridden)
      const fieldName = key.toLowerCase().replace(/_/g, '');
      collector.addError(fieldName, 'BUSINESS_RULE_VIOLATION', message, value);
    };
    return helpers;
  }, {}) as Record<keyof T, DomainErrorHelper>;
}

/**
 * Creates domain error helpers with custom field mapping
 * @param errorConfig - Configuration with messages and field mappings
 * @returns Object with error helper functions
 */
export function createDomainErrorHelpersWithFields<
  T extends Record<string, { message: string; field: string; code?: string }>,
>(errorConfig: T): Record<keyof T, DomainErrorHelper> {
  return Object.entries(errorConfig).reduce<Record<string, DomainErrorHelper>>(
    (helpers, [key, config]) => {
      helpers[key] = (collector: FieldErrorCollector, value?: ErrorValue) => {
        collector.addError(
          config.field,
          config.code ?? 'BUSINESS_RULE_VIOLATION',
          config.message,
          value,
        );
      };
      return helpers;
    },
    {},
  ) as Record<keyof T, DomainErrorHelper>;
}
