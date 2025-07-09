import { describe, expect, test } from 'vitest';
import { FieldErrorCollector } from '@repo/base-repo';
import { validateAndCastPropertyValue } from './installation-properties.domain';

describe('Installation Properties Domain', () => {
  describe('validateAndCastPropertyValue', () => {
    describe('required field validation', () => {
      test('should add error for empty required string field', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'string', required: true, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '',
          schema,
          collector,
        );

        expect(result).toBe('');
        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe('testField');
        expect(errors[0].code).toBe('REQUIRED');
      });

      test('should not add error for empty non-required field', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'string', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '',
          schema,
          collector,
        );

        expect(result).toBe('');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should not add error for whitespace-only non-required field', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'string', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '   ',
          schema,
          collector,
        );

        expect(result).toBe('   ');
        expect(collector.hasErrors()).toBe(false);
      });
    });

    describe('string type validation', () => {
      test('should return string value as-is', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'string', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          'test value',
          schema,
          collector,
        );

        expect(result).toBe('test value');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should handle long_text type same as string', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'long_text', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          'long text content',
          schema,
          collector,
        );

        expect(result).toBe('long text content');
        expect(collector.hasErrors()).toBe(false);
      });
    });

    describe('number type validation', () => {
      test('should validate valid integer', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'number', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '42',
          schema,
          collector,
        );

        expect(result).toBe('42');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should validate valid decimal', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'number', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '3.14',
          schema,
          collector,
        );

        expect(result).toBe('3.14');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should validate negative number', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'number', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '-123',
          schema,
          collector,
        );

        expect(result).toBe('-123');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should add error for invalid number', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'number', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          'not a number',
          schema,
          collector,
        );

        expect(result).toBe('not a number');
        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe('testField');
        expect(errors[0].code).toBe('INVALID_NUMBER');
      });

      test('should allow empty value for non-required number field', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'number', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '',
          schema,
          collector,
        );

        expect(result).toBe('');
        expect(collector.hasErrors()).toBe(false);
      });
    });

    describe('boolean type validation', () => {
      test('should normalize "true" to "true"', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'boolean', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          'true',
          schema,
          collector,
        );

        expect(result).toBe('true');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should normalize "false" to "false"', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'boolean', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          'false',
          schema,
          collector,
        );

        expect(result).toBe('false');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should normalize "1" to "true"', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'boolean', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '1',
          schema,
          collector,
        );

        expect(result).toBe('true');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should normalize "0" to "false"', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'boolean', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '0',
          schema,
          collector,
        );

        expect(result).toBe('false');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should handle case insensitive values', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'boolean', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          'TRUE',
          schema,
          collector,
        );

        expect(result).toBe('true');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should add error for invalid boolean value', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'boolean', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          'maybe',
          schema,
          collector,
        );

        expect(result).toBe('maybe');
        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe('testField');
        expect(errors[0].code).toBe('INVALID_BOOLEAN');
      });
    });

    describe('date type validation', () => {
      test('should validate correct date format', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'date', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '2024-03-15',
          schema,
          collector,
        );

        expect(result).toBe('2024-03-15');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should add error for invalid date format', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'date', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '15/03/2024',
          schema,
          collector,
        );

        expect(result).toBe('15/03/2024');
        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe('testField');
        expect(errors[0].code).toBe('INVALID_DATE');
      });

      test('should add error for invalid date', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'date', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          '2024-02-30',
          schema,
          collector,
        );

        expect(result).toBe('2024-02-30');
        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe('testField');
        expect(errors[0].code).toBe('INVALID_DATE');
      });

      test('should add error for non-date string', () => {
        const collector = new FieldErrorCollector();
        const schema = { type: 'date', required: false, options: {} };

        const result = validateAndCastPropertyValue(
          'testField',
          'not a date',
          schema,
          collector,
        );

        expect(result).toBe('not a date');
        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe('testField');
        expect(errors[0].code).toBe('INVALID_DATE');
      });
    });

    describe('enum type validation', () => {
      test('should validate valid enum value', () => {
        const collector = new FieldErrorCollector();
        const schema = {
          type: 'enum',
          required: false,
          options: { enumValues: ['option1', 'option2', 'option3'] },
        };

        const result = validateAndCastPropertyValue(
          'testField',
          'option2',
          schema,
          collector,
        );

        expect(result).toBe('option2');
        expect(collector.hasErrors()).toBe(false);
      });

      test('should add error for invalid enum value', () => {
        const collector = new FieldErrorCollector();
        const schema = {
          type: 'enum',
          required: false,
          options: { enumValues: ['option1', 'option2', 'option3'] },
        };

        const result = validateAndCastPropertyValue(
          'testField',
          'invalid_option',
          schema,
          collector,
        );

        expect(result).toBe('invalid_option');
        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe('testField');
        expect(errors[0].code).toBe('INVALID_ENUM_VALUE');
      });

      test('should add error for enum with no options', () => {
        const collector = new FieldErrorCollector();
        const schema = {
          type: 'enum',
          required: false,
          options: {},
        };

        const result = validateAndCastPropertyValue(
          'testField',
          'any_value',
          schema,
          collector,
        );

        expect(result).toBe('any_value');
        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe('testField');
        expect(errors[0].code).toBe('INVALID_ENUM_SCHEMA');
      });

      test('should add error for enum with invalid options', () => {
        const collector = new FieldErrorCollector();
        const schema = {
          type: 'enum',
          required: false,
          options: { enumValues: [] },
        };

        const result = validateAndCastPropertyValue(
          'testField',
          'any_value',
          schema,
          collector,
        );

        expect(result).toBe('any_value');
        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe('testField');
        expect(errors[0].code).toBe('INVALID_ENUM_VALUE');
      });
    });

    describe('unsupported type validation', () => {
      test('should add error for unsupported field type', () => {
        const collector = new FieldErrorCollector();
        const schema = {
          type: 'unsupported_type',
          required: false,
          options: {},
        };

        const result = validateAndCastPropertyValue(
          'testField',
          'any_value',
          schema,
          collector,
        );

        expect(result).toBe('any_value');
        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe('testField');
        expect(errors[0].code).toBe('UNSUPPORTED_TYPE');
      });
    });

    describe('multiple validation errors', () => {
      test('should accumulate multiple errors in collector', () => {
        const collector = new FieldErrorCollector();
        const schema1 = { type: 'number', required: true, options: {} };
        const schema2 = { type: 'boolean', required: false, options: {} };

        // First validation - required field empty
        validateAndCastPropertyValue('field1', '', schema1, collector);

        // Second validation - invalid boolean
        validateAndCastPropertyValue(
          'field2',
          'invalid_bool',
          schema2,
          collector,
        );

        expect(collector.hasErrors()).toBe(true);
        const errors = collector.getErrors();
        expect(errors.length).toBe(2);

        const field1Error = errors.find((e) => e.field === 'field1');
        const field2Error = errors.find((e) => e.field === 'field2');

        expect(field1Error).toBeDefined();
        expect(field2Error).toBeDefined();
        expect(field1Error?.code).toBe('REQUIRED');
        expect(field2Error?.code).toBe('INVALID_BOOLEAN');
      });
    });
  });
});
