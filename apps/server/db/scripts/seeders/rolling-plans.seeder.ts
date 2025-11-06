import { rollingPlanRepository } from '@/planning/rolling-plans/rolling-plans.repository';
import type { RollingPlan } from '@/planning/rolling-plans/rolling-plans.types';
import { fakerES_MX as faker } from '@faker-js/faker';
import type { BusModel } from '@/inventory/fleet/bus-models/bus-models.types';
import type { Node } from '@/inventory/locations/nodes/nodes.types';
import type { BusLine } from '@/inventory/operators/bus-lines/bus-lines.types';
import type { ServiceType } from '@/inventory/operators/service-types/service-types.types';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
} from './client-data.utils';

/**
 * Seeds rolling plans for bus lines
 * @param busLines - Array of bus lines to create rolling plans for
 * @param serviceTypes - Array of service types
 * @param busModels - Array of bus models
 * @param nodes - Array of nodes to use as base nodes
 * @param clientCode - Optional client code for client-specific data
 */
export async function seedRollingPlans(
  busLines: BusLine[],
  serviceTypes: ServiceType[],
  busModels: BusModel[],
  nodes: Node[],
  clientCode?: string,
): Promise<RollingPlan[]> {
  const rollingPlans: RollingPlan[] = [];

  // If no dependencies exist, log warning and return empty array
  if (
    busLines.length === 0 ||
    serviceTypes.length === 0 ||
    busModels.length === 0 ||
    nodes.length === 0
  ) {
    console.log(
      '⚠️  Skipping rolling plans seeding: missing required dependencies (busLines, serviceTypes, busModels, or nodes)',
    );
    return rollingPlans;
  }

  // Try to load client-specific data if clientCode is provided
  if (
    clientCode &&
    hasClientData(clientCode, CLIENT_DATA_FILES.ROLLING_PLANS)
  ) {
    try {
      const rollingPlansData = (await loadClientData(
        clientCode,
        CLIENT_DATA_FILES.ROLLING_PLANS,
      )) as {
        rolling_plans: {
          name: string;
          busLineCode: string;
          serviceTypeCode: string;
          busModelManufacturer: string;
          busModelModel: string;
          baseNodeCode: string;
          operationType: 'continuous' | 'specific_days';
          cycleDurationDays?: number;
          operationDays?: Record<string, unknown>;
          active?: boolean;
          notes?: string;
        }[];
      };

      if (rollingPlansData.rolling_plans?.length > 0) {
        const rollingPlansFromClient = rollingPlansData.rolling_plans
          .map((plan) => {
            // Find the bus line by code
            const busLine = busLines.find((bl) => bl.code === plan.busLineCode);
            if (!busLine) {
              console.warn(
                `⚠️  Bus line with code "${plan.busLineCode}" not found for rolling plan "${plan.name}"`,
              );
              return null;
            }

            // Find the service type by code
            const serviceType = serviceTypes.find(
              (st) => st.code === plan.serviceTypeCode,
            );
            if (!serviceType) {
              console.warn(
                `⚠️  Service type with code "${plan.serviceTypeCode}" not found for rolling plan "${plan.name}"`,
              );
              return null;
            }

            // Find the bus model by manufacturer and model
            const busModel = busModels.find(
              (bm) =>
                bm.manufacturer === plan.busModelManufacturer &&
                bm.model === plan.busModelModel,
            );
            if (!busModel) {
              console.warn(
                `⚠️  Bus model "${plan.busModelManufacturer} ${plan.busModelModel}" not found for rolling plan "${plan.name}"`,
              );
              return null;
            }

            // Find the base node by code
            const baseNode = nodes.find((n) => n.code === plan.baseNodeCode);
            if (!baseNode) {
              console.warn(
                `⚠️  Node with code "${plan.baseNodeCode}" not found for rolling plan "${plan.name}"`,
              );
              return null;
            }

            return {
              name: plan.name,
              buslineId: busLine.id,
              serviceTypeId: serviceType.id,
              busModelId: busModel.id,
              baseNodeId: baseNode.id,
              operationType: plan.operationType,
              cycleDurationDays:
                plan.operationType === 'continuous'
                  ? (plan.cycleDurationDays ?? undefined)
                  : undefined,
              operationDays:
                plan.operationType === 'specific_days'
                  ? (plan.operationDays ?? undefined)
                  : undefined,
              active: plan.active ?? true,
              notes: plan.notes ?? undefined,
            };
          })
          .filter((plan) => plan !== null);

        // Create rolling plans from client data
        for (const planPayload of rollingPlansFromClient) {
          if (!planPayload) continue;

          try {
            const rollingPlan = await rollingPlanRepository.create(planPayload);
            rollingPlans.push(rollingPlan);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            console.warn(
              `⚠️  Failed to create rolling plan "${planPayload.name}": ${errorMessage}`,
            );
          }
        }

        if (rollingPlans.length > 0) {
          console.log(
            `Seeded ${rollingPlans.length} rolling plans (client: ${clientCode.toUpperCase()})`,
          );
          return rollingPlans;
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn(
        `⚠️  Failed to load client rolling plans data: ${errorMessage}. Falling back to default seeding.`,
      );
    }
  }

  // Default behavior: create rolling plans for some bus lines
  // Use a subset of bus lines to avoid creating too many rolling plans
  const busLinesToUse = busLines.slice(0, Math.min(busLines.length, 10));

  for (const busLine of busLinesToUse) {
    // Each bus line can have 1-3 rolling plans
    const numPlans = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < numPlans; i++) {
      // Randomly select dependencies
      const serviceType =
        serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const busModel = busModels[Math.floor(Math.random() * busModels.length)];
      const baseNode = nodes[Math.floor(Math.random() * nodes.length)];

      if (!serviceType || !busModel || !baseNode) {
        continue;
      }

      // Randomly choose operation type
      const operationType =
        faker.helpers.maybe(() => 'continuous', { probability: 0.6 }) ||
        'specific_days';

      // Create rolling plan payload
      const rollingPlanPayload = {
        name: `${busLine.name} - Plan ${i + 1}`,
        buslineId: busLine.id,
        serviceTypeId: serviceType.id,
        busModelId: busModel.id,
        baseNodeId: baseNode.id,
        operationType: operationType as 'continuous' | 'specific_days',
        cycleDurationDays:
          operationType === 'continuous'
            ? faker.helpers.arrayElement([7, 14, 21, 28])
            : undefined,
        operationDays:
          operationType === 'specific_days'
            ? {
                days: faker.helpers.arrayElements([1, 2, 3, 4, 5, 6, 7], {
                  min: 2,
                  max: 5,
                }),
              }
            : undefined,
        active: faker.helpers.maybe(() => true, { probability: 0.9 }),
        notes:
          faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.3,
          }) || undefined,
      };

      try {
        const rollingPlan =
          await rollingPlanRepository.create(rollingPlanPayload);
        rollingPlans.push(rollingPlan);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.warn(
          `⚠️  Failed to create rolling plan for ${busLine.name}: ${errorMessage}`,
        );
      }
    }
  }

  console.log(`Seeded ${rollingPlans.length} rolling plans`);
  return rollingPlans;
}
