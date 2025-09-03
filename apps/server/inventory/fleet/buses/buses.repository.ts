import { createBaseRepository } from '@repo/base-repo';
import { StateTransition, createBaseStateMachine } from '@repo/state-machine';
import { db } from '@/inventory/db-service';
import { NotFoundError } from '@/shared/errors';
import { busModelRepository } from '../bus-models/bus-models.repository';
import { seatDiagramRepository } from '../seat-diagrams/seat-diagrams.repository';
import { technologiesRepository } from '../technologies/technologies.repository';
import { buses } from './buses.schema';
import type {
  Bus,
  BusLicensePlateType,
  BusWithRelations,
  CreateBusPayload,
  UpdateBusPayload,
} from './buses.types';
import { BusStatus } from './buses.types';

// Define the state transitions for buses
const busStatusTransitions: StateTransition<BusStatus>[] = [
  {
    from: BusStatus.ACTIVE,
    to: [
      BusStatus.ACTIVE,
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
      BusStatus.MAINTENANCE,
      BusStatus.ACTIVE,
      BusStatus.REPAIR,
      BusStatus.OUT_OF_SERVICE,
      BusStatus.RETIRED,
    ],
  },
  {
    from: BusStatus.REPAIR,
    to: [
      BusStatus.REPAIR,
      BusStatus.ACTIVE,
      BusStatus.MAINTENANCE,
      BusStatus.OUT_OF_SERVICE,
      BusStatus.RETIRED,
    ],
  },
  {
    from: BusStatus.OUT_OF_SERVICE,
    to: [
      BusStatus.OUT_OF_SERVICE,
      BusStatus.ACTIVE,
      BusStatus.MAINTENANCE,
      BusStatus.REPAIR,
      BusStatus.RETIRED,
    ],
  },
  {
    from: BusStatus.RESERVED,
    to: [
      BusStatus.RESERVED,
      BusStatus.ACTIVE,
      BusStatus.IN_TRANSIT,
      BusStatus.MAINTENANCE,
    ],
  },
  {
    from: BusStatus.IN_TRANSIT,
    to: [
      BusStatus.IN_TRANSIT,
      BusStatus.ACTIVE,
      BusStatus.MAINTENANCE,
      BusStatus.REPAIR,
    ],
  },
  {
    from: BusStatus.RETIRED,
    to: [BusStatus.RETIRED, BusStatus.OUT_OF_SERVICE],
  },
];

// Create the bus state machine
const busStateMachine = createBaseStateMachine<BusStatus>(busStatusTransitions);

/**
 * Creates a repository for managing bus entities
 * @returns {Object} An object containing bus-specific operations and base CRUD operations
 */
export function createBusRepository() {
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
    softDeleteEnabled: true,
  });

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

  /**
   * Finds a single bus with its relations (model, seatDiagram, transporter, alternateTransporter, busLine, base, technologies)
   * @param id - The ID of the bus to find
   * @returns The bus with related information
   * @throws {NotFoundError} If the bus is not found
   */
  async function findOneWithRelations(id: number): Promise<BusWithRelations> {
    const bus = await db.query.buses.findFirst({
      where: (buses, { eq, and, isNull }) =>
        and(eq(buses.id, id), isNull(buses.deletedAt)),
      with: {
        transporter: true,
        alternateTransporter: true,
        busLine: true,
        base: true,
      },
    });

    if (!bus) {
      throw new NotFoundError(`Bus with id ${id} not found`);
    }
    const busModel = await busModelRepository.findOne(bus.modelId);
    const seatDiagram = await seatDiagramRepository.findOne(bus.seatDiagramId);
    const technologies = await technologiesRepository.findByBusId(id);

    return {
      ...bus,
      status: bus.status as BusStatus,
      licensePlateType: bus.licensePlateType as BusLicensePlateType,
      availableForTourismOnly: bus.availableForTourismOnly as boolean,
      nextMaintenanceDate: bus.nextMaintenanceDate
        ? new Date(bus.nextMaintenanceDate)
        : null,
      lastMaintenanceDate: bus.lastMaintenanceDate
        ? new Date(bus.lastMaintenanceDate)
        : null,
      currentKilometer:
        bus.currentKilometer !== null && bus.currentKilometer !== undefined
          ? Number(bus.currentKilometer)
          : null,
      purchaseDate: new Date(bus.purchaseDate),
      expirationDate: new Date(bus.expirationDate),
      grossVehicleWeight: Number(bus.grossVehicleWeight),
      busModel,
      seatDiagram,
      technologies,
    };
  }

  return {
    ...baseRepository,
    update,
    getAllowedStatusTransitions,
    findOneWithRelations,
  };
}

// Export the bus repository instance
export const busRepository = createBusRepository();
