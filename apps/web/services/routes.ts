/**
 * This is a centralized place to define all the routes in the application.
 * It is used to avoid hardcoding routes in the application and to make it easier to change routes.
 */
const routes = {
  index: '/',
  countries: {
    index: '/countries',
    new: '/countries/new',
    getDetailsRoute: (id: string) => `/countries/${id}`,
    getEditRoute: (id: string) => `/countries/${id}/edit`,
  },
  states: {
    index: '/states',
    new: '/states/new',
    getDetailsRoute: (id: string) => `/states/${id}`,
    getEditRoute: (id: string) => `/states/${id}/edit`,
  },
  cities: {
    index: '/cities',
    new: '/cities/new',
    getDetailsRoute: (id: string) => `/cities/${id}`,
    getEditRoute: (id: string) => `/cities/${id}/edit`,
  },
  terminals: {
    index: '/terminals',
    new: '/terminals/new',
    getDetailsRoute: (id: string) => `/terminals/${id}`,
    getEditRoute: (id: string) => `/terminals/${id}/edit`,
  },
  transporters: {
    index: '/transporters',
    new: '/transporters/new',
    getDetailsRoute: (id: string) => `/transporters/${id}`,
    getEditRoute: (id: string) => `/transporters/${id}/edit`,
  },
  serviceTypes: {
    index: '/service-types',
    new: '/service-types/new',
    getDetailsRoute: (id: string) => `/service-types/${id}`,
    getEditRoute: (id: string) => `/service-types/${id}/edit`,
  },
  busLines: {
    index: '/bus-lines',
    new: '/bus-lines/new',
    getDetailsRoute: (id: string) => `/bus-lines/${id}`,
    getEditRoute: (id: string) => `/bus-lines/${id}/edit`,
  },
  routes: {
    index: '/routes',
    new: '/routes/new',
    getDetailsRoute: (id: string) => `/routes/${id}`,
    getEditRoute: (id: string) => `/routes/${id}/edit`,
  },
  pathways: {
    index: '/pathways',
    new: '/pathways/new',
    getDetailsRoute: (id: string) => `/pathways/${id}`,
    getEditRoute: (id: string) => `/pathways/${id}/edit`,
  },
  pathwayServices: {
    index: '/pathway-services',
    new: '/pathway-services/new',
    getDetailsRoute: (id: string) => `/pathway-services/${id}`,
    getEditRoute: (id: string) => `/pathway-services/${id}/edit`,
  },
  services: {
    index: '/services',
    new: '/services/new',
    getDetailsRoute: (id: string) => `/services/${id}`,
    getEditRoute: (id: string) => `/services/${id}/edit`,
  },
  drivers: {
    index: '/drivers',
    new: '/drivers/new',
    getDetailsRoute: (id: string) => `/drivers/${id}`,
    getEditRoute: (id: string) => `/drivers/${id}/edit`,
  },
  busModels: {
    index: '/bus-models',
    new: '/bus-models/new',
    getDetailsRoute: (id: string) => `/bus-models/${id}`,
    getEditRoute: (id: string) => `/bus-models/${id}/edit`,
  },
  buses: {
    index: '/buses',
    new: '/buses/new',
    getDetailsRoute: (id: string) => `/buses/${id}`,
    getEditRoute: (id: string) => `/buses/${id}/edit`,
  },
  busPlans: {
    index: '/bus-plans',
    new: '/bus-plans/new',
    getDetailsRoute: (id: string) => `/bus-plans/${id}`,
    getEditRoute: (id: string) => `/bus-plans/${id}/edit`,
  },
};

export default routes;
