import { fakerES_MX as faker } from '@faker-js/faker';
import { createSlug } from '@/shared/utils';
import type { City } from '@/inventory/locations/cities/cities.types';
import type { InstallationType } from '@/inventory/locations/installation-types/installation-types.types';
// Removed factory imports - using repositories directly for transaction visibility
import { installationRepository } from '@/inventory/locations/installations/installations.repository';
import type { Installation } from '@/inventory/locations/installations/installations.types';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import type { Node } from '@/inventory/locations/nodes/nodes.types';
import type { Population } from '@/inventory/locations/populations/populations.types';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
} from './client-data.utils';

/**
 * Normalizes text for matching (removes accents, converts to lowercase)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics/accents
}

/**
 * Finds a city by name using fuzzy matching
 */
function findCityByName(cities: City[], cityName: string): City | null {
  const searchName = normalizeText(cityName);

  // Try exact match first
  let city = cities.find((c) => normalizeText(c.name) === searchName);

  // If not found, try partial match
  if (!city) {
    city = cities.find((c) => normalizeText(c.name).includes(searchName));
  }

  // If still not found, try reverse partial match
  if (!city) {
    city = cities.find((c) => searchName.includes(normalizeText(c.name)));
  }

  return city || null;
}

/**
 * Finds a population by code or name
 * Handles both formats: "CODE" and "CODE-STATE"
 */
function findPopulationByCodeOrName(
  populations: Population[],
  idPoblacion: string,
): Population | null {
  if (!idPoblacion) return null;

  // Extract code and name from "CODE - NAME" format
  const parts = idPoblacion.split(' - ');
  const code = parts[0]?.trim();
  const name = parts[1]?.trim();

  if (!code) return null;

  // Try to find by exact code first (e.g., "MANZ-CO")
  let population = populations.find((p) => p.code === code);

  // If not found, try to find by code prefix (e.g., "MANZ" matches "MANZ-CO")
  if (!population) {
    population = populations.find((p) => p.code.startsWith(code + '-'));
  }

  // If still not found and we have a name, try by name
  if (!population && name) {
    const searchName = normalizeText(name);
    population = populations.find((p) => normalizeText(p.name) === searchName);
  }

  // If still not found, try partial name matching
  if (!population && name) {
    const searchName = normalizeText(name);
    population = populations.find(
      (p) =>
        normalizeText(p.name).includes(searchName) ||
        searchName.includes(normalizeText(p.name)),
    );
  }

  return population || null;
}

/**
 * Gets a random installation type, preferring "PARADA" for most nodes
 */
function getInstallationTypeForNode(
  installationTypes: InstallationType[],
  nodeData: {
    Nombre?: string;
    siglasNodo?: string;
    [key: string]: unknown;
  },
): InstallationType {
  // Guard against empty installation types array
  if (installationTypes.length === 0) {
    throw new Error(
      'No installation types provided to getInstallationTypeForNode',
    );
  }

  // Look for specific installation types
  const parada = installationTypes.find((it) => it.code === 'PARADA');
  const terminal = installationTypes.find((it) => it.code === 'TERMINAL');
  const defaultType = installationTypes[0];

  // If the node name suggests it's a terminal/central, use TERMINAL
  const nodeName = normalizeText(nodeData.Nombre ?? '');
  if (
    nodeName.includes('central') ||
    nodeName.includes('terminal') ||
    nodeName.includes('estacion')
  ) {
    return terminal || parada || defaultType;
  }

  // Otherwise, use PARADA (bus stop) for most nodes
  return parada || terminal || defaultType;
}

/**
 * Creates an installation for a node
 */
async function createInstallationForNode(
  nodeData: {
    Nombre?: string;
    siglasNodo?: string;
    [key: string]: unknown;
  },
  city: City,
  installationType: InstallationType,
): Promise<Installation> {
  // Generate installation details using faker
  const installationName = nodeData.Nombre ?? faker.company.name();
  const address = `${faker.location.streetAddress()}, ${city.name}`;

  // Add node code to make installation name unique
  const uniqueInstallationName = `${installationName} - ${nodeData.siglasNodo}`;

  const installationPayload = {
    name: uniqueInstallationName,
    address: address,
    installationTypeId: installationType.id,
    description: `${installationType.name} - ${installationName}`,
    contactPhone: faker.phone.number(),
    contactEmail: faker.internet.email(),
    website: faker.internet.url(),
    operatingHours: null,
    deletedAt: null,
  };

  return await installationRepository.create(installationPayload);
}

/**
 * Interface definition for node data from client JSON
 */
interface NodeDataFromClient {
  ID: number;
  siglasNodo: string;
  Nombre: string;
  ID_Poblacion: string;
  ID_Instalacion?: string | null;
  Coord_Latitud: number;
  Coord_Longitud: number;
  Radio: number;
  ciudad: string;
  estado: string;
  [key: string]: unknown;
}

/**
 * Validates and finds dependencies for a node
 */
function validateNodeDependencies(
  nodeData: NodeDataFromClient,
  cities: City[],
  populations: Population[],
): { city: City; population: Population } | null {
  const city = findCityByName(cities, nodeData.ciudad);
  if (!city) {
    console.warn(
      `   ⚠️ City not found: ${nodeData.ciudad} for node ${nodeData.siglasNodo}`,
    );
    return null;
  }

  const population = findPopulationByCodeOrName(
    populations,
    nodeData.ID_Poblacion,
  );
  if (!population) {
    console.warn(
      `   ⚠️ Population not found: ${nodeData.ID_Poblacion} for node ${nodeData.siglasNodo}`,
    );
    return null;
  }

  return { city, population };
}

/**
 * Creates a single node with its installation
 */
async function createSingleNodeWithInstallation(
  nodeData: NodeDataFromClient,
  city: City,
  population: Population,
  installationTypes: InstallationType[],
): Promise<Node> {
  const installationType = getInstallationTypeForNode(
    installationTypes,
    nodeData,
  );

  const installation = await createInstallationForNode(
    nodeData,
    city,
    installationType,
  );

  const nodeSlug = createSlug(
    `${nodeData.Nombre}-${nodeData.siglasNodo}`,
    city.name,
  );
  // Parse numeric fields with safe fallbacks
  const latitude = parseFloat(String(nodeData.Coord_Latitud));
  const longitude = parseFloat(String(nodeData.Coord_Longitud));
  const radius = parseFloat(String(nodeData.Radio ?? 50));

  const nodePayload = {
    code: nodeData.siglasNodo,
    name: nodeData.Nombre,
    latitude: isNaN(latitude) ? 0 : latitude,
    longitude: isNaN(longitude) ? 0 : longitude,
    radius: isNaN(radius) ? 50 : radius,
    slug: nodeSlug,
    allowsBoarding: true,
    allowsAlighting: true,
    active: true,
    cityId: city.id,
    populationId: population.id,
    installationId: installation.id,
    deletedAt: null,
  };

  return await nodeRepository.create(nodePayload);
}

/**
 * Creates nodes from client JSON data using batch processing to avoid ID conflicts
 */
async function createNodesFromClientData(
  nodesData: NodeDataFromClient[],
  cities: City[],
  populations: Population[],
  installationTypes: InstallationType[],
): Promise<Node[]> {
  const nodes: Node[] = [];
  let successCount = 0;
  let errorCount = 0;

  console.log(
    `   🏗️ Creating ${nodesData.length} nodes with installations from client data...`,
  );

  // Process in batches to avoid ID conflicts
  const BATCH_SIZE = 100;
  const totalBatches = Math.ceil(nodesData.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const batchStart = i * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, nodesData.length);
    const batch = nodesData.slice(batchStart, batchEnd);
    const batchNumber = i + 1;

    console.log(
      `   📦 Processing batch ${batchNumber} of ${totalBatches} (${batch.length} nodes)`,
    );

    // Process each node in the batch sequentially
    for (const nodeData of batch) {
      try {
        const dependencies = validateNodeDependencies(
          nodeData,
          cities,
          populations,
        );
        if (!dependencies) {
          errorCount++;
          continue;
        }

        const node = await createSingleNodeWithInstallation(
          nodeData,
          dependencies.city,
          dependencies.population,
          installationTypes,
        );

        nodes.push(node);
        successCount++;
      } catch (error) {
        console.error(
          `   ❌ Error creating node ${nodeData.siglasNodo}:`,
          error instanceof Error ? error.message : error,
        );
        errorCount++;
      }
    }

    // No delay between batches needed - removed for performance
  }

  console.log(
    `   ✅ Created ${successCount} nodes with installations from client data`,
  );
  if (errorCount > 0) {
    console.log(`   ⚠️ Failed to create ${errorCount} nodes`);
  }

  return nodes;
}

/**
 * Seeds nodes with their corresponding installations
 * Each node gets its own installation created automatically
 */
export async function seedNodes(
  cities: City[],
  populations: Population[],
  installationTypes: InstallationType[],
  clientCode?: string,
): Promise<Node[]> {
  console.log('🚏 Seeding nodes with installations...');

  // Fail fast when prerequisites are empty
  if (!cities.length || !populations.length) {
    throw new Error('seedNodes requires non-empty cities and populations.');
  }

  // Try to use client data if available
  if (clientCode && hasClientData(clientCode, CLIENT_DATA_FILES.NODES)) {
    console.log(`🚏 Seeding nodes for client: ${clientCode.toUpperCase()}`);

    try {
      const nodesData = (await loadClientData(
        clientCode,
        CLIENT_DATA_FILES.NODES,
      )) as NodeDataFromClient[];

      if (nodesData?.length > 0) {
        console.log(`   📊 Found ${nodesData.length} nodes in JSON data`);

        return await createNodesFromClientData(
          nodesData,
          cities,
          populations,
          installationTypes,
        );
      }
    } catch (error) {
      console.warn(
        `   ⚠️ Error loading client nodes data: ${error instanceof Error ? error.message : error}`,
      );
      console.log('   🔄 Falling back to random data generation...');
    }
  }

  // Default behavior - generate random nodes
  console.log('🚏 Seeding nodes with random data');

  const NODE_COUNT = 10;
  const nodePayloads = Array.from({ length: NODE_COUNT }, (_, index) => {
    const city = cities[index % cities.length];
    const population = populations[index % populations.length];

    return {
      code: `NODE${index + 1}`,
      name: `Node ${faker.location.city()}`,
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      radius: faker.number.int({ min: 25, max: 100 }),
      slug: createSlug(`Node ${index + 1}`, `NODE${index + 1}`),
      allowsBoarding: true,
      allowsAlighting: true,
      active: true,
      cityId: city.id,
      populationId: population.id,
      // installationId: null, // No installation for random nodes - omit for undefined
      deletedAt: null,
    };
  });

  const nodes: Node[] = [];
  for (const payload of nodePayloads) {
    const node = await nodeRepository.create(payload);
    nodes.push(node);
  }

  console.log(`   ✅ Created ${nodes.length} nodes with random data`);
  return nodes;
}
