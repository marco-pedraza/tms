/**
 * Utility type to convert a string union type to an array of strings
 * for use with Zod enum validation.
 *
 * @template T - The string union type to convert
 * @returns An array type with all the string values from the union
 *
 * @example
 * ```typescript
 * type FieldTypes = 'string' | 'number' | 'boolean';
 * type FieldTypesArray = StringUnionToArray<FieldTypes>; // ['string', 'number', 'boolean']
 *
 * const schema = z.object({
 *   type: z.enum(StringUnionToArray<FieldTypes>())
 * });
 * ```
 */
export type StringUnionToArray<T extends string> = [T, ...T[]];

/**
 * Utility function to convert a string union type to an array of strings
 * for use with Zod enum validation.
 *
 * @template T - The string union type to convert
 * @returns An array with all the string values from the union
 *
 * @example
 * ```typescript
 * type FieldTypes = 'string' | 'number' | 'boolean';
 * const fieldTypesArray = StringUnionToArray<FieldTypes>(); // ['string', 'number', 'boolean']
 *
 * const schema = z.object({
 *   type: z.enum(fieldTypesArray)
 * });
 * ```
 */
export function StringUnionToArray<T extends string>(): StringUnionToArray<T> {
  // This function is a type helper and should not be called at runtime
  // It's used to extract the type information for TypeScript
  throw new Error(
    'StringUnionToArray should only be used as a type, not called at runtime',
  );
}

/**
 * Alternative utility type that creates a tuple type from a string union.
 * This is useful when you need to ensure the array has at least one element.
 *
 * @template T - The string union type to convert
 * @returns A tuple type with all the string values from the union
 *
 * @example
 * ```typescript
 * type FieldTypes = 'string' | 'number' | 'boolean';
 * type FieldTypesTuple = StringUnionToTuple<FieldTypes>; // ['string', 'number', 'boolean']
 * ```
 */
export type StringUnionToTuple<T extends string> = T extends unknown
  ? [T, ...StringUnionToTuple<Exclude<T, T>>]
  : [];

/**
 * Utility function to create an array from a string union type using Object.keys
 * This is the runtime equivalent that can be used with existing object patterns.
 *
 * @template T - The string union type
 * @param obj - An object with keys matching the union type
 * @returns An array of the object keys
 *
 * @example
 * ```typescript
 * type FieldTypes = 'string' | 'number' | 'boolean';
 *
 * const tempObject: { [key in FieldTypes]: undefined } = {
 *   string: undefined,
 *   number: undefined,
 *   boolean: undefined,
 * };
 *
 * const fieldTypesArray = createEnumArray(tempObject); // ['string', 'number', 'boolean']
 * ```
 */
export function createEnumArray<T extends string>(obj: {
  [key in T]: unknown;
}): StringUnionToArray<T> {
  return Object.keys(obj) as StringUnionToArray<T>;
}
