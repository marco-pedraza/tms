import { terminals } from './terminals.schema';
import type {
  Terminal,
  CreateTerminalPayload,
  UpdateTerminalPayload,
  PaginatedTerminals,
} from './terminals.types';
import { createBaseRepository } from '../../shared/base-repository';
import { cityRepository } from '../cities/cities.repository';
import { PaginationParams } from '../../shared/types';

const DEFAULT_ERROR_MESSAGE = 'Terminal with this slug or code already exists';

/**
 * Creates a repository for managing terminal entities
 * @returns {Object} An object containing terminal-specific operations and base CRUD operations
 */
export const createTerminalRepository = () => {
  const baseRepository = createBaseRepository<
    Terminal,
    CreateTerminalPayload,
    UpdateTerminalPayload,
    typeof terminals
  >(terminals, 'Terminal');

  /**
   * Validates that a city exists in the database
   * @param cityId - The ID of the city to validate
   */
  const validateCityExists = async (cityId: number): Promise<void> => {
    await cityRepository.findOne(cityId);
  };

  /**
   * Validates that a terminal's slug and code are unique
   * @param slug - The slug to validate (optional)
   * @param code - The code to validate (optional)
   * @param excludeId - Optional ID to exclude from the validation
   */
  const validateUniquess = async (
    slug?: string,
    code?: string,
    excludeId?: number,
  ): Promise<void> => {
    if (!slug && !code) {
      return;
    }

    const fieldsToValidate = [];

    if (slug) {
      fieldsToValidate.push({ field: terminals.slug, value: slug });
    }

    if (code) {
      fieldsToValidate.push({ field: terminals.code, value: code });
    }

    await baseRepository.validateUniqueness(
      fieldsToValidate,
      excludeId,
      DEFAULT_ERROR_MESSAGE,
    );
  };

  /**
   * Creates a new terminal with city validation
   * @param data - The terminal data to create
   * @returns The created terminal
   */
  const create = async (data: CreateTerminalPayload): Promise<Terminal> => {
    await validateCityExists(data.cityId);
    await validateUniquess(data.slug, data.code);

    return baseRepository.create(data);
  };

  /**
   * Updates a terminal with validations
   * @param id - The ID of the terminal to update
   * @param data - The terminal data to update
   * @returns The updated terminal
   */
  const update = async (
    id: number,
    data: UpdateTerminalPayload,
  ): Promise<Terminal> => {
    if (data.cityId) {
      await validateCityExists(data.cityId);
    }
    await validateUniquess(data.slug, data.code, id);

    return baseRepository.update(id, data);
  };

  /**
   * Lists terminals with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of terminals
   */
  const listPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedTerminals> => {
    return baseRepository.findAllPaginated({
      ...params,
      sortBy: params.sortBy || 'name',
      sortDirection: params.sortDirection || 'asc',
    });
  };

  return {
    ...baseRepository,
    create,
    update,
    findAllPaginated: listPaginated,
  };
};

// Export the terminal repository instance
export const terminalRepository = createTerminalRepository();
