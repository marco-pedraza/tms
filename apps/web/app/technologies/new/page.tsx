'use client';

import { useTranslations } from 'next-intl';
import TechnologyForm, {
  type TechnologyFormValues,
} from '@/app/technologies/components/technology-form';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import useTechnologyMutations from '@/technologies/hooks/use-technology-mutations';

export default function NewTechnologyPage() {
  const t = useTranslations('technologies');
  const { create: createTechnology } = useTechnologyMutations();

  const handleSubmit = (values: TechnologyFormValues) =>
    createTechnology.mutateWithToast(values);

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.technologies.index}
        backLabel={t('actions.backToList')}
      />
      <TechnologyForm onSubmit={handleSubmit} />
    </div>
  );
}
