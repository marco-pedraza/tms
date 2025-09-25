import { inArray } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';
import type { Node } from '@/inventory/locations/nodes/nodes.types';
import { pathways } from './pathways.schema';
import type {
  CreatePathwayPayload,
  PaginatedListPathwaysQueryParams,
  PaginatedListPathwaysResult,
  Pathway,
  PathwayWithRelations,
  UpdatePathwayPayload,
} from './pathways.types';

export function createPathwayRepository() {
  const baseRepository = createBaseRepository<
    Pathway,
    CreatePathwayPayload,
    UpdatePathwayPayload,
    typeof pathways
  >(db, pathways, 'Pathway', {
    searchableFields: [pathways.name, pathways.code],
    softDeleteEnabled: true,
  });

  /**
   * Enriches pathways with origin and destination nodes to prevent N+1 queries
   * @param data - Array of pathway entities to enrich
   * @returns Array of pathways with origin and destination nodes included
   */
  async function enrichWithRelations(
    data: Pathway[],
  ): Promise<PathwayWithRelations[]> {
    if (data.length === 0) {
      return [];
    }

    // Collect all unique node IDs from pathways
    const nodeIds = new Set<number>();
    data.forEach((pathway) => {
      nodeIds.add(pathway.originNodeId);
      nodeIds.add(pathway.destinationNodeId);
    });

    // Fetch all required nodes in a single query
    const nodesData = await db
      .select()
      .from(nodes)
      .where(inArray(nodes.id, Array.from(nodeIds)));

    // Create a map for quick node lookup
    const nodesMap = new Map<number, Node>();
    nodesData.forEach((node) => {
      nodesMap.set(node.id, node);
    });

    // Enrich pathways with their origin and destination nodes
    return data.map((pathway) => {
      const originNode = nodesMap.get(pathway.originNodeId);
      const destinationNode = nodesMap.get(pathway.destinationNodeId);

      if (!originNode || !destinationNode) {
        throw new NotFoundError(
          `Missing node(s) for pathway ${pathway.id}: originNodeId=${pathway.originNodeId} (${originNode ? 'found' : 'missing'}), destinationNodeId=${pathway.destinationNodeId} (${destinationNode ? 'found' : 'missing'})`,
        );
      }

      return {
        ...pathway,
        origin: originNode,
        destination: destinationNode,
      };
    });
  }

  async function findAllPaginatedWithRelations(
    params: PaginatedListPathwaysQueryParams,
  ): Promise<PaginatedListPathwaysResult> {
    // Get paginated results using base repository
    const result = await baseRepository.findAllPaginated(params);

    // Enrich with relations
    const enrichedData = await enrichWithRelations(result.data);

    return {
      data: enrichedData,
      pagination: result.pagination,
    };
  }

  return {
    ...baseRepository,
    findAllPaginatedWithRelations,
  };
}

export const pathwayRepository = createPathwayRepository();
