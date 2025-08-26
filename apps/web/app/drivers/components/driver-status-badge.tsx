import { useTranslations } from 'next-intl';
import { drivers } from '@repo/ims-client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

type DriverStatusesDisplayConfig = {
  [key in drivers.DriverStatus]: {
    color: string;
  };
};

const driverStatuses: DriverStatusesDisplayConfig = {
  active: {
    color: 'bg-green-100',
  },
  inactive: {
    color: 'bg-red-100',
  },
  suspended: {
    color: 'bg-yellow-100',
  },
  on_leave: {
    color: 'bg-blue-100',
  },
  terminated: {
    color: 'bg-gray-100',
  },
  in_training: {
    color: 'bg-purple-100',
  },
  probation: {
    color: 'bg-orange-100',
  },
};

export default function DriverStatusBadge({
  status,
}: {
  status: drivers.DriverStatus;
}) {
  const tDrivers = useTranslations('drivers');
  return (
    <Badge variant="outline" className={cn(driverStatuses[status].color)}>
      {tDrivers(`status.${status}`)}
    </Badge>
  );
}
