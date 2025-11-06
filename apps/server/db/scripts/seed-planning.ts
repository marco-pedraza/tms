import { busModelRepository } from '@/inventory/fleet/bus-models/bus-models.repository';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import { serviceTypeRepository } from '@/inventory/operators/service-types/service-types.repository';
import { seedRollingPlans } from './seeders/rolling-plans.seeder';

/**
 * Main planning seeding function - orchestrates all planning-related seeders
 * @param clientCode - Optional client code for client-specific data (e.g., 'gfa')
 */
export async function seedPlanning(clientCode?: string): Promise<void> {
  try {
    console.log('🌱 Starting planning seeding...\n');

    // === ROLLING PLANS SEEDING ===
    console.log('📋 Seeding rolling plans...');

    // Fetch required dependencies from inventory
    const busLines = await busLineRepository.findAll();
    const serviceTypes = await serviceTypeRepository.findAll();
    const busModels = await busModelRepository.findAll();
    const nodes = await nodeRepository.findAll();

    if (
      busLines.length === 0 ||
      serviceTypes.length === 0 ||
      busModels.length === 0 ||
      nodes.length === 0
    ) {
      console.log(
        '⚠️  Cannot seed rolling plans: missing required dependencies.',
      );
      console.log(
        `   Bus Lines: ${busLines.length}, Service Types: ${serviceTypes.length}, Bus Models: ${busModels.length}, Nodes: ${nodes.length}`,
      );
      console.log(
        '   Please run seed-inventory first to create the required dependencies.\n',
      );
      return;
    }

    const rollingPlans = await seedRollingPlans(
      busLines,
      serviceTypes,
      busModels,
      nodes,
      clientCode,
    );
    console.log('✅ Rolling plans seeding completed\n');

    console.log(`📊 Summary:`);
    console.log(`   - Rolling Plans: ${rollingPlans.length}`);

    console.log('🎉 Planning seeding completed successfully!');
  } catch (error) {
    // Provide cleaner error output
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Error during planning seeding:', errorMessage);

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

  seedPlanning(clientCode)
    .then(() => {
      console.log('✨ Planning seeding script completed');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('💥 Unhandled error in seedPlanning script:', error);
      process.exit(1);
    });
}
