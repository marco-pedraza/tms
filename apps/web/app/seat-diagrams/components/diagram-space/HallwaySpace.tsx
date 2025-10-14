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
      readOnly: {
        true: 'cursor-default',
        false: 'cursor-pointer',
      },
    },
  },
);
interface HallwaySpaceProps {
  space: SeatDiagramSpace;
  onClick: (space: SeatDiagramSpace) => void;
  isSelected: boolean;
  readOnly?: boolean;
}

export default function HallwaySpace({
  space,
  onClick,
  isSelected,
  readOnly = false,
}: HallwaySpaceProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => {
        if (!readOnly) {
          onClick(space);
        }
      }}
      className={hallwaySpaceVariants({ isSelected, readOnly })}
      disabled={false}
      aria-label="Hallway space"
      aria-pressed={isSelected}
    />
  );
}
