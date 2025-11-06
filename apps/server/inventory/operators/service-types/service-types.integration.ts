import type { ServiceType } from './service-types.types';
import { serviceTypeRepository } from './service-types.repository';

/**
 * Public integration type for service types
 * Exposes only the fields needed for cross-service integration
 */
export type ServiceTypeIntegration = Pick<
  ServiceType,
  'id' | 'name' | 'code' | 'description' | 'active'
>;

/**
 * Service Types Integration Service
 *
 * Provides controlled access to service types for other bounded contexts.
 * This is the ONLY way other services should access service type data.
 *
 * @internal This API is for cross-service integration only
 */
export const serviceTypesIntegration = {
  /**
   * Retrieves a single service type by ID
   * @param id - The ID of the service type
   * @returns The service type data
   * @throws {NotFoundError} If the service type is not found
   */
  async getServiceType(id: number): Promise<ServiceTypeIntegration> {
    const serviceType = await serviceTypeRepository.findOne(id);
    return {
      id: serviceType.id,
      name: serviceType.name,
      code: serviceType.code,
      description: serviceType.description,
      active: serviceType.active,
    };
  },

  /**
   * Retrieves multiple service types by their IDs
   * This is a batch operation optimized for fetching multiple entities at once
   *
   * @param ids - Array of service type IDs to retrieve
   * @returns Array of service types in the same order as requested IDs
   */
  async getServiceTypesByIds(ids: number[]): Promise<ServiceTypeIntegration[]> {
    if (ids.length === 0) return [];

    const serviceTypes = await serviceTypeRepository.findByIds(ids);
    return serviceTypes.map((st) => ({
      id: st.id,
      name: st.name,
      code: st.code,
      description: st.description,
      active: st.active,
    }));
  },
};
