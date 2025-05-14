import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { ID_OFFSET } from './constants';
import { extractTablesFromSchema } from './factory-utils';
import { seatDiagramFactory } from './seat-diagrams.factory';

type ResolverParams = {
  sequence: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  use: <T>(factory: any) => { create: () => Promise<T> };
  params?: {
    zoneType?: number;
  };
};

/**
 * Factory for generating seat diagram zones for tests
 */
export const seatDiagramZoneFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'seatDiagramZones',
  resolver: ({ sequence, use, params }: ResolverParams) => {
    // More comprehensive list of zone names with realistic values
    const zoneNames = [
      'Business',
      'Business Plus',
      'First Class',
      'Premium',
      'Executive',
      'VIP',
      'Suite',
    ];

    // Zone price tiers with realistic multipliers
    const priceMultipliers = [
      2.0, // Business
      2.5, // Premium
    ];

    // Get zone type from params or use sequence as fallback
    const zoneType = params?.zoneType ?? sequence % 2;

    // Select zone name based on type
    const zoneIndex =
      zoneType === 0
        ? sequence % 2 // Business or Business Plus
        : 2 + (sequence % 4); // First Class, Premium, Executive, VIP, or Suite

    // Generate row numbers based on zone type
    let rowNumbers: number[];
    if (zoneType === 0) {
      // Business zones - always use rows 4-5-6
      rowNumbers = [4, 5, 6];
    } else {
      // Premium/First class zones - always use rows 1-2-3
      rowNumbers = [1, 2, 3];
    }

    return {
      id: sequence + ID_OFFSET,
      seatDiagramId: () =>
        use(seatDiagramFactory)
          .create()
          .then((diagram: unknown) => (diagram as { id: number }).id),
      name: zoneNames[zoneIndex],
      rowNumbers,
      priceMultiplier: priceMultipliers[zoneType],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
});
