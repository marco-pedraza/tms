import { bus_seat_models } from '@repo/ims-client';
import { SeatDiagramSpace } from '@/seat-diagrams/seat-diagrams.schemas';
import { SeatType, SpaceType } from '@/services/ims-client';

/**
 * Converts a BusSeatModel (from template) to SeatDiagramSpace format
 *
 * This is used when displaying the template diagram before a bus is created
 * or when the user changes the template selection.
 */
export const convertBusSeatModelToSeatDiagramSpace = (
  busSeatModel: bus_seat_models.BusSeatModel,
): SeatDiagramSpace => {
  return {
    floorNumber: busSeatModel.floorNumber,
    active: busSeatModel.active,
    position: {
      x: busSeatModel.position.x,
      y: busSeatModel.position.y,
    },
    spaceType: busSeatModel.spaceType as SpaceType,
    ...(busSeatModel.spaceType === 'seat' && {
      seatType: busSeatModel.seatType as SeatType,
      seatNumber: busSeatModel.seatNumber ?? '',
      amenities: busSeatModel.amenities ?? [],
      reclinementAngle: busSeatModel.reclinementAngle ?? '',
    }),
  };
};
