import { api } from 'encore.dev/api';
import { PaginatedAudits, PaginationParamsAudits } from './audits.types';
import { auditsRepository } from './audits.repository';

/**
 * Retrieves paginated audit entries with optional filtering
 * @param params - Pagination parameters with optional filtering (by service, userId, etc.)
 * @returns {Promise<PaginatedAudits>} Paginated list of audit entries
 */
export const listAuditsPaginated = api(
  { method: 'POST', path: '/audits/paginated', expose: true, auth: true },
  async (params: PaginationParamsAudits): Promise<PaginatedAudits> => {
    return await auditsRepository.findAllPaginated(params);
  },
);
