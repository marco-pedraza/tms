/**
 * Module permission codes
 * These constants define all module-based permissions for the application
 */
export const MODULE_PERMISSIONS = {
  // Inventory - Localities
  COUNTRIES: 'inventory_countries',
  STATES: 'inventory_states',
  CITIES: 'inventory_cities',
  POPULATIONS: 'inventory_populations',
  NODES: 'inventory_nodes',
  INSTALLATION_TYPES: 'inventory_installation_types',
  EVENTS: 'inventory_events',
  LABELS: 'inventory_labels',

  // Inventory - Operators
  TRANSPORTERS: 'inventory_transporters',
  SERVICE_TYPES: 'inventory_service_types',
  BUS_LINES: 'inventory_bus_lines',

  // Inventory - Fleet
  BUSES: 'inventory_buses',
  BUS_MODELS: 'inventory_bus_models',
  SEAT_DIAGRAMS: 'inventory_seat_diagrams',
  DRIVERS: 'inventory_drivers',
  TECHNOLOGIES: 'inventory_technologies',
  CHROMATICS: 'inventory_chromatics',

  // Inventory - Routing
  PATHWAYS: 'inventory_pathways',
  ROUTES: 'inventory_routes',

  // Inventory - General Config
  AMENITIES: 'inventory_amenities',

  // Planning
  ROLLING_PLANS: 'planning_rolling_plans',

  // Users
  DEPARTMENTS: 'users_departments',
  PERMISSIONS: 'users_permissions',
  ROLES: 'users_roles',
  USERS: 'users_users',
} as const;

/**
 * Type for module permission codes
 */
export type ModulePermission =
  (typeof MODULE_PERMISSIONS)[keyof typeof MODULE_PERMISSIONS];

/**
 * Maps Encore service:endpoint combinations to module permissions
 * This mapping connects API endpoints to their required module permissions
 * for authorization checks in the middleware
 * Each endpoint can belong to multiple modules for form dependencies
 */
export const ENDPOINT_TO_MODULES: Record<string, string[]> = {
  // ============================================================================
  // INVENTORY SYSTEM
  // ============================================================================

  // Inventory - Fleet
  // Bus Diagram Model Zones
  'inventory:createBusDiagramModelZone': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:getBusDiagramModelZone': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:listZonesByDiagramModel': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:listZonesByDiagramModelPaginated': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:updateBusDiagramModelZone': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:deleteBusDiagramModelZone': [MODULE_PERMISSIONS.BUS_MODELS],

  // Bus Diagram Models
  'inventory:createBusDiagramModel': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:getBusDiagramModel': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:listBusDiagramModels': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:listBusDiagramModelsPaginated': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:updateBusDiagramModel': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:deleteBusDiagramModel': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:updateSeatConfiguration': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:listBusDiagramModelSeats': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:regenerateSeats': [MODULE_PERMISSIONS.BUS_MODELS],

  // Bus Models
  'inventory:createBusModel': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:getBusModel': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:listBusModels': [
    MODULE_PERMISSIONS.BUS_MODELS,
    MODULE_PERMISSIONS.BUSES,
  ],
  'inventory:listBusModelsPaginated': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:updateBusModel': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:deleteBusModel': [MODULE_PERMISSIONS.BUS_MODELS],
  'inventory:assignAmenitiesToBusModel': [MODULE_PERMISSIONS.BUS_MODELS],

  // Buses
  'inventory:createBus': [MODULE_PERMISSIONS.BUSES],
  'inventory:getBus': [MODULE_PERMISSIONS.BUSES],
  'inventory:listBuses': [MODULE_PERMISSIONS.BUSES],
  'inventory:listBusesPaginated': [MODULE_PERMISSIONS.BUSES],
  'inventory:updateBus': [MODULE_PERMISSIONS.BUSES],
  'inventory:deleteBus': [MODULE_PERMISSIONS.BUSES],
  'inventory:listBusValidNextStatuses': [MODULE_PERMISSIONS.BUSES],
  'inventory:assignTechnologiesToBus': [MODULE_PERMISSIONS.BUSES],
  'inventory:assignDriversToBusCrew': [MODULE_PERMISSIONS.BUSES],

  // Chromatics
  'inventory:createChromatic': [MODULE_PERMISSIONS.CHROMATICS],
  'inventory:getChromatic': [MODULE_PERMISSIONS.CHROMATICS],
  'inventory:listChromatics': [
    MODULE_PERMISSIONS.CHROMATICS,
    MODULE_PERMISSIONS.BUSES,
  ],
  'inventory:listChromaticsPaginated': [MODULE_PERMISSIONS.CHROMATICS],
  'inventory:updateChromatic': [MODULE_PERMISSIONS.CHROMATICS],
  'inventory:deleteChromatic': [MODULE_PERMISSIONS.CHROMATICS],

  // Driver Medical Checks
  'inventory:createDriverMedicalCheck': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:getDriverMedicalCheck': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:listDriverMedicalChecks': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:listDriverMedicalChecksPaginated': [MODULE_PERMISSIONS.DRIVERS],

  // Driver Time-offs
  'inventory:createDriverTimeOff': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:getDriverTimeOff': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:listDriverTimeOffs': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:listDriverTimeOffsPaginated': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:updateDriverTimeOff': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:deleteDriverTimeOff': [MODULE_PERMISSIONS.DRIVERS],

  // Drivers
  'inventory:createDriver': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:getDriver': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:listDrivers': [
    MODULE_PERMISSIONS.DRIVERS,
    MODULE_PERMISSIONS.BUSES,
  ],
  'inventory:listDriversPaginated': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:updateDriver': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:deleteDriver': [MODULE_PERMISSIONS.DRIVERS],
  'inventory:listDriversAvailability': [MODULE_PERMISSIONS.DRIVERS],

  // Seat Diagram Zones
  'inventory:createSeatDiagramZone': [MODULE_PERMISSIONS.SEAT_DIAGRAMS],
  'inventory:getSeatDiagramZone': [MODULE_PERMISSIONS.SEAT_DIAGRAMS],
  'inventory:listZonesByDiagram': [MODULE_PERMISSIONS.SEAT_DIAGRAMS],
  'inventory:listZonesByDiagramPaginated': [MODULE_PERMISSIONS.SEAT_DIAGRAMS],
  'inventory:updateSeatDiagramZone': [MODULE_PERMISSIONS.SEAT_DIAGRAMS],
  'inventory:deleteSeatDiagramZone': [MODULE_PERMISSIONS.SEAT_DIAGRAMS],

  // Seat Diagrams
  'inventory:getSeatDiagram': [MODULE_PERMISSIONS.SEAT_DIAGRAMS],
  'inventory:updateSeatDiagram': [MODULE_PERMISSIONS.SEAT_DIAGRAMS],
  'inventory:deleteSeatDiagram': [MODULE_PERMISSIONS.SEAT_DIAGRAMS],
  'inventory:listSeatDiagramSeats': [MODULE_PERMISSIONS.SEAT_DIAGRAMS],
  'inventory:updateSeatDiagramConfiguration': [
    MODULE_PERMISSIONS.SEAT_DIAGRAMS,
  ],

  // Technologies
  'inventory:createTechnology': [MODULE_PERMISSIONS.TECHNOLOGIES],
  'inventory:getTechnology': [MODULE_PERMISSIONS.TECHNOLOGIES],
  'inventory:listTechnologies': [
    MODULE_PERMISSIONS.TECHNOLOGIES,
    MODULE_PERMISSIONS.BUSES,
  ],
  'inventory:listTechnologiesPaginated': [MODULE_PERMISSIONS.TECHNOLOGIES],
  'inventory:updateTechnology': [MODULE_PERMISSIONS.TECHNOLOGIES],
  'inventory:deleteTechnology': [MODULE_PERMISSIONS.TECHNOLOGIES],

  // Inventory - Locations
  // Cities
  'inventory:createCity': [MODULE_PERMISSIONS.CITIES],
  'inventory:getCity': [MODULE_PERMISSIONS.CITIES],
  'inventory:listCities': [
    MODULE_PERMISSIONS.CITIES,
    MODULE_PERMISSIONS.NODES,
    MODULE_PERMISSIONS.TRANSPORTERS,
  ],
  'inventory:listCitiesPaginated': [MODULE_PERMISSIONS.CITIES],
  'inventory:updateCity': [MODULE_PERMISSIONS.CITIES],
  'inventory:deleteCity': [MODULE_PERMISSIONS.CITIES],

  // Countries
  'inventory:createCountry': [MODULE_PERMISSIONS.COUNTRIES],
  'inventory:getCountry': [MODULE_PERMISSIONS.COUNTRIES],
  'inventory:listCountries': [MODULE_PERMISSIONS.COUNTRIES],
  'inventory:listCountriesPaginated': [MODULE_PERMISSIONS.COUNTRIES],
  'inventory:updateCountry': [MODULE_PERMISSIONS.COUNTRIES],
  'inventory:deleteCountry': [MODULE_PERMISSIONS.COUNTRIES],

  // Event Types
  'inventory:createEventType': [MODULE_PERMISSIONS.EVENTS],
  'inventory:getEventType': [MODULE_PERMISSIONS.EVENTS],
  'inventory:updateEventType': [MODULE_PERMISSIONS.EVENTS],
  'inventory:listEventTypes': [
    MODULE_PERMISSIONS.EVENTS,
    MODULE_PERMISSIONS.INSTALLATION_TYPES,
  ],
  'inventory:listEventTypesPaginated': [MODULE_PERMISSIONS.EVENTS],
  'inventory:deleteEventType': [MODULE_PERMISSIONS.EVENTS],

  // Events
  'inventory:createEvent': [MODULE_PERMISSIONS.EVENTS],
  'inventory:getEvent': [MODULE_PERMISSIONS.EVENTS],
  'inventory:listEvents': [MODULE_PERMISSIONS.EVENTS],
  'inventory:listEventsPaginated': [MODULE_PERMISSIONS.EVENTS],
  'inventory:updateEvent': [MODULE_PERMISSIONS.EVENTS],
  'inventory:deleteEvent': [MODULE_PERMISSIONS.EVENTS],

  // Installation Schemas
  // TODO: Verify if module is correct
  'inventory:createInstallationSchema': [MODULE_PERMISSIONS.INSTALLATION_TYPES],
  'inventory:getInstallationSchema': [MODULE_PERMISSIONS.INSTALLATION_TYPES],
  'inventory:updateInstallationSchema': [MODULE_PERMISSIONS.INSTALLATION_TYPES],
  'inventory:listInstallationSchemas': [MODULE_PERMISSIONS.INSTALLATION_TYPES],
  'inventory:listInstallationSchemasPaginated': [
    MODULE_PERMISSIONS.INSTALLATION_TYPES,
  ],
  'inventory:deleteInstallationSchema': [MODULE_PERMISSIONS.INSTALLATION_TYPES],

  // Installation Types
  'inventory:createInstallationType': [MODULE_PERMISSIONS.INSTALLATION_TYPES],
  'inventory:getInstallationType': [MODULE_PERMISSIONS.INSTALLATION_TYPES],
  'inventory:getInstallationTypeSchema': [
    MODULE_PERMISSIONS.INSTALLATION_TYPES,
  ],
  'inventory:syncInstallationSchemas': [MODULE_PERMISSIONS.INSTALLATION_TYPES],
  'inventory:updateInstallationType': [MODULE_PERMISSIONS.INSTALLATION_TYPES],
  'inventory:listInstallationTypes': [
    MODULE_PERMISSIONS.INSTALLATION_TYPES,
    MODULE_PERMISSIONS.NODES,
  ],
  'inventory:listInstallationTypesPaginated': [
    MODULE_PERMISSIONS.INSTALLATION_TYPES,
  ],
  'inventory:deleteInstallationType': [MODULE_PERMISSIONS.INSTALLATION_TYPES],
  'inventory:assignEventTypesToInstallationType': [
    MODULE_PERMISSIONS.INSTALLATION_TYPES,
  ],

  // Installations
  'inventory:createInstallation': [MODULE_PERMISSIONS.NODES],
  'inventory:getInstallation': [MODULE_PERMISSIONS.NODES],
  'inventory:updateInstallation': [MODULE_PERMISSIONS.NODES],
  'inventory:listInstallations': [MODULE_PERMISSIONS.NODES],
  'inventory:listInstallationsPaginated': [MODULE_PERMISSIONS.NODES],
  'inventory:deleteInstallation': [MODULE_PERMISSIONS.NODES],
  'inventory:updateInstallationProperties': [MODULE_PERMISSIONS.NODES],
  'inventory:assignAmenitiesToInstallation': [MODULE_PERMISSIONS.NODES],

  // Labels
  'inventory:createLabel': [MODULE_PERMISSIONS.LABELS],
  'inventory:updateLabel': [MODULE_PERMISSIONS.LABELS],
  'inventory:deleteLabel': [MODULE_PERMISSIONS.LABELS],
  'inventory:getLabel': [MODULE_PERMISSIONS.LABELS],
  'inventory:listLabelsPaginated': [MODULE_PERMISSIONS.LABELS],
  'inventory:listLabels': [MODULE_PERMISSIONS.LABELS, MODULE_PERMISSIONS.NODES],
  'inventory:getLabelsMetrics': [MODULE_PERMISSIONS.LABELS],

  // Nodes
  'inventory:createNode': [MODULE_PERMISSIONS.NODES],
  'inventory:getNode': [MODULE_PERMISSIONS.NODES],
  'inventory:listNodes': [
    MODULE_PERMISSIONS.NODES,
    MODULE_PERMISSIONS.PATHWAYS,
    MODULE_PERMISSIONS.BUSES,
  ],
  'inventory:listNodesPaginated': [MODULE_PERMISSIONS.NODES],
  'inventory:updateNode': [MODULE_PERMISSIONS.NODES],
  'inventory:deleteNode': [MODULE_PERMISSIONS.NODES],
  'inventory:assignEventsToNode': [MODULE_PERMISSIONS.NODES],
  'inventory:assignLabelsToNode': [MODULE_PERMISSIONS.NODES],

  // Populations
  'inventory:createPopulation': [MODULE_PERMISSIONS.POPULATIONS],
  'inventory:getPopulation': [MODULE_PERMISSIONS.POPULATIONS],
  'inventory:listPopulations': [
    MODULE_PERMISSIONS.POPULATIONS,
    MODULE_PERMISSIONS.CITIES,
    MODULE_PERMISSIONS.NODES,
  ],
  'inventory:listPopulationsPaginated': [MODULE_PERMISSIONS.POPULATIONS],
  'inventory:updatePopulation': [MODULE_PERMISSIONS.POPULATIONS],
  'inventory:assignCitiesToPopulation': [MODULE_PERMISSIONS.POPULATIONS],
  'inventory:assignCityToPopulation': [MODULE_PERMISSIONS.POPULATIONS],
  'inventory:unassignCityFromPopulation': [MODULE_PERMISSIONS.POPULATIONS],
  'inventory:listAvailableCities': [MODULE_PERMISSIONS.POPULATIONS],
  'inventory:getPopulationCities': [MODULE_PERMISSIONS.POPULATIONS],
  'inventory:deletePopulation': [MODULE_PERMISSIONS.POPULATIONS],
  'inventory:findPopulationByAssignedCity': [MODULE_PERMISSIONS.POPULATIONS],

  // States
  'inventory:createState': [MODULE_PERMISSIONS.STATES],
  'inventory:getState': [MODULE_PERMISSIONS.STATES],
  'inventory:listStates': [
    MODULE_PERMISSIONS.STATES,
    MODULE_PERMISSIONS.CITIES,
  ],
  'inventory:listStatesPaginated': [MODULE_PERMISSIONS.STATES],
  'inventory:updateState': [MODULE_PERMISSIONS.STATES],
  'inventory:deleteState': [MODULE_PERMISSIONS.STATES],

  // Timezones (read-only data, no specific module needed)
  'inventory:getTimezone': [],
  'inventory:listTimezones': [],

  // Tollbooths
  'inventory:getTollbooth': [MODULE_PERMISSIONS.ROUTES],
  'inventory:listTollbooths': [MODULE_PERMISSIONS.ROUTES],

  // Inventory - Operators
  // Bus Lines
  'inventory:createBusLine': [MODULE_PERMISSIONS.BUS_LINES],
  'inventory:getBusLine': [MODULE_PERMISSIONS.BUS_LINES],
  'inventory:listBusLines': [
    MODULE_PERMISSIONS.BUS_LINES,
    MODULE_PERMISSIONS.DRIVERS,
    MODULE_PERMISSIONS.BUSES,
  ],
  'inventory:listBusLinesPaginated': [MODULE_PERMISSIONS.BUS_LINES],
  'inventory:updateBusLine': [MODULE_PERMISSIONS.BUS_LINES],
  'inventory:deleteBusLine': [MODULE_PERMISSIONS.BUS_LINES],

  // Service Types
  'inventory:createServiceType': [MODULE_PERMISSIONS.SERVICE_TYPES],
  'inventory:getServiceType': [MODULE_PERMISSIONS.SERVICE_TYPES],
  'inventory:listServiceTypes': [
    MODULE_PERMISSIONS.SERVICE_TYPES,
    MODULE_PERMISSIONS.BUS_LINES,
  ],
  'inventory:listServiceTypesPaginated': [MODULE_PERMISSIONS.SERVICE_TYPES],
  'inventory:updateServiceType': [MODULE_PERMISSIONS.SERVICE_TYPES],
  'inventory:deleteServiceType': [MODULE_PERMISSIONS.SERVICE_TYPES],
  'inventory:assignAmenitiesToServiceType': [MODULE_PERMISSIONS.SERVICE_TYPES],

  // Transporters
  'inventory:createTransporter': [MODULE_PERMISSIONS.TRANSPORTERS],
  'inventory:getTransporter': [MODULE_PERMISSIONS.TRANSPORTERS],
  'inventory:listTransporters': [
    MODULE_PERMISSIONS.TRANSPORTERS,
    MODULE_PERMISSIONS.BUS_LINES,
    MODULE_PERMISSIONS.BUSES,
  ],
  'inventory:listTransportersPaginated': [MODULE_PERMISSIONS.TRANSPORTERS],
  'inventory:updateTransporter': [MODULE_PERMISSIONS.TRANSPORTERS],
  'inventory:deleteTransporter': [MODULE_PERMISSIONS.TRANSPORTERS],

  // Inventory - Routing
  // Pathways
  'inventory:createPathway': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:getPathway': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:listPathways': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:listPathwaysPaginated': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:updatePathway': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:deletePathway': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:addOptionToPathway': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:removeOptionFromPathway': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:updatePathwayOption': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:setDefaultPathwayOption': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:syncPathwayOptionTolls': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:listPathwayOptionTolls': [MODULE_PERMISSIONS.PATHWAYS],
  'inventory:syncPathwayOptions': [MODULE_PERMISSIONS.PATHWAYS],

  // Routes
  'inventory:createRoute': [MODULE_PERMISSIONS.ROUTES],
  'inventory:getRoute': [MODULE_PERMISSIONS.ROUTES],
  'inventory:listRoutes': [MODULE_PERMISSIONS.ROUTES],
  'inventory:listRoutesPaginated': [MODULE_PERMISSIONS.ROUTES],
  'inventory:updateRoute': [MODULE_PERMISSIONS.ROUTES],
  'inventory:deleteRoute': [MODULE_PERMISSIONS.ROUTES],

  // Inventory - Shared Entities
  // Amenities
  'inventory:createAmenity': [MODULE_PERMISSIONS.AMENITIES],
  'inventory:getAmenity': [MODULE_PERMISSIONS.AMENITIES],
  'inventory:listAmenities': [
    MODULE_PERMISSIONS.AMENITIES,
    MODULE_PERMISSIONS.NODES,
    MODULE_PERMISSIONS.SERVICE_TYPES,
    MODULE_PERMISSIONS.BUS_MODELS,
  ],
  'inventory:listAmenitiesPaginated': [MODULE_PERMISSIONS.AMENITIES],
  'inventory:updateAmenity': [MODULE_PERMISSIONS.AMENITIES],
  'inventory:deleteAmenity': [MODULE_PERMISSIONS.AMENITIES],

  // ============================================================================
  // PLANNING SYSTEM
  // ============================================================================

  // Planning - Rolling Plans
  'planning:createRollingPlan': [MODULE_PERMISSIONS.ROLLING_PLANS],
  'planning:listRollingPlans': [MODULE_PERMISSIONS.ROLLING_PLANS],
  'planning:listRollingPlansPaginated': [MODULE_PERMISSIONS.ROLLING_PLANS],
  'planning:getRollingPlan': [MODULE_PERMISSIONS.ROLLING_PLANS],
  'planning:updateRollingPlan': [MODULE_PERMISSIONS.ROLLING_PLANS],
  'planning:deleteRollingPlan': [MODULE_PERMISSIONS.ROLLING_PLANS],

  // ============================================================================
  // USERS SYSTEM
  // ============================================================================

  // Users - Audits (read-only for system admins)
  'users:listAuditsPaginated': [],

  // Users - Auth
  'users:login': [],
  'users:refreshToken': [],
  'users:logout': [],
  'users:revokeAllTokens': [MODULE_PERMISSIONS.USERS],

  // Users - Departments
  'users:createDepartment': [MODULE_PERMISSIONS.DEPARTMENTS],
  'users:getDepartment': [MODULE_PERMISSIONS.DEPARTMENTS],
  'users:listDepartments': [
    MODULE_PERMISSIONS.DEPARTMENTS,
    MODULE_PERMISSIONS.USERS,
  ],
  'users:listDepartmentsPaginated': [MODULE_PERMISSIONS.DEPARTMENTS],
  'users:updateDepartment': [MODULE_PERMISSIONS.DEPARTMENTS],
  'users:deleteDepartment': [MODULE_PERMISSIONS.DEPARTMENTS],
  'users:searchDepartments': [MODULE_PERMISSIONS.DEPARTMENTS],
  'users:searchDepartmentsPaginated': [MODULE_PERMISSIONS.DEPARTMENTS],

  // Users - Permission Groups
  'users:createPermissionGroup': [MODULE_PERMISSIONS.PERMISSIONS],
  'users:listPermissionGroups': [MODULE_PERMISSIONS.PERMISSIONS],
  'users:updatePermissionGroup': [MODULE_PERMISSIONS.PERMISSIONS],
  'users:deletePermissionGroup': [MODULE_PERMISSIONS.PERMISSIONS],

  // Users - Permissions
  'users:createPermission': [MODULE_PERMISSIONS.PERMISSIONS],
  'users:getPermission': [MODULE_PERMISSIONS.PERMISSIONS],
  'users:listPermissions': [MODULE_PERMISSIONS.PERMISSIONS],
  'users:listPermissionsWithPagination': [MODULE_PERMISSIONS.PERMISSIONS],
  'users:updatePermission': [MODULE_PERMISSIONS.PERMISSIONS],
  'users:deletePermission': [MODULE_PERMISSIONS.PERMISSIONS],
  'users:searchPermissions': [MODULE_PERMISSIONS.PERMISSIONS],
  'users:searchPermissionsPaginated': [MODULE_PERMISSIONS.PERMISSIONS],

  // Users - Roles
  'users:createRole': [MODULE_PERMISSIONS.ROLES],
  'users:getRole': [MODULE_PERMISSIONS.ROLES],
  'users:listRoles': [MODULE_PERMISSIONS.ROLES, MODULE_PERMISSIONS.USERS],
  'users:listRolesPaginated': [MODULE_PERMISSIONS.ROLES],
  'users:updateRole': [MODULE_PERMISSIONS.ROLES],
  'users:assignPermissionsToRole': [MODULE_PERMISSIONS.ROLES],
  'users:deleteRole': [MODULE_PERMISSIONS.ROLES],

  // Users - User Permissions
  'users:getUserWithRoles': [MODULE_PERMISSIONS.USERS],
  'users:getUserWithPermissions': [MODULE_PERMISSIONS.USERS],
  'users:assignRolesToUser': [MODULE_PERMISSIONS.USERS],
  'users:assignPermissionsToUser': [MODULE_PERMISSIONS.USERS],
  'users:checkUserPermission': [MODULE_PERMISSIONS.USERS],
  'users:checkUserRole': [MODULE_PERMISSIONS.USERS],
  'users:getUserPermissions': [MODULE_PERMISSIONS.USERS],
  'users:getUserRoles': [MODULE_PERMISSIONS.USERS],

  // Users - Users
  'users:createUser': [MODULE_PERMISSIONS.USERS],
  'users:updateUser': [MODULE_PERMISSIONS.USERS],
  'users:deleteUser': [MODULE_PERMISSIONS.USERS],
  'users:getUser': [MODULE_PERMISSIONS.USERS],
  'users:listUsers': [MODULE_PERMISSIONS.USERS],
  'users:listUsersPaginated': [MODULE_PERMISSIONS.USERS],
  'users:changePassword': [MODULE_PERMISSIONS.USERS],
};
