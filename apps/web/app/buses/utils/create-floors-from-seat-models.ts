import { bus_seat_models } from '@repo/ims-client';

/**
 * Groups bus seat models by floor number
 *
 * Takes a flat array of bus seat models from a template and organizes them into floors,
 * creating the structure expected by the seat diagram form.
 */
export function createFloorsFromSeatModels(
  seatModels: bus_seat_models.BusSeatModel[],
) {
  if (!seatModels || seatModels.length === 0) {
    return [];
  }

  const numberOfFloors = Math.max(
    ...seatModels.map((seat) => seat.floorNumber),
  );
  const floors: {
    floorNumber: number;
    spaces: bus_seat_models.BusSeatModel[];
  }[] = Array.from({ length: numberOfFloors }, (_, index) => ({
    floorNumber: index + 1,
    spaces: [],
  }));

  seatModels.forEach((seat) => {
    const floor = floors.find(
      (floor) => floor.floorNumber === seat.floorNumber,
    );
    if (floor) {
      floor.spaces.push(seat);
    }
  });

  return floors;
}
