import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface IsEmptyTripBadgeProps {
  isEmptyTrip: boolean;
}

export default function IsEmptyTripBadge({
  isEmptyTrip,
}: IsEmptyTripBadgeProps) {
  const tCommon = useTranslations('common');
  return (
    <Badge
      variant="outline"
      className={cn(isEmptyTrip ? 'bg-gray-100' : 'bg-orange-100')}
    >
      {isEmptyTrip
        ? tCommon('status.emptyTrip')
        : tCommon('status.notEmptyTrip')}
    </Badge>
  );
}
