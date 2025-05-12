import { api } from 'encore.dev/api';
import type {
  CreateGatePayload,
  Gate,
  Gates,
  GatesQueryOptions,
  PaginatedGates,
  PaginationParamsGates,
  UpdateGatePayload,
} from './gates.types';
import { gateRepository } from './gates.repository';

/**
 * Creates a new gate.
 * @param params - The gate data to create
 * @returns {Promise<Gate>} The created gate
 * @throws {APIError} If the gate creation fails
 */
export const createGate = api(
  { expose: true, method: 'POST', path: '/gates' },
  async (params: CreateGatePayload): Promise<Gate> => {
    return await gateRepository.create(params);
  },
);

/**
 * Retrieves a gate by its ID.
 * @param params - Object containing the gate ID
 * @param params.id - The ID of the gate to retrieve
 * @returns {Promise<Gate>} The found gate
 * @throws {APIError} If the gate is not found or retrieval fails
 */
export const getGate = api(
  { expose: true, method: 'GET', path: '/gates/:id' },
  async ({ id }: { id: number }): Promise<Gate> => {
    return await gateRepository.findOne(id);
  },
);

/**
 * Retrieves all gates without pagination (useful for dropdowns).
 * @returns {Promise<Gates>} An object containing an array of gates
 * @throws {APIError} If retrieval fails
 */
export const listGates = api(
  { expose: true, method: 'POST', path: '/get-gates' },
  async (params: GatesQueryOptions): Promise<Gates> => {
    const gates = await gateRepository.findAll(params);
    return {
      gates,
    };
  },
);

/**
 * Retrieves gates with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedGates>} Paginated list of gates
 * @throws {APIError} If retrieval fails
 */
export const listGatesPaginated = api(
  { expose: true, method: 'POST', path: '/get-gates/paginated' },
  async (params: PaginationParamsGates): Promise<PaginatedGates> => {
    return await gateRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing gate.
 * @param params - Object containing the gate ID and update data
 * @param params.id - The ID of the gate to update
 * @returns {Promise<Gate>} The updated gate
 * @throws {APIError} If the gate is not found or update fails
 */
export const updateGate = api(
  { expose: true, method: 'PUT', path: '/gates/:id' },
  async ({
    id,
    ...data
  }: UpdateGatePayload & { id: number }): Promise<Gate> => {
    return await gateRepository.update(id, data);
  },
);

/**
 * Deletes a gate by its ID.
 * @param params - Object containing the gate ID
 * @param params.id - The ID of the gate to delete
 * @returns {Promise<Gate>} The deleted gate
 * @throws {APIError} If the gate is not found or deletion fails
 */
export const deleteGate = api(
  { expose: true, method: 'DELETE', path: '/gates/:id' },
  async ({ id }: { id: number }): Promise<Gate> => {
    return await gateRepository.delete(id);
  },
);
