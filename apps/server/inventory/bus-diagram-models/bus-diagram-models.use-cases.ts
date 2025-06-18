import type { BaseRepository } from '@repo/base-repo';
import { SpaceType } from '../../shared/types';
import { busDiagramModelZoneRepository } from '../bus-diagram-model-zones/bus-diagram-model-zones.repository';
import type { BusDiagramModelZone } from '../bus-diagram-model-zones/bus-diagram-model-zones.types';
import {
  getPositionKey,
  seatNeedsUpdateFromModel,
} from '../bus-seat-models/bus-seat-models.domain';
import { busSeatModelRepository } from '../bus-seat-models/bus-seat-models.repository';
import type { BusSeatModel } from '../bus-seat-models/bus-seat-models.types';
import type { BusSeatModels } from '../bus-seat-models/bus-seat-models.types';
import { busSeatModelUseCases } from '../bus-seat-models/bus-seat-models.use-cases';
import { busSeatRepository } from '../bus-seats/bus-seats.repository';
import type { busSeats } from '../bus-seats/bus-seats.schema';
import type { BusSeat } from '../bus-seats/bus-seats.types';
import type {
  CreateBusSeatPayload,
  UpdateBusSeatPayload,
} from '../bus-seats/bus-seats.types';
import { seatDiagramZoneRepository } from '../seat-diagram-zones/seat-diagram-zones.repository';
import type { seatDiagramZones } from '../seat-diagram-zones/seat-diagram-zones.schema';
import type {
  CreateSeatDiagramZonePayload,
  SeatDiagramZone,
  UpdateSeatDiagramZonePayload,
} from '../seat-diagram-zones/seat-diagram-zones.types';
import { seatDiagramRepository } from '../seat-diagrams/seat-diagrams.repository';
import type { seatDiagrams } from '../seat-diagrams/seat-diagrams.schema';
import type {
  CreateSeatDiagramPayload,
  SeatDiagram,
  UpdateSeatDiagramPayload,
} from '../seat-diagrams/seat-diagrams.types';
import type {
  BusDiagramModel,
  CreateBusDiagramModelPayload,
  RegenerateSeatsResponse,
  SeatDiagramSyncSummary,
} from './bus-diagram-models.types';
import { busDiagramModelRepository } from './bus-diagram-models.repository';

/**
 * Creates use cases for bus diagram models
 * @returns Object with bus diagram model-specific use case functions
 */
export function createBusDiagramModelUseCases() {
  /**
   * Creates a new bus diagram model and automatically generates seat models in a single transaction.
   * This ensures atomicity between diagram model creation and seat model generation.
   * @param params - Data for the new bus diagram model
   * @returns {Promise<BusDiagramModel>} The created bus diagram model
   * @throws {ValidationError} If creation fails or validation fails
   */
  async function createBusDiagramModelWithSeats(
    params: CreateBusDiagramModelPayload,
  ): Promise<BusDiagramModel> {
    // Use transaction to ensure atomicity between diagram model and seat models creation
    return await busDiagramModelRepository
      .transaction(async (txRepo, tx) => {
        // Create the bus diagram model within transaction
        const createdModel = await txRepo.create(params);

        // Create seat models using the existing use case
        // If this fails, the whole transaction will be rolled back
        await busSeatModelUseCases.createSeatModelsFromDiagramModel(
          createdModel.id,
          tx,
        );

        // Return the diagram model ID for post-transaction retrieval
        return createdModel.id;
      })
      .then(async (diagramModelId: number) => {
        // After transaction completes successfully, retrieve the complete diagram model
        return await busDiagramModelRepository.findOne(diagramModelId);
      });
  }

  /**
   * Gets eligible seat diagrams for synchronization
   * @param busDiagramModelId - ID of the bus diagram model
   * @returns Array of seat diagrams that can be synchronized
   */
  async function getEligibleSeatDiagrams(busDiagramModelId: number) {
    return await seatDiagramRepository.findAll({
      filters: {
        busDiagramModelId,
        isModified: false,
      },
    });
  }

  /**
   * Gets active seat models for a bus diagram model
   * @param busDiagramModelId - ID of the bus diagram model
   * @returns Array of active seat models
   */
  async function getActiveSeatModels(busDiagramModelId: number) {
    return await busSeatModelRepository.findAll({
      filters: {
        busDiagramModelId,
        active: true,
      },
    });
  }

  /**
   * Gets zones for a bus diagram model
   * @param busDiagramModelId - ID of the bus diagram model
   * @returns Array of zone models
   */
  async function getZoneModels(busDiagramModelId: number) {
    return await busDiagramModelZoneRepository.findAll({
      filters: {
        busDiagramModelId,
      },
    });
  }

  /**
   * Updates seat diagram properties from bus diagram model
   * @param seatDiagramRepo - Transactional seat diagram repository
   * @param seatDiagramId - ID of the seat diagram to update
   * @param busDiagramModel - Source bus diagram model
   */
  async function updateSeatDiagramFromModel(
    seatDiagramRepo: BaseRepository<
      SeatDiagram,
      CreateSeatDiagramPayload,
      UpdateSeatDiagramPayload,
      typeof seatDiagrams
    >,
    seatDiagramId: number,
    busDiagramModel: BusDiagramModel,
  ): Promise<void> {
    await seatDiagramRepo.update(seatDiagramId, {
      name: busDiagramModel.name,
      description: busDiagramModel.description ?? undefined,
      maxCapacity: busDiagramModel.maxCapacity,
      numFloors: busDiagramModel.numFloors,
      seatsPerFloor: busDiagramModel.seatsPerFloor,
      totalSeats: busDiagramModel.totalSeats,
      isFactoryDefault: busDiagramModel.isFactoryDefault,
    });
  }

  /**
   * Creates a seat from a seat model
   * @param seatRepo - Transactional seat repository
   * @param seatDiagramId - ID of the target seat diagram
   * @param seatModel - Source seat model
   */
  async function createSeatFromModel(
    seatRepo: BaseRepository<
      BusSeat,
      CreateBusSeatPayload,
      UpdateBusSeatPayload,
      typeof busSeats
    >,
    seatDiagramId: number,
    seatModel: BusSeatModel,
  ): Promise<void> {
    const basePayload = {
      seatDiagramId,
      spaceType: seatModel.spaceType as SpaceType,
      floorNumber: seatModel.floorNumber,
      amenities: seatModel.amenities,
      position: seatModel.position,
      meta: seatModel.meta,
      active: seatModel.active,
    };

    // Add seat-specific fields if it's a seat
    if (seatModel.spaceType === SpaceType.SEAT) {
      await seatRepo.create({
        ...basePayload,
        seatNumber: seatModel.seatNumber,
        seatType: seatModel.seatType,
        reclinementAngle: seatModel.reclinementAngle,
      });
    } else {
      await seatRepo.create({
        ...basePayload,
        seatNumber: undefined,
        seatType: undefined,
        reclinementAngle: undefined,
      });
    }
  }

  /**
   * Updates an existing seat from a seat model
   * @param seatRepo - Transactional seat repository
   * @param seatId - ID of the seat to update
   * @param seatModel - Source seat model
   */
  async function updateSeatFromModel(
    seatRepo: BaseRepository<
      BusSeat,
      CreateBusSeatPayload,
      UpdateBusSeatPayload,
      typeof busSeats
    >,
    seatId: number,
    seatModel: BusSeatModel,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      amenities: seatModel.amenities,
      meta: seatModel.meta,
      active: seatModel.active,
    };

    if (seatModel.spaceType === SpaceType.SEAT) {
      updateData.seatNumber = seatModel.seatNumber;
      updateData.seatType = seatModel.seatType;
      updateData.reclinementAngle = seatModel.reclinementAngle;
    }

    await seatRepo.update(seatId, updateData);
  }

  /**
   * Creates a zone from a zone model
   * @param zoneRepo - Transactional zone repository
   * @param seatDiagramId - ID of the target seat diagram
   * @param zoneModel - Source zone model
   */
  async function createZoneFromModel(
    zoneRepo: BaseRepository<
      SeatDiagramZone,
      CreateSeatDiagramZonePayload,
      UpdateSeatDiagramZonePayload,
      typeof seatDiagramZones
    >,
    seatDiagramId: number,
    zoneModel: BusDiagramModelZone,
  ): Promise<void> {
    // Internal type for repository create method that includes seatDiagramId
    type CreateZoneWithDiagramId = CreateSeatDiagramZonePayload & {
      seatDiagramId: number;
    };

    await zoneRepo.create({
      seatDiagramId,
      name: zoneModel.name,
      rowNumbers: zoneModel.rowNumbers,
      priceMultiplier: zoneModel.priceMultiplier,
    } as CreateZoneWithDiagramId);
  }

  /**
   * Synchronizes seats
   * @param seatDiagram - Target seat diagram
   * @param busDiagramModel - Source bus diagram model
   * @param seatModels - Array of seat models to synchronize
   * @param zoneModels - Array of zone models to synchronize
   * @returns Summary of synchronization changes
   */
  async function synchronizeSeatDiagram(
    seatDiagram: SeatDiagram,
    busDiagramModel: BusDiagramModel,
    seatModels: BusSeatModel[],
    zoneModels: BusDiagramModelZone[],
  ): Promise<SeatDiagramSyncSummary> {
    return await busDiagramModelRepository.transaction(async (txRepo, tx) => {
      const txSeatDiagramRepo = seatDiagramRepository.withTransaction(tx);
      const txBusSeatRepo = busSeatRepository.withTransaction(tx);
      const txSeatDiagramZoneRepo =
        seatDiagramZoneRepository.withTransaction(tx);

      // Update seat diagram info with bus diagram model info
      await updateSeatDiagramFromModel(
        txSeatDiagramRepo,
        seatDiagram.id,
        busDiagramModel,
      );

      // Get current bus seats for this diagram
      const currentSeats = await txBusSeatRepo.findAll({
        filters: { seatDiagramId: seatDiagram.id },
      });

      // Get current zones for this diagram
      const currentZones = await txSeatDiagramZoneRepo.findAll({
        filters: { seatDiagramId: seatDiagram.id },
      });

      let created = 0;
      let updated = 0;
      let deleted = 0;

      // Synchronize seats
      // Create maps for efficient lookups
      const currentSeatsMap = new Map<string, BusSeat>(
        currentSeats.map((seat) => [
          getPositionKey(seat.floorNumber, seat.position),
          seat,
        ]),
      );

      // Process seat models to create/update seats
      for (const seatModel of seatModels) {
        const key = getPositionKey(seatModel.floorNumber, seatModel.position);
        const existingSeat = currentSeatsMap.get(key);

        if (!existingSeat) {
          await createSeatFromModel(txBusSeatRepo, seatDiagram.id, seatModel);
          created++;
        } else {
          // Check if update is needed using domain function
          if (seatNeedsUpdateFromModel(existingSeat, seatModel)) {
            await updateSeatFromModel(
              txBusSeatRepo,
              existingSeat.id,
              seatModel,
            );
            updated++;
          }
          // Remove from current seats map as it's been processed
          currentSeatsMap.delete(key);
        }
      }

      // Delete seats that no longer exist in the model
      const remainingSeats = Array.from(currentSeatsMap.values());
      if (remainingSeats.length > 0) {
        const remainingSeatIds = remainingSeats.map((seat) => seat.id);
        await txBusSeatRepo.deleteMany(remainingSeatIds);
        deleted = remainingSeats.length;
      }

      // Synchronize zones - Delete all existing zones and create new ones
      if (currentZones.length > 0) {
        await txSeatDiagramZoneRepo.deleteByDiagramId(seatDiagram.id);
      }

      // Create all zones from the model
      for (const zoneModel of zoneModels) {
        await createZoneFromModel(
          txSeatDiagramZoneRepo,
          seatDiagram.id,
          zoneModel,
        );
      }

      return {
        seatDiagramId: seatDiagram.id,
        created,
        updated,
        deleted,
      };
    });
  }

  /**
   * Synchronizes seats and zones from bus diagram model to all non-modified operational diagrams
   * @param busDiagramModelId - ID of the bus diagram model to sync from
   * @returns {Promise<RegenerateSeatsResponse>} Summary of changes for each diagram
   * @throws {ValidationError} If the bus diagram model doesn't exist or sync fails
   */
  async function regenerateSeats(
    busDiagramModelId: number,
  ): Promise<RegenerateSeatsResponse> {
    // Verify the bus diagram model exists
    const busDiagramModel =
      await busDiagramModelRepository.findOne(busDiagramModelId);

    // Get eligible seat diagrams for synchronization
    const seatDiagrams = await getEligibleSeatDiagrams(busDiagramModelId);

    if (seatDiagrams.length === 0) {
      return { summaries: [] };
    }

    // Get active seat models to use as template
    const seatModels = await getActiveSeatModels(busDiagramModelId);

    // Get zone models to use as template
    const zoneModels = await getZoneModels(busDiagramModelId);

    // Process each seat diagram
    const summaries: SeatDiagramSyncSummary[] = [];
    for (const seatDiagram of seatDiagrams) {
      const summary = await synchronizeSeatDiagram(
        seatDiagram,
        busDiagramModel,
        seatModels,
        zoneModels,
      );
      summaries.push(summary);
    }

    return { summaries };
  }

  /**
   * Retrieves all seat models for a specific bus diagram model.
   * This operation coordinates multiple repositories and applies business rules
   * such as filtering only active seats and proper ordering.
   * @param diagramModelId - The ID of the bus diagram model to get seats for
   * @returns {Promise<BusSeatModels>} Object containing array of seat models
   * @throws {NotFoundError} If the bus diagram model doesn't exist
   * @throws {ValidationError} If retrieval fails
   */
  async function getBusDiagramModelSeats(
    diagramModelId: number,
  ): Promise<BusSeatModels> {
    // Verify the diagram model exists first
    await busDiagramModelRepository.findOne(diagramModelId);

    // Get all active seat models for this diagram model
    const seatModels =
      await busSeatModelRepository.findActiveByBusDiagramModelId(
        diagramModelId,
      );

    return {
      busSeatModels: seatModels,
    };
  }

  return {
    createBusDiagramModelWithSeats,
    regenerateSeats,
    getBusDiagramModelSeats,
  };
}

// Export the use case instance
export const busDiagramModelUseCases = createBusDiagramModelUseCases();
