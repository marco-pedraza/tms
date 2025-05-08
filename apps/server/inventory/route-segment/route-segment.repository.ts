import { routeSegments } from './route-segment.schema';
import {
  RouteSegment,
  CreateRouteSegmentPayload,
  UpdateRouteSegmentPayload,
} from './route-segment.types';
import { createBaseRepository } from '@repo/base-repo';
import { db } from '../db-service';

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
