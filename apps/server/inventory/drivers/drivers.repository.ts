import { inArray } from 'drizzle-orm';
import { createBaseRepository } from '@repo/base-repo';
import { StateTransition, createBaseStateMachine } from '@repo/state-machine';
import { PaginationMeta } from '../../shared/types';
import { db } from '../db-service';
import { drivers } from './drivers.schema';
import {
  CreateDriverPayload,
  Driver,
  DriverStatus,
  DriverWithRelations,
  PaginatedListDriversQueryParams,
  PaginatedListDriversResult,
  UpdateDriverPayload,
} from './drivers.types';

/**
 * Status transition map defining allowed transitions between driver statuses
 */
const STATUS_TRANSITIONS: StateTransition<DriverStatus>[] = [
  {
    from: DriverStatus.ACTIVE,
    to: [
      DriverStatus.INACTIVE,
      DriverStatus.SUSPENDED,
      DriverStatus.ON_LEAVE,
      DriverStatus.TERMINATED,
    ],
  },
  {
    from: DriverStatus.INACTIVE,
    to: [DriverStatus.ACTIVE, DriverStatus.TERMINATED],
  },
  {
    from: DriverStatus.SUSPENDED,
    to: [DriverStatus.ACTIVE, DriverStatus.TERMINATED],
  },
  {
    from: DriverStatus.ON_LEAVE,
    to: [DriverStatus.ACTIVE, DriverStatus.TERMINATED],
  },
  { from: DriverStatus.TERMINATED, to: [] }, // Terminal state - no transitions allowed
  {
    from: DriverStatus.IN_TRAINING,
    to: [DriverStatus.ACTIVE, DriverStatus.PROBATION, DriverStatus.TERMINATED],
  },
  {
    from: DriverStatus.PROBATION,
    to: [DriverStatus.ACTIVE, DriverStatus.TERMINATED],
  },
];

/**
 * Allowed initial states for new drivers
 */
const ALLOWED_INITIAL_STATES: DriverStatus[] = [
  DriverStatus.IN_TRAINING,
  DriverStatus.ACTIVE,
  DriverStatus.PROBATION,
];

/**
 * Creates a repository for managing driver entities
 * @returns {Object} An object containing driver-specific operations and base CRUD operations
 */
export const createDriverRepository = () => {
  const baseRepository = createBaseRepository<
    Driver,
    CreateDriverPayload,
    UpdateDriverPayload,
    typeof drivers
  >(db, drivers, 'Driver', {
    searchableFields: [
      drivers.fullName,
      drivers.driverKey,
      drivers.rfc,
      drivers.curp,
      drivers.email,
      drivers.phoneNumber,
    ],
  });

  // Create a state machine for driver statuses
  const stateMachine = createBaseStateMachine<DriverStatus>(
    STATUS_TRANSITIONS,
    'Driver',
  );

  /**
   * Creates a new driver
   * @param {CreateDriverPayload} data - The driver data to create
   * @returns {Promise<Driver>} The created driver
   */
  const create = async (data: CreateDriverPayload): Promise<Driver> => {
    // For new drivers, validate that the initial status is valid
    stateMachine.validateInitialState(data.status, ALLOWED_INITIAL_STATES);
    return await baseRepository.create(data);
  };

  /**
   * Updates a driver
   * @param {number} id - The ID of the driver to update
   * @param {UpdateDriverPayload} data - The driver data to update
   * @returns {Promise<Driver>} The updated driver
   */
  const update = async (
    id: number,
    data: UpdateDriverPayload,
  ): Promise<Driver> => {
    // If status is being updated, validate the transition
    if (data.status) {
      const driver = await baseRepository.findOne(id);
      stateMachine.validateTransition(driver.status, data.status);
      // When status changes, always update the status date
      if (data.status !== driver.status && !data.statusDate) {
        data.statusDate = new Date();
      }
    }
    return await baseRepository.update(id, data);
  };

  const appendRelations = async (
    driversResult: Driver[],
    pagination: PaginationMeta,
    params: PaginatedListDriversQueryParams,
  ): Promise<PaginatedListDriversResult> => {
    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = driversResult.map((driver) => driver.id);

    const driversWithRelations = await db.query.drivers.findMany({
      where: inArray(drivers.id, ids),
      orderBy: baseOrderBy,
      with: { transporter: true, busLine: true },
    });

    return {
      data: driversWithRelations as unknown as DriverWithRelations[],
      pagination,
    };
  };

  /**
   * Gets all possible next statuses for a driver
   * @param {number} id - The ID of the driver
   * @returns {Promise<DriverStatus[]>} Array of possible next statuses
   */
  const getDriverValidNextStatuses = async (
    id: number,
  ): Promise<DriverStatus[]> => {
    const driver = await baseRepository.findOne(id);
    return stateMachine.getPossibleNextStates(driver.status);
  };

  const getValidInitialStatuses = (): DriverStatus[] => {
    return ALLOWED_INITIAL_STATES;
  };

  return {
    ...baseRepository,
    create,
    update,
    getDriverValidNextStatuses,
    getValidInitialStatuses,
    appendRelations,
  };
};

// Export the driver repository instance
export const driverRepository = createDriverRepository();
