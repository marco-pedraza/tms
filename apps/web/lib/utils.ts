/**
 * Creates a Google Maps link from coordinates
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Google Maps URL for the location
 */
export function createGoogleMapsLink(
  latitude: number,
  longitude: number,
): string {
  const coordinates = `${latitude},${longitude}`;
  return `https://www.google.com/maps?q=${coordinates}`;
}

/**
 * Type definition for TanStack React Form field used in our form components
 * Includes only the properties we need for validation functions
 */
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
export function hasFieldErrors(field: FormField): boolean {
  return !!field.state.meta.errors?.length;
}
