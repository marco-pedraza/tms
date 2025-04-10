import { Service } from 'encore.dev/service';
import { errorsMiddleware } from '../shared/errors.middleware';
import { usersMiddleware } from './users.middleware';

export default new Service('users', {
  middlewares: [errorsMiddleware, usersMiddleware],
});
