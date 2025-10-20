import { api } from 'encore.dev/api';
import { NotFoundError } from '@/shared/errors';
import {
  CreateSeatDiagramZonePayload,
  PaginatedSeatDiagramZones,
  PaginationParamsSeatDiagramZones,
  SeatDiagramZone,
  SeatDiagramZoneQueryOptions,
  SeatDiagramZones,
  UpdateSeatDiagramZonePayload,
} from './seat-diagram-zones.types';
import { seatDiagramZoneRepository } from './seat-diagram-zones.repository';

// Internal type for repository create method
type CreateZoneWithDiagramId = CreateSeatDiagramZonePayload & {
  seatDiagramId: number;
};

/**
 * Creates a new seat diagram zone.
 * @param params - The zone data to create
 * @returns {Promise<SeatDiagramZone>} The created zone
 * @throws {APIError} If creation fails
 */
export const createSeatDiagramZone = api(
  {
    expose: true,
    method: 'POST',
    path: '/seat-diagrams/:seatDiagramId/zones',
    auth: true,
  },
  async (
    params: CreateSeatDiagramZonePayload & { seatDiagramId: number },
  ): Promise<SeatDiagramZone> => {
    // Extract the seatDiagramId from the URL path
    const { seatDiagramId, ...zoneData } = params;

    // Create the zone with the seatDiagramId from the URL
    return await seatDiagramZoneRepository.create({
      ...zoneData,
      seatDiagramId,
    } as CreateZoneWithDiagramId);
  },
);

/**
 * Retrieves a seat diagram zone by its ID.
 * @param params - Object containing the zone ID and diagram ID
 * @param params.id - The ID of the zone to retrieve
 * @param params.seatDiagramId - The ID of the diagram the zone belongs to
 * @returns {Promise<SeatDiagramZone>} The requested zone
 * @throws {APIError} If retrieval fails or zone doesn't exist
 */
export const getSeatDiagramZone = api(
  {
    expose: true,
    method: 'GET',
    path: '/seat-diagrams/:seatDiagramId/zones/:id',
    auth: true,
  },
  async ({
    id,
    seatDiagramId,
  }: {
    id: number;
    seatDiagramId: number;
  }): Promise<SeatDiagramZone> => {
    const zone = await seatDiagramZoneRepository.findOneForDiagram(
      seatDiagramId,
      id,
    );
    if (!zone) {
      throw new NotFoundError(
        `Zone with ID ${id} not found in diagram ${seatDiagramId}`,
      );
    }
    return zone;
  },
);

/**
 * Retrieves all zones for a specific seat diagram without pagination.
 * @param params - Object containing the seat diagram ID
 * @param params.seatDiagramId - The ID of the seat diagram
 * @returns {Promise<SeatDiagramZones>} List of zones for the seat diagram
 * @throws {APIError} If retrieval fails
 */
export const listZonesByDiagram = api(
  {
    expose: true,
    method: 'POST',
    path: '/seat-diagrams/:seatDiagramId/get-zones',
    auth: true,
  },
  async (
    params: SeatDiagramZoneQueryOptions & { seatDiagramId: number },
  ): Promise<SeatDiagramZones> => {
    const zones = await seatDiagramZoneRepository.findAll({
      ...params,
      filters: {
        ...params.filters,
        seatDiagramId: params.seatDiagramId,
      },
    });

    return {
      seatDiagramZones: zones,
    };
  },
);

/**
 * Retrieves zones for a specific seat diagram with pagination.
 * @param params - Object containing the seat diagram ID and pagination parameters
 * @param params.seatDiagramId - The ID of the seat diagram
 * @returns {Promise<PaginatedSeatDiagramZones>} Paginated list of zones for the seat diagram
 * @throws {APIError} If retrieval fails
 */
export const listZonesByDiagramPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/seat-diagrams/:seatDiagramId/get-zones/paginated',
    auth: true,
  },
  async (
    params: PaginationParamsSeatDiagramZones & {
      seatDiagramId: number;
    },
  ): Promise<PaginatedSeatDiagramZones> => {
    return await seatDiagramZoneRepository.findAllPaginated({
      ...params,
      filters: {
        ...params.filters,
        seatDiagramId: params.seatDiagramId,
      },
    });
  },
);

/**
 * Updates an existing seat diagram zone.
 * @param params - The zone data to update with ID
 * @returns {Promise<SeatDiagramZone>} The updated zone
 * @throws {APIError} If update fails or zone doesn't exist
 */
export const updateSeatDiagramZone = api(
  {
    expose: true,
    method: 'PATCH',
    path: '/seat-diagrams/:seatDiagramId/zones/:id',
    auth: true,
  },
  async ({
    id,
    seatDiagramId,
    ...data
  }: UpdateSeatDiagramZonePayload & {
    id: number;
    seatDiagramId: number;
  }): Promise<SeatDiagramZone> => {
    // Verify the zone belongs to the specified diagram before updating
    const zone = await seatDiagramZoneRepository.findOneForDiagram(
      seatDiagramId,
      id,
    );
    if (!zone) {
      throw new NotFoundError(
        `Zone with ID ${id} not found in diagram ${seatDiagramId}`,
      );
    }

    return await seatDiagramZoneRepository.update(id, data);
  },
);

/**
 * Deletes a seat diagram zone.
 * @param params - Object containing the zone ID and diagram ID
 * @param params.id - The ID of the zone to delete
 * @param params.seatDiagramId - The ID of the diagram the zone belongs to
 * @returns {Promise<void>} No content on success
 * @throws {APIError} If deletion fails or zone doesn't exist
 */
export const deleteSeatDiagramZone = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/seat-diagrams/:seatDiagramId/zones/:id',
    auth: true,
  },
  async ({
    id,
    seatDiagramId,
  }: {
    id: number;
    seatDiagramId: number;
  }): Promise<void> => {
    // First, verify the zone exists for this diagram
    const existingZone = await seatDiagramZoneRepository.findOneForDiagram(
      seatDiagramId,
      id,
    );
    if (!existingZone) {
      throw new NotFoundError(
        `Zone with ID ${id} not found in diagram ${seatDiagramId}`,
      );
    }

    // Delete the zone
    await seatDiagramZoneRepository.delete(id);
  },
);
