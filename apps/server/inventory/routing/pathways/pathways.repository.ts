import { and, inArray, isNull } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';
import type { Node } from '@/inventory/locations/nodes/nodes.types';
import { pathwayOptionTollRepository } from '@/inventory/routing/pathway-options-tolls/pathway-options-tolls.repository';
import { pathwayOptionRepository } from '@/inventory/routing/pathway-options/pathway-options.repository';
import { pathways } from './pathways.schema';
import type {
  CreatePathwayPayload,
  PaginatedListPathwaysQueryParams,
  PaginatedListPathwaysResult,
  Pathway,
  PathwayOptionWithTolls,
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
    checkDependenciesOnSoftDelete: false,
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

    // Collect all pathway IDs to fetch options
    const pathwayIds = data.map((pathway) => pathway.id);

    // Fetch all pathway options for all pathways in a single query
    const allOptions =
      await pathwayOptionRepository.findByPathwayIds(pathwayIds);

    // Collect all option IDs to fetch tolls
    const optionIds = allOptions.map((option) => option.id);

    // Fetch all tolls for all options in a single query
    const allTolls =
      optionIds.length > 0
        ? await pathwayOptionTollRepository.findByOptionIds(optionIds)
        : [];

    // Create maps for quick lookup
    const optionsMap = new Map<number, PathwayOptionWithTolls[]>();
    const tollsMap = new Map<number, typeof allTolls>();

    // Group options by pathway ID
    allOptions.forEach((option) => {
      const list = optionsMap.get(option.pathwayId) ?? [];
      list.push({ ...option, tolls: [] });
      optionsMap.set(option.pathwayId, list);
    });

    // Group tolls by option ID
    allTolls.forEach((toll) => {
      const list = tollsMap.get(toll.pathwayOptionId) ?? [];
      list.push(toll);
      tollsMap.set(toll.pathwayOptionId, list);
    });

    // Enrich options with their tolls
    optionsMap.forEach((options) => {
      options.forEach((option) => {
        const tolls = tollsMap.get(option.id) || [];
        option.tolls = tolls.sort((a, b) => a.sequence - b.sequence);
      });
    });

    // Enrich pathways with their origin, destination nodes, and options
    return data.map((pathway) => {
      const originNode = nodesMap.get(pathway.originNodeId);
      const destinationNode = nodesMap.get(pathway.destinationNodeId);
      const options = optionsMap.get(pathway.id);

      if (!originNode || !destinationNode) {
        throw new NotFoundError(
          `Missing node(s) for pathway ${pathway.id}: originNodeId=${pathway.originNodeId} (${originNode ? 'found' : 'missing'}), destinationNodeId=${pathway.destinationNodeId} (${destinationNode ? 'found' : 'missing'})`,
        );
      }

      return {
        ...pathway,
        origin: originNode,
        destination: destinationNode,
        options:
          options?.map((option) => ({
            ...option,
            tolls: option.tolls ?? [],
          })) ?? [],
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

  async function findOneWithRelations(
    id: number,
  ): Promise<PathwayWithRelations> {
    const { baseWhere } = baseRepository.buildQueryExpressions({
      filters: { id },
    });

    const pathway = await db.query.pathways.findFirst({
      where: baseWhere,
      with: {
        originNode: true,
        destinationNode: true,
        options: {
          where: (option, { isNull }) => isNull(option.deletedAt),
          orderBy: (option, { asc }) => [asc(option.sequence)],
          with: {
            pathwayOptionTolls: {
              orderBy: (toll, { asc }) => [asc(toll.sequence)],
            },
          },
        },
      },
    });

    if (!pathway) {
      throw new NotFoundError(`Pathway with id ${id} not found`);
    }

    const options = pathway.options?.map(
      ({ pathwayOptionTolls, ...option }) => ({
        ...option,
        tolls: pathwayOptionTolls ?? [],
      }),
    );

    return {
      ...pathway,
      origin: pathway.originNode,
      destination: pathway.destinationNode,
      options: options ?? [],
    };
  }

  /**
   * Finds pathways by their IDs
   * @param ids - Array of pathway IDs to find
   * @param tx - Optional transaction instance
   * @returns Array of found pathways (may be less than requested if some don't exist or are deleted)
   */
  async function findByIds(
    ids: number[],
    tx?: TransactionalDB,
  ): Promise<Pathway[]> {
    if (ids.length === 0) {
      return [];
    }

    const dbInstance = tx || db;

    const results = await dbInstance
      .select()
      .from(pathways)
      .where(and(inArray(pathways.id, ids), isNull(pathways.deletedAt)));

    return results;
  }

  return {
    ...baseRepository,
    findAllPaginatedWithRelations,
    findOneWithRelations,
    findByIds,
  };
}

export const pathwayRepository = createPathwayRepository();
