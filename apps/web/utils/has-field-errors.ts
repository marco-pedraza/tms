export interface FormField {
  state: {
    meta: {
      errors?: unknown[];
      isTouched?: boolean;
      isValidating?: boolean;
    };
    value: unknown;
  };
  name: string;
}

/**
 * Checks if a TanStack React Form field has validation errors
 * @param field - The field object from TanStack React Form
 * @returns A boolean indicating if the field has validation errors
 */
export default function hasFieldErrors(field: FormField): boolean {
  return !!field.state.meta.errors?.length;
}
