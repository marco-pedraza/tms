import { SeatDiagramSpace } from '@/seat-diagrams/seat-diagrams.schemas';
import { SpaceType } from '@/services/ims-client';

/**
 * Syncs seatsPerFloor configuration with actual seatConfiguration
 * This ensures that the quick config reflects the actual diagram state
 * after manual modifications (adding/removing columns/rows)
 */
export function syncSeatsPerFloorWithConfiguration(
  seatsPerFloor: {
    floorNumber: number;
    numRows: number;
    seatsLeft: number;
    seatsRight: number;
  }[],
  seatConfiguration: {
    floorNumber: number;
    spaces: SeatDiagramSpace[];
  }[],
) {
  return seatConfiguration.map((floorSpaces) => {
    // Find existing config for this floor, or create default values
    const existingConfig = seatsPerFloor.find(
      (config) => config.floorNumber === floorSpaces.floorNumber,
    );

    if (!floorSpaces.spaces || floorSpaces.spaces.length === 0) {
      return (
        existingConfig ?? {
          floorNumber: floorSpaces.floorNumber,
          numRows: 0,
          seatsLeft: 0,
          seatsRight: 0,
        }
      );
    }

    // Calculate actual dimensions from seatConfiguration
    const maxY = Math.max(
      ...floorSpaces.spaces.map((space) => space.position.y),
    );

    // Find the main hallway (most common X position with HALLWAY type)
    const hallwaySpaces = floorSpaces.spaces.filter(
      (space) => space.spaceType === SpaceType.HALLWAY,
    );

    let mainHallwayX: number | null = null;
    if (hallwaySpaces.length > 0) {
      const hallwayCountByX = new Map<number, number>();
      hallwaySpaces.forEach((hallway) => {
        const x = hallway.position.x;
        hallwayCountByX.set(x, (hallwayCountByX.get(x) ?? 0) + 1);
      });

      let maxCount = 0;
      hallwayCountByX.forEach((count, x) => {
        if (count > maxCount) {
          maxCount = count;
          mainHallwayX = x;
        }
      });
    }

    // Calculate seats left and right based on actual configuration
    let seatsLeft = 0;
    let seatsRight = 0;

    if (mainHallwayX !== null) {
      // Count seats before and after the main hallway
      const leftSeats = floorSpaces.spaces.filter(
        (space) =>
          space.position.x < (mainHallwayX as number) &&
          space.spaceType === SpaceType.SEAT,
      );
      const rightSeats = floorSpaces.spaces.filter(
        (space) =>
          space.position.x > (mainHallwayX as number) &&
          space.spaceType === SpaceType.SEAT,
      );

      // Get unique X positions to count columns
      const leftColumns = new Set(leftSeats.map((seat) => seat.position.x))
        .size;
      const rightColumns = new Set(rightSeats.map((seat) => seat.position.x))
        .size;

      seatsLeft = leftColumns;
      seatsRight = rightColumns;
    } else {
      // No hallway, count all seats as left side
      const allSeats = floorSpaces.spaces.filter(
        (space) => space.spaceType === SpaceType.SEAT,
      );
      const uniqueXPositions = new Set(allSeats.map((seat) => seat.position.x));
      seatsLeft = uniqueXPositions.size;
      seatsRight = 0;
    }

    return {
      ...existingConfig,
      floorNumber: floorSpaces.floorNumber,
      numRows: maxY + 1, // Convert from 0-based to 1-based
      seatsLeft,
      seatsRight,
    };
  });
}
