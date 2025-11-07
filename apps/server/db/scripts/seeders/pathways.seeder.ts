import { and, inArray, isNull } from 'drizzle-orm';
import { FieldValidationError } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';
import type { Node } from '@/inventory/locations/nodes/nodes.types';
import { createPathwayApplicationService } from '@/inventory/routing/pathways/pathways.application-service';
import { pathwayRepository } from '@/inventory/routing/pathways/pathways.repository';
import type { CreatePathwayPayload } from '@/inventory/routing/pathways/pathways.types';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
} from './client-data.utils';

interface PathwayDataFromClient {
  originNodeCode: string;
  destinationNodeCode: string;
  name: string;
  code: string;
  description?: string | null;
  isSellable?: boolean;
  isEmptyTrip?: boolean;
  active?: boolean;
  distanceKm?: number;
}

interface PathwaysClientData {
  pathways: PathwayDataFromClient[];
}

/**
 * Seeds pathways from client-specific JSON data
 * @param clientCode - Client identifier (e.g., 'gfa')
 * @param _factoryDb - Factory database instance (not used but required by interface)
 */
export async function seedPathways(
  clientCode: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  _factoryDb: any,
): Promise<void> {
  // Check if client has pathways data
  if (!hasClientData(clientCode, CLIENT_DATA_FILES.PATHWAYS)) {
    console.log(`No pathways data found for client: ${clientCode}`);
    return;
  }

  // Load pathways data
  const clientData = (await loadClientData(
    clientCode,
    CLIENT_DATA_FILES.PATHWAYS,
  )) as PathwaysClientData;

  if (!clientData.pathways || !Array.isArray(clientData.pathways)) {
    console.log(`Invalid pathways data format for client: ${clientCode}`);
    return;
  }

  const pathwayApplicationService = createPathwayApplicationService();
  let created = 0;
  let skipped = 0;
  const errors: { pathway: PathwayDataFromClient; error: string }[] = [];

  console.log(
    `\n🌍 Seeding ${clientData.pathways.length} pathways for client: ${clientCode}`,
  );

  // Bulk-load optimization: collect all unique node codes referenced by pathways
  const nodeCodes = new Set<string>();
  for (const pathwayData of clientData.pathways) {
    nodeCodes.add(pathwayData.originNodeCode);
    nodeCodes.add(pathwayData.destinationNodeCode);
  }

  // Bulk-load all nodes in a single query
  const allNodes = await db
    .select()
    .from(nodes)
    .where(
      and(inArray(nodes.code, Array.from(nodeCodes)), isNull(nodes.deletedAt)),
    );

  // Build Map keyed by node code for O(1) lookups
  const nodesByCode = new Map<string, Node>();
  for (const node of allNodes) {
    nodesByCode.set(node.code, node as Node);
  }

  // Bulk-load all existing pathways to check for duplicates
  const existingPathways = await pathwayRepository.findAll();

  // Create Sets for existing codes and names for O(1) lookups
  const existingCodes = new Set<string>();
  const existingNames = new Set<string>();
  for (const pathway of existingPathways) {
    existingCodes.add(pathway.code);
    existingNames.add(pathway.name);
  }

  // Process pathways with in-memory lookups
  for (const pathwayData of clientData.pathways) {
    try {
      // Lookup origin node from Map (O(1))
      const originNode = nodesByCode.get(pathwayData.originNodeCode);

      if (!originNode) {
        skipped++;
        errors.push({
          pathway: pathwayData,
          error: `Origin node not found: ${pathwayData.originNodeCode}`,
        });
        continue;
      }

      // Lookup destination node from Map (O(1))
      const destinationNode = nodesByCode.get(pathwayData.destinationNodeCode);

      if (!destinationNode) {
        skipped++;
        errors.push({
          pathway: pathwayData,
          error: `Destination node not found: ${pathwayData.destinationNodeCode}`,
        });
        continue;
      }

      // Check for duplicates using Sets (O(1))
      const existingByCode = existingCodes.has(pathwayData.code);
      const existingByName = existingNames.has(pathwayData.name);

      if (existingByCode || existingByName) {
        skipped++;
        errors.push({
          pathway: pathwayData,
          error:
            existingByCode && existingByName
              ? `Pathway already exists (code and name)`
              : existingByCode
                ? `Pathway with code already exists`
                : `Pathway with name already exists`,
        });
        continue;
      }

      // Create pathway payload
      // Note: active is set to false initially - will be activated when first option is added
      const payload: CreatePathwayPayload = {
        originNodeId: originNode.id,
        destinationNodeId: destinationNode.id,
        name: pathwayData.name,
        code: pathwayData.code,
        description: pathwayData.description ?? null,
        isSellable: pathwayData.isSellable ?? true,
        isEmptyTrip: pathwayData.isEmptyTrip ?? false,
        active: false, // Start inactive - will be activated when first option is added
      };

      // Create pathway using application service
      const pathway = await pathwayApplicationService.createPathway(payload);

      // CRITICAL: Add at least one option to the pathway
      // According to domain rules:
      // - A pathway needs at least one option to be activated
      // - The first option becomes the default automatically
      // - Adding the first option activates the pathway
      // - distanceKm and typicalTimeMin are REQUIRED for pathway options

      // Use distanceKm from JSON if available, otherwise use a default minimum value
      // Default: 1 km (minimum reasonable distance for a pathway)
      const distanceKm =
        pathwayData.distanceKm && pathwayData.distanceKm > 0
          ? pathwayData.distanceKm
          : 1.0;

      // Calculate typical time in minutes (assuming average speed of 60 km/h)
      // This is a reasonable default for bus routes
      const typicalTimeMin = Math.round((distanceKm / 60) * 60);

      await pathwayApplicationService.addOptionToPathway(pathway.id, {
        name: `${pathwayData.name} - Opción Principal`,
        description: pathwayData.description ?? undefined,
        distanceKm,
        typicalTimeMin,
        isPassThrough: false,
        active: true,
        // isDefault will be set automatically (true for first option)
      });

      // Update Sets to prevent duplicates within the same batch
      existingCodes.add(pathwayData.code);
      existingNames.add(pathwayData.name);

      created++;
    } catch (error) {
      skipped++;

      // Extract detailed error message
      let errorMessage: string;
      if (error instanceof FieldValidationError) {
        // Show field-level validation errors
        const fieldDetails = error.fieldErrors
          .map((fe) => `${fe.field}: ${fe.message}`)
          .join(', ');
        errorMessage = `Validation failed - ${fieldDetails}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unknown error occurred';
      }

      errors.push({
        pathway: pathwayData,
        error: errorMessage,
      });
    }
  }

  console.log(`✅ Created ${created} pathways`);
  if (skipped > 0) {
    console.log(`⚠️ Skipped ${skipped} pathways`);
    if (errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      errors.slice(0, 10).forEach(({ pathway, error }) => {
        console.log(
          `  - ${pathway.code} (${pathway.originNodeCode} -> ${pathway.destinationNodeCode}): ${error}`,
        );
      });
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
      }
    }
  }
}
