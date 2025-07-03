import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function NodeNotFound() {
  const tNodes = useTranslations('nodes');

  return (
    <NotFound
      title={tNodes('errors.notFound.title')}
      description={tNodes('errors.notFound.description')}
      backHref={routes.nodes.index}
      backLabel={tNodes('actions.backToList')}
    />
  );
}
