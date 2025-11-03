import { DB, initDrizzle } from '@/db/database';

/**
 * Initialized DB instance for the planning service
 */
export const db = initDrizzle(DB);
