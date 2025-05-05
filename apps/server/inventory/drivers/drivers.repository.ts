import { drivers } from './drivers.schema';
import {
  Driver,
  CreateDriverPayload,
  UpdateDriverPayload,
  Drivers,
  DriverStatus,
} from './drivers.types';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { createBaseStateMachine, StateTransition } from '@repo/state-machine';

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
  >(db, drivers, 'Driver');

  // Create a state machine for driver statuses
  const stateMachine = createBaseStateMachine<DriverStatus>(
    STATUS_TRANSITIONS,
    'Driver',
  );

  /**
   * Updates driver status using state machine validation
   * @param {number} id - The ID of the driver
   * @param {DriverStatus} newStatus - The new status to set
   * @returns {Promise<Driver>} The updated driver
   */
  const updateStatus = async (
    id: number,
    newStatus: DriverStatus,
  ): Promise<Driver> => {
    const driver = await baseRepository.findOne(id);

    stateMachine.validateTransition(driver.status, newStatus);

    return await baseRepository.update(id, {
      status: newStatus,
      statusDate: new Date(),
    });
  };

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

  /**
   * Retrieves all drivers
   * @returns {Promise<Drivers>} Object containing array of drivers
   */
  const findAll = async (): Promise<Drivers> => {
    const driversList = await baseRepository.findAll({
      orderBy: [{ field: 'fullName', direction: 'asc' }],
    });
    return {
      drivers: driversList,
    };
  };

  /**
   * Finds drivers by status
   * @param {DriverStatus} status - The status to filter by
   * @returns {Promise<Drivers>} Object containing array of drivers with the specified status
   */
  const findAllByStatus = async (status: DriverStatus): Promise<Drivers> => {
    const driversList = await baseRepository.findAllBy(drivers.status, status);

    return {
      drivers: driversList,
    };
  };

  /**
   * Finds drivers by transporter
   * @param {number} transporterId - The transporter ID to filter by
   * @returns {Promise<Drivers>} Object containing array of drivers assigned to the specified transporter
   */
  const findAllByTransporter = async (
    transporterId: number,
  ): Promise<Drivers> => {
    const driversList = await baseRepository.findAllBy(
      drivers.transporterId,
      transporterId,
      {
        orderBy: [{ field: 'fullName', direction: 'asc' }],
      },
    );

    return {
      drivers: driversList,
    };
  };

  /**
   * Finds drivers by bus line
   * @param {number} busLineId - The bus line ID to filter by
   * @returns {Promise<Drivers>} Object containing array of drivers assigned to the specified bus line
   */
  const findAllByBusLine = async (busLineId: number): Promise<Drivers> => {
    const driversList = await baseRepository.findAllBy(
      drivers.busLineId,
      busLineId,
      {
        orderBy: [{ field: 'fullName', direction: 'asc' }],
      },
    );

    return {
      drivers: driversList,
    };
  };

  /**
   * Finds drivers by bus
   * @param {number} busId - The bus ID to filter by
   * @returns {Promise<Drivers>} Object containing array of drivers assigned to the specified bus
   */
  const findAllByBus = async (busId: number): Promise<Drivers> => {
    const driversList = await baseRepository.findAllBy(drivers.busId, busId, {
      orderBy: [{ field: 'fullName', direction: 'asc' }],
    });

    return {
      drivers: driversList,
    };
  };

  /**
   * Gets all possible next statuses for a driver
   * @param {number} id - The ID of the driver
   * @returns {Promise<DriverStatus[]>} Array of possible next statuses
   */
  const getPossibleNextStatuses = async (
    id: number,
  ): Promise<DriverStatus[]> => {
    const driver = await baseRepository.findOne(id);
    return stateMachine.getPossibleNextStates(driver.status);
  };

  /**
   * Assigns a driver to a transporter
   * @param {number} id - The ID of the driver
   * @param {number} transporterId - The ID of the transporter
   * @returns {Promise<Driver>} The updated driver
   */
  const assignToTransporter = async (
    id: number,
    transporterId: number,
  ): Promise<Driver> => {
    return await baseRepository.update(id, { transporterId });
  };

  /**
   * Assigns a driver to a bus line
   * @param {number} id - The ID of the driver
   * @param {number} busLineId - The ID of the bus line
   * @returns {Promise<Driver>} The updated driver
   */
  const assignToBusLine = async (
    id: number,
    busLineId: number,
  ): Promise<Driver> => {
    return await baseRepository.update(id, { busLineId });
  };

  /**
   * Assigns a driver to a bus
   * @param {number} id - The ID of the driver
   * @param {number} busId - The ID of the bus
   * @returns {Promise<Driver>} The updated driver
   */
  const assignToBus = async (id: number, busId: number): Promise<Driver> => {
    return await baseRepository.update(id, { busId });
  };

  /**
   * Removes a driver from a transporter
   * @param {number} id - The ID of the driver
   * @returns {Promise<Driver>} The updated driver
   */
  const removeFromTransporter = async (id: number): Promise<Driver> => {
    return await baseRepository.update(id, { transporterId: null });
  };

  /**
   * Removes a driver from a bus line
   * @param {number} id - The ID of the driver
   * @returns {Promise<Driver>} The updated driver
   */
  const removeFromBusLine = async (id: number): Promise<Driver> => {
    return await baseRepository.update(id, { busLineId: null });
  };

  /**
   * Removes a driver from a bus
   * @param {number} id - The ID of the driver
   * @returns {Promise<Driver>} The updated driver
   */
  const removeFromBus = async (id: number): Promise<Driver> => {
    return await baseRepository.update(id, { busId: null });
  };

  return {
    ...baseRepository,
    create,
    update,
    findAll,
    findAllByStatus,
    findAllByTransporter,
    findAllByBusLine,
    findAllByBus,
    updateStatus,
    getPossibleNextStatuses,
    assignToTransporter,
    assignToBusLine,
    assignToBus,
    removeFromTransporter,
    removeFromBusLine,
    removeFromBus,
  };
};

// Export the driver repository instance
export const driverRepository = createDriverRepository();
