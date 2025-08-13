import { createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { routeSegments } from './route-segment.schema';
import {
  CreateRouteSegmentPayload,
  RouteSegment,
  UpdateRouteSegmentPayload,
} from './route-segment.types';

export const createRouteSegmentRepository = () => {
  const baseRepository = createBaseRepository<
    RouteSegment,
    CreateRouteSegmentPayload,
    UpdateRouteSegmentPayload,
    typeof routeSegments
  >(db, routeSegments, 'RouteSegment');

  return baseRepository;
};

export const routeSegmentRepository = createRouteSegmentRepository();
