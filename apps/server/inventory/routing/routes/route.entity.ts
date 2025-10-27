import { FieldErrorCollector } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { EntityUtils } from '@/shared/domain/entity-utils';
import {
  validateNodesAndGetCities,
  validateOriginDestinationRule,
} from '../shared/node-validation.utils';
import type {
  CreateRoutePayload,
  Route,
  UpdateRoutePayload,
} from './routes.types';
import type { RouteEntity, RouteEntityDependencies } from './routes.types';
import { routeErrors } from './route.errors';

export function createRouteEntity(dependencies: RouteEntityDependencies) {
  const {
    routesRepository,
    nodeRepository,
    pathwayRepository,
    pathwayOptionRepository,
    busLineRepository,
    serviceTypeRepository,
    routeLegsRepository,
  } = dependencies;

  const { isEntityPersisted } = EntityUtils;

  /**
   * Validates route legs and pathways
   * @param legs - Array of leg payloads (CreateRouteLegPayload[] or UpdateRouteLegPayload[])
   * @param collector - Optional error collector to accumulate errors
   * @returns True if validation passes, false if there are errors
   */
  async function validateLegs(
    legs: CreateRoutePayload['legs'] | UpdateRoutePayload['legs'],
    collector?: FieldErrorCollector,
  ): Promise<boolean> {
    if (!legs) return true;

    const errorCollector = collector || new FieldErrorCollector();

    // Get all unique pathway and pathway option IDs
    const pathwayIds = [...new Set(legs.map((leg) => leg.pathwayId))];
    const pathwayOptionIds = [
      ...new Set(legs.map((leg) => leg.pathwayOptionId)),
    ];

    // Fetch pathways and options (repositories already have transaction if needed)
    const [pathways, pathwayOptions] = await Promise.all([
      pathwayRepository.findByIds(pathwayIds),
      pathwayOptionRepository.findByIds(pathwayOptionIds),
    ]);

    const pathwaysMap = new Map(pathways.map((p) => [p.id, p]));
    const pathwayOptionsMap = new Map(pathwayOptions.map((po) => [po.id, po]));

    // Validate each leg
    legs.forEach((leg, index) => {
      // Validate pathway exists
      const pathway = pathwaysMap.get(leg.pathwayId);
      if (!pathway) {
        routeErrors.pathwayNotFoundInLeg(errorCollector, index, leg.pathwayId);
      }

      // Validate pathway option exists and belongs to the pathway
      const pathwayOption = pathwayOptionsMap.get(leg.pathwayOptionId);
      if (!pathwayOption) {
        routeErrors.pathwayOptionNotFoundInLeg(
          errorCollector,
          index,
          leg.pathwayOptionId,
        );
      } else if (pathwayOption.pathwayId !== leg.pathwayId) {
        routeErrors.pathwayOptionMismatch(
          errorCollector,
          index,
          leg.pathwayOptionId,
          leg.pathwayId,
        );
      }
    });

    // If no collector was provided, throw errors immediately
    if (!collector) {
      errorCollector.throwIfErrors();
    }

    return !errorCollector.hasErrors();
  }

  /**
   * Validates leg sequence boundaries and chain connectivity
   * @param legs - Array of leg payloads
   * @param routeOriginNodeId - The origin node ID of the route
   * @param routeDestinationNodeId - The destination node ID of the route
   * @param collector - Error collector to accumulate errors
   */
  async function validateLegSequence(
    legs: CreateRoutePayload['legs'] | UpdateRoutePayload['legs'],
    routeOriginNodeId: number | undefined,
    routeDestinationNodeId: number | undefined,
    collector: FieldErrorCollector,
  ): Promise<void> {
    if (!legs || legs.length === 0) return;

    // Skip validation if origin or destination is undefined
    if (
      routeOriginNodeId === undefined ||
      routeDestinationNodeId === undefined
    ) {
      return;
    }

    // Get pathway IDs from legs
    const pathwayIds = [...new Set(legs.map((leg) => leg.pathwayId))];

    // Fetch pathways
    const pathways = await pathwayRepository.findByIds(pathwayIds);
    const pathwaysMap = new Map(pathways.map((p) => [p.id, p]));

    // Sort legs by position to ensure correct order
    const sortedLegs = [...legs].sort((a, b) => a.position - b.position);

    // Validate first leg origin matches route origin
    const firstLeg = sortedLegs[0];
    const firstPathway = pathwaysMap.get(firstLeg.pathwayId);
    if (firstPathway && firstPathway.originNodeId !== routeOriginNodeId) {
      routeErrors.legSequenceOriginMismatchError(
        collector,
        0,
        routeOriginNodeId,
        firstPathway.originNodeId,
      );
    }

    // Validate last leg destination matches route destination
    const lastLeg = sortedLegs[sortedLegs.length - 1];
    const lastPathway = pathwaysMap.get(lastLeg.pathwayId);
    if (
      lastPathway &&
      lastPathway.destinationNodeId !== routeDestinationNodeId
    ) {
      routeErrors.legSequenceDestinationMismatchError(
        collector,
        sortedLegs.length - 1,
        routeDestinationNodeId,
        lastPathway.destinationNodeId,
      );
    }

    // Validate chain connectivity between consecutive legs
    for (let i = 0; i < sortedLegs.length - 1; i++) {
      const currentLeg = sortedLegs[i];
      const nextLeg = sortedLegs[i + 1];

      const currentPathway = pathwaysMap.get(currentLeg.pathwayId);
      const nextPathway = pathwaysMap.get(nextLeg.pathwayId);

      if (currentPathway && nextPathway) {
        if (currentPathway.destinationNodeId !== nextPathway.originNodeId) {
          routeErrors.legSequenceChainBrokenError(
            collector,
            i,
            i + 1,
            nextPathway.originNodeId,
            currentPathway.destinationNodeId,
          );
        }
      }
    }
  }

  /**
   * Validates that busline exists
   * @param buslineId - The busline ID to validate
   * @param collector - Optional error collector to accumulate errors
   * @returns True if validation passes, false if there are errors
   */
  async function validateBusline(
    buslineId: number,
    collector?: FieldErrorCollector,
  ): Promise<boolean> {
    const errorCollector = collector || new FieldErrorCollector();

    // Validate busline exists
    try {
      await busLineRepository.findOne(buslineId);
    } catch {
      routeErrors.buslineNotFound(errorCollector, buslineId);
    }

    // If no collector was provided, throw errors immediately
    if (!collector) {
      errorCollector.throwIfErrors();
    }

    return !errorCollector.hasErrors();
  }

  /**
   * Validates that service type exists
   * @param serviceTypeId - The service type ID to validate
   * @param collector - Optional error collector to accumulate errors
   * @returns True if validation passes, false if there are errors
   */
  async function validateServiceType(
    serviceTypeId: number,
    collector?: FieldErrorCollector,
  ): Promise<boolean> {
    const errorCollector = collector || new FieldErrorCollector();

    // Validate service type exists
    try {
      await serviceTypeRepository.findOne(serviceTypeId);
    } catch {
      routeErrors.serviceTypeNotFound(errorCollector, serviceTypeId);
    }

    // If no collector was provided, throw errors immediately
    if (!collector) {
      errorCollector.throwIfErrors();
    }

    return !errorCollector.hasErrors();
  }

  /**
   * Validates all business rules for route creation or update
   * @param payload - The route payload to validate
   * @param collector - Error collector to accumulate validation errors
   * @param existingRoute - Optional existing route data for updates
   * @returns Enhanced payload with city IDs
   */
  async function validateRoutePayload(
    payload: CreateRoutePayload | UpdateRoutePayload,
    collector: FieldErrorCollector,
    existingRoute?: Partial<Route>,
  ): Promise<{
    enhancedPayload: CreateRoutePayload | UpdateRoutePayload;
    cityData?: { originCityId: number; destinationCityId: number };
  }> {
    // Validate origin and destination are different
    validateOriginDestinationRule(
      payload,
      collector,
      routeErrors.sameOriginDestination,
    );

    // Validate legs if provided
    if (payload.legs) {
      await validateLegs(payload.legs, collector);
    }

    // Determine which IDs to validate based on what's being updated
    const buslineId = payload.buslineId ?? existingRoute?.buslineId;
    const serviceTypeId = payload.serviceTypeId ?? existingRoute?.serviceTypeId;
    const originNodeId = payload.originNodeId ?? existingRoute?.originNodeId;
    const destinationNodeId =
      payload.destinationNodeId ?? existingRoute?.destinationNodeId;

    // Validate leg sequence boundaries and chain connectivity
    if (payload.legs) {
      await validateLegSequence(
        payload.legs,
        originNodeId,
        destinationNodeId,
        collector,
      );
    }

    // Validate busline and service type if they're being set
    if (buslineId && serviceTypeId) {
      await validateBusline(buslineId, collector);
      await validateServiceType(serviceTypeId, collector);
    }

    // For creation (no existingRoute), always validate nodes and get city IDs
    // For updates, only validate nodes if they're being changed
    const shouldValidateNodes =
      !existingRoute ||
      payload.originNodeId !== undefined ||
      payload.destinationNodeId !== undefined;

    let cityData:
      | { originCityId: number; destinationCityId: number }
      | undefined;
    let enhancedPayload = payload;

    if (shouldValidateNodes && originNodeId && destinationNodeId) {
      const nodeValidationResult = await validateNodesAndGetCities(
        originNodeId,
        destinationNodeId,
        nodeRepository,
        collector,
        {
          originNodeNotFound: routeErrors.originNodeNotFound,
          destinationNodeNotFound: routeErrors.destinationNodeNotFound,
        },
      );

      if (nodeValidationResult) {
        cityData = nodeValidationResult;
        enhancedPayload = {
          ...payload,
          originCityId: cityData.originCityId,
          destinationCityId: cityData.destinationCityId,
        } as typeof payload & {
          originCityId: number;
          destinationCityId: number;
        };
      }
    }

    return { enhancedPayload, cityData };
  }

  /**
   * Creates route legs from payload data
   * @param legs - Array of leg payloads
   * @param routeId - The route ID to associate legs with
   * @param tx - Database transaction
   */
  async function createRouteLegs(
    legs: CreateRoutePayload['legs'] | UpdateRoutePayload['legs'],
    routeId: number,
    tx: TransactionalDB,
  ): Promise<void> {
    if (!legs) return;

    // Get pathways for legs to populate node IDs
    const pathwayIds = [...new Set(legs.map((leg) => leg.pathwayId))];
    const pathways = await pathwayRepository.findByIds(pathwayIds);
    const pathwaysMap = new Map(pathways.map((p) => [p.id, p]));

    // Create route legs with enriched data
    const legsToCreate = legs.map((leg) => {
      const pathway = pathwaysMap.get(leg.pathwayId);
      if (!pathway) {
        throw new Error(
          `Internal error: pathway ${leg.pathwayId} should exist after validation`,
        );
      }
      return {
        position: leg.position,
        routeId,
        originNodeId: pathway.originNodeId,
        destinationNodeId: pathway.destinationNodeId,
        pathwayId: leg.pathwayId,
        pathwayOptionId: leg.pathwayOptionId,
        isDerived: leg.isDerived ?? false,
        active: leg.active ?? true,
      };
    });

    // Use repository to create legs instead of writing directly to DB
    await routeLegsRepository.createLegs(legsToCreate, tx);
  }

  /**
   * Creates a route entity from existing route data
   * @param routeData - The route data
   * @returns A route entity with domain behavior
   */
  function createInstance(routeData: Partial<Route>): RouteEntity {
    const isPersisted = isEntityPersisted(routeData.id);

    /**
     * Saves the route entity to the database within a transaction
     * @param tx - Database transaction instance (required)
     * @returns The persisted route entity
     */
    async function save(tx: TransactionalDB): Promise<RouteEntity> {
      const collector = new FieldErrorCollector();

      if (isPersisted) {
        // Already persisted, return same instance
        return createInstance(routeData);
      }

      const payload = routeData as CreateRoutePayload;

      // Validate all business rules and collect errors
      const { enhancedPayload } = await validateRoutePayload(
        payload,
        collector,
      );

      // Throw all collected errors at once
      collector.throwIfErrors();

      // Ensure city IDs are present for creation
      const createPayload = enhancedPayload as CreateRoutePayload & {
        originCityId: number;
        destinationCityId: number;
      };

      // Create in database (repository already has transaction if needed)
      const route = await routesRepository.create(createPayload, tx);

      // Create route legs
      await createRouteLegs(payload.legs, route.id, tx);

      return createInstance(route);
    }

    async function update(
      payload: UpdateRoutePayload,
      tx: TransactionalDB,
    ): Promise<RouteEntity> {
      const collector = new FieldErrorCollector();

      // Validate entity is persisted
      if (!isPersisted) {
        routeErrors.updateNotPersisted(collector, routeData.id);
      }

      if (!routeData.id) {
        throw new Error('Internal error: route ID should exist for updates');
      }

      // Validate update payload business rules
      const { enhancedPayload } = await validateRoutePayload(
        payload,
        collector,
        routeData,
      );

      // Throw all collected errors at once
      collector.throwIfErrors();

      // Update in database (repository already has transaction if needed)
      const updatedRoute = await routesRepository.update(
        routeData.id,
        enhancedPayload,
        tx,
      );

      // If legs are being updated, replace them
      if (payload.legs) {
        // Delete existing legs for this route using repository
        await routeLegsRepository.deleteByRouteId(routeData.id, tx);

        // Create new route legs
        await createRouteLegs(payload.legs, updatedRoute.id, tx);
      }

      return createInstance(updatedRoute);
    }

    function toRoute(): Route {
      // Validate required fields exist
      if (
        routeData.id === undefined ||
        routeData.code === undefined ||
        routeData.name === undefined ||
        routeData.serviceTypeId === undefined ||
        routeData.buslineId === undefined ||
        routeData.originNodeId === undefined ||
        routeData.destinationNodeId === undefined ||
        routeData.originCityId === undefined ||
        routeData.destinationCityId === undefined ||
        routeData.active === undefined
      ) {
        throw new Error('Cannot convert to Route: missing required fields');
      }

      return {
        id: routeData.id,
        code: routeData.code,
        name: routeData.name,
        serviceTypeId: routeData.serviceTypeId,
        buslineId: routeData.buslineId,
        originNodeId: routeData.originNodeId,
        destinationNodeId: routeData.destinationNodeId,
        originCityId: routeData.originCityId,
        destinationCityId: routeData.destinationCityId,
        active: routeData.active,
        createdAt: routeData.createdAt ?? null,
        updatedAt: routeData.updatedAt ?? null,
      };
    }

    // Use spread operator to provide direct access to all properties
    return {
      ...routeData,
      isPersisted,
      save,
      update,
      toRoute,
    } as RouteEntity;
  }

  /**
   * Creates a new route entity from payload data (not yet persisted)
   * @param payload - The route creation data
   * @returns A new RouteEntity instance ready to be saved
   */
  function create(payload: CreateRoutePayload): RouteEntity {
    // Use spread operator with defaults for optional fields
    const routeData = {
      ...payload,
      active: payload.active ?? true,
      // createdAt and updatedAt will be set by the database automatically
    };

    return createInstance(routeData);
  }

  /**
   * Finds a route by ID from the database
   * @param id - The route ID to find
   * @returns The route entity
   * @throws {NotFoundError} If route is not found
   */
  async function findOne(id: number): Promise<RouteEntity> {
    const route = await routesRepository.findOne(id);
    return createInstance(route);
  }

  /**
   * Creates a route entity from existing route data
   * @param route - The route data
   * @returns A route entity with domain behavior
   */
  function fromData(route: Route): RouteEntity {
    return createInstance(route);
  }

  return {
    create,
    findOne,
    fromData,
  };
}
