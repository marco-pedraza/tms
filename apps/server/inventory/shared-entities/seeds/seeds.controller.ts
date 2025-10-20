import { api } from 'encore.dev/api';
import { APIError } from 'encore.dev/api';
// import { seedAdmin } from '../../db/scripts/seed-admin';
import { seedInventory } from '@/db/scripts/seed-inventory';
import { seedUsersData } from '@/db/scripts/seed-users';
import { appMeta } from 'encore.dev';

/**
 * Request payload for seeding operations with client code
 */
interface SeedWithClientPayload {
  /**
   * Client code to use for seeding (e.g., 'GFA', 'CLIENT_B')
   * If not provided, will use random/default data
   */
  clientCode?: string;
}

export const runAllSeeders = api(
  {
    expose: false,
    method: 'POST',
    path: '/seed',
    auth: true,
  },
  async (
    params: SeedWithClientPayload,
  ): Promise<{ success: boolean; message: string }> => {
    const environment = appMeta().environment.type;

    if (environment === 'production') {
      throw APIError.permissionDenied(
        'Seeding is not allowed in production environments',
      );
    }

    const clientCode = params.clientCode;

    // await seedAdmin();
    await seedInventory(clientCode);
    await seedUsersData();

    return {
      success: true,
      message: 'All seed operations completed successfully',
    };
  },
);
