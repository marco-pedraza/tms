import { cva } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import { SeatDiagramSpace } from '@/seat-diagrams/seat-diagrams.schemas';

const hallwaySpaceVariants = cva(
  'w-10 h-10 rounded-none bg-white border-dashed border-2 border-gray-300 shadow-none p-1',
  {
    variants: {
      isSelected: {
        true: 'ring-2 shadow-md',
      },
    },
  },
);
interface HallwaySpaceProps {
  space: SeatDiagramSpace;
  onClick: (space: SeatDiagramSpace) => void;
  isSelected: boolean;
}

export default function HallwaySpace({
  space,
  onClick,
  isSelected,
}: HallwaySpaceProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => {
        onClick(space);
      }}
      className={hallwaySpaceVariants({ isSelected })}
      aria-label="Hallway space"
      aria-pressed={isSelected}
    />
  );
}
