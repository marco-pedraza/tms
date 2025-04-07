import { Service } from 'encore.dev/service';
import { usersMiddleware } from './users.middleware';

export default new Service('users', {
  middlewares: [usersMiddleware],
});
