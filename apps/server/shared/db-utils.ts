import { PgSelect } from 'drizzle-orm/pg-core';
import { PaginatedResult, PaginationMeta, PaginationParams } from './types';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;
const MAX_PAGE_SIZE = 100;

/**
 * Applies pagination to a query and handles metadata calculation
 *
 * @param query Main query in dynamic mode
 * @param countQuery Query to get total count
 * @param params Pagination parameters
 * @returns Paginated results with metadata
 *
 * @template T Query type
 * @template TRecord Type of returned records
 */
export async function withPagination<T extends PgSelect, TRecord>(
  query: T,
  countQuery: Promise<{ count: number }[]> | Promise<{ count: bigint }[]>,
  params: PaginationParams = {},
): Promise<PaginatedResult<TRecord>> {
  // Extraer y validar parámetros de paginación
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const pageSize = Math.max(
    1,
    Math.min(MAX_PAGE_SIZE, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );

  // Aplicar paginación a la consulta
  const offset = (page - 1) * pageSize;
  const paginatedQuery = query.limit(pageSize).offset(offset);

  // Ejecutar ambas consultas en paralelo para mejor rendimiento
  const [results, countResult] = await Promise.all([
    paginatedQuery,
    countQuery,
  ]);

  const totalCount = Number(countResult[0]?.count || 0);

  const totalPages = Math.ceil(totalCount / pageSize);

  const paginationMeta: PaginationMeta = {
    currentPage: page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  return {
    data: results as TRecord[],
    pagination: paginationMeta,
  };
}
