import { db } from '@/inventory/db-service';
import { countryRepository } from '@/inventory/locations/countries/countries.repository';
import { Country } from '@/inventory/locations/countries/countries.types';
import { getFactoryDb } from '@/tests/factories/factory-utils';
import {
  seedAmenities,
  seedInstallationAmenities,
  seedServiceTypeAmenities,
} from './seeders/amenities.seeder';
import { seedEventTypes } from './seeders/events.seeder';
import {
  seedCities,
  seedCountries,
  seedPopulationCities,
  seedPopulations,
  seedStates,
} from './seeders/geography.seeder';
import {
  seedEventTypeInstallationTypes,
  seedInstallationProperties,
  seedInstallationSchemas,
  seedInstallationTypes,
  seedInstallations,
} from './seeders/installations.seeder';
import { seedLabelNodes, seedLabels } from './seeders/labels.seeder';
import { seedNodes } from './seeders/nodes.seeder';
import {
  seedBusLines,
  seedBusModels,
  seedBuses,
  seedDriverMedicalChecks,
  seedDriverTimeOffs,
  seedDrivers,
  seedServiceTypes,
  seedTransporters,
} from './seeders/transportation.seeder';

const factoryDb = getFactoryDb(db);

/**
 * Main inventory seeding function - orchestrates all seeders
 * @param clientCode - Optional client code for client-specific data (e.g., 'gfa')
 */
export async function seedInventory(clientCode?: string): Promise<void> {
  try {
    console.log('🌱 Starting inventory seeding...\n');

    // === GEOGRAPHY SEEDING ===
    console.log('📍 Seeding geography data...');

    let countries: Country[];
    try {
      countries = await seedCountries(factoryDb, clientCode);
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        console.log(
          '⚠️  Countries already exist, checking for expected countries...',
        );

        // Fetch all countries and check for expected ones
        const allCountries = await countryRepository.findAll();
        const expectedCodes = ['MX', 'US', 'CA'];
        countries = allCountries.filter((country) =>
          expectedCodes.includes(country.code),
        );

        // If we don't have all expected countries, this is a real error
        if (countries.length < expectedCodes.length) {
          const foundCodes = countries.map((c) => c.code);
          const missingCodes = expectedCodes.filter(
            (code) => !foundCodes.includes(code),
          );
          throw new Error(
            `Expected countries not found. Found: [${foundCodes.join(', ')}], Missing: [${missingCodes.join(', ')}]. This indicates a partial or corrupted country seeding.`,
          );
        }

        console.log(
          `Found all ${countries.length} expected countries: ${countries.map((c) => c.code).join(', ')}`,
        );
      } else {
        throw error;
      }
    }

    const mexicoCountry = countries.find((country) => country.code === 'MX');
    if (!mexicoCountry) {
      throw new Error('Mexico country not found');
    }

    const states = await seedStates(mexicoCountry, factoryDb, clientCode);
    const cities = await seedCities(states, factoryDb, clientCode);
    console.log('✅ Geography seeding completed\n');

    // === TRANSPORTATION SEEDING ===
    console.log('🚌 Seeding transportation data...');
    const serviceTypes = await seedServiceTypes(factoryDb, clientCode);
    const transporters = await seedTransporters(cities, factoryDb, clientCode);
    const busLines = await seedBusLines(
      transporters,
      serviceTypes,
      factoryDb,
      clientCode,
    );
    const busModels = await seedBusModels(factoryDb);
    await seedBuses(transporters, busModels, factoryDb);
    const drivers = await seedDrivers(transporters, busLines, factoryDb);
    await seedDriverTimeOffs(drivers, factoryDb);
    await seedDriverMedicalChecks(drivers, factoryDb);
    console.log('✅ Transportation seeding completed\n');

    // === INSTALLATION TYPES & EVENT TYPES ===
    console.log('🏗️ Seeding installation and event types...');
    const installationTypes = await seedInstallationTypes(factoryDb);
    const eventTypes = await seedEventTypes(factoryDb);

    // Create associations between event types and installation types
    await seedEventTypeInstallationTypes(
      eventTypes,
      installationTypes,
      factoryDb,
    );

    // Create installation schemas for the installation types
    const installationSchemas = await seedInstallationSchemas(
      installationTypes,
      factoryDb,
    );
    console.log('✅ Installation and event types seeding completed\n');

    // === INSTALLATIONS ===
    console.log('🏢 Seeding installations...');
    const installations = await seedInstallations(
      installationTypes,
      cities,
      factoryDb,
      clientCode,
    );

    // Create installation properties based on existing installations and schemas
    await seedInstallationProperties(
      installations,
      installationSchemas,
      factoryDb,
    );
    console.log('✅ Installations seeding completed\n');

    // === POPULATIONS & NODES ===
    console.log('👥 Seeding populations and nodes...');
    const populations = await seedPopulations(factoryDb, clientCode);

    // Create population-city relationships if using client data
    if (clientCode && populations.length > 0) {
      await seedPopulationCities(populations, cities, factoryDb, clientCode);
    }

    const nodes = await seedNodes(
      cities,
      populations,
      installationTypes,
      clientCode,
    );
    console.log('✅ Populations and nodes seeding completed\n');

    // === LABELS ===
    console.log('🏷️ Seeding labels...');
    const labels = await seedLabels(factoryDb);
    await seedLabelNodes(labels, nodes);
    console.log('✅ Labels seeding completed\n');

    // === AMENITIES ===
    console.log('🎯 Seeding amenities...');
    await seedAmenities(factoryDb);

    // Assign amenities to installations and service types
    await seedInstallationAmenities(installations);
    await seedServiceTypeAmenities(serviceTypes);
    console.log('✅ Amenities seeding completed\n');

    console.log('🎉 Inventory seeding completed successfully!');
  } catch (error) {
    // Provide cleaner error output
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Error during inventory seeding:', errorMessage);

    // Only show full stack trace in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
    }

    throw error;
  }
}

// Allow running this script directly
const shouldRunSeeder = process.argv.includes('--seed');
if (shouldRunSeeder) {
  // Extract client code from command line arguments
  const clientCodeIndex = process.argv.findIndex((arg) => arg === '--client');
  const clientCode =
    clientCodeIndex !== -1 && process.argv[clientCodeIndex + 1]
      ? process.argv[clientCodeIndex + 1]
      : undefined;

  if (clientCode) {
    console.log(
      `🎯 Running seeder with client code: ${clientCode.toUpperCase()}`,
    );
  } else {
    console.log('🌱 Running seeder with default data');
  }

  seedInventory(clientCode)
    .then(() => {
      console.log('✨ Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Unhandled error in seedInventory script:', error);
      process.exit(1);
    });
}
