/**
 * Test utilities for creating and managing tollbooth test data
 *
 * This module provides utilities to simplify tollbooth test data creation across
 * the test suite, ensuring consistency and handling common setup requirements.
 *
 * ## Usage Example
 *
 * ```typescript
 * describe('My Tollbooth Tests', () => {
 *   let tollboothInfrastructure: TollboothInfrastructure;
 *   const testSuiteId = createTestSuiteId('my-test-suite');
 *
 *   beforeAll(async () => {
 *     // Setup tollbooth infrastructure once for all tests
 *     tollboothInfrastructure = await setupTollboothInfrastructure(db, testSuiteId);
 *   });
 *
 *   beforeEach(async () => {
 *     // Create tollbooths as needed
 *     const tollbooth = await createTestTollbooth({
 *       cityId: testCityId,
 *       populationId: testPopulationId,
 *       testSuiteId,
 *       infrastructure: tollboothInfrastructure,
 *       tollPrice: '100.00',
 *     });
 *     // Remember to track for cleanup
 *     installationCleanup.track(tollbooth.installationId);
 *   });
 * });
 * ```
 *
 * ## Key Features
 * - Race condition handling for parallel test execution
 * - Automatic unique identifier generation
 * - Consistent tollbooth setup with required properties
 * - TOLLBOOTH code requirement for tollboothRepository compatibility
 */
import type { db as dbType } from '@/inventory/db-service';
import {
  createCleanupHelper,
  createUniqueCode,
  createUniqueName,
  findOrCreate,
} from '@/tests/shared/test-utils';
import { installationPropertyRepository } from '../installation-properties/installation-properties.repository';
import { createInstallationSchema } from '../installation-schemas/installation-schemas.controller';
import { InstallationSchemaFieldType } from '../installation-schemas/installation-schemas.types';
import { createInstallationType } from '../installation-types/installation-types.controller';
import { installationRepository } from '../installations/installations.repository';
import { nodeRepository } from '../nodes/nodes.repository';

/**
 * Interface for tollbooth infrastructure IDs
 */
export interface TollboothInfrastructure {
  tollboothTypeId: number;
  tollPriceSchemaId: number;
  iaveEnabledSchemaId: number;
}

/**
 * Interface for created tollbooth test data
 */
export interface TollboothTestData {
  nodeId: number;
  installationId: number;
  tollPrice: string;
  iaveEnabled: boolean;
}

/**
 * Sets up the global tollbooth infrastructure (installation type and schemas)
 * This should be called once in beforeAll() to initialize the TOLLBOOTH type and schemas
 *
 * @param db - Database instance for querying
 * @param testSuiteId - Unique test suite identifier
 * @returns Object containing the IDs of the created infrastructure
 */
export async function setupTollboothInfrastructure(
  db: typeof dbType,
  testSuiteId: string,
): Promise<TollboothInfrastructure> {
  // Find or create TOLLBOOTH installation type (handles race conditions)
  const tollboothType = await findOrCreate<{ id: number }>(
    async () => {
      const type = await db.query.installationTypes.findFirst({
        where: (installationTypes, { eq, and, isNull }) =>
          and(
            eq(installationTypes.code, 'TOLLBOOTH'),
            isNull(installationTypes.deletedAt),
          ),
      });
      return type ?? undefined;
    },
    () =>
      createInstallationType({
        name: createUniqueName('Tollbooth Type', testSuiteId),
        code: 'TOLLBOOTH', // Must be 'TOLLBOOTH' to match tollboothRepository default
      }),
  );

  const tollboothTypeId = tollboothType.id;

  // Find or create toll_price schema
  const tollPriceSchema = await findOrCreate<{ id: number }>(
    async () => {
      const schema = await db.query.installationSchemas.findFirst({
        where: (installationSchemas, { eq, and, isNull }) =>
          and(
            eq(installationSchemas.name, 'toll_price'),
            eq(installationSchemas.installationTypeId, tollboothTypeId),
            isNull(installationSchemas.deletedAt),
          ),
      });
      return schema ?? undefined;
    },
    () =>
      createInstallationSchema({
        name: 'toll_price',
        description: 'Precio del peaje en pesos',
        type: InstallationSchemaFieldType.NUMBER,
        required: true,
        installationTypeId: tollboothTypeId,
      }),
  );

  // Find or create iave_enabled schema
  const iaveEnabledSchema = await findOrCreate<{ id: number }>(
    async () => {
      const schema = await db.query.installationSchemas.findFirst({
        where: (installationSchemas, { eq, and, isNull }) =>
          and(
            eq(installationSchemas.name, 'iave_enabled'),
            eq(installationSchemas.installationTypeId, tollboothTypeId),
            isNull(installationSchemas.deletedAt),
          ),
      });
      return schema ?? undefined;
    },
    () =>
      createInstallationSchema({
        name: 'iave_enabled',
        description: 'Indica si el peaje acepta pago con IAVE',
        type: InstallationSchemaFieldType.BOOLEAN,
        required: true,
        installationTypeId: tollboothTypeId,
      }),
  );

  return {
    tollboothTypeId,
    tollPriceSchemaId: tollPriceSchema.id,
    iaveEnabledSchemaId: iaveEnabledSchema.id,
  };
}

/**
 * Options for creating a test tollbooth
 */
export interface CreateTestTollboothOptions {
  /** City ID where the tollbooth node will be located */
  cityId: number;
  /** Population ID for the tollbooth node */
  populationId: number;
  /** Test suite ID for unique naming */
  testSuiteId: string;
  /** Tollbooth infrastructure (type and schema IDs) */
  infrastructure: TollboothInfrastructure;
  /** Optional: Custom toll price (default: '100.00') */
  tollPrice?: string;
  /** Optional: Whether IAVE is enabled (default: true) */
  iaveEnabled?: boolean;
  /** Optional: Custom node code (default: generated) */
  nodeCode?: string;
  /** Optional: Custom node name (default: generated) */
  nodeName?: string;
  /** Optional: Latitude (default: 19.5) */
  latitude?: number;
  /** Optional: Longitude (default: -99.5) */
  longitude?: number;
}

/**
 * Creates a complete test tollbooth with node, installation, and properties
 * This is a helper function to reduce boilerplate in tests
 *
 * @param options - Configuration options for the tollbooth
 * @returns Object containing the created node and installation IDs
 */
export async function createTestTollbooth(
  options: CreateTestTollboothOptions,
  installationPropertyCleanup?: ReturnType<typeof createCleanupHelper>,
): Promise<TollboothTestData> {
  const {
    cityId,
    populationId,
    testSuiteId,
    infrastructure,
    tollPrice = '100.00',
    iaveEnabled = true,
    nodeCode,
    nodeName,
    latitude = 19.5,
    longitude = -99.5,
  } = options;

  // Generate unique identifiers
  const code = nodeCode ?? createUniqueCode('TOLL', 5);
  const name = nodeName ?? createUniqueName('Test Tollbooth', testSuiteId);
  const slug = code.toLowerCase();

  // Create the node
  const node = await nodeRepository.create({
    code,
    name,
    cityId,
    latitude,
    longitude,
    radius: 1000,
    slug,
    populationId,
    allowsBoarding: false,
    allowsAlighting: false,
    active: true,
  });

  // Create the installation
  const installation = await installationRepository.create({
    name: createUniqueName('Tollbooth Installation', testSuiteId),
    address: 'Test Tollbooth Address',
    installationTypeId: infrastructure.tollboothTypeId,
  });

  // Link installation to node
  await nodeRepository.update(node.id, {
    installationId: installation.id,
  });

  // Create toll_price property
  const tollPriceProperty = await installationPropertyRepository.create({
    installationId: installation.id,
    installationSchemaId: infrastructure.tollPriceSchemaId,
    value: tollPrice,
  });

  // Create iave_enabled property
  const iaveProperty = await installationPropertyRepository.create({
    installationId: installation.id,
    installationSchemaId: infrastructure.iaveEnabledSchemaId,
    value: iaveEnabled ? 'true' : 'false',
  });

  // Track properties for cleanup if cleanup helper is provided
  if (installationPropertyCleanup) {
    installationPropertyCleanup.track(tollPriceProperty.id);
    installationPropertyCleanup.track(iaveProperty.id);
  }

  return {
    nodeId: node.id,
    installationId: installation.id,
    tollPrice,
    iaveEnabled,
  };
}
