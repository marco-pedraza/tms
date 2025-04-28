import { pathwayServices } from './pathway-services.schema';
import type {
  PathwayService,
  CreatePathwayServicePayload,
  UpdatePathwayServicePayload,
} from './pathway-services.types';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/db';

export const createPathwayServiceRepository = () => {
  const baseRepository = createBaseRepository<
    PathwayService,
    CreatePathwayServicePayload,
    UpdatePathwayServicePayload,
    typeof pathwayServices
  >(db, pathwayServices, 'PathwayService');

  //TODO: we need to validate OperatingHours, but that functionality is in a PR
  return {
    ...baseRepository,
  };
};

export const pathwayServiceRepository = createPathwayServiceRepository();
