import BathroomSpace from '@/seat-diagrams/components/diagram-space/BathroomSpace';
import HallwaySpace from '@/seat-diagrams/components/diagram-space/HallwaySpace';
import SeatSpace from '@/seat-diagrams/components/diagram-space/SeatSpace';
import StairsSpace from '@/seat-diagrams/components/diagram-space/StairsSpace';
import {
  SeatDiagramSpace,
  SeatSpaceType,
} from '@/seat-diagrams/seat-diagrams.schemas';
import { SpaceType } from '@/services/ims-client';
import EmptySpace from './EmptySpace';

interface DiagramSpaceProps {
  space: SeatDiagramSpace;
  isSelected: boolean;
  onClick: (space: SeatDiagramSpace) => void;
  readOnly?: boolean;
}

export default function DiagramSpace({
  space,
  isSelected,
  onClick,
  readOnly = false,
}: DiagramSpaceProps) {
  switch (space.spaceType) {
    case SpaceType.SEAT:
      return (
        <SeatSpace
          space={space as SeatSpaceType}
          isSelected={isSelected}
          onClick={onClick}
          readOnly={readOnly}
        />
      );

    case SpaceType.HALLWAY:
      return (
        <HallwaySpace
          space={space}
          onClick={onClick}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );

    case SpaceType.BATHROOM:
      return (
        <BathroomSpace
          space={space}
          onClick={onClick}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );

    case SpaceType.STAIRS:
      return (
        <StairsSpace
          space={space}
          onClick={onClick}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );

    case SpaceType.EMPTY:
      return (
        <EmptySpace
          space={space}
          onClick={onClick}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
  }
}
