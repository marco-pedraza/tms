import { routeLegsRepository } from '../route-legs/route-legs.repository';

/**
 * Information about pathway/option usage in route legs
 */
export interface PathwayUsageInfo {
  /** Whether the pathway option is in use by active legs */
  inUse: boolean;

  /** Array of route IDs that use this pathway option */
  routeIds: number[];

  /** Count of active legs achieved this pathway option */
  activeLegsCount: number;
}

/**
 * Internal domain service for validating pathway/option usage
 *
 * This service provides internal validation logic (NOT an endpoint) to check
 * if pathways/options are in use by active route legs before allowing modifications.
 *
 * Business Rules:
 * - When a pathway option is in use by ≥1 active leg:
 *   Prohibited:
 *   - Edit metrics (distance, time, speed)
 *   - Sync toll booths
 *   Allowable:
 *   - Change name, description, isDefault
 *   - Change active=false (if legs don't depend on active)
 */
export const pathwayUsageValidationService = {
  /**
   * Checks if a pathway option is in use by active route legs
   */
  async checkPathwayOptionUsage(
    pathwayId: number,
    optionId: number,
  ): Promise<PathwayUsageInfo> {
    // Find all active legs using this pathway option
    const activeLegs = await routeLegsRepository.findActiveLegsByPathwayOption(
      pathwayId,
      optionId,
    );

    // Get unique route IDs from the legs
    const routeIds = [...new Set(activeLegs.map((leg) => leg.routeId))];

    return {
      inUse: activeLegs.length > 0,
      routeIds,
      activeLegsCount: activeLegs.length,
    };
  },

  /**
   * Validates that a pathway option can be modified (metrics editing allowed)
   * Throws an error if the option is in use and modifications are not allowed
   */
  async validateCanModifyMetrics(
    pathwayId: number,
    optionId: number,
  ): Promise<void> {
    const usageInfo = await this.checkPathwayOptionUsage(pathwayId, optionId);

    if (usageInfo.inUse) {
      throw new Error(
        `Cannot modify metrics for pathway option ${optionId} because it is in use by ${usageInfo.activeLegsCount} active leg(s) in route(s): ${usageInfo.routeIds.join(', ')}`,
      );
    }
  },

  /**
   * Validates that a pathway option's toll booths can be synchronized
   * Throws an error if the option is in use and synchronization is not allowed
   */
  async validateCanSyncTolls(
    pathwayId: number,
    optionId: number,
  ): Promise<void> {
    const usageInfo = await this.checkPathwayOptionUsage(pathwayId, optionId);

    if (usageInfo.inUse) {
      throw new Error(
        `Cannot synchronize toll booths for pathway option ${optionId} because it is in use by ${usageInfo.activeLegsCount} active leg(s) in route(s): ${usageInfo.routeIds.join(', ')}`,
      );
    }
  },
};
