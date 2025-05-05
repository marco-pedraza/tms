import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';

export default function TerminalNotFound() {
  const tTerminals = useTranslations('terminals');

  return (
    <NotFound
      title={tTerminals('errors.notFound.title')}
      description={tTerminals('errors.notFound.description')}
      backHref="/terminals"
      backLabel={tTerminals('actions.backToList')}
    />
  );
}
