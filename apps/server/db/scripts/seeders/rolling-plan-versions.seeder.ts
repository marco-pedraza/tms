import { rollingPlanVersionRepository } from '@/planning/rolling-plan-versions/rolling-plan-versions.repository';
import type {
  RollingPlanVersion,
  RollingPlanVersionState,
} from '@/planning/rolling-plan-versions/rolling-plan-versions.types';
import type { RollingPlan } from '@/planning/rolling-plans/rolling-plans.types';
import { fakerES_MX as faker } from '@faker-js/faker';

/**
 * Calculates a date that is a certain number of weeks ago from now
 */
function generateRandomDateWithinWeeks(weeks: {
  min: number;
  max: number;
}): Date {
  const weeksAgo = faker.number.int(weeks);
  const daysAgo = weeksAgo * 7;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  return targetDate;
}

/**
 * Determines version state for non-active versions (draft or inactive)
 * 50% draft, 50% inactive
 */
function determineNonActiveVersionState(): {
  state: RollingPlanVersionState;
  activatedAt: Date | undefined;
  deactivatedAt: Date | undefined;
} {
  const stateRandom = faker.number.float({ min: 0, max: 1 });

  if (stateRandom < 0.5) {
    return {
      state: 'draft',
      activatedAt: undefined,
      deactivatedAt: undefined,
    };
  }

  // Inactive versions: activation date between 8-20 weeks ago
  const activatedAt = generateRandomDateWithinWeeks({ min: 8, max: 20 });
  const deactivatedAt = faker.date.between({
    from: activatedAt,
    to: new Date(),
  });

  return {
    state: 'inactive',
    activatedAt,
    deactivatedAt,
  };
}

/**
 * Creates state data for an active version
 */
function createActiveVersionState(): {
  state: RollingPlanVersionState;
  activatedAt: Date | undefined;
  deactivatedAt: Date | undefined;
} {
  // Active versions: activation date between 4-12 weeks ago
  const activatedAt = generateRandomDateWithinWeeks({ min: 4, max: 12 });
  return {
    state: 'active',
    activatedAt,
    deactivatedAt: undefined,
  };
}

/**
 * Seeds rolling plan versions for existing rolling plans
 * @param rollingPlans - Array of rolling plans to create versions for
 * @returns Array of created rolling plan versions
 */
export async function seedRollingPlanVersions(
  rollingPlans: RollingPlan[],
): Promise<RollingPlanVersion[]> {
  const versions: RollingPlanVersion[] = [];

  if (rollingPlans.length === 0) {
    console.log(
      '⚠️  Skipping rolling plan versions seeding: no rolling plans found',
    );
    return versions;
  }

  // Create versions for each rolling plan
  for (const rollingPlan of rollingPlans) {
    // Each rolling plan can have 1-3 versions
    const numVersions = faker.number.int({ min: 1, max: 3 });

    // Decide if this rolling plan will have an active version (0 or 1)
    const hasActiveVersion = faker.datatype.boolean();

    // If there's an active version, randomly select which version index will be active
    const activeVersionIndex =
      hasActiveVersion && numVersions > 0
        ? faker.number.int({ min: 0, max: numVersions - 1 })
        : -1;

    for (let i = 0; i < numVersions; i++) {
      // Determine state: active if this is the selected index, otherwise draft or inactive
      const { state, activatedAt, deactivatedAt } =
        i === activeVersionIndex
          ? createActiveVersionState()
          : determineNonActiveVersionState();

      const versionName = `v${i + 1}.${faker.number.int({ min: 0, max: 9 })}`;
      const notes = faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.3,
      });

      try {
        const version = await rollingPlanVersionRepository.create({
          rollingPlanId: rollingPlan.id,
          name: versionName,
          state,
          notes: notes,
          activatedAt,
          deactivatedAt,
        });

        versions.push(version);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.warn(
          `⚠️  Failed to create version "${versionName}" for rolling plan "${rollingPlan.name}": ${errorMessage}`,
        );
      }
    }
  }

  console.log(`Seeded ${versions.length} rolling plan versions`);
  return versions;
}
