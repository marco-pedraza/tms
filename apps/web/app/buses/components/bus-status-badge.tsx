import { useTranslations } from 'next-intl';
import { buses } from '@repo/ims-client';
import busStatusTranslationKeys from '@/buses/translations/bus-status-translations-keys';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

type BusStatusesDisplayConfig = {
  [key in buses.BusStatus]: {
    color: string;
  };
};

const busStatuses: BusStatusesDisplayConfig = {
  ACTIVE: {
    color: 'bg-green-100 text-green-800 ',
  },
  MAINTENANCE: {
    color: 'bg-yellow-100 text-yellow-800',
  },
  REPAIR: {
    color: 'bg-orange-100 text-orange-800',
  },
  OUT_OF_SERVICE: {
    color: 'bg-red-100 text-red-800',
  },
  RESERVED: {
    color: 'bg-blue-100 text-blue-800',
  },
  IN_TRANSIT: {
    color: 'bg-purple-100 text-purple-800',
  },
  RETIRED: {
    color: 'bg-gray-100 text-gray-800',
  },
};

export default function BusStatusBadge({
  status,
}: {
  status: buses.BusStatus;
}) {
  const tBuses = useTranslations('buses');
  return (
    <Badge variant="outline" className={cn(busStatuses[status].color)}>
      {tBuses(`status.${busStatusTranslationKeys[status]}`)}
    </Badge>
  );
}
