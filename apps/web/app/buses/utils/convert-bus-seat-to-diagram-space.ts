import { bus_seat_models, bus_seats } from '@repo/ims-client';
import { SeatDiagramSpace } from '@/seat-diagrams/seat-diagrams.schemas';
import { SeatType, SpaceType } from '@/services/ims-client';

/**
 * Converts a BusSeatModel to SeatDiagramSpace format
 */
export function convertBusSeatModelToSeatDiagramSpace(
  busSeat: bus_seat_models.BusSeatModel,
): SeatDiagramSpace {
  return {
    floorNumber: busSeat.floorNumber,
    active: busSeat.active,
    position: {
      x: busSeat.position.x,
      y: busSeat.position.y,
    },
    spaceType: busSeat.spaceType as SpaceType,
    ...(busSeat.spaceType === 'seat' && {
      seatType: busSeat.seatType as SeatType,
      seatNumber: busSeat.seatNumber ?? '',
      amenities: busSeat.amenities ?? [],
      reclinementAngle: busSeat.reclinementAngle ?? '',
    }),
  };
}

/**
 * Converts a BusSeat to SeatDiagramSpace format
 */
export function convertBusSeatToSeatDiagramSpace(
  busSeat: bus_seats.BusSeat,
): SeatDiagramSpace {
  return {
    floorNumber: busSeat.floorNumber,
    active: busSeat.active,
    position: {
      x: busSeat.position.x,
      y: busSeat.position.y,
    },
    spaceType: busSeat.spaceType as SpaceType,
    ...(busSeat.spaceType === 'seat' && {
      seatType: busSeat.seatType as SeatType,
      seatNumber: busSeat.seatNumber ?? '',
      amenities: busSeat.amenities ?? [],
      reclinementAngle: busSeat.reclinementAngle ?? '',
    }),
  };
}
