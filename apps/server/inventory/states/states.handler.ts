import { db } from '../db/database';
import { states } from '../db/schemas/states.schema';
import { countries } from '../db/schemas/countries.schema';
import { eq, and } from 'drizzle-orm';
import { CreateStateDto, StateDto, UpdateStateDto } from './states.types';
import {
  NotFoundError,
  ValidationError,
  DuplicateError,
} from '../../shared/errors';

/**
 * Service class for managing state-related operations.
 * Handles CRUD operations and business logic for states.
 */
export class StateHandler {
  /**
   * Validates that a country exists in the database.
   * @param countryId - The ID of the country to validate
   * @throws {NotFoundError} If the country does not exist
   * @private
   */
  private async validateCountryExists(countryId: number): Promise<void> {
    const [country] = await db
      .select()
      .from(countries)
      .where(eq(countries.id, countryId))
      .limit(1);
    if (!country) {
      throw new NotFoundError('Country not found');
    }
  }

  /**
   * Validates that a state name and code combination is unique.
   * @param name - The name of the state to validate
   * @param code - The code of the state to validate
   * @param excludeId - Optional ID to exclude from validation (used in updates)
   * @throws {DuplicateError} If a state with the same name or code exists
   * @private
   */
  private async validateUniqueState(
    name: string,
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const conditions = [eq(states.name, name), eq(states.code, code)];

    if (excludeId) {
      conditions.push(eq(states.id, excludeId));
    }

    const [existingState] = await db
      .select()
      .from(states)
      .where(and(...conditions))
      .limit(1);

    if (existingState) {
      throw new DuplicateError('State with this name or code already exists');
    }
  }

  /**
   * Creates a new state in the database.
   * @param data - The state data to create
   * @returns {Promise<StateDto>} The created state
   * @throws {NotFoundError} If the associated country does not exist
   * @throws {DuplicateError} If a state with the same name or code exists
   * @throws {ValidationError} If there's a validation error
   */
  async create(data: CreateStateDto): Promise<StateDto> {
    try {
      await this.validateCountryExists(data.countryId);
      await this.validateUniqueState(data.name, data.code);

      const [state] = await db.insert(states).values(data).returning();
      return state;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Retrieves a state by its ID.
   * @param id - The ID of the state to retrieve
   * @returns {Promise<StateDto>} The found state
   * @throws {NotFoundError} If the state does not exist
   */
  async findOne(id: number): Promise<StateDto> {
    const [state] = await db
      .select()
      .from(states)
      .where(eq(states.id, id))
      .limit(1);

    if (!state) {
      throw new NotFoundError('State not found');
    }

    return state;
  }

  /**
   * Updates an existing state.
   * @param id - The ID of the state to update
   * @param data - The state data to update
   * @returns {Promise<StateDto>} The updated state
   * @throws {NotFoundError} If the state does not exist
   * @throws {NotFoundError} If the new country ID does not exist
   * @throws {DuplicateError} If the new name or code conflicts with existing states
   * @throws {ValidationError} If there's a validation error
   */
  async update(id: number, data: UpdateStateDto): Promise<StateDto> {
    try {
      // Verify state exists
      const existingState = await this.findOne(id);

      // If countryId is being updated, validate it exists
      if (data.countryId) {
        await this.validateCountryExists(data.countryId);
      }

      // If name or code is being updated, validate uniqueness
      if (data.name || data.code) {
        await this.validateUniqueState(
          data.name || existingState.name,
          data.code || existingState.code,
          id,
        );
      }

      const [updated] = await db
        .update(states)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(states.id, id))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Deletes a state by its ID.
   * @param id - The ID of the state to delete
   * @throws {NotFoundError} If the state does not exist
   */
  async delete(id: number): Promise<StateDto> {
    // Verify state exists
    await this.findOne(id);
    const [deletedState] = await db
      .delete(states)
      .where(eq(states.id, id))
      .returning();
    return deletedState;
  }

  /**
   * Retrieves all states from the database.
   * @returns {Promise<{ states: StateDto[] }>} An object containing an array of states
   */
  async findAll(): Promise<{ states: StateDto[] }> {
    const statesList = await db.select().from(states).orderBy(states.name);
    return {
      states: statesList,
    };
  }
}

export const stateHandler = new StateHandler();
