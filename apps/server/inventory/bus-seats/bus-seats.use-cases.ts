import type { TransactionalDB } from '@repo/base-repo';
import { SpaceType } from '../../shared/types';
import { seatDiagramRepository } from '../seat-diagrams/seat-diagrams.repository';
import type { SeatDiagram } from '../seat-diagrams/seat-diagrams.types';
import { busSeats } from './bus-seats.schema';
import {
  BusSeat,
  SeatConfigurationInput,
  UpdatedSeatConfiguration,
} from './bus-seats.types';
import { busSeatRepository } from './bus-seats.repository';
import {
  createNewSeatPayload,
  createSeatUpdateData,
  generateAllSeats,
  getPositionKey,
  needsSeatUpdate,
  validateSeatConfigurationPayload,
} from './bus-seats.domain';

/**
 * Creates the bus seat use cases
 * @returns Object with use case functions
 */
export function createBusSeatUseCases() {
  /**
   * Creates seats from a seat diagram configuration within a transaction
   * @param seatDiagramId - Seat diagram ID
   * @param tx - Database transaction
   * @returns Promise resolving to the number of created seats
   * @throws {ValidationError} If creation fails
   */
  async function createSeatsFromDiagram(
    seatDiagramId: number,
    tx: TransactionalDB,
  ): Promise<number> {
    // Create transaction-scoped repositories
    const txDiagramRepo = seatDiagramRepository.withTransaction(tx);

    // Get the seat diagram using transaction-scoped repository
    const seatDiagram = await txDiagramRepo.findOne(seatDiagramId);

    // Generate all seat payloads using the extracted function
    const allSeats = generateAllSeats(seatDiagram, seatDiagramId);

    // Create all seats using batch insert for better performance
    const createdSeats = await tx.insert(busSeats).values(allSeats).returning();

    return createdSeats.length;
  }

  /**
   * Processes an incoming seat configuration (create or update)
   * @param incomingSeat - The incoming seat configuration
   * @param existingSeat - The existing seat (if any)
   * @param seatDiagramId - Seat diagram ID
   * @param seatDiagram - The seat diagram
   * @param txRepo - Transaction repository
   * @returns Promise resolving to operation result
   */
  async function processIncomingSeatConfiguration(
    incomingSeat: SeatConfigurationInput & { seatKey: string },
    existingSeat: BusSeat | undefined,
    seatDiagramId: number,
    seatDiagram: SeatDiagram,
    txRepo: ReturnType<typeof busSeatRepository.withTransaction>,
  ): Promise<{ created: boolean; updated: boolean }> {
    if (!existingSeat) {
      // Create new space (seat, stairs, hallway, etc.)
      const newSeatPayload = createNewSeatPayload(
        incomingSeat,
        seatDiagramId,
        seatDiagram,
      );
      await txRepo.create(newSeatPayload);
      return { created: true, updated: false };
    } else {
      // Check if update is needed using the helper function
      const incomingSpaceType = incomingSeat.spaceType ?? SpaceType.SEAT;
      const needsUpdate = needsSeatUpdate(
        incomingSpaceType,
        incomingSeat,
        existingSeat,
      );

      if (needsUpdate) {
        const updateData = createSeatUpdateData(
          incomingSpaceType,
          incomingSeat,
          existingSeat,
          seatDiagram,
        );

        await txRepo.update(existingSeat.id, updateData);
        return { created: false, updated: true };
      }

      return { created: false, updated: false };
    }
  }

  /**
   * Deactivates seats that are no longer in the incoming configuration
   * @param existingSeats - All existing seats for the diagram
   * @param incomingSeatKeys - Set of incoming seat position keys
   * @param txRepo - Transaction repository
   * @returns Promise resolving to number of deactivated seats
   */
  async function deactivateUnusedSeats(
    existingSeats: BusSeat[],
    incomingSeatKeys: Set<string>,
    txRepo: ReturnType<typeof busSeatRepository.withTransaction>,
  ): Promise<number> {
    let seatsDeactivated = 0;

    for (const existingSeat of existingSeats) {
      const existingKey = getPositionKey(
        existingSeat.floorNumber,
        existingSeat.position,
      );
      if (!incomingSeatKeys.has(existingKey) && existingSeat.active) {
        await txRepo.update(existingSeat.id, { active: false });
        seatsDeactivated++;
      }
    }

    return seatsDeactivated;
  }

  /**
   * Updates seat configuration of a seat diagram in a single batch operation
   * @param seatDiagramId - The ID of the seat diagram to update
   * @param seatConfigurations - Array of seat configurations to process
   * @returns Promise with statistics about the update operation
   * @throws {ValidationError} If validation fails
   */
  async function batchUpdateSeatConfiguration(
    seatDiagramId: number,
    seatConfigurations: SeatConfigurationInput[],
  ): Promise<UpdatedSeatConfiguration> {
    return await busSeatRepository.transaction(async (txRepo, tx) => {
      // Create transaction-scoped repositories
      const txSeatDiagramRepo = seatDiagramRepository.withTransaction(tx);

      // Validate seat diagram exists
      const seatDiagram = await txSeatDiagramRepo.findOne(seatDiagramId);

      // Validate payload including position limits
      validateSeatConfigurationPayload(seatConfigurations, seatDiagram);

      // Get existing seat models
      const existingSeats = await txRepo.findAllBy(
        busSeats.seatDiagramId,
        seatDiagramId,
      );

      // Create lookup maps for processing
      const existingSeatMap = new Map<string, BusSeat>();
      existingSeats.forEach((seat) => {
        const key = getPositionKey(seat.floorNumber, seat.position);
        existingSeatMap.set(key, seat);
      });

      // Build incoming seat map for processing
      const incomingSeatKeys = new Set<string>();
      const incomingSeats = seatConfigurations.map((config) => {
        const key = getPositionKey(config.floorNumber, config.position);
        incomingSeatKeys.add(key);

        return { ...config, seatKey: key };
      });

      let seatsCreated = 0;
      let seatsUpdated = 0;

      // Process each incoming seat configuration
      for (const incomingSeat of incomingSeats) {
        const existingSeat = existingSeatMap.get(incomingSeat.seatKey);

        const result = await processIncomingSeatConfiguration(
          incomingSeat,
          existingSeat,
          seatDiagramId,
          seatDiagram,
          txRepo,
        );

        if (result.created) seatsCreated++;
        if (result.updated) seatsUpdated++;
      }

      // Deactivate seats not in payload
      const seatsDeactivated = await deactivateUnusedSeats(
        existingSeats,
        incomingSeatKeys,
        txRepo,
      );

      // Update diagram with new total seats count (only SEAT space types)
      // Use countAll method for better performance
      const totalActiveSeats = await txRepo.countAll({
        filters: {
          seatDiagramId,
          active: true,
          spaceType: SpaceType.SEAT,
        },
      });

      // Create internal update object with system-managed fields
      const updateData = {
        totalSeats: totalActiveSeats,
        isModified: true, // Mark as modified when seat configuration changes
      };
      await txSeatDiagramRepo.update(seatDiagram.id, updateData);

      return {
        seatsCreated,
        seatsUpdated,
        seatsDeactivated,
        totalActiveSeats,
      };
    });
  }

  return {
    createSeatsFromDiagram,
    batchUpdateSeatConfiguration,
  };
}

// Export the use case instance
export const busSeatUseCases = createBusSeatUseCases();
