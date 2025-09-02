import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { driverMedicalChecks } from './medical-checks.schema';
import type {
  CreateDriverMedicalCheckPayload,
  DriverMedicalCheck,
  UpdateDriverMedicalCheckPayload,
} from './medical-checks.types';
import { MedicalCheckSource } from './medical-checks.types';
import { calculateNextCheckDate } from './medical-checks.domain';

/**
 * Creates a repository for managing driver medical check entities
 * @returns {Object} An object containing medical check-specific operations and base CRUD operations
 */
export const createDriverMedicalCheckRepository = () => {
  const baseRepository = createBaseRepository<
    DriverMedicalCheck,
    CreateDriverMedicalCheckPayload,
    UpdateDriverMedicalCheckPayload,
    typeof driverMedicalChecks
  >(db, driverMedicalChecks, 'DriverMedicalCheck', {
    softDeleteEnabled: true,
  });

  /**
   * Creates a new driver medical check with automatically calculated nextCheckDate
   * @param payload - The medical check data to create
   * @returns The created medical check
   */
  async function create(
    payload: CreateDriverMedicalCheckPayload & { driverId: number },
  ) {
    const dataWithNextDate = {
      ...payload,
      source: MedicalCheckSource.MANUAL,
      nextCheckDate: calculateNextCheckDate(
        payload.checkDate,
        payload.daysUntilNextCheck,
      ),
    };

    return await baseRepository.create(dataWithNextDate);
  }

  return {
    ...baseRepository,
    create,
  };
};

// Export the driver medical check repository instance
export const driverMedicalCheckRepository =
  createDriverMedicalCheckRepository();
