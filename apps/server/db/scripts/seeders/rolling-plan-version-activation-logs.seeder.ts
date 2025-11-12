import { db } from '@/planning/db-service';
import { rollingPlanVersionActivationLogs } from '@/planning/rolling-plan-version-activation-logs/rolling-plan-version-activation-logs.schema';
import { rollingPlanVersionRepository } from '@/planning/rolling-plan-versions/rolling-plan-versions.repository';
import type { RollingPlanVersion } from '@/planning/rolling-plan-versions/rolling-plan-versions.types';
import type { RollingPlan } from '@/planning/rolling-plans/rolling-plans.types';
import { fakerES_MX as faker } from '@faker-js/faker';
import type { InferSelectModel } from 'drizzle-orm';

type RollingPlanVersionActivationLog = InferSelectModel<
  typeof rollingPlanVersionActivationLogs
>;

/**
 * Calculates a historical activation date that occurred before the given reference date
 * Historical activation between 12-24 weeks before the reference date
 */
function calculateHistoricalActivationDate(referenceDate: Date): Date {
  const weeksBefore = faker.number.int({ min: 12, max: 24 });
  const daysBefore = weeksBefore * 7;
  const maxDate = new Date(referenceDate);
  maxDate.setDate(maxDate.getDate() - daysBefore);
  return faker.date.between({
    from: maxDate,
    to: referenceDate,
  });
}

/**
 * Creates activation log dates for a version
 * First log uses the version's actual dates, subsequent logs are historical
 */
function createActivationLogDates(
  version: RollingPlanVersion & { activatedAt: Date },
  logIndex: number,
): { activatedAt: Date; deactivatedAt: Date | null } {
  if (logIndex === 0) {
    // First log uses the version's activation date
    // Ensure activatedAt is a Date object (could be string from DB)
    const activatedAt =
      version.activatedAt instanceof Date
        ? version.activatedAt
        : new Date(version.activatedAt);
    // If version is inactive, use its deactivation date
    const deactivatedAt =
      version.state === 'inactive' && version.deactivatedAt
        ? version.deactivatedAt instanceof Date
          ? version.deactivatedAt
          : new Date(version.deactivatedAt)
        : null;
    return { activatedAt, deactivatedAt };
  }

  // Historical logs: create past activation periods
  // Ensure activatedAt is a Date object (could be string from DB)
  const versionActivatedAt =
    version.activatedAt instanceof Date
      ? version.activatedAt
      : new Date(version.activatedAt);
  const activatedAt = calculateHistoricalActivationDate(versionActivatedAt);
  // Historical activations are always closed (have deactivation date)
  const deactivatedAt = faker.date.between({
    from: activatedAt,
    to: versionActivatedAt,
  });

  return { activatedAt, deactivatedAt };
}

/**
 * Handles errors during activation log creation with consistent logging
 */
function handleActivationLogCreationError(
  error: unknown,
  versionName: string,
  rollingPlanName: string,
): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.warn(
    `⚠️  Failed to create activation log for version "${versionName}" (rolling plan "${rollingPlanName}"): ${errorMessage}`,
  );
}

/**
 * Seeds rolling plan version activation logs for activated versions
 * @param rollingPlans - Array of rolling plans to create activation logs for
 * @returns Array of created activation logs
 */
export async function seedRollingPlanVersionActivationLogs(
  rollingPlans: RollingPlan[],
): Promise<RollingPlanVersionActivationLog[]> {
  const logs: RollingPlanVersionActivationLog[] = [];

  if (rollingPlans.length === 0) {
    console.log('⚠️  Skipping activation logs seeding: no rolling plans found');
    return logs;
  }

  // For each rolling plan, find its activated versions (active or inactive)
  for (const rollingPlan of rollingPlans) {
    try {
      // Find all versions for this rolling plan
      const allVersions =
        await rollingPlanVersionRepository.findAllByRollingPlanId(
          rollingPlan.id,
        );

      // Filter to only versions that have been activated (activatedAt is not null)
      const versionsWithActivation = allVersions.filter(
        (version): version is RollingPlanVersion & { activatedAt: Date } =>
          version.activatedAt !== null && version.activatedAt !== undefined,
      );

      // Create activation logs for each activated version
      for (const version of versionsWithActivation) {
        // Each version can have 1-2 activation periods (historical activations)
        const numLogs = faker.number.int({ min: 1, max: 2 });

        for (let i = 0; i < numLogs; i++) {
          const { activatedAt, deactivatedAt } = createActivationLogDates(
            version,
            i,
          );

          try {
            const [log] = await db
              .insert(rollingPlanVersionActivationLogs)
              .values({
                versionId: version.id,
                rollingPlanId: rollingPlan.id,
                activatedAt,
                deactivatedAt,
              })
              .returning();

            logs.push(log);
          } catch (error) {
            handleActivationLogCreationError(
              error,
              version.name,
              rollingPlan.name,
            );
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn(
        `⚠️  Failed to fetch versions for rolling plan "${rollingPlan.name}": ${errorMessage}`,
      );
    }
  }

  console.log(`Seeded ${logs.length} rolling plan version activation logs`);
  return logs;
}
