import { useTranslations } from 'next-intl';
import type { medical_checks } from '@repo/ims-client';
import { Badge } from '@/components/ui/badge';
import { MedicalCheckResult } from '@/services/ims-client';
import { cn } from '@/utils/cn';

type MedicalCheckResultsDisplayConfig = {
  [key in medical_checks.MedicalCheckResult]: {
    color: string;
  };
};

const medicalCheckResults: MedicalCheckResultsDisplayConfig = {
  [MedicalCheckResult.FIT]: {
    color: 'bg-green-100',
  },
  [MedicalCheckResult.LIMITED]: {
    color: 'bg-yellow-100',
  },
  [MedicalCheckResult.UNFIT]: {
    color: 'bg-red-100',
  },
};

export default function DriverMedicalCheckResultBadge({
  result,
}: {
  result: medical_checks.MedicalCheckResult;
}) {
  const tMedicalChecks = useTranslations('medicalChecks');

  const getResultLabel = (result: medical_checks.MedicalCheckResult) => {
    switch (result) {
      case MedicalCheckResult.FIT:
        return tMedicalChecks('results.fit');
      case MedicalCheckResult.LIMITED:
        return tMedicalChecks('results.limited');
      case MedicalCheckResult.UNFIT:
        return tMedicalChecks('results.unfit');
      default:
        return tMedicalChecks('results.unfit');
    }
  };

  return (
    <Badge variant="outline" className={cn(medicalCheckResults[result].color)}>
      {getResultLabel(result)}
    </Badge>
  );
}
