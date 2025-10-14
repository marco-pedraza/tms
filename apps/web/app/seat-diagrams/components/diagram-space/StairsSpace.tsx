import { cva } from 'class-variance-authority';
import { MoveUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeatDiagramSpace } from '@/seat-diagrams/seat-diagrams.schemas';

const stairsSpaceVariants = cva(
  'w-10 h-10 rounded-none bg-gray-200 border-2 border-gray-300 shadow-none p-1',
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
interface StairsSpaceProps {
  space: SeatDiagramSpace;
  onClick: (space: SeatDiagramSpace) => void;
  isSelected: boolean;
  readOnly?: boolean;
}

export default function StairsSpace({
  space,
  onClick,
  isSelected,
  readOnly = false,
}: StairsSpaceProps) {
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
      className={stairsSpaceVariants({ isSelected, readOnly })}
      disabled={false}
      aria-label="Stairs space"
      aria-pressed={isSelected}
    >
      <MoveUpRight className="w-4 h-4" />
    </Button>
  );
}
