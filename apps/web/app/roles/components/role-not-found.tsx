import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

/**
 * Component displayed when a role is not found or doesn't exist.
 */
export default function RoleNotFound() {
  const tRoles = useTranslations('roles');

  return (
    <NotFound
      title={tRoles('errors.notFound.title')}
      description={tRoles('errors.notFound.description')}
      backHref={routes.roles.index}
      backLabel={tRoles('actions.backToList')}
    />
  );
}
