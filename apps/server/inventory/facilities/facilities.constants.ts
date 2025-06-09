import { Facility } from './facilities.types';

/**
 * List of available facilities for terminals
 * Used as a static data source since this data is unlikely to change frequently
 */
export const AVAILABLE_FACILITIES: Facility[] = [
  {
    code: 'restaurant',
    name: 'Restaurante',
  },
  {
    code: 'cafeteria',
    name: 'Cafetería',
  },
  {
    code: 'bathroom',
    name: 'Baños',
  },
  {
    code: 'wifi',
    name: 'WiFi',
  },
  {
    code: 'atm',
    name: 'Cajero Automático',
  },
  {
    code: 'parking',
    name: 'Estacionamiento',
  },
  {
    code: 'waiting_room',
    name: 'Sala de Espera',
  },
  {
    code: 'luggage_storage',
    name: 'Guardaequipaje',
  },
  {
    code: 'pharmacy',
    name: 'Farmacia',
  },
  {
    code: 'shop',
    name: 'Tienda',
  },
  {
    code: 'air_conditioning',
    name: 'Aire Acondicionado',
  },
  {
    code: 'accessibility',
    name: 'Accesibilidad',
  },
  {
    code: 'security',
    name: 'Seguridad',
  },
  {
    code: 'information_desk',
    name: 'Mesa de Información',
  },
  {
    code: 'taxi_service',
    name: 'Servicio de Taxi',
  },
];
