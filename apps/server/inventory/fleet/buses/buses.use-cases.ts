import { busTechnologies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '@/shared/errors';
import { busDiagramModelZoneRepository } from '@/inventory/fleet/bus-diagram-model-zones/bus-diagram-model-zones.repository';
import type { BusDiagramModelZone } from '@/inventory/fleet/bus-diagram-model-zones/bus-diagram-model-zones.types';
import { busDiagramModelRepository } from '@/inventory/fleet/bus-diagram-models/bus-diagram-models.repository';
import { busModelRepository } from '@/inventory/fleet/bus-models/bus-models.repository';
import { busSeatModelRepository } from '@/inventory/fleet/bus-seat-models/bus-seat-models.repository';
import type { BusSeatModel } from '@/inventory/fleet/bus-seat-models/bus-seat-models.types';
import { busSeatRepository } from '@/inventory/fleet/bus-seats/bus-seats.repository';
import { seatDiagramZoneRepository } from '@/inventory/fleet/seat-diagram-zones/seat-diagram-zones.repository';
import type { CreateSeatDiagramZonePayload } from '@/inventory/fleet/seat-diagram-zones/seat-diagram-zones.types';
import { seatDiagramRepository } from '@/inventory/fleet/seat-diagrams/seat-diagrams.repository';
import type { CreateSeatDiagramPayload } from '@/inventory/fleet/seat-diagrams/seat-diagrams.types';
import type {
  AssignTechnologiesToBusPayload,
  Bus,
  BusWithRelations,
  CreateBusPayload,
  UpdateBusPayload,
} from './buses.types';
import { busRepository } from './buses.repository';

// Internal type for repository create method
type CreateZoneWithDiagramId = CreateSeatDiagramZonePayload & {
  seatDiagramId: number;
};

// Internal type for updating a bus with a seat diagram
type UpdateBusWithSeatDiagramPayload = UpdateBusPayload & {
  seatDiagramId: number;
};

/**
 * Creates a new bus with a seat diagram. The seat diagram can be created in two ways:
 * 1. Using a specific bus diagram model ID provided in the payload
 * 2. Using the default bus diagram model from the bus model
 *
 * In both cases, the bus diagram model is copied to a new seat diagram,
 * allowing each bus to have its own independent seat diagram that can be modified
 * without affecting other buses.
 *
 * The process includes:
 * 1. Creating a new seat diagram based on the bus diagram model
 * 2. Copying all zones from the bus diagram model to the new seat diagram
 * 3. Copying all seats from the bus seat models to the new seat diagram
 * 4. Creating the bus with the new seat diagram ID
 *
 * All operations are wrapped in a transaction to ensure atomicity and prevent
 * orphaned seat diagrams or seats if bus creation fails.
 *
 * @param data - The bus data to create
 * @returns {Promise<Bus>} The created bus with its seat diagram
 * @throws {NotFoundError} If the bus model or bus diagram model is not found
 */
export const createBusWithSeatDiagram = async (
  data: CreateBusPayload,
): Promise<Bus> => {
  // Get the bus model
  const busModel = await busModelRepository.findOne(data.modelId);
  if (!busModel) {
    throw new NotFoundError('Bus model not found');
  }

  // Use the bus model's default diagram model
  const busDiagramModelId = busModel.defaultBusDiagramModelId;
  const busDiagramModel =
    await busDiagramModelRepository.findOne(busDiagramModelId);
  if (!busDiagramModel) {
    throw new NotFoundError('Bus diagram model not found');
  }

  // Create a new seat diagram based on the diagram model
  const seatDiagramPayload: CreateSeatDiagramPayload = {
    busDiagramModelId: busDiagramModel.id,
    name: `${busModel.manufacturer} ${busModel.model} - ${data.registrationNumber}`,
    maxCapacity: busModel.seatingCapacity,
    numFloors: busModel.numFloors,
    seatsPerFloor: busDiagramModel.seatsPerFloor,
    totalSeats: busDiagramModel.totalSeats,
    isFactoryDefault: busDiagramModel.isFactoryDefault,
    active: true,
  };

  // Get diagram zones before starting transaction
  const diagramZones = await busDiagramModelZoneRepository.findAll({
    filters: {
      busDiagramModelId: busDiagramModel.id,
    },
  });

  // Get bus seat models before starting transaction
  const busSeatModels = await busSeatModelRepository.findAll({
    filters: {
      busDiagramModelId: busDiagramModel.id,
    },
  });

  // Execute all database operations in a transaction
  return await seatDiagramRepository.transaction(
    async (txSeatDiagramRepo, tx) => {
      // Create transaction-scoped repositories
      const txSeatDiagramZoneRepo =
        seatDiagramZoneRepository.withTransaction(tx);
      const txBusSeatRepo = busSeatRepository.withTransaction(tx);
      const txBusRepo = busRepository.withTransaction(tx);

      // Create the seat diagram within transaction
      const seatDiagram = await txSeatDiagramRepo.create(seatDiagramPayload);

      // Clone each zone to the diagram within transaction
      for (const zone of diagramZones) {
        await txSeatDiagramZoneRepo.create({
          name: zone.name,
          rowNumbers: zone.rowNumbers,
          priceMultiplier: zone.priceMultiplier,
          seatDiagramId: seatDiagram.id,
        } as CreateZoneWithDiagramId);
      }

      // Clone seats from bus seat models to bus seats within transaction
      for (const seatModel of busSeatModels) {
        await txBusSeatRepo.create({
          seatDiagramId: seatDiagram.id,
          floorNumber: seatModel.floorNumber,
          amenities: seatModel.amenities,
          position: seatModel.position,
          meta: seatModel.meta,
          active: seatModel.active,
        });
      }

      // Create the bus with the new seat diagram within transaction
      const busData = {
        ...data,
        seatDiagramId: seatDiagram.id,
      };

      return await txBusRepo.create(busData);
    },
  );
};

/**
 * Replaces a bus's seat diagram with a new one in a transaction.
 * This function:
 * 1. Creates a new seat diagram
 * 2. Clones zones from bus diagram model to the new diagram
 * 3. Copies seats from bus seat models to the new diagram
 * 4. Updates the bus with the new seat diagram ID
 * 5. Deletes the old seat diagram and its zones
 *
 * @param bus - The existing bus
 * @param data - The update payload
 * @param seatDiagramPayload - Data for creating the new seat diagram
 * @param busDiagramZones - Zones to clone to the new diagram
 * @param busSeatModels - Seat models to copy to the new diagram
 * @returns {Promise<Bus>} The updated bus
 */
const replaceSeatDiagramInTransaction = async (
  bus: Bus,
  data: UpdateBusPayload,
  seatDiagramPayload: CreateSeatDiagramPayload,
  busDiagramZones: BusDiagramModelZone[],
  busSeatModels: BusSeatModel[],
): Promise<Bus> => {
  return await seatDiagramRepository.transaction(
    async (txSeatDiagramRepo, tx) => {
      // Create transaction-scoped repositories
      const txSeatDiagramZoneRepo =
        seatDiagramZoneRepository.withTransaction(tx);
      const txBusSeatRepo = busSeatRepository.withTransaction(tx);
      const txBusRepo = busRepository.withTransaction(tx);

      // Create the new seat diagram within transaction
      const seatDiagram = await txSeatDiagramRepo.create(seatDiagramPayload);

      // Clone each zone to the diagram within transaction
      for (const zone of busDiagramZones) {
        await txSeatDiagramZoneRepo.create({
          name: zone.name,
          rowNumbers: zone.rowNumbers,
          priceMultiplier: zone.priceMultiplier,
          seatDiagramId: seatDiagram.id,
        } as CreateZoneWithDiagramId);
      }

      // Clone seats from bus seat models to bus seats within transaction
      for (const seatModel of busSeatModels) {
        await txBusSeatRepo.create({
          seatDiagramId: seatDiagram.id,
          floorNumber: seatModel.floorNumber,
          amenities: seatModel.amenities,
          position: seatModel.position,
          meta: seatModel.meta,
          active: seatModel.active,
        });
      }

      // Store old seat diagram ID for later deletion
      const oldSeatDiagramId = bus.seatDiagramId;

      // Update the bus with the new seat diagram ID first
      const updatedBus = await txBusRepo.update(bus.id, {
        ...data,
        seatDiagramId: seatDiagram.id,
      } as UpdateBusWithSeatDiagramPayload);

      // Now that the bus references the new diagram, delete the old diagram and its zones if they exist
      if (oldSeatDiagramId) {
        // Delete all zones for the old diagram in a single operation
        await txSeatDiagramZoneRepo.deleteByDiagramId(oldSeatDiagramId);

        // Delete the old seat diagram (seats will be deleted automatically by cascade)
        await txSeatDiagramRepo.delete(oldSeatDiagramId);
      }

      return updatedBus;
    },
  );
};

/**
 * Updates a bus and its seat diagram if needed.
 * When the bus model is changed, this process:
 * 1. Creates a new seat diagram based on the new bus model's bus diagram model
 * 2. Clones the bus diagram model zones to the new seat diagram
 * 3. Copies the bus seat models to the new seat diagram
 * 4. Updates the bus with the new seat diagram ID
 * 5. Deletes the old seat diagram, its zones, and seats
 *
 * For updates that don't change the model, a regular update is performed.
 * All operations are wrapped in a transaction to ensure atomicity.
 *
 * @param bus - The existing bus
 * @param data - The update payload
 * @returns {Promise<Bus>} The updated bus
 * @throws {NotFoundError} If the bus model is not found
 */
export const updateBusWithSeatDiagram = async (
  bus: Bus,
  data: UpdateBusPayload,
): Promise<Bus> => {
  if (!data.modelId || data.modelId === bus.modelId) {
    return await busRepository.update(bus.id, data);
  }

  const busModel = await busModelRepository.findOne(data.modelId);
  const busDiagramModel = await busDiagramModelRepository.findOne(
    busModel.defaultBusDiagramModelId,
  );

  // Get diagram zones before starting transaction
  const busDiagramZones = await busDiagramModelZoneRepository.findAll({
    filters: {
      busDiagramModelId: busDiagramModel.id,
    },
  });

  // Get bus seat models before starting transaction
  const busSeatModels = await busSeatModelRepository.findAll({
    filters: {
      busDiagramModelId: busDiagramModel.id,
    },
  });

  // Prepare the seat diagram payload
  const seatDiagramPayload: CreateSeatDiagramPayload = {
    name: `${busModel.manufacturer} ${busModel.model} - ${bus.registrationNumber}`,
    busDiagramModelId: busDiagramModel.id,
    maxCapacity: busDiagramModel.totalSeats,
    numFloors: busDiagramModel.numFloors,
    seatsPerFloor: busDiagramModel.seatsPerFloor,
    totalSeats: busDiagramModel.totalSeats,
    isFactoryDefault: false,
    active: true,
  };

  return await replaceSeatDiagramInTransaction(
    bus,
    data,
    seatDiagramPayload,
    busDiagramZones,
    busSeatModels,
  );
};

/**
 * Assigns technologies to a bus with validation and atomicity
 * This is a destructive operation that replaces existing technologies
 * @param busId - The ID of the bus to assign technologies to
 * @param payload - The assignment payload with technology IDs
 * @returns The updated bus with its relations and assigned technologies
 * @throws {ValidationError} If validation fails
 */
export async function assignTechnologiesToBus(
  busId: number,
  payload: AssignTechnologiesToBusPayload,
): Promise<BusWithRelations> {
  return await busRepository
    .transaction(async (txRepo, tx) => {
      // Remove duplicates from technologyIds
      const uniqueTechnologyIds = [...new Set(payload.technologyIds)];

      // Delete existing technology assignments
      await tx.delete(busTechnologies).where(eq(busTechnologies.busId, busId));

      // Insert new technology assignments if any
      if (uniqueTechnologyIds.length > 0) {
        const technologyAssignments = uniqueTechnologyIds.map(
          (technologyId) => ({
            busId,
            technologyId,
          }),
        );

        await tx.insert(busTechnologies).values(technologyAssignments);
      }

      return busId;
    })
    .then((busId) => busRepository.findOneWithRelations(busId));
}
