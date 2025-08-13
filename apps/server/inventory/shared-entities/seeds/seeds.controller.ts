import { api } from 'encore.dev/api';
import { APIError } from 'encore.dev/api';
// import { seedAdmin } from '../../db/scripts/seed-admin';
import { seedInventory } from '@/db/scripts/seed-inventory';
import { seedPermissions } from '@/db/scripts/seed-permissions';
import { appMeta } from 'encore.dev';

export const runAllSeeders = api(
  { expose: false, method: 'POST', path: '/seed' },
  async (): Promise<{ success: boolean; message: string }> => {
    const environment = appMeta().environment.type;

    // Prevent execution in production environment
    if (environment === 'production') {
      throw APIError.permissionDenied(
        'Seeding is not allowed in production environments',
      );
    }

    // Run all seed operations in sequence
    // await seedAdmin();
    await seedInventory();
    await seedPermissions();

    return {
      success: true,
      message: 'All seed operations completed successfully',
    };
  },
);
