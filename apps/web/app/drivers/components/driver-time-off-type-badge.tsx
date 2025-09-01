import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { TimeOffType } from '@/services/ims-client';
import { cn } from '@/utils/cn';

type TimeOffTypesDisplayConfig = {
  [key in TimeOffType]: {
    color: string;
  };
};

const timeOffTypes: TimeOffTypesDisplayConfig = {
  [TimeOffType.VACATION]: {
    color: 'bg-green-100',
  },
  [TimeOffType.LEAVE]: {
    color: 'bg-blue-100',
  },
  [TimeOffType.SICK_LEAVE]: {
    color: 'bg-red-100',
  },
  [TimeOffType.PERSONAL_DAY]: {
    color: 'bg-purple-100',
  },
  [TimeOffType.OTHER]: {
    color: 'bg-gray-100',
  },
};

export default function DriverTimeOffTypeBadge({
  type,
}: {
  type: TimeOffType;
}) {
  const t = useTranslations('timeOffs.types');

  const getTypeLabel = (type: TimeOffType) => {
    switch (type) {
      case TimeOffType.VACATION:
        return t('vacation');
      case TimeOffType.LEAVE:
        return t('leave');
      case TimeOffType.SICK_LEAVE:
        return t('sick_leave');
      case TimeOffType.PERSONAL_DAY:
        return t('personal_day');
      case TimeOffType.OTHER:
      default:
        return t('other');
    }
  };

  return (
    <Badge variant="outline" className={cn(timeOffTypes[type].color)}>
      {getTypeLabel(type)}
    </Badge>
  );
}
