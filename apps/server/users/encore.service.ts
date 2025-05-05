import { Service } from 'encore.dev/service';
import { errorsMiddleware } from '../shared/errors.middleware';
import { usersMiddleware } from './users.middleware';
import { logger } from '../shared/logger.middleware';

export default new Service('users', {
  middlewares: [logger, errorsMiddleware, usersMiddleware],
});
