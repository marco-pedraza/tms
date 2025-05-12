import { ValidationError } from '../../shared/errors';
import { busLineRepository } from '../bus-lines/bus-lines.repository';
import { Driver } from './drivers.types';
import { driverRepository } from './drivers.repository';

/**
 * Creates a use case module for driver operations that involve complex business logic
 * @returns {Object} An object containing driver-specific operations
 */
export const createDriverUseCases = () => {
  /**
   * Assigns a driver to a transporter with validation
   * @param {number} id - The ID of the driver
   * @param {number} transporterId - The ID of the transporter
   * @returns {Promise<Driver>} The updated driver
   * @throws {ValidationError} If the assignment fails
   */
  const assignToTransporter = async (
    id: number,
    transporterId: number,
  ): Promise<Driver> => {
    try {
      // Validate driver exists
      const driver = await driverRepository.findOne(id);

      // Check if driver is already assigned to a transporter
      if (driver.transporterId === transporterId) {
        throw new ValidationError(
          `Driver is already assigned to transporter with ID ${transporterId}`,
        );
      }

      // Use repository update to assign driver to transporter
      return await driverRepository.update(id, { transporterId });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Failed to assign driver to transporter: ${error.message}`,
      );
    }
  };

  /**
   * Assigns a driver to a bus line with validation
   * @param {number} id - The ID of the driver
   * @param {number} busLineId - The ID of the bus line
   * @returns {Promise<Driver>} The updated driver
   * @throws {ValidationError} If the assignment fails
   */
  const assignToBusLine = async (
    id: number,
    busLineId: number,
  ): Promise<Driver> => {
    try {
      // Validate driver exists
      const driver = await driverRepository.findOne(id);

      // Fetch the bus line to validate
      const busLine = await busLineRepository.findOne(busLineId);

      // Validate driver is assigned to the same transporter as the bus line
      if (
        busLine.transporterId &&
        driver.transporterId !== busLine.transporterId
      ) {
        throw new ValidationError(
          `Driver must be assigned to transporter ID ${busLine.transporterId} before being assigned to this bus line`,
        );
      }

      // Use repository update to assign driver to bus line
      return await driverRepository.update(id, { busLineId });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Failed to assign driver to bus line: ${error.message}`,
      );
    }
  };

  /**
   * Removes a driver from a transporter
   * @param {number} id - The ID of the driver
   * @returns {Promise<Driver>} The updated driver
   * @throws {ValidationError} If the removal fails
   */
  const removeFromTransporter = async (id: number): Promise<Driver> => {
    try {
      // Validate driver exists
      const driver = await driverRepository.findOne(id);

      // Check if driver is assigned to a transporter
      if (!driver.transporterId) {
        throw new ValidationError(`Driver is not assigned to any transporter`);
      }

      // If driver is assigned to a bus line, remove from bus line first
      if (driver.busLineId) {
        await driverRepository.update(id, { busLineId: null });
      }

      // Use repository update to remove driver from transporter
      return await driverRepository.update(id, { transporterId: null });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Failed to remove driver from transporter: ${error.message}`,
      );
    }
  };

  /**
   * Removes a driver from a bus line
   * @param {number} id - The ID of the driver
   * @returns {Promise<Driver>} The updated driver
   * @throws {ValidationError} If the removal fails
   */
  const removeFromBusLine = async (id: number): Promise<Driver> => {
    try {
      // Validate driver exists
      const driver = await driverRepository.findOne(id);

      // Check if driver is assigned to a bus line
      if (!driver.busLineId) {
        throw new ValidationError(`Driver is not assigned to any bus line`);
      }

      // Use repository update to remove driver from bus line
      return await driverRepository.update(id, { busLineId: null });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Failed to remove driver from bus line: ${error.message}`,
      );
    }
  };

  /**
   * Assigns a driver to a bus with validation
   * @param {number} id - The ID of the driver
   * @param {number} busId - The ID of the bus
   * @returns {Promise<Driver>} The updated driver
   * @throws {ValidationError} If the assignment fails
   */
  const assignToBus = async (id: number, busId: number): Promise<Driver> => {
    try {
      // Validate driver exists
      const driver = await driverRepository.findOne(id);

      // Check if driver is already assigned to a bus
      if (driver.busId) {
        throw new ValidationError(`Driver is already assigned to a bus`);
      }

      // Use repository update to assign driver to bus
      return await driverRepository.assignToBus(id, busId);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Failed to assign driver to bus: ${error.message}`,
      );
    }
  };

  /**
   * Removes a driver from a bus
   * @param {number} id - The ID of the driver
   * @returns {Promise<Driver>} The updated driver
   * @throws {ValidationError} If the removal fails
   */
  const removeFromBus = async (id: number): Promise<Driver> => {
    try {
      // Validate driver exists
      const driver = await driverRepository.findOne(id);

      // Check if driver is assigned to a bus
      if (!driver.busId) {
        throw new ValidationError(`Driver is not assigned to any bus`);
      }

      // Use repository update to remove driver from bus
      return await driverRepository.removeFromBus(id);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Failed to remove driver from bus: ${error.message}`,
      );
    }
  };

  return {
    assignToTransporter,
    assignToBusLine,
    assignToBus,
    removeFromTransporter,
    removeFromBusLine,
    removeFromBus,
  };
};

// Export the use case instance
export const driverUseCases = createDriverUseCases();
