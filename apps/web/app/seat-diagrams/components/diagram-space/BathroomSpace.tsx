import { cva } from 'class-variance-authority';
import { Bath } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeatDiagramSpace } from '@/seat-diagrams/seat-diagrams.schemas';

const bathroomSpaceVariants = cva(
  'w-10 h-10 rounded-none bg-gray-200 border-2 border-gray-300 shadow-none p-1',
  {
    variants: {
      isSelected: {
        true: 'ring-2 shadow-md',
      },
    },
  },
);

interface BathroomSpaceProps {
  space: SeatDiagramSpace;
  onClick: (space: SeatDiagramSpace) => void;
  isSelected: boolean;
}

export default function BathroomSpace({
  space,
  onClick,
  isSelected,
}: BathroomSpaceProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={() => {
        onClick(space);
      }}
      className={bathroomSpaceVariants({ isSelected })}
      aria-label="Bathroom space"
      aria-pressed={isSelected}
    >
      <Bath className="w-4 h-4" />
    </Button>
  );
}
