import { bus_seat_models } from '@repo/ims-client';
import { SeatType, SpaceType } from '@/services/ims-client';
import { SeatDiagramFormValues } from './seat-diagram-form';

/**
 * Generate a seat diagram from a quick configuration
 * @param quickConfiguration - The quick configuration to generate the seat diagram from
 * @returns The generated seat diagram
 *
 *  Example:
 *  const floor1 = {
 *    floorNumber: 1,
 *    quickConfiguration: {
 *      numRows: 10,
 *      seatsLeft: 2,
 *      seatsRight: 2,
 *    },
 *    zones: []
 *    seats: [
 *      {
 *        id: 1,
 *        spaceType: 'seat',
 *        seatType: 'regular',
 *        seatNumber: '1A',
 *        position: {
 *          x: 0,
 *          y: 0,
 *        },
 *      },
 *      {
 *        id: 2,
 *        spaceType: 'bathroom',
 *        position: {
 *          x: 0,
 *          y: 1,
 *        },
 *      },
 *    ]
 *  }
 *  const floor2 = {
 *    floorNumber: 2,
 *    quickConfiguration: {
 *      numRows: 5,
 *      seatsLeft: 1,
 *      seatsRight: 2,
 *    },
 *    zones: []
 *    seats: []
 *  }
 *
 * const seatDiagram = [
 *  floor1,
 *  floor2,
 * ]
 *  seat diagram
 *  -- each entry is a floor
 *  ----- each entry is a row
 *  ------- each entry is a space (BusSeatModel)
 */
export default function createFloorsFromQuickConfig(
  quickConfiguration: SeatDiagramFormValues['seatsPerFloor'],
) {
  // build floors
  // -- by default, each space in a floor is a hallway, or a seat
  // -- the seat number is the global seat number counter incremented for each seat
  // -- for now, the zones array is empty
  let globalSeatNumberCounter = 1;
  const floors = quickConfiguration.map((floor) => {
    const seatsLeft: bus_seat_models.BusSeatModel[] = [];
    const seatsRight: bus_seat_models.BusSeatModel[] = [];
    const hallways: bus_seat_models.BusSeatModel[] = [];
    for (let row = 0; row < floor.numRows; row++) {
      for (let seat = 0; seat < floor.seatsLeft; seat++) {
        seatsLeft.push({
          id: Number(`${floor.floorNumber}${row}${seat}`),
          spaceType: SpaceType.SEAT,
          seatType: SeatType.REGULAR,
          seatNumber: `${globalSeatNumberCounter++}`,
          position: {
            x: seat,
            y: row,
          },
          meta: {},
          busDiagramModelId: 0,
          floorNumber: floor.floorNumber,
          amenities: [],
          // @ts-expect-error - @todo improve typing
          reclinementAngle: '',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      for (let seat = 0; seat < floor.seatsRight; seat++) {
        seatsRight.push({
          id: Number(`${floor.floorNumber}${row}${floor.seatsLeft + seat + 1}`),
          spaceType: SpaceType.SEAT,
          seatType: SeatType.REGULAR,
          seatNumber: `${globalSeatNumberCounter++}`,
          position: {
            x: floor.seatsLeft + seat + 1,
            y: row,
          },
          meta: {},
          busDiagramModelId: 0,
          floorNumber: floor.floorNumber,
          amenities: [],
          // @ts-expect-error - @todo improve typing
          reclinementAngle: '',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      hallways.push({
        id: Number(`${floor.floorNumber}${row}${floor.seatsLeft}`),
        spaceType: SpaceType.HALLWAY,
        position: {
          x: floor.seatsLeft,
          y: row,
        },
        meta: {},
        busDiagramModelId: 0,
        floorNumber: floor.floorNumber,
        amenities: [],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return {
      floorNumber: floor.floorNumber,
      spaces: [...seatsLeft, ...hallways, ...seatsRight],
    };
  });

  return floors;
}

export function createFloorsFromSeatConfiguration(
  seatConfiguration: bus_seat_models.BusSeatModel[],
) {
  const numberOfFloors = Math.max(
    ...seatConfiguration.map((seat) => seat.floorNumber),
  );
  const floors: {
    floorNumber: number;
    spaces: bus_seat_models.BusSeatModel[];
  }[] = Array.from({ length: numberOfFloors }, (_, index) => ({
    floorNumber: index + 1,
    spaces: [],
  }));

  seatConfiguration.forEach((seat) => {
    const floor = floors.find(
      (floor) => floor.floorNumber === seat.floorNumber,
    );
    if (floor) {
      floor.spaces.push({
        ...seat,
        // @ts-expect-error - @todo improve typing
        reclinementAngle: seat.reclinementAngle ?? '',
      });
    }
  });

  return floors;
}
