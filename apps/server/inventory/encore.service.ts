import { Service } from 'encore.dev/service';
import { errorsMiddleware } from '../shared/errors.middleware';
import { logger } from '../shared/logger.middleware';
import { sentryMiddleware } from '../shared/sentry.middleware';
import { usersMiddleware } from '../users/users.middleware';

export default new Service('inventory', {
  middlewares: [logger, sentryMiddleware, errorsMiddleware, usersMiddleware],
});
