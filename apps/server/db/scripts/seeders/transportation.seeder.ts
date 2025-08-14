import { fakerES_MX as faker } from '@faker-js/faker';
import type { BusModel } from '@/inventory/fleet/bus-models/bus-models.types';
import type { Bus } from '@/inventory/fleet/buses/buses.types';
import type { Driver } from '@/inventory/fleet/drivers/drivers.types';
import type { City } from '@/inventory/locations/cities/cities.types';
import type { BusLine } from '@/inventory/operators/bus-lines/bus-lines.types';
import type { ServiceType } from '@/inventory/operators/service-types/service-types.types';
import { ServiceTypeCategory } from '@/inventory/operators/service-types/service-types.types';
import type { Transporter } from '@/inventory/operators/transporters/transporters.types';
import {
  busFactory,
  busLineFactory,
  busModelFactory,
  driverFactory,
  seatDiagramFactory,
  serviceTypeFactory,
  transporterFactory,
} from '@/factories';
import { getFactoryDb } from '@/factories/factory-utils';

/**
 * Seeds service types for transportation
 */
export async function seedServiceTypes(
  db: ReturnType<typeof getFactoryDb>,
): Promise<ServiceType[]> {
  const serviceTypes = (await serviceTypeFactory(db).create([
    {
      name: 'Lujo',
      code: 'LUX',
      category: ServiceTypeCategory.LUXURY,
      description: 'Premium service with enhanced comfort and amenities',
      active: true,
      deletedAt: null,
    },
    {
      name: 'Primera Clase',
      code: 'PRIM',
      category: ServiceTypeCategory.LUXURY,
      description: 'First class service with comfortable seating',
      active: true,
      deletedAt: null,
    },
    {
      name: 'Económico',
      code: 'ECO',
      category: ServiceTypeCategory.ECONOMIC,
      description: 'Standard economic service',
      active: true,
      deletedAt: null,
    },
    {
      name: 'Estándar',
      code: 'STD',
      category: ServiceTypeCategory.REGULAR,
      description: 'Tourist class service',
      active: true,
      deletedAt: null,
    },
  ])) as ServiceType[];

  console.log(`Seeded ${serviceTypes.length} service types`);
  return serviceTypes;
}

/**
 * Seeds transporters (bus companies)
 */
export async function seedTransporters(
  cities: City[],
  db: ReturnType<typeof getFactoryDb>,
): Promise<Transporter[]> {
  // Get major cities for headquarter locations
  const majorCities = cities.slice(0, 6); // Use first 6 cities

  const transporters = (await transporterFactory(db).create([
    {
      name: 'ADO',
      code: 'ADO',
      description: 'Autobuses de Oriente - Premium bus service',
      website: 'https://www.ado.com.mx',
      email: 'contacto@ado.com.mx',
      phone: '+52 55 5784 4652',
      headquartersCityId: majorCities[0]?.id,
      active: true,
    },
    {
      name: 'ETN',
      code: 'ETN',
      description: 'Enlace de Transporte Nacional - Luxury bus service',
      website: 'https://www.etn.com.mx',
      email: 'info@etn.com.mx',
      phone: '+52 55 5729 0707',
      headquartersCityId: majorCities[1]?.id,
      active: true,
    },
    {
      name: 'Primera Plus',
      code: 'PLUS',
      description: 'First class intercity bus service',
      website: 'https://www.primeraplus.com.mx',
      email: 'contacto@primeraplus.com.mx',
      phone: '+52 55 5141 4300',
      headquartersCityId: majorCities[2]?.id,
      active: true,
    },
    {
      name: 'Omnibus de Mexico',
      code: 'ODM',
      description: 'Long distance bus transportation',
      website: 'https://www.omnibus.com.mx',
      email: 'servicio@omnibus.com.mx',
      phone: '+52 55 5567 8999',
      headquartersCityId: majorCities[3]?.id,
      active: true,
    },
    {
      name: 'Flecha Amarilla',
      code: 'FLAM',
      description: 'Regional bus transportation service',
      website: 'https://www.flechaamarilla.com.mx',
      email: 'info@flechaamarilla.com.mx',
      phone: '+52 55 5518 1560',
      headquartersCityId: majorCities[4]?.id,
      active: true,
    },
  ])) as Transporter[];

  console.log(`Seeded ${transporters.length} transporters`);
  return transporters;
}

/**
 * Seeds bus lines operated by transporters
 */
export async function seedBusLines(
  transporters: Transporter[],
  serviceTypes: ServiceType[],
  db: ReturnType<typeof getFactoryDb>,
): Promise<BusLine[]> {
  const busLines: BusLine[] = [];

  // Create multiple bus lines for each transporter
  for (const transporter of transporters) {
    for (let i = 0; i < 2; i++) {
      const serviceType = serviceTypes[i % serviceTypes.length];

      const lines = (await busLineFactory(db).create([
        {
          name: `${transporter.name} ${serviceType?.name} Line ${faker.string.alpha({ length: 4, casing: 'upper' })}`,
          code: `${serviceType?.name.substring(0, 3).toUpperCase()}${faker.string.alpha({ length: 5, casing: 'upper' })}`,
          transporterId: transporter.id,
          serviceTypeId: serviceType?.id,
          active: true,
          deletedAt: null,
        },
      ])) as BusLine[];

      busLines.push(...lines);
    }
  }

  console.log(`Seeded ${busLines.length} bus lines`);
  return busLines;
}

/**
 * Seeds bus models
 */
export async function seedBusModels(
  db: ReturnType<typeof getFactoryDb>,
): Promise<BusModel[]> {
  const busModels = (await busModelFactory(db).create([
    {
      manufacturer: 'Volvo',
      model: '9700',
      year: 2023,
      seatingCapacity: 45,
      numFloors: 1,
      amenities: ['Wi-Fi', 'Air Conditioning', 'Reclining Seats'],
      active: true,
    },
    {
      manufacturer: 'Mercedes Benz',
      model: 'O500',
      year: 2022,
      seatingCapacity: 42,
      numFloors: 1,
      amenities: ['Wi-Fi', 'Air Conditioning'],
      active: true,
    },
    {
      manufacturer: 'Scania',
      model: 'Irizar i6',
      year: 2023,
      seatingCapacity: 48,
      numFloors: 1,
      amenities: ['Wi-Fi', 'Air Conditioning', 'Entertainment System'],
      active: true,
    },
  ])) as BusModel[];

  console.log(`Seeded ${busModels.length} bus models`);
  return busModels;
}

/**
 * Seeds buses for transporters
 */
export async function seedBuses(
  transporters: Transporter[],
  busModels: BusModel[],
  db: ReturnType<typeof getFactoryDb>,
): Promise<Bus[]> {
  const buses: Bus[] = [];

  // Create buses for each transporter
  for (const transporter of transporters) {
    for (let i = 0; i < 3; i++) {
      const busModel = busModels[i % busModels.length];

      if (!busModel) continue;

      // Create a seat diagram for this bus
      const seatDiagram = await seatDiagramFactory(db).create({
        busDiagramModelId: busModel.defaultBusDiagramModelId,
        name: `Seat Diagram for Bus ${i + 1}`,
        maxCapacity: busModel.seatingCapacity,
        numFloors: busModel.numFloors,
        seatsPerFloor: [
          {
            rows: Math.ceil(busModel.seatingCapacity / 4),
            seatsPerRow: 4,
          },
        ],
        totalSeats: busModel.seatingCapacity,
        isFactoryDefault: false,
        active: true,
      });

      const transporterBuses = (await busFactory(db).create([
        {
          modelId: busModel.id,
          transporterId: transporter.id,
          seatDiagramId: seatDiagram.id,
          active: true,
        },
      ])) as Bus[];

      buses.push(...transporterBuses);
    }
  }

  console.log(`Seeded ${buses.length} buses`);
  return buses;
}

/**
 * Seeds drivers for transporters
 */
export async function seedDrivers(
  transporters: Transporter[],
  db: ReturnType<typeof getFactoryDb>,
): Promise<Driver[]> {
  const drivers: Driver[] = [];

  // Create drivers for each transporter
  for (const transporter of transporters) {
    for (let i = 0; i < 4; i++) {
      const transporterDrivers = (await driverFactory(db).create([
        {
          transporterId: transporter.id,
          busLineId: null, // Explicitly set to null to avoid auto-creation
          busId: null, // Explicitly set to null to avoid auto-creation
          active: true,
        },
      ])) as Driver[];

      drivers.push(...transporterDrivers);
    }
  }

  console.log(`Seeded ${drivers.length} drivers`);
  return drivers;
}
