import { Service } from 'encore.dev/service';
import { usersMiddleware } from '@/users/users.middleware';
import { errorsMiddleware } from '@/shared/errors.middleware';
import { logger } from '@/shared/logger.middleware';
import { sentryMiddleware } from '@/shared/sentry.middleware';

export default new Service('planning', {
  middlewares: [logger, sentryMiddleware, errorsMiddleware, usersMiddleware],
});
