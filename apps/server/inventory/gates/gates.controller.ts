import { api } from 'encore.dev/api';
import { gateRepository } from './gates.repository';
import type {
  CreateGatePayload,
  UpdateGatePayload,
  Gate,
  PaginatedGates,
} from './gates.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';

const withErrorHandling = createControllerErrorHandler('GatesController');

/**
 * Creates a new gate.
 * @param params - The gate data to create
 * @returns {Promise<Gate>} The created gate
 * @throws {APIError} If the gate creation fails
 */
export const createGate = api(
  { method: 'POST', path: '/gates', expose: true },
  async (params: CreateGatePayload): Promise<Gate> => {
    return withErrorHandling('createGate', () => gateRepository.create(params));
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
  { method: 'GET', path: '/gates/:id', expose: true },
  async ({ id }: { id: number }): Promise<Gate> => {
    return withErrorHandling('getGate', () => gateRepository.findOne(id));
  },
);

/**
 * Retrieves gates with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedGates>} Paginated list of gates
 * @throws {APIError} If retrieval fails
 */
export const listGates = api(
  { method: 'GET', path: '/gates', expose: true },
  async (params: PaginationParams): Promise<PaginatedGates> => {
    return withErrorHandling('listGates', () =>
      gateRepository.findAllPaginated(params),
    );
  },
);

/**
 * Retrieves gates for a terminal with pagination.
 * @param params - Object containing the terminal ID and pagination parameters
 * @returns {Promise<PaginatedGates>} Paginated list of gates for the terminal
 * @throws {APIError} If retrieval fails
 */
export const listGatesByTerminal = api(
  { method: 'GET', path: '/terminals/:terminalId/gates', expose: true },
  async ({
    terminalId,
    ...paginationParams
  }: { terminalId: number } & PaginationParams): Promise<PaginatedGates> => {
    return withErrorHandling('listGatesByTerminal', () =>
      gateRepository.findByTerminal(terminalId, paginationParams),
    );
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
  { method: 'PUT', path: '/gates/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateGatePayload & { id: number }): Promise<Gate> => {
    return withErrorHandling('updateGate', () =>
      gateRepository.update(id, data),
    );
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
  { method: 'DELETE', path: '/gates/:id', expose: true },
  async ({ id }: { id: number }): Promise<Gate> => {
    return withErrorHandling('deleteGate', () => gateRepository.delete(id));
  },
);
