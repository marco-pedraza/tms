import { expect, describe, test } from 'vitest';
import { count } from './user.controller';

describe('User Controller', () => {
  test('Should return the number of users', async () => {
    const resp = await count();
    console.log(resp);
    expect(resp.result).toBe(0);
  });
});
