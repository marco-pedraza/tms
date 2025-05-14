import { NotFoundError } from '../../shared/errors';
import { busModelRepository } from '../bus-models/bus-models.repository';
import { seatDiagramZoneRepository } from '../seat-diagram-zones/seat-diagram-zones.repository';
import { CreateSeatDiagramZonePayload } from '../seat-diagram-zones/seat-diagram-zones.types';
import { seatDiagramRepository } from '../seat-diagrams/seat-diagrams.repository';
import { CreateSeatDiagramPayload } from '../seat-diagrams/seat-diagrams.types';
import { seatLayoutModelZoneRepository } from '../seat-layout-model-zones/seat-layout-model-zones.repository';
import { seatLayoutModelRepository } from '../seat-layout-models/seat-layout-models.repository';
import { Bus, CreateBusPayload } from './buses.types';
import { busRepository } from './buses.repository';

// Internal type for repository create method
type CreateZoneWithDiagramId = CreateSeatDiagramZonePayload & {
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
