import { buses } from './buses.schema';
import type {
  Bus,
  CreateBusPayload,
  UpdateBusPayload,
  Buses,
  PaginatedBuses,
  BusesQueryOptions,
  PaginationParamsBuses,
} from './buses.types';
import { BusStatus } from './buses.types';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { eq, and } from 'drizzle-orm';
import { createBaseStateMachine, StateTransition } from '@repo/state-machine';

// Define the state transitions for buses
const busStatusTransitions: StateTransition<BusStatus>[] = [
  {
    from: BusStatus.ACTIVE,
    to: [
      BusStatus.MAINTENANCE,
      BusStatus.REPAIR,
      BusStatus.OUT_OF_SERVICE,
      BusStatus.RESERVED,
      BusStatus.IN_TRANSIT,
      BusStatus.RETIRED,
    ],
  },
  {
    from: BusStatus.MAINTENANCE,
    to: [
      BusStatus.ACTIVE,
      BusStatus.REPAIR,
      BusStatus.OUT_OF_SERVICE,
      BusStatus.RETIRED,
    ],
  },
  {
    from: BusStatus.REPAIR,
    to: [
      BusStatus.ACTIVE,
      BusStatus.MAINTENANCE,
      BusStatus.OUT_OF_SERVICE,
      BusStatus.RETIRED,
    ],
  },
  {
    from: BusStatus.OUT_OF_SERVICE,
    to: [
      BusStatus.ACTIVE,
      BusStatus.MAINTENANCE,
      BusStatus.REPAIR,
      BusStatus.RETIRED,
    ],
  },
  {
    from: BusStatus.RESERVED,
    to: [BusStatus.ACTIVE, BusStatus.IN_TRANSIT, BusStatus.MAINTENANCE],
  },
  {
    from: BusStatus.IN_TRANSIT,
    to: [BusStatus.ACTIVE, BusStatus.MAINTENANCE, BusStatus.REPAIR],
  },
  { from: BusStatus.RETIRED, to: [BusStatus.OUT_OF_SERVICE] },
];

// Create the bus state machine
const busStateMachine = createBaseStateMachine<BusStatus>(busStatusTransitions);

/**
 * Creates a repository for managing bus entities
 * @returns {Object} An object containing bus-specific operations and base CRUD operations
 */
export const createBusRepository = () => {
  const baseRepository = createBaseRepository<
    Bus,
    CreateBusPayload,
    UpdateBusPayload,
    typeof buses
  >(db, buses, 'Bus', {
    searchableFields: [
      buses.registrationNumber,
      buses.economicNumber,
      buses.engineNumber,
      buses.serialNumber,
    ],
  });

  /**
   * Creates a new bus
   * @param data - The bus data to create
   * @returns {Promise<Bus>} The created bus
   */
  const create = async (data: CreateBusPayload): Promise<Bus> => {
    return await baseRepository.create(data);
  };

  /**
   * Updates a bus
   * @param id - The ID of the bus to update
   * @param data - The bus data to update
   * @returns {Promise<Bus>} The updated bus
   */
  const update = async (id: number, data: UpdateBusPayload): Promise<Bus> => {
    // If status is being updated, validate the transition
    if (data.status) {
      const bus = await baseRepository.findOne(id);
      busStateMachine.validateTransition(bus.status, data.status);
    }

    return await baseRepository.update(id, data);
  };

  /**
   * Retrieves all buses with pagination
   * @param params - Pagination parameters
   * @returns {Promise<PaginatedBuses>} Paginated list of buses
   */
  const findAllPaginated = async (
    params: PaginationParamsBuses = {},
  ): Promise<PaginatedBuses> => {
    return await baseRepository.findAllPaginated(params);
  };

  /**
   * Retrieves all buses
   * @param options - Query options for ordering and filtering
   * @returns {Promise<Buses>} Object containing array of buses
   */
  const findAll = async (options: BusesQueryOptions = {}): Promise<Buses> => {
    const busList = await baseRepository.findAll(options);
    return {
      buses: busList,
    };
  };

  /**
   * Finds buses by model ID
   * @param modelId - The ID of the bus model
   * @param options - Query options for ordering and filtering
   * @returns {Promise<Buses>} Object containing array of buses
   */
  const findByModelId = async (modelId: number): Promise<Buses> => {
    const busList = await baseRepository.findAllBy(buses.modelId, modelId);
    return {
      buses: busList,
    };
  };

  /**
   * Finds available buses
   * @param options - Query options for ordering and filtering
   * @returns {Promise<Buses>} Object containing array of available buses
   */
  const findAvailable = async (): Promise<Buses> => {
    const busList = await db
      .select()
      .from(buses)
      .where(and(eq(buses.available, true), eq(buses.active, true)));

    return {
      buses: busList,
    };
  };

  /**
   * Finds buses by status
   * @param status - The status to filter by
   * @param options - Query options for ordering and filtering
   * @returns {Promise<Buses>} Object containing array of buses with the specified status
   */
  const findAllByStatus = async (status: BusStatus): Promise<Buses> => {
    const busList = await baseRepository.findAllBy(buses.status, status);
    return {
      buses: busList,
    };
  };

  /**
   * Updates a bus status
   * @param id - The ID of the bus
   * @param status - The new status
   * @returns {Promise<Bus>} The updated bus
   * @throws {ValidationError} If the status transition is not allowed
   */
  const updateStatus = async (id: number, status: BusStatus): Promise<Bus> => {
    const bus = await baseRepository.findOne(id);

    busStateMachine.validateTransition(bus.status, status);

    return await baseRepository.update(id, { status });
  };

  /**
   * Gets all allowed status transitions for a bus
   * @param id - The ID of the bus
   * @returns {Promise<BusStatus[]>} Array of allowed status transitions
   */
  const getAllowedStatusTransitions = async (
    id: number,
  ): Promise<BusStatus[]> => {
    const bus = await baseRepository.findOne(id);
    return busStateMachine.getPossibleNextStates(bus.status);
  };

  return {
    ...baseRepository,
    create,
    update,
    findAll,
    findAllPaginated,
    findByModelId,
    findAvailable,
    findAllByStatus,
    updateStatus,
    getAllowedStatusTransitions,
  };
};

// Export the bus repository instance
export const busRepository = createBusRepository();
