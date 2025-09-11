import { api } from 'encore.dev/api';
import type {
  CreateEventTypePayload,
  EventType,
  ListEventTypesQueryParams,
  ListEventTypesResult,
  PaginatedListEventTypesQueryParams,
  PaginatedListEventTypesResult,
  UpdateEventTypePayload,
} from './event-types.types';
import { eventTypeRepository } from './event-types.repository';
import { validateEventType } from './event-types.domain';

/**
 * Creates a new event type.
 * @param params - The event type data to create
 * @returns {Promise<EventType>} The created event type
 * @throws {APIError} If the event type creation fails
 */
export const createEventType = api(
  { expose: true, method: 'POST', path: '/event-types/create' },
  async (params: CreateEventTypePayload): Promise<EventType> => {
    // Apply default value for baseTime if not provided
    const eventTypeData = {
      ...params,
      baseTime: params.baseTime ?? 0,
    };

    await validateEventType(eventTypeData);
    return await eventTypeRepository.create(eventTypeData);
  },
);

/**
 * Retrieves an event type by its ID.
 * @param params - Object containing the event type ID
 * @param params.id - The ID of the event type to retrieve
 * @returns {Promise<EventType>} The found event type
 * @throws {APIError} If the event type is not found or retrieval fails
 */
export const getEventType = api(
  { expose: true, method: 'GET', path: '/event-types/:id' },
  async ({ id }: { id: number }): Promise<EventType> => {
    return await eventTypeRepository.findOne(id);
  },
);

/**
 * Updates an existing event type.
 * @param params - Object containing the event type ID and update data
 * @param params.id - The ID of the event type to update
 * @returns {Promise<EventType>} The updated event type
 * @throws {APIError} If the event type is not found or update fails
 */
export const updateEventType = api(
  { expose: true, method: 'PUT', path: '/event-types/:id/update' },
  async ({
    id,
    ...data
  }: UpdateEventTypePayload & { id: number }): Promise<EventType> => {
    // Apply default value for baseTime if explicitly set to undefined
    const eventTypeData = {
      ...data,
      ...(data.baseTime !== undefined && { baseTime: data.baseTime ?? 0 }),
    };

    await validateEventType(eventTypeData, id);
    return await eventTypeRepository.update(id, eventTypeData);
  },
);

/**
 * Retrieves all event types without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListEventTypesResult>} Unified response with data property containing array of event types
 * @throws {APIError} If retrieval fails
 */
export const listEventTypes = api(
  { expose: true, method: 'POST', path: '/event-types/list/all' },
  async (params: ListEventTypesQueryParams): Promise<ListEventTypesResult> => {
    const eventTypes = await eventTypeRepository.findAll(params);
    return {
      data: eventTypes,
    };
  },
);

/**
 * Retrieves event types with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListEventTypesResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listEventTypesPaginated = api(
  { expose: true, method: 'POST', path: '/event-types/list' },
  async (
    params: PaginatedListEventTypesQueryParams,
  ): Promise<PaginatedListEventTypesResult> => {
    return await eventTypeRepository.findAllPaginated(params);
  },
);

/**
 * Deletes an event type by its ID.
 * @param params - Object containing the event type ID
 * @param params.id - The ID of the event type to delete
 * @returns {Promise<EventType>} The deleted event type
 * @throws {APIError} If the event type is not found or deletion fails
 */
export const deleteEventType = api(
  { expose: true, method: 'DELETE', path: '/event-types/:id/delete' },
  async ({ id }: { id: number }): Promise<EventType> => {
    return await eventTypeRepository.delete(id);
  },
);
