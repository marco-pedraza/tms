import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { db } from '@/inventory/db-service';
import { installationPropertyRepository } from '@/inventory/locations/installation-properties/installation-properties.repository';
import { createInstallationSchema } from '@/inventory/locations/installation-schemas/installation-schemas.controller';
import { InstallationSchemaFieldType } from '@/inventory/locations/installation-schemas/installation-schemas.types';
import { createInstallationType } from '@/inventory/locations/installation-types/installation-types.controller';
import { installationRepository } from '@/inventory/locations/installations/installations.repository';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
  findOrCreate,
} from '@/tests/shared/test-utils';
import { cityFactory } from '@/factories';
import { getFactoryDb } from '@/factories/factory-utils';
import { tollboothRepository } from './tollbooths.repository';

describe('Tollbooths Repository', () => {
  const testSuiteId = createTestSuiteId('tollbooths-repo');
  const factoryDb = getFactoryDb(db);
  let testCityId: number;
  let tollboothTypeId: number;
  let tollPriceSchemaId: number;
  let iaveEnabledSchemaId: number;

  const nodeCleanup = createCleanupHelper(
    ({ id }) => nodeRepository.forceDelete(id),
    'node',
  );

  const installationPropertyCleanup = createCleanupHelper(
    ({ id }) => installationPropertyRepository.forceDelete(id),
    'installation property',
  );

  const installationCleanup = createCleanupHelper(
    ({ id }) => installationRepository.forceDelete(id),
    'installation',
  );

  beforeAll(async () => {
    // Create test city
    const testCity = await cityFactory(factoryDb).create({
      name: createUniqueName('Tollbooth Repo Test City', testSuiteId),
      latitude: 19.7431,
      longitude: -99.2237,
      timezone: 'America/Mexico_City',
    });
    testCityId = testCity.id;

    // Use findOrCreate to handle race conditions for TOLLBOOTH installation type
    const tollboothType = await findOrCreate(
      async () => {
        return await db.query.installationTypes.findFirst({
          where: (installationTypes, { eq, and, isNull }) =>
            and(
              eq(installationTypes.code, 'TOLLBOOTH'),
              isNull(installationTypes.deletedAt),
            ),
        });
      },
      async () => {
        return await createInstallationType({
          name: createUniqueName('Tollbooth Type', testSuiteId),
          code: 'TOLLBOOTH',
        });
      },
    );
    tollboothTypeId = tollboothType.id;

    // Find or create required schemas for tollbooths (with race condition handling)
    try {
      const existingTollPriceSchema =
        await db.query.installationSchemas.findFirst({
          where: (installationSchemas, { eq, and, isNull }) =>
            and(
              eq(installationSchemas.name, 'toll_price'),
              eq(installationSchemas.installationTypeId, tollboothTypeId),
              isNull(installationSchemas.deletedAt),
            ),
        });

      if (existingTollPriceSchema) {
        tollPriceSchemaId = existingTollPriceSchema.id;
      } else {
        const tollPriceSchema = await createInstallationSchema({
          name: 'toll_price',
          description: 'Precio del peaje en pesos',
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
          installationTypeId: tollboothTypeId,
        });
        tollPriceSchemaId = tollPriceSchema.id;
      }
    } catch (error) {
      // Handle race condition - if another test created it, fetch it
      const schema = await db.query.installationSchemas.findFirst({
        where: (installationSchemas, { eq, and, isNull }) =>
          and(
            eq(installationSchemas.name, 'toll_price'),
            eq(installationSchemas.installationTypeId, tollboothTypeId),
            isNull(installationSchemas.deletedAt),
          ),
      });
      if (schema) {
        tollPriceSchemaId = schema.id;
      } else {
        throw error; // Re-throw if it wasn't a race condition
      }
    }

    try {
      const existingIaveEnabledSchema =
        await db.query.installationSchemas.findFirst({
          where: (installationSchemas, { eq, and, isNull }) =>
            and(
              eq(installationSchemas.name, 'iave_enabled'),
              eq(installationSchemas.installationTypeId, tollboothTypeId),
              isNull(installationSchemas.deletedAt),
            ),
        });

      if (existingIaveEnabledSchema) {
        iaveEnabledSchemaId = existingIaveEnabledSchema.id;
      } else {
        const iaveEnabledSchema = await createInstallationSchema({
          name: 'iave_enabled',
          description: 'Indica si el peaje acepta pago con IAVE',
          type: InstallationSchemaFieldType.BOOLEAN,
          required: true,
          installationTypeId: tollboothTypeId,
        });
        iaveEnabledSchemaId = iaveEnabledSchema.id;
      }
    } catch (error) {
      // Handle race condition - if another test created it, fetch it
      const schema = await db.query.installationSchemas.findFirst({
        where: (installationSchemas, { eq, and, isNull }) =>
          and(
            eq(installationSchemas.name, 'iave_enabled'),
            eq(installationSchemas.installationTypeId, tollboothTypeId),
            isNull(installationSchemas.deletedAt),
          ),
      });
      if (schema) {
        iaveEnabledSchemaId = schema.id;
      } else {
        throw error; // Re-throw if it wasn't a race condition
      }
    }
  });

  afterAll(async () => {
    await nodeCleanup.cleanupAll();
    await installationPropertyCleanup.cleanupAll();
    await installationCleanup.cleanupAll();
  });

  /**
   * Helper function to create a valid tollbooth for testing
   */
  async function createTestTollbooth(
    overrides?: Partial<{
      code: string;
      name: string;
      tollPrice: string;
      iaveEnabled: string;
    }>,
  ) {
    const nodeCode = overrides?.code ?? createUniqueCode('TOLL', 4);
    const node = await nodeRepository.create({
      code: nodeCode,
      name: overrides?.name ?? createUniqueName('Caseta Test', testSuiteId),
      slug: nodeCode.toLowerCase(),
      latitude: 19.7431,
      longitude: -99.2237,
      radius: 100,
      cityId: testCityId,
      active: true,
    });
    nodeCleanup.track(node.id);

    const installation = await installationRepository.create({
      name: createUniqueName('Tollbooth Installation', testSuiteId),
      address: 'Test Address',
      installationTypeId: tollboothTypeId,
    });
    installationCleanup.track(installation.id);

    await nodeRepository.update(node.id, {
      installationId: installation.id,
    });

    const tollPriceProperty = await installationPropertyRepository.create({
      installationId: installation.id,
      installationSchemaId: tollPriceSchemaId,
      value: overrides?.tollPrice ?? '150.00',
    });

    const iaveProperty = await installationPropertyRepository.create({
      installationId: installation.id,
      installationSchemaId: iaveEnabledSchemaId,
      value: overrides?.iaveEnabled ?? 'true',
    });

    // Track properties for cleanup
    installationPropertyCleanup.track(tollPriceProperty.id);
    installationPropertyCleanup.track(iaveProperty.id);

    return node.id;
  }

  describe('findByIds', () => {
    test('should return empty array when no IDs provided', async () => {
      const result = await tollboothRepository.findByIds([]);

      expect(result).toEqual([]);
    });

    test('should return single tollbooth when one valid ID provided', async () => {
      // Arrange
      const nodeId = await createTestTollbooth({
        tollPrice: '100.00',
        iaveEnabled: 'true',
      });

      // Act
      const result = await tollboothRepository.findByIds([nodeId]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(nodeId);
      expect(result[0].tollPrice).toBe(100);
      expect(result[0].iaveEnabled).toBe(true);
    });

    test('should return multiple tollbooths when multiple valid IDs provided', async () => {
      // Arrange
      const nodeId1 = await createTestTollbooth({
        code: createUniqueCode('TOLL1', 5),
        tollPrice: '150.00',
        iaveEnabled: 'true',
      });

      const nodeId2 = await createTestTollbooth({
        code: createUniqueCode('TOLL2', 5),
        tollPrice: '200.00',
        iaveEnabled: 'false',
      });

      const nodeId3 = await createTestTollbooth({
        code: createUniqueCode('TOLL3', 5),
        tollPrice: '250.00',
        iaveEnabled: 'true',
      });

      // Act
      const result = await tollboothRepository.findByIds([
        nodeId1,
        nodeId2,
        nodeId3,
      ]);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map((t) => t.id).sort()).toEqual(
        [nodeId1, nodeId2, nodeId3].sort(),
      );
      expect(result.find((t) => t.id === nodeId1)?.tollPrice).toBe(150);
      expect(result.find((t) => t.id === nodeId2)?.tollPrice).toBe(200);
      expect(result.find((t) => t.id === nodeId3)?.tollPrice).toBe(250);
    });

    test('should return only valid tollbooths when some IDs are invalid', async () => {
      // Arrange
      const validNodeId = await createTestTollbooth({
        tollPrice: '100.00',
      });

      const invalidNodeId = 999999; // Non-existent ID

      // Act
      const result = await tollboothRepository.findByIds([
        validNodeId,
        invalidNodeId,
      ]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(validNodeId);
    });

    test('should return only tollbooths, not regular nodes', async () => {
      // Arrange
      const tollboothNodeId = await createTestTollbooth();

      // Create a regular node (not a tollbooth)
      const regularNode = await nodeRepository.create({
        code: createUniqueCode('NODE', 4),
        name: createUniqueName('Regular Node', testSuiteId),
        slug: createUniqueCode('node', 4),
        latitude: 19.5,
        longitude: -99.2,
        radius: 100,
        cityId: testCityId,
        active: true,
      });
      nodeCleanup.track(regularNode.id);

      // Act
      const result = await tollboothRepository.findByIds([
        tollboothNodeId,
        regularNode.id,
      ]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(tollboothNodeId);
    });

    test('should return empty array when all IDs are non-tollbooths', async () => {
      // Arrange: Create two regular nodes
      const regularNode1 = await nodeRepository.create({
        code: createUniqueCode('NODE1', 5),
        name: createUniqueName('Regular Node 1', testSuiteId),
        slug: createUniqueCode('node1', 5),
        latitude: 19.5,
        longitude: -99.2,
        radius: 100,
        cityId: testCityId,
        active: true,
      });
      nodeCleanup.track(regularNode1.id);

      const regularNode2 = await nodeRepository.create({
        code: createUniqueCode('NODE2', 5),
        name: createUniqueName('Regular Node 2', testSuiteId),
        slug: createUniqueCode('node2', 5),
        latitude: 19.5,
        longitude: -99.2,
        radius: 100,
        cityId: testCityId,
        active: true,
      });
      nodeCleanup.track(regularNode2.id);

      // Act
      const result = await tollboothRepository.findByIds([
        regularNode1.id,
        regularNode2.id,
      ]);

      // Assert
      expect(result).toEqual([]);
    });

    test('should not return soft-deleted tollbooths', async () => {
      // Arrange
      const nodeId = await createTestTollbooth();

      // Soft delete the node
      await nodeRepository.delete(nodeId);

      // Act
      const result = await tollboothRepository.findByIds([nodeId]);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
