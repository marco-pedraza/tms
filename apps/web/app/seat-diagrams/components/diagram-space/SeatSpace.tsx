import { cva } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import { SeatSpaceType } from '@/seat-diagrams/seat-diagrams.schemas';

const seatSpaceVariants = cva(
  'w-10 h-10 rounded-none bg-white border-2 border-gray-300 shadow-none p-1 flex flex-col items-center justify-center text-xs text-gray-800 font-bold hover:bg-gray-200 cursor-pointer',
  {
    variants: {
      seatType: {
        regular: '',
        premium: 'bg-purple-100 border-purple-500 hover:bg-purple-600',
        vip: 'bg-green-100 border-green-500 hover:bg-green-600',
        business: 'bg-blue-100 border-blue-500 hover:bg-blue-600',
        executive: 'bg-yellow-100 border-yellow-500 hover:bg-yellow-600',
      },
      isSelected: {
        true: 'ring-2 shadow-md',
      },
    },
  },
);

interface SeatSpaceProps {
  space: SeatSpaceType;
  isSelected: boolean;
  onClick: (space: SeatSpaceType) => void;
}

export default function SeatSpace({
  space,
  isSelected,
  onClick,
}: SeatSpaceProps) {
  return (
    <Button
      type="button"
      onClick={() => {
        onClick(space);
      }}
      className={seatSpaceVariants({ seatType: space.seatType, isSelected })}
      disabled={!space.active}
    >
      {space.seatNumber ? (
        space.seatNumber
      ) : (
        <span className="text-gray-400">s/n</span>
      )}
    </Button>
  );
}
