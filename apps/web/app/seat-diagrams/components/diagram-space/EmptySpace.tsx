import { cva } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import { SeatDiagramSpace } from '@/seat-diagrams/seat-diagrams.schemas';

const emptySpaceVariants = cva(
  'w-10 h-10 rounded-none bg-gray-200 border-dashed border-2 border-gray-300 shadow-none p-1',
  {
    variants: {
      isSelected: {
        true: 'ring-2 shadow-md',
      },
    },
  },
);
interface EmptySpaceProps {
  space: SeatDiagramSpace;
  onClick: (space: SeatDiagramSpace) => void;
  isSelected: boolean;
}

export default function EmptySpace({
  space,
  onClick,
  isSelected,
}: EmptySpaceProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => {
        onClick(space);
      }}
      className={emptySpaceVariants({ isSelected })}
      aria-label="Empty space"
      aria-pressed={isSelected}
    />
  );
}
