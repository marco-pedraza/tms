import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import type {
  CreateDriverPayload,
  DriverWithRelations,
  UpdateDriverPayload,
} from './drivers.types';
import { driverRepository } from './drivers.repository';

/**
 * Creates a use case module for driver operations that involve complex business logic
 * @returns {Object} An object containing driver-specific operations
 */
export function createDriverUseCases() {
  /**
   * Gets the transporter ID associated with a bus line
   * @param busLineId - The ID of the bus line
   * @returns {Promise<number>} The transporter ID associated with the bus line
   * @throws {ValidationError} If the bus line is not found or invalid
   */
  const getTransporterIdFromBusLine = async (
    busLineId: number,
  ): Promise<number> => {
    // Validate that the bus line exists and get its transporter
    const busLineWithTransporter =
      await busLineRepository.findOneWithRelations(busLineId);

    return busLineWithTransporter.transporterId;
  };

  /**
   * Creates a new driver with automatic transporter assignment based on bus line
   * @param data - The driver creation payload
   * @returns {Promise<DriverWithRelations>} The created driver with transporter and bus line information
   * @throws {ValidationError} If the bus line is not found or invalid
   */
  const createDriverWithTransporter = async (
    data: CreateDriverPayload,
  ): Promise<DriverWithRelations> => {
    // Get the transporter ID from the bus line
    const transporterId = await getTransporterIdFromBusLine(data.busLineId);

    // Create the driver with the obtained transporter ID
    const driverData = {
      ...data,
      transporterId,
    };

    if (!data.statusDate) {
      driverData.statusDate = new Date();
    }

    const driver = await driverRepository.create(driverData);

    // Return the driver with relations
    return await driverRepository.findOneWithRelations(driver.id);
  };

  /**
   * Updates a driver with automatic transporter assignment based on bus line (if bus line changes)
   * @param id - The ID of the driver to update
   * @param data - The driver update payload
   * @returns {Promise<DriverWithRelations>} The updated driver with transporter and bus line information
   * @throws {ValidationError} If the bus line is not found or invalid
   */
  const updateDriverWithTransporter = async (
    id: number,
    data: UpdateDriverPayload,
  ): Promise<DriverWithRelations> => {
    const updateData: UpdateDriverPayload & { transporterId?: number } = {
      ...data,
    };

    // If bus line is being updated, get the new transporter ID
    if (typeof data.busLineId === 'number') {
      const transporterId = await getTransporterIdFromBusLine(data.busLineId);
      updateData.transporterId = transporterId;
    }

    // If status is being updated, update the status date if not provided
    if (data.status && !data.statusDate) {
      updateData.statusDate = new Date();
    }

    await driverRepository.update(id, updateData);

    // Return the updated driver with relations
    return await driverRepository.findOneWithRelations(id);
  };

  return {
    getTransporterIdFromBusLine,
    createDriverWithTransporter,
    updateDriverWithTransporter,
  };
}

// Export the use case instance
export const driverUseCases = createDriverUseCases();
