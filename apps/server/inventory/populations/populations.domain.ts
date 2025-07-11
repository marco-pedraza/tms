import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../shared/errors';
import { cityRepository } from '../cities/cities.repository';
import { cities } from '../cities/cities.schema';
import { populations } from './populations.schema';
import type {
  AssignCitiesPayload,
  CreatePopulationPayload,
  UpdatePopulationPayload,
} from './populations.types';
import { populationRepository } from './populations.repository';

/**
 * Validate uniqueness constraints for population data
 * @param payload - Population data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validatePopulationUniqueness(
  payload: CreatePopulationPayload | UpdatePopulationPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.code) {
    fieldsToCheck.push({
      field: populations.code,
      value: payload.code,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await populationRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Population',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates population data according to business rules
 * @param payload - Population data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validatePopulation(
  payload: CreatePopulationPayload | UpdatePopulationPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validatePopulationUniqueness(payload, currentId);
  validator.throwIfErrors();
}

export async function validateCityAssignment(
  populationId: number,
  cityId: number,
): Promise<void> {
  const collector = new FieldErrorCollector();
  // Validate population exists
  const populationExists = await populationRepository.existsBy(
    populations.id,
    populationId,
  );
  collector.addIf(
    !populationExists,
    'populationId',
    'NOT_FOUND',
    `Population with id ${populationId} not found`,
    populationId,
  );
  // Validate city exists
  const cityExists = await cityRepository.existsBy(cities.id, cityId);
  collector.addIf(
    !cityExists,
    'cityId',
    'NOT_FOUND',
    `City with id ${cityId} not found`,
    cityId,
  );
  collector.throwIfErrors();
}
/**
 * Validates city assignment data for a population
 * @param populationId - The ID of the population to validate
 * @param data - The assignment data containing city IDs
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateCityListAssignment(
  populationId: number,
  data: AssignCitiesPayload,
): Promise<void> {
  const collector = new FieldErrorCollector();

  // Validate that cityIds array has no duplicates
  const uniqueCityIds = new Set(data.cityIds);
  collector.addIf(
    uniqueCityIds.size !== data.cityIds.length,
    'cityIds',
    'DUPLICATE_INPUT',
    'Duplicate city IDs are not allowed in the assignment',
    data.cityIds,
  );
  collector.throwIfErrors(); // Stop immediately if duplicates found

  // Validate population exists
  const populationExists = await populationRepository.existsBy(
    populations.id,
    populationId,
  );
  collector.addIf(
    !populationExists,
    'populationId',
    'NOT_FOUND',
    `Population with id ${populationId} not found`,
    populationId,
  );
  collector.throwIfErrors(); // Stop immediately if population not found

  // If cityIds is empty, no need to validate cities
  if (data.cityIds.length === 0) {
    return;
  }

  // Validate all cities exist using the city repository
  const nonExistentCityIds = await cityRepository.validateCitiesExist(
    data.cityIds,
  );

  collector.addIf(
    nonExistentCityIds.length > 0,
    'cityIds',
    'NOT_FOUND',
    `Cities with IDs [${nonExistentCityIds.join(', ')}] not found`,
    nonExistentCityIds,
  );
  collector.throwIfErrors(); // Stop immediately if cities not found

  // Validate that cities are not already assigned to any other population
  const alreadyAssignedCityIds =
    await populationRepository.getAlreadyAssignedCities(
      data.cityIds,
      populationId, // Exclude current population to allow reassignment within same population
    );

  collector.addIf(
    alreadyAssignedCityIds.length > 0,
    'cityIds',
    'DUPLICATE',
    `Cities with IDs [${alreadyAssignedCityIds.join(', ')}] are already assigned to other populations`,
    alreadyAssignedCityIds,
  );
  collector.throwIfErrors(); // Stop immediately if cities already assigned
}
