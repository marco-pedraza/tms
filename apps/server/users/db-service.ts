import { DB, initDrizzle } from '../db/database';

/**
 * Initialized DB instance for the users service
 */
export const db = initDrizzle(DB);
