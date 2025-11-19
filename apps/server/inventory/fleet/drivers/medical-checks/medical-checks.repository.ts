import { type TransactionalDB, createBaseRepository } from '@repo/base-repo';
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
   * @param tx - Optional transaction instance
   * @returns The created medical check
   */
  async function create(
    payload: CreateDriverMedicalCheckPayload & { driverId: number },
    tx?: TransactionalDB,
  ) {
    const dataWithNextDate = {
      ...payload,
      source: MedicalCheckSource.MANUAL,
      nextCheckDate: calculateNextCheckDate(
        payload.checkDate,
        payload.daysUntilNextCheck,
      ),
    };

    const txBaseRepository = tx
      ? baseRepository.withTransaction(tx)
      : baseRepository;

    return await txBaseRepository.create(dataWithNextDate);
  }

  /**
   * Creates a transaction-scoped version of this repository
   * Overrides baseRepository.withTransaction to preserve custom methods
   * @param tx - Transaction instance
   * @returns Transaction-scoped repository with all custom methods
   */
  function withTransaction(tx: TransactionalDB) {
    const txBaseRepository = baseRepository.withTransaction(tx);
    return {
      ...txBaseRepository,
      create: (
        payload: CreateDriverMedicalCheckPayload & { driverId: number },
      ) => create(payload, tx),
      withTransaction: (newTx: TransactionalDB) => withTransaction(newTx),
    };
  }

  return {
    ...baseRepository,
    create,
    withTransaction,
  };
};

// Export the driver medical check repository instance
export const driverMedicalCheckRepository =
  createDriverMedicalCheckRepository();

/**
 * Type representing the complete medical check repository
 * Derived from the actual implementation
 */
export type MedicalCheckRepository = typeof driverMedicalCheckRepository;
