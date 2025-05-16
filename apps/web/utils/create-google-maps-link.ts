/**
 * Creates a Google Maps link from coordinates
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Google Maps URL for the location
 */
export default function createGoogleMapsLink(
  latitude: number,
  longitude: number,
): string {
  const coordinates = `${latitude},${longitude}`;
  return `https://www.google.com/maps?q=${coordinates}`;
}
