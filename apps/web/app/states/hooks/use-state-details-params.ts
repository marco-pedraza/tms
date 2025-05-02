import { useParams } from 'next/navigation';

/**
 * Parses and validates state ID from the URL parameters
 *
 * @returns Object containing the stateId and validation state
 * @returns {string} result.stateId - The parsed state ID
 * @returns {boolean} result.isValidId - Whether the ID is valid
 */
export default function useStateDetailsParams() {
  const params = useParams();
  const id = params?.id as string;

  // Validate that the ID is a number
  const numericId = id ? parseInt(id, 10) : NaN;
  const isValidId = !isNaN(numericId) && numericId > 0;

  return {
    stateId: id,
    isValidId,
  };
}
