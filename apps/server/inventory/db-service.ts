import { DB, initDrizzle } from '../db/database';

/**
 * Initialized DB instance for the inventory service
 */
export const db = initDrizzle(DB);
