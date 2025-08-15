import { fakerES_MX as faker } from '@faker-js/faker';
import type { Installation } from '@/inventory/locations/installations/installations.types';
import { installationUseCases } from '@/inventory/locations/installations/installations.use-cases';
import type { ServiceType } from '@/inventory/operators/service-types/service-types.types';
import { serviceTypeUseCases } from '@/inventory/operators/service-types/service-types.use-cases';
import { amenitiesRepository } from '@/inventory/shared-entities/amenities/amenities.repository';
import type { Amenity } from '@/inventory/shared-entities/amenities/amenities.types';
import {
  AmenityCategory,
  AmenityType,
} from '@/inventory/shared-entities/amenities/amenities.types';
import { amenityFactory } from '@/tests/factories';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

// Predefined amenities data with realistic examples
const AMENITIES_DATA = [
  // Bus amenities
  {
    name: 'Wi-Fi',
    category: AmenityCategory.TECHNOLOGY,
    amenityType: AmenityType.BUS,
    description: 'Free wireless internet connection',
    iconName: 'wifi',
    active: true,
  },
  {
    name: 'Air Conditioning',
    category: AmenityCategory.COMFORT,
    amenityType: AmenityType.BUS,
    description: 'Climate controlled environment',
    iconName: 'air-vent',
    active: true,
  },
  {
    name: 'Reclining Seats',
    category: AmenityCategory.COMFORT,
    amenityType: AmenityType.BUS,
    description: 'Comfortable reclining seats',
    iconName: 'armchair',
    active: true,
  },
  {
    name: 'USB Charging Ports',
    category: AmenityCategory.TECHNOLOGY,
    amenityType: AmenityType.BUS,
    description: 'USB ports for device charging',
    iconName: 'usb',
    active: true,
  },
  {
    name: 'Onboard Restroom',
    category: AmenityCategory.BASIC,
    amenityType: AmenityType.BUS,
    description: 'Private restroom facility',
    iconName: 'bath',
    active: true,
  },
  {
    name: 'Entertainment System',
    category: AmenityCategory.TECHNOLOGY,
    amenityType: AmenityType.BUS,
    description: 'Individual entertainment screens',
    iconName: 'tv',
    active: true,
  },
  {
    name: 'Security Cameras',
    category: AmenityCategory.SECURITY,
    amenityType: AmenityType.BUS,
    description: 'Onboard security monitoring',
    iconName: 'camera',
    active: true,
  },
  {
    name: 'Wheelchair Accessibility',
    category: AmenityCategory.ACCESSIBILITY,
    amenityType: AmenityType.BUS,
    description: 'Wheelchair accessible boarding',
    iconName: 'accessibility',
    active: true,
  },

  // Installation amenities
  {
    name: 'Passenger Waiting Area',
    category: AmenityCategory.BASIC,
    amenityType: AmenityType.INSTALLATION,
    description: 'Comfortable seating area for passengers',
    iconName: 'users',
    active: true,
  },
  {
    name: 'Information Desk',
    category: AmenityCategory.SERVICES,
    amenityType: AmenityType.INSTALLATION,
    description: 'Customer service and information point',
    iconName: 'info',
    active: true,
  },
  {
    name: 'Cafeteria',
    category: AmenityCategory.SERVICES,
    amenityType: AmenityType.INSTALLATION,
    description: 'Food and beverage service',
    iconName: 'coffee',
    active: true,
  },
  {
    name: 'Public Restrooms',
    category: AmenityCategory.BASIC,
    amenityType: AmenityType.INSTALLATION,
    description: 'Clean public restroom facilities',
    iconName: 'bath',
    active: true,
  },
  {
    name: 'Free Wi-Fi Zone',
    category: AmenityCategory.TECHNOLOGY,
    amenityType: AmenityType.INSTALLATION,
    description: 'Free internet access area',
    iconName: 'wifi',
    active: true,
  },
  {
    name: 'Luggage Storage',
    category: AmenityCategory.SERVICES,
    amenityType: AmenityType.INSTALLATION,
    description: 'Secure luggage storage facility',
    iconName: 'package',
    active: true,
  },
  {
    name: 'Security Checkpoint',
    category: AmenityCategory.SECURITY,
    amenityType: AmenityType.INSTALLATION,
    description: 'Security screening area',
    iconName: 'shield',
    active: true,
  },
  {
    name: 'Accessibility Ramp',
    category: AmenityCategory.ACCESSIBILITY,
    amenityType: AmenityType.INSTALLATION,
    description: 'Wheelchair accessible entrance',
    iconName: 'accessibility',
    active: true,
  },
  {
    name: 'Charging Stations',
    category: AmenityCategory.TECHNOLOGY,
    amenityType: AmenityType.INSTALLATION,
    description: 'Device charging stations',
    iconName: 'battery',
    active: true,
  },
  {
    name: 'ATM Machine',
    category: AmenityCategory.SERVICES,
    amenityType: AmenityType.INSTALLATION,
    description: 'Automated teller machine',
    iconName: 'credit-card',
    active: true,
  },
  // Service type amenities
  {
    name: 'High Speed Wi-Fi',
    category: AmenityCategory.TECHNOLOGY,
    amenityType: AmenityType.SERVICE_TYPE,
    description:
      'Stay connected with fast, reliable internet throughout your journey',
    iconName: 'wifi',
    active: true,
  },
  {
    name: 'Headphones',
    category: AmenityCategory.COMFORT,
    amenityType: AmenityType.SERVICE_TYPE,
    description: 'Enjoy your favorite music or movies with our headphones',
    iconName: 'headphones',
    active: true,
  },
  {
    name: 'Cocktail Service',
    category: AmenityCategory.COMFORT,
    amenityType: AmenityType.SERVICE_TYPE,
    description: 'Savor a variety of cocktails and snacks during your journey',
    iconName: 'martini',
    active: true,
  },
  {
    name: 'Entertainment',
    category: AmenityCategory.COMFORT,
    amenityType: AmenityType.SERVICE_TYPE,
    description: 'Enjoy a variety of entertainment during your journey',
    iconName: 'tv',
    active: true,
  },
] as const;

/**
 * Seeds amenities for bus, installation and service type types
 */
export async function seedAmenities(factoryDb: FactoryDb): Promise<Amenity[]> {
  const amenities = (await amenityFactory(factoryDb).create(
    AMENITIES_DATA,
  )) as Amenity[];

  console.log(
    `Seeded ${amenities.length} amenities (${
      amenities.filter((a) => a.amenityType === AmenityType.BUS).length
    } bus, ${
      amenities.filter((a) => a.amenityType === AmenityType.INSTALLATION).length
    } installation, ${
      amenities.filter((a) => a.amenityType === AmenityType.SERVICE_TYPE).length
    } service type)`,
  );

  return amenities;
}

/**
 * Assigns amenities to entities based on their type
 * @param entities - The entities to assign amenities to
 * @param amenityType - The type of amenity to assign
 * @param assignAmenitiesUseCase - The use case to assign amenities to the entities
 * @param entityTypeName - The name of the entity type
 * @returns void
 */
export async function seedEntityAmenities<T extends { id: number }, TReturn>(
  entities: T[],
  amenityType: AmenityType,
  assignAmenitiesUseCase: (
    entityId: number,
    amenityIds: number[],
  ) => Promise<TReturn>,
  entityTypeName: string,
): Promise<void> {
  // Get actual amenities from database based on type
  const availableAmenities = await amenitiesRepository.findAll({
    filters: {
      amenityType,
      active: true,
    },
  });

  if (availableAmenities.length === 0) {
    console.log(`No ${entityTypeName} amenities found to assign`);
    return;
  }

  console.log(
    `Found ${availableAmenities.length} ${entityTypeName} amenities in database`,
  );

  let successCount = 0;
  let skipCount = 0;

  for (const entity of entities) {
    // Randomly decide if this entity should have amenities (90% chance)
    if (Math.random() > 0.9) {
      skipCount++;
      continue;
    }

    // Randomly select 2-4 amenities for each entity
    const numAmenities = Math.floor(Math.random() * 3) + 2; // 2 to 4 amenities
    const selectedAmenities = faker.helpers
      .arrayElements(
        availableAmenities,
        Math.min(numAmenities, availableAmenities.length),
      )
      .map((amenity) => amenity.id);

    // Remove duplicates just in case
    const uniqueAmenityIds = [...new Set(selectedAmenities)];

    try {
      await assignAmenitiesUseCase(entity.id, uniqueAmenityIds);
      successCount++;
    } catch (error) {
      // Log minimal error info instead of full stack trace
      console.warn(
        `⚠️  Failed to assign amenities to ${entityTypeName} ${entity.id}: ${error instanceof Error ? error.message.split('\n')[0] : 'Unknown error'}`,
      );
    }
  }

  console.log(
    `✅ Assigned amenities to ${successCount} ${entityTypeName}s${skipCount > 0 ? ` (skipped ${skipCount})` : ''}`,
  );
}

/**
 * Assigns amenities to installations based on installation type
 */
export async function seedInstallationAmenities(
  installations: Installation[],
): Promise<void> {
  await seedEntityAmenities(
    installations,
    AmenityType.INSTALLATION,
    (installationId, amenityIds) =>
      installationUseCases.assignAmenities(installationId, amenityIds),
    'installation',
  );
}

/**
 * Assigns amenities to service types based on their category
 */
export async function seedServiceTypeAmenities(
  serviceTypes: ServiceType[],
): Promise<void> {
  await seedEntityAmenities(
    serviceTypes,
    AmenityType.SERVICE_TYPE,
    (serviceTypeId, amenityIds) =>
      serviceTypeUseCases.assignAmenities(serviceTypeId, amenityIds),
    'service type',
  );
}
