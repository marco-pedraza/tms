import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function TerminalNotFound() {
  const tTerminals = useTranslations('terminals');

  return (
    <NotFound
      title={tTerminals('errors.notFound.title')}
      description={tTerminals('errors.notFound.description')}
      backHref={routes.terminals.index}
      backLabel={tTerminals('actions.backToList')}
    />
  );
}
