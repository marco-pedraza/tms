import { SpaceType } from '@/services/ims-client';

/**
 * Initializes seat-specific fields when changing space type to SEAT
 *
 * This function ensures that required seat fields (seatNumber, reclinementAngle, amenities)
 * are initialized with valid values when switching from a non-seat space type (like HALLWAY)
 * to a SEAT type. This prevents form validation errors from undefined/null values.
 */
export function initializeSeatFields(
  // @todo type this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spaceForm: any, // FormAPI type from tanstack-form
  newSpaceType: SpaceType,
  currentSeatNumber: string | undefined | null,
  currentReclinementAngle: string | undefined | null,
  currentAmenities: string[] | undefined | null,
) {
  if (newSpaceType === SpaceType.SEAT) {
    if (currentSeatNumber === undefined || currentSeatNumber === null) {
      spaceForm.setFieldValue('seatNumber', '');
    }
    if (
      currentReclinementAngle === undefined ||
      currentReclinementAngle === null
    ) {
      spaceForm.setFieldValue('reclinementAngle', '');
    }
    if (currentAmenities === undefined || currentAmenities === null) {
      spaceForm.setFieldValue('amenities', []);
    }
  }
}
