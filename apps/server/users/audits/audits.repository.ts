import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';
import { audits } from './audits.schema';
import { Audit, CreateAuditPayload } from './audits.types';

/**
 * Creates a repository for managing audit operations
 * @returns {Object} An object containing audit-specific operations and base CRUD operations
 */
export const createAuditsRepository = () => {
  const baseRepository = createBaseRepository<
    Audit,
    CreateAuditPayload,
    never, // No updates for audit logs
    typeof audits
  >(db, audits, 'Audit');

  return {
    ...baseRepository,
  };
};

export const auditsRepository = createAuditsRepository();
