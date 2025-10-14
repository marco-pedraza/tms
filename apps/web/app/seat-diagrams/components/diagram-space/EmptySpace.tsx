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
      readOnly: {
        true: 'cursor-default',
        false: 'cursor-pointer',
      },
    },
  },
);
interface EmptySpaceProps {
  space: SeatDiagramSpace;
  onClick: (space: SeatDiagramSpace) => void;
  isSelected: boolean;
  readOnly?: boolean;
}

export default function EmptySpace({
  space,
  onClick,
  isSelected,
  readOnly = false,
}: EmptySpaceProps) {
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
      className={emptySpaceVariants({ isSelected, readOnly })}
      disabled={false}
      aria-label="Empty space"
      aria-pressed={isSelected}
    />
  );
}
