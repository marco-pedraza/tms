import { NotFoundError } from '../../shared/errors';
import { busModelRepository } from '../bus-models/bus-models.repository';
import { seatDiagramZoneRepository } from '../seat-diagram-zones/seat-diagram-zones.repository';
import { CreateSeatDiagramZonePayload } from '../seat-diagram-zones/seat-diagram-zones.types';
import { seatDiagramRepository } from '../seat-diagrams/seat-diagrams.repository';
import { CreateSeatDiagramPayload } from '../seat-diagrams/seat-diagrams.types';
import { seatLayoutModelZoneRepository } from '../seat-layout-model-zones/seat-layout-model-zones.repository';
import { SeatLayoutModelZone } from '../seat-layout-model-zones/seat-layout-model-zones.types';
import { seatLayoutModelRepository } from '../seat-layout-models/seat-layout-models.repository';
import { Bus, CreateBusPayload, UpdateBusPayload } from './buses.types';
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
 * 1. Using a specific seat layout model ID provided in the payload
 * 2. Using the default seat layout model from the bus model
 *
 * In both cases, the seat layout model is copied to a new seat diagram,
 * allowing each bus to have its own independent seat diagram that can be modified
 * without affecting other buses.
 *
 * Both the seat diagram and bus creation are wrapped in a transaction to ensure
 * atomicity and prevent orphaned seat diagrams if bus creation fails.
 *
 * @param data - The bus data to create
 * @returns {Promise<Bus>} The created bus with its seat diagram
 * @throws {NotFoundError} If the bus model or seat layout model is not found
 */
export const createBusWithSeatDiagram = async (
  data: CreateBusPayload,
): Promise<Bus> => {
  // Get the bus model
  const busModel = await busModelRepository.findOne(data.modelId);
  if (!busModel) {
    throw new NotFoundError('Bus model not found');
  }

  // Use provided seat layout model or fallback to bus model's default
  const seatLayoutModelId =
    data.seatLayoutModelId ?? busModel.defaultSeatLayoutModelId;
  const seatLayoutModel =
    await seatLayoutModelRepository.findOne(seatLayoutModelId);
  if (!seatLayoutModel) {
    throw new NotFoundError('Seat layout model not found');
  }

  // Create a new seat diagram based on the layout model
  const seatDiagramPayload: CreateSeatDiagramPayload = {
    seatLayoutModelId: seatLayoutModel.id,
    name: `${busModel.manufacturer} ${busModel.model} - ${data.registrationNumber}`,
    maxCapacity: busModel.seatingCapacity,
    numFloors: busModel.numFloors,
    seatsPerFloor: seatLayoutModel.seatsPerFloor,
    bathroomRows: seatLayoutModel.bathroomRows,
    totalSeats: seatLayoutModel.totalSeats,
    isFactoryDefault: seatLayoutModel.isFactoryDefault,
    active: true,
  };

  // Get layout zones before starting transaction
  const layoutZones = await seatLayoutModelZoneRepository.findAll({
    filters: {
      seatLayoutModelId: seatLayoutModel.id,
    },
  });

  // Execute all database operations in a transaction
  return await seatDiagramRepository.transaction(
    async (txSeatDiagramRepo, tx) => {
      // Create transaction-scoped repositories
      const txSeatDiagramZoneRepo =
        seatDiagramZoneRepository.withTransaction(tx);
      const txBusRepo = busRepository.withTransaction(tx);

      // Create the seat diagram within transaction
      const seatDiagram = await txSeatDiagramRepo.create(seatDiagramPayload);

      // Clone each zone to the diagram within transaction
      for (const zone of layoutZones) {
        await txSeatDiagramZoneRepo.create({
          name: zone.name,
          rowNumbers: zone.rowNumbers,
          priceMultiplier: zone.priceMultiplier,
          seatDiagramId: seatDiagram.id,
        } as CreateZoneWithDiagramId);
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
 * 2. Clones zones from layout to the new diagram
 * 3. Updates the bus with the new seat diagram ID
 * 4. Deletes the old seat diagram and its zones
 *
 * @param bus - The existing bus
 * @param data - The update payload
 * @param seatDiagramPayload - Data for creating the new seat diagram
 * @param layoutZones - Zones to clone to the new diagram
 * @returns {Promise<Bus>} The updated bus
 */
const replaceSeaDiagramInTransaction = async (
  bus: Bus,
  data: UpdateBusPayload,
  seatDiagramPayload: CreateSeatDiagramPayload,
  layoutZones: SeatLayoutModelZone[],
): Promise<Bus> => {
  return await seatDiagramRepository.transaction(
    async (txSeatDiagramRepo, tx) => {
      // Create transaction-scoped repositories
      const txSeatDiagramZoneRepo =
        seatDiagramZoneRepository.withTransaction(tx);
      const txBusRepo = busRepository.withTransaction(tx);

      // Create the new seat diagram within transaction
      const seatDiagram = await txSeatDiagramRepo.create(seatDiagramPayload);

      // Clone each zone to the diagram within transaction
      for (const zone of layoutZones) {
        await txSeatDiagramZoneRepo.create({
          name: zone.name,
          rowNumbers: zone.rowNumbers,
          priceMultiplier: zone.priceMultiplier,
          seatDiagramId: seatDiagram.id,
        } as CreateZoneWithDiagramId);
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

        // Delete the old seat diagram
        await txSeatDiagramRepo.delete(oldSeatDiagramId);
      }

      return updatedBus;
    },
  );
};

/**
 * Updates a bus and its seat diagram if needed.
 * When the bus model is changed, this process:
 * 1. Deletes the current seat diagram and its zones
 * 2. Creates a new seat diagram based on the new bus model's seat layout
 * 3. Clones the seat layout zones to the new seat diagram
 * 4. Updates the bus with the new seat diagram ID
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
  // If modelId is not provided, we don't need to update the seat diagram
  if (!data.modelId) {
    return await busRepository.update(bus.id, data);
  }

  // Check if model has actually changed
  if (data.modelId === bus.modelId) {
    return await busRepository.update(bus.id, data);
  }

  // Get the new bus model
  const busModel = await busModelRepository.findOne(data.modelId);

  // Get the seat layout model from the new bus model
  const seatLayoutModelId = busModel.defaultSeatLayoutModelId;
  const seatLayoutModel =
    await seatLayoutModelRepository.findOne(seatLayoutModelId);

  // Create a new seat diagram based on the layout model
  const seatDiagramPayload: CreateSeatDiagramPayload = {
    seatLayoutModelId: seatLayoutModel.id,
    name: `${busModel.manufacturer} ${busModel.model} - ${bus.registrationNumber}`,
    maxCapacity: busModel.seatingCapacity,
    numFloors: busModel.numFloors,
    seatsPerFloor: seatLayoutModel.seatsPerFloor,
    bathroomRows: seatLayoutModel.bathroomRows,
    totalSeats: seatLayoutModel.totalSeats,
    isFactoryDefault: seatLayoutModel.isFactoryDefault,
    active: true,
  };

  // Get layout zones before starting transaction
  const layoutZones = await seatLayoutModelZoneRepository.findAll({
    filters: {
      seatLayoutModelId: seatLayoutModel.id,
    },
  });

  // Execute all database operations in a transaction
  return await replaceSeaDiagramInTransaction(
    bus,
    data,
    seatDiagramPayload,
    layoutZones,
  );
};
