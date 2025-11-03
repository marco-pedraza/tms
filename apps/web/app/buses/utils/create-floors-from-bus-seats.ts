import { bus_seats } from '@repo/ims-client';

/**
 * Groups bus seats by floor number
 *
 * Takes a flat array of bus seats and organizes them into floors,
 * creating the structure expected by the seat diagram form.
 */
export function createFloorsFromBusSeats(
  seatConfiguration: bus_seats.BusSeat[],
) {
  const numberOfFloors = Math.max(
    ...seatConfiguration.map((seat) => seat.floorNumber),
  );
  const floors: {
    floorNumber: number;
    spaces: bus_seats.BusSeat[];
  }[] = Array.from({ length: numberOfFloors }, (_, index) => ({
    floorNumber: index + 1,
    spaces: [],
  }));

  seatConfiguration.forEach((seat) => {
    const floor = floors.find(
      (floor) => floor.floorNumber === seat.floorNumber,
    );
    if (floor) {
      floor.spaces.push(seat);
    }
  });

  return floors;
}
