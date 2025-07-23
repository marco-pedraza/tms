import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface ValueBadgeProps {
  value: boolean;
}

export default function AffirmationBadge({ value }: ValueBadgeProps) {
  const tCommon = useTranslations('common');
  return (
    <Badge
      variant="outline"
      className={cn(value ? 'bg-orange-100 text-orange-800' : 'bg-gray-100')}
    >
      {value ? tCommon('status.yes') : tCommon('status.no')}
    </Badge>
  );
}
