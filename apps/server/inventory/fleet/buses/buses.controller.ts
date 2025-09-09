import { api } from 'encore.dev/api';
import { busModelRepository } from '@/inventory/fleet/bus-models/bus-models.repository';
import { technologiesRepository } from '@/inventory/fleet/technologies/technologies.repository';
import type {
  AssignDriverToBusCrewPayload,
  Bus,
  CreateBusPayload,
  ExtendedBusData,
  ListBusStatusesResult,
  ListBusesQueryParams,
  ListBusesResult,
  PaginatedListBusesQueryParams,
  PaginatedListBusesResult,
  UpdateBusPayload,
} from './buses.types';
import {
  AssignTechnologiesToBusPayload,
  BusWithRelations,
} from './buses.types';
import { busRepository } from './buses.repository';
import {
  validateBus,
  validateDriverAssignmentToBusCrew,
  validateTechnologyAssignment,
} from './buses.domain';
import {
  assignDriversToBusCrew as assignDriversToBusCrewUseCase,
  assignTechnologiesToBus as assignTechnologiesToBusUseCase,
  createBusWithSeatDiagram,
  updateBusWithSeatDiagram,
} from './buses.use-cases';

/**
 * Creates a new bus.
 * @param params - The bus data to create
 * @returns {Promise<Bus>} The created bus
 * @throws {APIError} If the bus creation fails
 */
export const createBus = api(
  { method: 'POST', path: '/buses/create', expose: true },
  async (params: CreateBusPayload): Promise<Bus> => {
    await validateBus(params);
    return await createBusWithSeatDiagram(params);
  },
);

/**
 * Retrieves a bus by its ID.
 * @param params - Object containing the bus ID
 * @param params.id - The ID of the bus to retrieve
 * @returns {Promise<ExtendedBusData>} The found bus
 * @throws {APIError} If the bus is not found or retrieval fails
 */
export const getBus = api(
  { method: 'GET', path: '/buses/:id', expose: true },
  async ({ id }: { id: number }): Promise<ExtendedBusData> => {
    const bus = await busRepository.findOneWithRelations(id);
    const busModel = await busModelRepository.findOne(bus.modelId);
    const technologies = await technologiesRepository.findByBusId(bus.id);
    const busCrew = await busRepository.findBusCrewByBusId(id);

    return {
      ...busModel,
      ...bus,
      busModel: busModel.model,
      technologies,
      busCrew: busCrew ?? [],
    };
  },
);

/**
 * Retrieves all buses without pagination (useful for dropdowns).
 * @param params - Query options for ordering and filtering
 * @returns {Promise<ListBusesResult>} An object containing an array of buses
 * @throws {APIError} If retrieval fails
 */
export const listBuses = api(
  { method: 'POST', path: '/buses/list/all', expose: true },
  async (params: ListBusesQueryParams): Promise<ListBusesResult> => {
    const buses = await busRepository.findAll(params);
    return {
      data: buses,
    };
  },
);

/**
 * Retrieves buses with pagination (useful for tables).
 * @param params - Pagination parameters with query options
 * @returns {Promise<PaginatedListBusesResult>} Paginated list of buses
 * @throws {APIError} If retrieval fails
 */
export const listBusesPaginated = api(
  { method: 'POST', path: '/buses/list', expose: true },
  async (
    params: PaginatedListBusesQueryParams,
  ): Promise<PaginatedListBusesResult> => {
    return await busRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing bus.
 * @param params - Object containing the bus ID and update data
 * @param params.id - The ID of the bus to update
 * @param params.data - The bus data to update
 * @returns {Promise<Bus>} The updated bus
 * @throws {APIError} If the bus is not found or update fails
 */
export const updateBus = api(
  { method: 'PUT', path: '/buses/:id/update', expose: true },
  async ({ id, ...data }: UpdateBusPayload & { id: number }): Promise<Bus> => {
    await validateBus(data, id);
    const bus = await busRepository.findOne(id);
    return await updateBusWithSeatDiagram(bus, data);
  },
);

/**
 * Deletes a bus by its ID.
 * @param params - Object containing the bus ID
 * @param params.id - The ID of the bus to delete
 * @returns {Promise<Bus>} The deleted bus
 * @throws {APIError} If the bus is not found or deletion fails
 */
export const deleteBus = api(
  { method: 'DELETE', path: '/buses/:id/delete', expose: true },
  async ({ id }: { id: number }): Promise<Bus> => {
    return await busRepository.delete(id);
  },
);

/**
 * Gets all valid next statuses for a bus.
 * @param params - Object containing the bus ID
 * @param params.id - The ID of the bus
 * @returns {Promise<ListBusStatusesResult>} An object containing allowed transitions
 * @throws {APIError} If retrieval fails
 */
export const listBusValidNextStatuses = api(
  {
    method: 'GET',
    path: '/buses/:id/valid-next-statuses',
    expose: true,
  },
  async ({ id }: { id: number }): Promise<ListBusStatusesResult> => {
    const statuses = await busRepository.getAllowedStatusTransitions(id);
    return { data: statuses };
  },
);

/**
 * Assigns technologies to a bus.
 * This is a destructive operation that replaces existing technologies.
 * @param params - Object containing the bus ID and technologies to assign
 * @param params.id - The ID of the bus to assign technologies to
 * @param params.technologyIds - Array of technology IDs to assign to the bus
 * @returns {Promise<BusWithRelations>} The updated bus with its relations and assigned technologies
 * @throws {APIError} If the bus is not found, validation fails, or assignment fails
 */
export const assignTechnologiesToBus = api(
  { expose: true, method: 'POST', path: '/buses/:id/technologies/assign' },
  async ({
    id,
    technologyIds,
  }: AssignTechnologiesToBusPayload & {
    id: number;
  }): Promise<BusWithRelations> => {
    await validateTechnologyAssignment(id, { technologyIds });
    return await assignTechnologiesToBusUseCase(id, {
      technologyIds,
    });
  },
);

/**
 * Assigns drivers to a bus crew (destructive sync).
 * Replaces existing active assignments for this bus with the provided set.
 * @param params - Object containing the bus ID and driver IDs
 * @param params.id - The ID of the bus
 * @param params.driverIds - Array of driver IDs to assign to the bus
 * @returns {Promise<BusWithRelations>} The updated bus with relations (including busCrew)
 * @throws {APIError} If validation or assignment fails
 */
export const assignDriversToBusCrew = api(
  {
    method: 'POST',
    path: '/buses/:id/crew/assign',
    expose: true,
  },
  async ({
    id,
    driverIds,
  }: AssignDriverToBusCrewPayload & {
    id: number;
  }): Promise<BusWithRelations> => {
    await validateDriverAssignmentToBusCrew(id, { driverIds });
    return await assignDriversToBusCrewUseCase(id, {
      driverIds,
    });
  },
);
