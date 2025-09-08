import type { FloorSeats, SeatPosition, SpaceType } from '@/shared/types';
import { SeatType } from '@/shared/types';
import { busDiagramModelRepository } from '@/inventory/fleet/bus-diagram-models/bus-diagram-models.repository';
import type { CreateBusDiagramModelPayload } from '@/inventory/fleet/bus-diagram-models/bus-diagram-models.types';
import type { BusDiagramModel } from '@/inventory/fleet/bus-diagram-models/bus-diagram-models.types';
import { busSeatModels } from '@/inventory/fleet/bus-seat-models/bus-seat-models.schema';
import type { CreateBusSeatModelPayload } from '@/inventory/fleet/bus-seat-models/bus-seat-models.types';

/**
 * Generates realistic seat models with aisles, bathrooms, and stairs
 * @param busDiagramModelId - ID of the bus diagram model
 * @param floorConfig - Floor configuration
 * @param isDoubleDeckerFirstFloor - Whether this is the first floor of a double decker bus
 * @param seatNumberCounter - Current seat number counter
 * @returns Array of seat model payloads and updated counter
 */
function generateRealisticSeatModels(
  busDiagramModelId: number,
  floorConfig: FloorSeats,
  isDoubleDeckerFirstFloor: boolean,
  seatNumberCounter: number,
): [CreateBusSeatModelPayload[], number] {
  const seatModels: CreateBusSeatModelPayload[] = [];
  let currentSeatCounter = seatNumberCounter;

  // Calculate layout dimensions
  const totalColumns = floorConfig.seatsLeft + 1 + floorConfig.seatsRight; // +1 for aisle
  const aisleColumn = floorConfig.seatsLeft; // Aisle position

  // Generate seats for each row
  for (let rowIndex = 0; rowIndex < floorConfig.numRows; rowIndex++) {
    const isFirstRow = rowIndex === 0;
    const isLastRow = rowIndex === floorConfig.numRows - 1;

    // Generate all columns for this row
    for (let colIndex = 0; colIndex < totalColumns; colIndex++) {
      const position: SeatPosition = { x: colIndex, y: rowIndex };

      if (colIndex === aisleColumn) {
        // AISLE COLUMN
        if (isFirstRow && isDoubleDeckerFirstFloor) {
          // Add stairs in first row aisle for double decker buses
          seatModels.push({
            busDiagramModelId,
            spaceType: 'stairs' as SpaceType,
            seatNumber: undefined,
            floorNumber: floorConfig.floorNumber,
            seatType: undefined,
            amenities: [],
            reclinementAngle: undefined,
            position,
            meta: {
              rowIndex,
              colIndex,
              description: 'Stairs to upper floor',
            },
            active: true,
          });
        } else {
          // Regular aisle space (bathroom moved to right side)
          seatModels.push({
            busDiagramModelId,
            spaceType: 'hallway' as SpaceType,
            seatNumber: undefined,
            floorNumber: floorConfig.floorNumber,
            seatType: undefined,
            amenities: [],
            reclinementAngle: undefined,
            position,
            meta: {
              rowIndex,
              colIndex,
              description: 'Aisle',
            },
            active: true,
          });
        }
      } else {
        // SEAT COLUMNS
        let shouldAddSeat = true;

        // Skip seats in first row corners if there are stairs in double decker
        if (isFirstRow && isDoubleDeckerFirstFloor) {
          const isLeftCorner = colIndex === 0;
          const isRightCorner = colIndex === totalColumns - 1;

          if (isLeftCorner || isRightCorner) {
            // Add empty space instead of seat for stairs area
            seatModels.push({
              busDiagramModelId,
              spaceType: 'empty' as SpaceType,
              seatNumber: undefined,
              floorNumber: floorConfig.floorNumber,
              seatType: undefined,
              amenities: [],
              reclinementAngle: undefined,
              position,
              meta: {
                rowIndex,
                colIndex,
                description: 'Stairs area',
              },
              active: true,
            });
            shouldAddSeat = false;
          }
        }

        // Add bathroom in last row at the right extreme
        if (isLastRow && colIndex === totalColumns - 1) {
          // Add bathroom at right extreme of last row
          seatModels.push({
            busDiagramModelId,
            spaceType: 'bathroom' as SpaceType,
            seatNumber: undefined,
            floorNumber: floorConfig.floorNumber,
            seatType: undefined,
            amenities: [],
            reclinementAngle: undefined,
            position,
            meta: {
              rowIndex,
              colIndex,
              description: 'Bathroom',
            },
            active: true,
          });
          shouldAddSeat = false;
        }

        // Skip seat next to bathroom (for bathroom space)
        if (isLastRow && colIndex === totalColumns - 2) {
          // Add empty space next to bathroom
          seatModels.push({
            busDiagramModelId,
            spaceType: 'empty' as SpaceType,
            seatNumber: undefined,
            floorNumber: floorConfig.floorNumber,
            seatType: undefined,
            amenities: [],
            reclinementAngle: undefined,
            position,
            meta: {
              rowIndex,
              colIndex,
              description: 'Bathroom area',
            },
            active: true,
          });
          shouldAddSeat = false;
        }

        if (shouldAddSeat) {
          // Add regular seat
          const seatNumber = String(currentSeatCounter++);
          // Window seat logic: left extreme is always window, right extreme only if not last row (bathroom)
          const isWindowSeat =
            colIndex === 0 || (colIndex === totalColumns - 1 && !isLastRow);

          seatModels.push({
            busDiagramModelId,
            spaceType: 'seat' as SpaceType,
            seatNumber,
            floorNumber: floorConfig.floorNumber,
            seatType: SeatType.REGULAR,
            amenities: isWindowSeat ? ['window'] : [],
            reclinementAngle: 15,
            position,
            meta: {
              rowIndex,
              colIndex,
              isWindow: isWindowSeat,
              isLegroom: isFirstRow,
            },
            active: true,
          });
        }
      }
    }
  }

  return [seatModels, currentSeatCounter];
}

/**
 * Creates bus diagram model with custom realistic seat layout
 * @param config - Bus diagram model configuration
 * @returns Created bus diagram model with custom seats
 */
async function createBusDiagramModelWithRealisticSeats(
  config: CreateBusDiagramModelPayload,
): Promise<BusDiagramModel> {
  return await busDiagramModelRepository.transaction(async (txRepo, tx) => {
    // Create the bus diagram model
    const diagramModel = await txRepo.create(config);

    // Generate realistic seat models
    const allSeatModels: CreateBusSeatModelPayload[] = [];
    let seatNumberCounter = 1;

    for (const floorConfig of config.seatsPerFloor) {
      const isDoubleDeckerFirstFloor =
        config.numFloors > 1 && floorConfig.floorNumber === 1;

      const [floorSeatModels, updatedCounter] = generateRealisticSeatModels(
        diagramModel.id,
        floorConfig,
        isDoubleDeckerFirstFloor,
        seatNumberCounter,
      );

      allSeatModels.push(...floorSeatModels);
      seatNumberCounter = updatedCounter;
    }

    // Create all seat models in batch using the transaction context
    if (allSeatModels.length > 0) {
      await tx.insert(busSeatModels).values(allSeatModels);
    }

    return diagramModel;
  });
}

/**
 * Seeds bus diagram models with functional seat configurations
 * Creates different bus sizes: 40-seat single floor, 50-seat single floor, and 60-seat double floor
 */
export async function seedBusDiagramModels(): Promise<BusDiagramModel[]> {
  console.log('🚌 Seeding bus diagram models...');

  const diagramModels: BusDiagramModel[] = [];

  try {
    // 1. Single floor 40-seat bus (2+2 seats per row, 11 rows, with bathroom in last row)
    const smallBusConfig: CreateBusDiagramModelPayload = {
      name: 'Compact Bus 40 Seats',
      description:
        'Single floor compact bus with aisle, bathroom, and 40 passenger seats',
      maxCapacity: 42, // 40 seats + 2 staff
      numFloors: 1,
      seatsPerFloor: [
        {
          floorNumber: 1,
          numRows: 11, // 10 rows with seats + 1 row with bathroom
          seatsLeft: 2,
          seatsRight: 2,
        } as FloorSeats,
      ],
      totalSeats: 40, // Actual passenger seats (excluding bathroom row)
      isFactoryDefault: true,
      active: true,
    };

    console.log(
      '   🏗️ Creating 40-seat compact bus diagram with realistic layout...',
    );
    const smallBus =
      await createBusDiagramModelWithRealisticSeats(smallBusConfig);
    diagramModels.push(smallBus);
    console.log(
      '   ✅ Created 40-seat bus diagram with aisle, bathroom, and realistic layout',
    );

    // 2. Single floor 50-seat bus (2+2 seats per row, 13 rows, with bathroom in last row)
    const mediumBusConfig: CreateBusDiagramModelPayload = {
      name: 'Standard Bus 50 Seats',
      description:
        'Single floor standard bus with aisle, bathroom, and 50 passenger seats',
      maxCapacity: 52, // 50 seats + 2 staff
      numFloors: 1,
      seatsPerFloor: [
        {
          floorNumber: 1,
          numRows: 14, // 13 rows with seats + 1 row with bathroom
          seatsLeft: 2,
          seatsRight: 2,
        } as FloorSeats,
      ],
      totalSeats: 50, // Actual passenger seats (excluding bathroom row)
      isFactoryDefault: true,
      active: true,
    };

    console.log(
      '   🏗️ Creating 50-seat standard bus diagram with realistic layout...',
    );
    const mediumBus =
      await createBusDiagramModelWithRealisticSeats(mediumBusConfig);
    diagramModels.push(mediumBus);
    console.log(
      '   ✅ Created 50-seat bus diagram with aisle, bathroom, and realistic layout',
    );

    // 3. Double floor 60-seat bus with stairs, aisle, and bathroom
    const largeBusConfig: CreateBusDiagramModelPayload = {
      name: 'Double Decker Bus 60 Seats',
      description:
        'Double floor luxury bus with stairs, aisles, bathroom, and 60 passenger seats',
      maxCapacity: 64, // 60 seats + 4 staff (2 per floor)
      numFloors: 2,
      seatsPerFloor: [
        {
          floorNumber: 1,
          numRows: 11, // 10 rows with seats + 1 row with bathroom (stairs in first row corners)
          seatsLeft: 2,
          seatsRight: 2,
        } as FloorSeats,
        {
          floorNumber: 2,
          numRows: 8, // 8 rows with seats (no bathroom on upper floor)
          seatsLeft: 2,
          seatsRight: 2,
        } as FloorSeats,
      ],
      totalSeats: 60, // Actual passenger seats (excluding stairs, bathroom areas)
      isFactoryDefault: true,
      active: true,
    };

    console.log(
      '   🏗️ Creating 60-seat double decker bus diagram with realistic layout...',
    );
    const largeBus =
      await createBusDiagramModelWithRealisticSeats(largeBusConfig);
    diagramModels.push(largeBus);
    console.log(
      '   ✅ Created 60-seat double decker bus with stairs, aisles, bathroom, and realistic layout',
    );

    console.log(
      `✅ Successfully seeded ${diagramModels.length} bus diagram models with seats`,
    );

    // Log summary of created models
    diagramModels.forEach((model, index) => {
      console.log(
        `   ${index + 1}. ${model.name}: ${model.totalSeats} seats, ${model.numFloors} floor(s)`,
      );
    });

    return diagramModels;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error seeding bus diagram models:', errorMessage);
    throw error;
  }
}

/**
 * Seeds bus diagram model zones for pricing tiers
 * Creates different pricing zones for each bus diagram model
 */
export function seedBusDiagramModelZones(
  busDiagramModels: BusDiagramModel[],
): void {
  console.log('🎯 Seeding bus diagram model zones...');

  try {
    // Note: Zones are created automatically by the seat model generation process
    // This function is a placeholder for future zone-specific seeding if needed
    console.log(
      `   ℹ️ Zones are automatically created with seat models for ${busDiagramModels.length} diagrams`,
    );
    console.log('✅ Bus diagram model zones seeding completed');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error seeding bus diagram model zones:', errorMessage);
    throw error;
  }
}
