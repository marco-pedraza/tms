// Static imports for type checking
import amenities from './amenities.json';
import auth from './auth.json';
import busLines from './busLines.json';
import busModels from './busModels.json';
import buses from './buses.json';
import chromatics from './chromatics.json';
import cities from './cities.json';
import common from './common.json';
import countries from './countries.json';
import departments from './departments.json';
import drivers from './drivers.json';
import eventTypes from './eventTypes.json';
import installationTypes from './installationTypes.json';
import installations from './installations.json';
import labels from './labels.json';
import medicalChecks from './medicalChecks.json';
import nodeEvents from './nodeEvents.json';
import nodes from './nodes.json';
import pathways from './pathways.json';
import populations from './populations.json';
import roles from './roles.json';
import routes from './routes.json';
import seatDiagrams from './seatDiagrams.json';
import serviceTypes from './serviceTypes.json';
import sidebar from './sidebar.json';
import states from './states.json';
import technologies from './technologies.json';
import timeOffs from './timeOffs.json';
import transporters from './transporters.json';
import users from './users.json';
import validations from './validations.json';

// Export for type checking
export const messages = {
  common,
  auth,
  validations,
  sidebar,
  users,
  roles,
  departments,
  countries,
  labels,
  states,
  cities,
  transporters,
  serviceTypes,
  busLines,
  drivers,
  timeOffs,
  medicalChecks,
  populations,
  nodes,
  installations,
  nodeEvents,
  installationTypes,
  eventTypes,
  amenities,
  busModels,
  buses,
  technologies,
  chromatics,
  seatDiagrams,
  pathways,
  routes,
};

// Dynamic imports are required here since next-intl relies on them for loading locale messages.
export async function loadMessages() {
  const [
    commonModule,
    authModule,
    validationsModule,
    sidebarModule,
    usersModule,
    rolesModule,
    departmentsModule,
    countriesModule,
    labelsModule,
    statesModule,
    citiesModule,
    transportersModule,
    serviceTypesModule,
    busLinesModule,
    driversModule,
    timeOffsModule,
    medicalChecksModule,
    populationsModule,
    nodesModule,
    installationsModule,
    nodeEventsModule,
    installationTypesModule,
    eventTypesModule,
    amenitiesModule,
    busModelsModule,
    busesModule,
    technologiesModule,
    chromaticsModule,
    seatDiagramsModule,
    pathwaysModule,
    routesModule,
  ] = await Promise.all([
    import('./common.json'),
    import('./auth.json'),
    import('./validations.json'),
    import('./sidebar.json'),
    import('./users.json'),
    import('./roles.json'),
    import('./departments.json'),
    import('./countries.json'),
    import('./labels.json'),
    import('./states.json'),
    import('./cities.json'),
    import('./transporters.json'),
    import('./serviceTypes.json'),
    import('./busLines.json'),
    import('./drivers.json'),
    import('./timeOffs.json'),
    import('./medicalChecks.json'),
    import('./populations.json'),
    import('./nodes.json'),
    import('./installations.json'),
    import('./nodeEvents.json'),
    import('./installationTypes.json'),
    import('./eventTypes.json'),
    import('./amenities.json'),
    import('./busModels.json'),
    import('./buses.json'),
    import('./technologies.json'),
    import('./chromatics.json'),
    import('./seatDiagrams.json'),
    import('./pathways.json'),
    import('./routes.json'),
  ]);

  return {
    common: commonModule.default,
    auth: authModule.default,
    validations: validationsModule.default,
    sidebar: sidebarModule.default,
    users: usersModule.default,
    roles: rolesModule.default,
    departments: departmentsModule.default,
    countries: countriesModule.default,
    labels: labelsModule.default,
    states: statesModule.default,
    cities: citiesModule.default,
    transporters: transportersModule.default,
    serviceTypes: serviceTypesModule.default,
    busLines: busLinesModule.default,
    drivers: driversModule.default,
    timeOffs: timeOffsModule.default,
    medicalChecks: medicalChecksModule.default,
    populations: populationsModule.default,
    nodes: nodesModule.default,
    installations: installationsModule.default,
    nodeEvents: nodeEventsModule.default,
    installationTypes: installationTypesModule.default,
    eventTypes: eventTypesModule.default,
    amenities: amenitiesModule.default,
    busModels: busModelsModule.default,
    buses: busesModule.default,
    technologies: technologiesModule.default,
    chromatics: chromaticsModule.default,
    seatDiagrams: seatDiagramsModule.default,
    pathways: pathwaysModule.default,
    routes: routesModule.default,
  };
}
