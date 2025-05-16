import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface IsActiveBadgeProps {
  isActive: boolean;
}

export default function IsActiveBadge({ isActive }: IsActiveBadgeProps) {
  const tCommon = useTranslations('common');
  return (
    <Badge
      variant="outline"
      className={cn(isActive ? 'bg-green-100' : 'bg-red-100')}
    >
      {isActive ? tCommon('status.active') : tCommon('status.inactive')}
    </Badge>
  );
}
