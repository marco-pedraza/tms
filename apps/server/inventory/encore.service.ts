import { Service } from 'encore.dev/service';
import { errorsMiddleware } from '../shared/errors.middleware';
import { usersMiddleware } from '../users/users.middleware';

export default new Service('inventory', {
  middlewares: [errorsMiddleware, usersMiddleware],
});
