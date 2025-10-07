import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { NotFoundError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { installationPropertyRepository } from '@/inventory/locations/installation-properties/installation-properties.repository';
import { installationSchemaRepository } from '@/inventory/locations/installation-schemas/installation-schemas.repository';
import { InstallationSchemaFieldType } from '@/inventory/locations/installation-schemas/installation-schemas.types';
import { installationTypeRepository } from '@/inventory/locations/installation-types/installation-types.repository';
import { installationRepository } from '@/inventory/locations/installations/installations.repository';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '@/tests/shared/test-utils';
import { cityFactory, populationFactory } from '@/factories';
import { getFactoryDb } from '@/factories/factory-utils';
import { createInstallationType } from '../installation-types/installation-types.controller';
import { createTollboothRepository } from './tollbooths.repository';
import {
  getTollbooth,
  listTollbooths,
  resetTollboothRepository,
  setTollboothRepository,
} from './tollbooths.controller';

describe('Tollbooths Controller', () => {
  const testSuiteId = createTestSuiteId('tollbooths');
  const factoryDb = getFactoryDb(db);
  let testCityId: number;
  let testPopulationId: number;
  let tollboothTypeId: number;
  let tollboothTypeCode: string;
  let tollboothNodeId: number;
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
    // Create test city and population
    const testCity = await cityFactory(factoryDb).create({
      name: createUniqueName('Tollbooth Test City', testSuiteId),
      latitude: 19.7431,
      longitude: -99.2237,
      timezone: 'America/Mexico_City',
    });
    testCityId = testCity.id;

    const testPopulation = await populationFactory(factoryDb).create({
      code: createUniqueCode('TPOP', 3),
      description: 'Test population for tollbooths',
      active: true,
    });
    testPopulationId = testPopulation.id;

    // Create TOLLBOOTH installation type for testing with unique code
    tollboothTypeCode = createUniqueCode('TOLLBOOTH', 10);
    const tollboothType = await installationTypeRepository.create({
      name: createUniqueName('Tollbooth Type', testSuiteId),
      code: tollboothTypeCode,
      description: 'Test tollbooth installation type',
    });
    tollboothTypeId = tollboothType.id;

    // Create a custom repository for this test suite
    const testTollboothRepository =
      createTollboothRepository(tollboothTypeCode);
    setTollboothRepository(testTollboothRepository);

    // Create required schemas
    const tollPriceSchema = await installationSchemaRepository.create({
      name: 'toll_price',
      description: 'Precio del peaje en pesos',
      type: InstallationSchemaFieldType.NUMBER,
      required: true,
      installationTypeId: tollboothTypeId,
    });
    tollPriceSchemaId = tollPriceSchema.id;

    const iaveEnabledSchema = await installationSchemaRepository.create({
      name: 'iave_enabled',
      description: 'Indica si el peaje acepta pago con IAVE',
      type: InstallationSchemaFieldType.BOOLEAN,
      required: true,
      installationTypeId: tollboothTypeId,
    });
    iaveEnabledSchemaId = iaveEnabledSchema.id;

    // Create test node
    const nodeCode = createUniqueCode('TOLL', 4);
    const testNode = await nodeRepository.create({
      code: nodeCode,
      name: createUniqueName('Caseta Test', testSuiteId),
      slug: nodeCode.toLowerCase(),
      latitude: 19.7431,
      longitude: -99.2237,
      radius: 100,
      cityId: testCityId,
      populationId: testPopulationId,
      active: true,
    });
    tollboothNodeId = testNode.id;
    nodeCleanup.track(testNode.id);

    // Create installation
    const installation = await installationRepository.create({
      name: createUniqueName('Tollbooth Installation', testSuiteId),
      address: 'Test Address',
      installationTypeId: tollboothTypeId,
    });
    installationCleanup.track(installation.id);

    // Link node to installation
    await nodeRepository.update(tollboothNodeId, {
      installationId: installation.id,
    });

    // Create properties
    const tollPriceProperty = await installationPropertyRepository.create({
      installationId: installation.id,
      installationSchemaId: tollPriceSchemaId,
      value: '150.00',
    });

    const iaveProperty = await installationPropertyRepository.create({
      installationId: installation.id,
      installationSchemaId: iaveEnabledSchemaId,
      value: 'true',
    });

    // Track properties for cleanup
    installationPropertyCleanup.track(tollPriceProperty.id);
    installationPropertyCleanup.track(iaveProperty.id);
  });

  afterAll(async () => {
    // Reset repository to default
    resetTollboothRepository();

    await nodeCleanup.cleanupAll();
    await installationPropertyCleanup.cleanupAll();
    await installationCleanup.cleanupAll();
  });

  describe('getTollbooth', () => {
    test('should retrieve a tollbooth by ID', async () => {
      const tollbooth = await getTollbooth({ id: tollboothNodeId });

      expect(tollbooth).toBeDefined();
      expect(tollbooth.id).toBe(tollboothNodeId);
      expect(tollbooth.tollPrice).toBe(150);
      expect(tollbooth.iaveEnabled).toBe(true);
      expect(tollbooth.cityId).toBe(testCityId);
      expect(tollbooth.populationId).toBe(testPopulationId);
    });

    test('should throw NotFoundError for non-existent tollbooth', async () => {
      await expect(getTollbooth({ id: 999999 })).rejects.toThrow(NotFoundError);
    });

    test('should throw NotFoundError for node with non-TOLLBOOTH installation', async () => {
      // Create a different installation type
      const otherType = await createInstallationType({
        name: createUniqueName('Other Type', testSuiteId),
        code: createUniqueCode('OTHER', 4),
        description: 'Non-tollbooth type',
      });

      // Create node with different installation type
      const otherNodeCode = createUniqueCode('OTHER', 4);
      const otherNode = await nodeRepository.create({
        code: otherNodeCode,
        name: createUniqueName('Other Node', testSuiteId),
        slug: otherNodeCode.toLowerCase(),
        latitude: 19.5,
        longitude: -99.2,
        radius: 50,
        cityId: testCityId,
        active: true,
      });
      nodeCleanup.track(otherNode.id);

      const otherInstallation = await installationRepository.create({
        name: createUniqueName('Other Installation', testSuiteId),
        address: 'Other Address',
        installationTypeId: otherType.id,
      });
      installationCleanup.track(otherInstallation.id);

      await nodeRepository.update(otherNode.id, {
        installationId: otherInstallation.id,
      });

      // Should throw NotFoundError because it's not a TOLLBOOTH
      await expect(getTollbooth({ id: otherNode.id })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('listTollbooths', () => {
    test('should list all tollbooths', async () => {
      const result = await listTollbooths({});

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);

      const tollbooth = result.data.find((t) => t.id === tollboothNodeId);
      expect(tollbooth).toBeDefined();
      expect(tollbooth?.tollPrice).toBe(150);
    });

    test('should filter tollbooths by active status', async () => {
      const result = await listTollbooths({
        filters: { active: true },
      });

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.every((t) => t.active)).toBe(true);
    });
  });
});
