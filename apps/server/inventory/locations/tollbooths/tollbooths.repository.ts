import { and, eq, exists, inArray, isNull } from 'drizzle-orm';
import { NotFoundError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { installationTypes } from '@/inventory/locations/installation-types/installation-types.schema';
import { installations } from '@/inventory/locations/installations/installations.schema';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';
import type { ListTollboothsQueryParams, Tollbooth } from './tollbooths.types';
import {
  type NodeWithInstallationRaw,
  mapToTollbooth,
} from './tollbooths.mapper';

const DEFAULT_INSTALLATION_TYPE_CODE = 'TOLLBOOTH';
const TOLLBOOTH_WITH_CLAUSE = {
  installation: {
    with: {
      installationType: true,
      installationProperties: {
        with: {
          installationSchema: true,
        },
      },
    },
  },
} as const;

function buildTollboothCondition(
  installationTypeCode = DEFAULT_INSTALLATION_TYPE_CODE,
) {
  return exists(
    db
      .select()
      .from(installations)
      .innerJoin(
        installationTypes,
        eq(installations.installationTypeId, installationTypes.id),
      )
      .where(
        and(
          eq(installations.id, nodes.installationId),
          eq(installationTypes.code, installationTypeCode),
          isNull(installations.deletedAt),
        ),
      ),
  );
}

export function createTollboothRepository(
  installationTypeCode = DEFAULT_INSTALLATION_TYPE_CODE,
) {
  /**
   * Finds a tollbooth by node ID using db.query with relations
   */
  async function findOne(nodeId: number): Promise<Tollbooth> {
    const node = await db.query.nodes.findFirst({
      where: and(
        eq(nodes.id, nodeId),
        isNull(nodes.deletedAt),
        buildTollboothCondition(installationTypeCode),
      ),
      with: TOLLBOOTH_WITH_CLAUSE,
    });

    if (!node) {
      throw new NotFoundError(
        `Node with id ${nodeId} not found or is not a tollbooth`,
      );
    }

    if (!node.installation) {
      throw new NotFoundError(`Node ${nodeId} is not a tollbooth`);
    }

    return mapToTollbooth(node as NodeWithInstallationRaw);
  }

  /**
   * Finds tollbooths by multiple node IDs using db.query with relations (single query)
   */
  async function findByIds(nodeIds: number[]): Promise<Tollbooth[]> {
    if (nodeIds.length === 0) {
      return [];
    }

    const nodesData = await db.query.nodes.findMany({
      where: and(
        inArray(nodes.id, nodeIds),
        isNull(nodes.deletedAt),
        buildTollboothCondition(installationTypeCode),
      ),
      with: TOLLBOOTH_WITH_CLAUSE,
    });

    return nodesData
      .filter((node) => node.installation)
      .map((node) => mapToTollbooth(node as NodeWithInstallationRaw));
  }

  /**
   * Finds all tollbooths using db.query with relations (single query)
   */
  async function findAll(
    params?: ListTollboothsQueryParams,
  ): Promise<Tollbooth[]> {
    const { baseWhere, baseOrderBy } = nodeRepository.buildQueryExpressions(
      params as Parameters<typeof nodeRepository.buildQueryExpressions>[0],
    );

    const combinedWhere = baseWhere
      ? and(baseWhere, buildTollboothCondition(installationTypeCode))
      : buildTollboothCondition(installationTypeCode);

    const nodesData = await db.query.nodes.findMany({
      where: combinedWhere,
      orderBy: baseOrderBy,
      with: TOLLBOOTH_WITH_CLAUSE,
    });

    return nodesData
      .filter((node) => node.installation)
      .map((node) => mapToTollbooth(node as NodeWithInstallationRaw));
  }

  return {
    findOne,
    findByIds,
    findAll,
  };
}

export const tollboothRepository = createTollboothRepository();
