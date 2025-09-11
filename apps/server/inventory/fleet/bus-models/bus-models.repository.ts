import { and, eq, isNull } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import type { Amenity } from '@/inventory/shared-entities/amenities/amenities.types';
import { busModels } from './bus-models.schema';
import type {
  BusModel,
  BusModelWithDetails,
  CreateBusModelPayload,
  EngineType,
  UpdateBusModelPayload,
} from './bus-models.types';

/**
 * Creates a repository for managing bus model entities
 * @returns {Object} An object containing bus model-specific operations and base CRUD operations
 */
export const createBusModelRepository = () => {
  const baseRepository = createBaseRepository<
    BusModel,
    CreateBusModelPayload,
    UpdateBusModelPayload,
    typeof busModels
  >(db, busModels, 'Bus Model', {
    searchableFields: [busModels.manufacturer, busModels.model],
    softDeleteEnabled: true,
  });

  /**
   * Finds a bus model by ID with its relations (amenities)
   */
  async function findOneWithRelations(
    id: number,
  ): Promise<BusModelWithDetails> {
    // Use base repository's buildQueryExpressions to respect soft delete
    const { baseWhere } = baseRepository.buildQueryExpressions({
      filters: { id },
    });

    const result = await db.query.busModels.findFirst({
      where: baseWhere
        ? and(baseWhere, isNull(busModels.deletedAt))
        : and(eq(busModels.id, id), isNull(busModels.deletedAt)),
      with: {
        busModelAmenities: {
          with: {
            amenity: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundError(`Bus Model with id ${id} not found`);
    }

    // Shape to BusModelWithDetails without leaking join data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { busModelAmenities, deletedAt, ...busModel } = result;
    return {
      ...busModel,
      engineType: busModel.engineType as EngineType,
      amenities: busModelAmenities.map(({ amenity }) => amenity as Amenity),
    };
  }

  return {
    ...baseRepository,
    findOneWithRelations,
  };
};

// Export the bus model repository instance
export const busModelRepository = createBusModelRepository();
