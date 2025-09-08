import { fakerES_MX as faker } from '@faker-js/faker';
import type { BusModel } from '@/inventory/fleet/bus-models/bus-models.types';
import { EngineType } from '@/inventory/fleet/bus-models/bus-models.types';
import type { Bus } from '@/inventory/fleet/buses/buses.types';
import {
  BusLicensePlateType,
  BusStatus,
} from '@/inventory/fleet/buses/buses.types';
import { createBusWithSeatDiagram } from '@/inventory/fleet/buses/buses.use-cases';
import type { Driver } from '@/inventory/fleet/drivers/drivers.types';
import type { DriverMedicalCheck } from '@/inventory/fleet/drivers/medical-checks/medical-checks.types';
import type { DriverTimeOff } from '@/inventory/fleet/drivers/time-offs/time-offs.types';
import type { City } from '@/inventory/locations/cities/cities.types';
import type { BusLine } from '@/inventory/operators/bus-lines/bus-lines.types';
import type { ServiceType } from '@/inventory/operators/service-types/service-types.types';
import { ServiceTypeCategory } from '@/inventory/operators/service-types/service-types.types';
import type { Transporter } from '@/inventory/operators/transporters/transporters.types';
import {
  busLineFactory,
  busModelFactory,
  driverFactory,
  medicalCheckFactory,
  serviceTypeFactory,
  timeOffFactory,
  transporterFactory,
} from '@/factories';
import { getFactoryDb } from '@/factories/factory-utils';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
} from './client-data.utils';

/**
 * Seeds service types for transportation
 * @param db - Factory database instance
 * @param clientCode - Optional client code for client-specific data
 */
export async function seedServiceTypes(
  db: ReturnType<typeof getFactoryDb>,
  clientCode?: string,
): Promise<ServiceType[]> {
  if (clientCode && hasClientData(clientCode, CLIENT_DATA_FILES.BUS_LINES)) {
    const busLinesData = (await loadClientData(
      clientCode,
      CLIENT_DATA_FILES.BUS_LINES,
    )) as {
      dependencies: {
        service_types: {
          name: string;
          code: string;
          category: string;
          description?: string;
        }[];
      };
    };

    if (busLinesData.dependencies?.service_types?.length > 0) {
      /**
       * Helper function to validate ServiceTypeCategory enum values
       * Handles both uppercase and lowercase variations
       */
      const isValidServiceTypeCategory = (
        category: unknown,
      ): category is ServiceTypeCategory => {
        if (typeof category !== 'string') return false;

        // Normalize to lowercase for comparison
        const normalizedCategory = category.toLowerCase();
        return Object.values(ServiceTypeCategory)
          .map((v) => v.toLowerCase())
          .includes(normalizedCategory);
      };

      /**
       * Helper function to normalize category to proper enum value
       */
      const normalizeServiceTypeCategory = (
        category: string,
      ): ServiceTypeCategory => {
        const normalizedCategory = category.toLowerCase();
        // Map normalized values to enum values
        switch (normalizedCategory) {
          case 'regular':
            return ServiceTypeCategory.REGULAR;
          case 'express':
            return ServiceTypeCategory.EXPRESS;
          case 'luxury':
            return ServiceTypeCategory.LUXURY;
          case 'economic':
            return ServiceTypeCategory.ECONOMIC;
          default:
            return ServiceTypeCategory.REGULAR;
        }
      };

      const serviceTypesFromClient =
        busLinesData.dependencies.service_types.map((st) => {
          // Validate enum value and provide safe fallback
          let validCategory: ServiceTypeCategory;
          if (isValidServiceTypeCategory(st.category)) {
            validCategory = normalizeServiceTypeCategory(st.category);
          } else {
            console.warn(
              `   ⚠️ Invalid service type category '${st.category as string}' for service type '${st.name}'. Using fallback: REGULAR`,
            );
            validCategory = ServiceTypeCategory.REGULAR;
          }

          return {
            name: st.name,
            code: st.code,
            category: validCategory,
            description: st.description ?? `${st.name} service`,
            active: true,
            deletedAt: null,
          };
        });

      const serviceTypes = (await serviceTypeFactory(db).create(
        serviceTypesFromClient,
      )) as unknown as ServiceType[];

      console.log(
        `Seeded ${serviceTypes.length} service types (client: ${clientCode.toUpperCase()})`,
      );
      return serviceTypes;
    }
  }

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
  ])) as unknown as ServiceType[];

  console.log(`Seeded ${serviceTypes.length} service types`);
  return serviceTypes;
}

/**
 * Seeds transporters (bus companies)
 * @param cities - Array of cities for headquarter locations
 * @param db - Factory database instance
 * @param clientCode - Optional client code for client-specific data
 */
export async function seedTransporters(
  cities: City[],
  db: ReturnType<typeof getFactoryDb>,
  clientCode?: string,
): Promise<Transporter[]> {
  if (clientCode && hasClientData(clientCode, CLIENT_DATA_FILES.TRANSPORTERS)) {
    const transportersData = (await loadClientData(
      clientCode,
      CLIENT_DATA_FILES.TRANSPORTERS,
    )) as {
      transporters: {
        name: string;
        code: string;
        legalName?: string;
        address?: string;
        description?: string;
        website?: string;
        email?: string;
        phone?: string;
        headquarterCityName?: string;
        logoUrl?: string;
        contactInfo?: string;
        licenseNumber?: string;
        active?: boolean;
      }[];
    };

    if (transportersData.transporters?.length > 0) {
      const transportersFromClient = transportersData.transporters.map(
        (transporter) => {
          // Find headquarter city by name if provided
          let headquarterCityId = cities[0]?.id; // Default to first city
          if (transporter.headquarterCityName) {
            // Function to normalize text (remove accents, convert to lowercase)
            const normalizeText = (text: string) =>
              text
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics/accents

            const searchName = normalizeText(transporter.headquarterCityName);

            // Try exact match first
            let headquarterCity = cities.find(
              (city) => normalizeText(city.name) === searchName,
            );

            // If not found, try partial match
            if (!headquarterCity) {
              headquarterCity = cities.find((city) =>
                normalizeText(city.name).includes(searchName),
              );
            }

            // If still not found, try reverse partial match (search term contains city name)
            if (!headquarterCity) {
              headquarterCity = cities.find((city) =>
                searchName.includes(normalizeText(city.name)),
              );
            }

            if (headquarterCity) {
              headquarterCityId = headquarterCity.id;
            }
          }

          return {
            name: transporter.name,
            code: transporter.code,
            legalName: transporter.legalName,
            address: transporter.address,
            description:
              transporter.description ??
              `${transporter.name} transportation service`,
            website: transporter.website,
            email: transporter.email,
            phone: transporter.phone,
            headquarterCityId,
            logoUrl: transporter.logoUrl,
            contactInfo: transporter.contactInfo,
            licenseNumber: transporter.licenseNumber,
            active: transporter.active ?? true,
          };
        },
      );

      const transporters = (await transporterFactory(db).create(
        transportersFromClient,
      )) as unknown as Transporter[];

      console.log(
        `Seeded ${transporters.length} transporters (client: ${clientCode.toUpperCase()})`,
      );
      return transporters;
    }
  }

  // Get major cities for headquarter locations
  const majorCities = cities.slice(0, 6); // Use first 6 cities

  const transporters = (await transporterFactory(db).create([
    {
      name: 'ADO',
      code: 'ADO',
      description: 'Autobuses de Oriente - Premium bus service',
      website: 'https://www.ado.com.mx',
      email: 'contacto@ado.com.mx',
      phone: '+525557844652',
      headquarterCityId: majorCities[0]?.id,
      active: true,
    },
    {
      name: 'ETN',
      code: 'ETN',
      description: 'Enlace de Transporte Nacional - Luxury bus service',
      website: 'https://www.etn.com.mx',
      email: 'info@etn.com.mx',
      phone: '+525557290707',
      headquarterCityId: majorCities[1]?.id,
      active: true,
    },
    {
      name: 'Primera Plus',
      code: 'PLUS',
      description: 'First class intercity bus service',
      website: 'https://www.primeraplus.com.mx',
      email: 'contacto@primeraplus.com.mx',
      phone: '+525551414300',
      headquarterCityId: majorCities[2]?.id,
      active: true,
    },
    {
      name: 'Omnibus de Mexico',
      code: 'ODM',
      description: 'Long distance bus transportation',
      website: 'https://www.omnibus.com.mx',
      email: 'servicio@omnibus.com.mx',
      phone: '+525555678999',
      headquarterCityId: majorCities[3]?.id,
      active: true,
    },
    {
      name: 'Flecha Amarilla',
      code: 'FLAM',
      description: 'Regional bus transportation service',
      website: 'https://www.flechaamarilla.com.mx',
      email: 'info@flechaamarilla.com.mx',
      phone: '+525555181560',
      headquarterCityId: majorCities[4]?.id,
      active: true,
    },
  ])) as unknown as Transporter[];

  console.log(`Seeded ${transporters.length} transporters`);
  return transporters;
}

/**
 * Seeds bus lines operated by transporters
 * @param transporters - Array of transporters
 * @param serviceTypes - Array of service types
 * @param db - Factory database instance
 * @param clientCode - Optional client code for client-specific data
 */
export async function seedBusLines(
  transporters: Transporter[],
  serviceTypes: ServiceType[],
  db: ReturnType<typeof getFactoryDb>,
  clientCode?: string,
): Promise<BusLine[]> {
  if (clientCode && hasClientData(clientCode, CLIENT_DATA_FILES.BUS_LINES)) {
    const busLinesData = (await loadClientData(
      clientCode,
      CLIENT_DATA_FILES.BUS_LINES,
    )) as {
      bus_lines: {
        name: string;
        code: string;
        transporterCode: string;
        serviceTypeCode: string;
        description?: string;
        active?: boolean;
      }[];
    };

    if (busLinesData.bus_lines?.length > 0) {
      const busLinesFromClient = busLinesData.bus_lines
        .map((busLine) => {
          // Find the transporter by code
          const transporter = transporters.find(
            (t) => t.code === busLine.transporterCode,
          );
          if (!transporter) return null;

          // Find the service type by code
          const serviceType = serviceTypes.find(
            (st) => st.code === busLine.serviceTypeCode,
          );
          if (!serviceType) return null;

          return {
            name: busLine.name,
            code: busLine.code,
            transporterId: transporter.id,
            serviceTypeId: serviceType.id,
            description: busLine.description,
            active: busLine.active ?? true,
            deletedAt: null,
          };
        })
        .filter((busLine) => busLine !== null);

      if (busLinesFromClient.length > 0) {
        const busLines = (await busLineFactory(db).create(
          busLinesFromClient,
        )) as unknown as BusLine[];

        console.log(
          `Seeded ${busLines.length} bus lines (client: ${clientCode.toUpperCase()})`,
        );
        return busLines;
      }
    }
  }

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
      ])) as unknown as BusLine[];

      busLines.push(...lines);
    }
  }

  console.log(`Seeded ${busLines.length} bus lines`);
  return busLines;
}

/**
 * Seeds bus models using the provided bus diagram models
 */
export async function seedBusModels(
  db: ReturnType<typeof getFactoryDb>,
  busDiagramModels: {
    id: number;
    name: string;
    totalSeats: number;
    numFloors: number;
  }[],
): Promise<BusModel[]> {
  // Map bus diagram models to bus models with appropriate manufacturers
  const busModelConfigs = [
    {
      manufacturer: 'Volvo',
      model: '9700',
      year: 2023,
      diagramIndex: 0, // 40-seat compact bus
      amenities: ['Wi-Fi', 'Air Conditioning', 'Reclining Seats'],
      engineType: 'DIESEL',
    },
    {
      manufacturer: 'Mercedes Benz',
      model: 'O500',
      year: 2022,
      diagramIndex: 1, // 50-seat standard bus
      amenities: ['Wi-Fi', 'Air Conditioning', 'USB Charging'],
      engineType: 'DIESEL',
    },
    {
      manufacturer: 'Scania',
      model: 'Irizar i6',
      year: 2023,
      diagramIndex: 2, // 60-seat double decker bus
      amenities: [
        'Wi-Fi',
        'Air Conditioning',
        'Entertainment System',
        'Premium Seating',
      ],
      engineType: 'HYBRID',
    },
  ];

  const busModelPayloads = busModelConfigs.map((config) => {
    const diagramModel = busDiagramModels[config.diagramIndex];
    if (!diagramModel) {
      throw new Error(
        `Bus diagram model at index ${config.diagramIndex} not found`,
      );
    }

    return {
      defaultBusDiagramModelId: diagramModel.id,
      manufacturer: config.manufacturer,
      model: config.model,
      year: config.year,
      seatingCapacity: diagramModel.totalSeats,
      numFloors: diagramModel.numFloors,
      maxCapacity: diagramModel.totalSeats + 2, // Add capacity for staff
      amenities: config.amenities,
      engineType: config.engineType as EngineType,
      trunkCapacity: 500, // Standard trunk capacity
      fuelEfficiency: config.engineType === 'HYBRID' ? 12 : 8, // Better efficiency for hybrid
      active: true,
    };
  });

  const busModels = (await busModelFactory(db).create(
    busModelPayloads,
  )) as unknown as BusModel[];

  console.log(`Seeded ${busModels.length} bus models with diagram models`);

  // Log the mapping between bus models and diagram models
  busModels.forEach((busModel, index) => {
    const diagramModel =
      busDiagramModels[busModelConfigs[index]?.diagramIndex ?? 0];
    console.log(
      `   ${busModel.manufacturer} ${busModel.model}: ${busModel.seatingCapacity} seats (${diagramModel?.name})`,
    );
  });

  return busModels;
}

/**
 * Seeds buses for transporters using bus diagram models for functional seat diagrams
 */
export async function seedBuses(
  transporters: Transporter[],
  busModels: BusModel[],
): Promise<Bus[]> {
  const buses: Bus[] = [];

  console.log('🚌 Creating buses with functional seat diagrams...');

  // Create buses for each transporter
  for (const transporter of transporters) {
    console.log(`   🏢 Creating buses for ${transporter.name}...`);

    for (let i = 0; i < 3; i++) {
      const busModel = busModels[i % busModels.length];

      if (!busModel) continue;

      try {
        // Generate unique identifiers
        const registrationNumber = `${transporter.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}-${busModel.manufacturer.substring(0, 2).toUpperCase()}`;
        const economicNumber = String(i + 1).padStart(4, '0');
        const licensePlateNumber =
          faker.string.alpha({ length: 3, casing: 'upper' }) +
          '-' +
          faker.string.numeric({ length: 3 });
        const serialNumber = faker.string.alphanumeric({
          length: 17,
          casing: 'upper',
        });
        const chassisNumber = faker.string.alphanumeric({
          length: 17,
          casing: 'upper',
        });

        // Generate dates
        const purchaseDate = faker.date.past({ years: 5 });
        const expirationDate = faker.date.future({
          years: 10,
          refDate: purchaseDate,
        });

        // Use the bus use case to create bus with functional seat diagram
        const bus = await createBusWithSeatDiagram({
          // Basic information
          economicNumber,
          registrationNumber,
          licensePlateType: BusLicensePlateType.NATIONAL,
          licensePlateNumber,
          circulationCard: faker.string.alphanumeric({
            length: 10,
            casing: 'upper',
          }),
          availableForTourismOnly: false,
          status: BusStatus.ACTIVE,
          transporterId: transporter.id,
          // Model and dates
          purchaseDate: purchaseDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          expirationDate: expirationDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          modelId: busModel.id,
          // Technical information
          serialNumber,
          chassisNumber,
          grossVehicleWeight: faker.number.int({ min: 15000, max: 25000 }), // Weight in kg
          // System information
          seatDiagramId: 0, // Will be set by the use case
          active: true,
        });

        buses.push(bus);

        console.log(
          `      ✅ Created ${busModel.manufacturer} ${busModel.model} (${busModel.seatingCapacity} seats, ${busModel.numFloors} floor${busModel.numFloors > 1 ? 's' : ''})`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.warn(
          `      ⚠️ Failed to create bus ${i + 1} for ${transporter.name}: ${errorMessage}`,
        );
      }
    }
  }

  console.log(`✅ Seeded ${buses.length} buses with functional seat diagrams`);

  // Log summary by bus model
  const busModelCounts = buses.reduce(
    (acc, bus) => {
      const model = busModels.find((bm) => bm.id === bus.modelId);
      const key = model ? `${model.manufacturer} ${model.model}` : 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  Object.entries(busModelCounts).forEach(([modelName, count]) => {
    console.log(`   📊 ${modelName}: ${count as number} buses`);
  });

  return buses;
}

/**
 * Seeds drivers for transporters
 */
export async function seedDrivers(
  transporters: Transporter[],
  busLines: BusLine[],
  db: ReturnType<typeof getFactoryDb>,
): Promise<Driver[]> {
  const drivers: Driver[] = [];

  // Create drivers for each transporter
  for (const transporter of transporters) {
    // Get bus lines for this transporter
    const transporterBusLines = busLines.filter(
      (busLine) => busLine.transporterId === transporter.id,
    );

    if (transporterBusLines.length === 0) {
      continue;
    }

    for (let i = 0; i < 4; i++) {
      // Use a bus line from this transporter (cycling through available ones)
      const busLine = transporterBusLines[i % transporterBusLines.length];

      const transporterDrivers = (await driverFactory(db).create([
        {
          transporterId: transporter.id,
          busLineId: busLine.id, // Use existing bus line
          active: true,
        },
      ])) as unknown as Driver[];

      drivers.push(...transporterDrivers);
    }
  }

  console.log(`Seeded ${drivers.length} drivers`);
  return drivers;
}

/**
 * Seeds time-offs for some drivers (not all drivers get time-offs)
 */
export async function seedDriverTimeOffs(
  drivers: Driver[],
  db: ReturnType<typeof getFactoryDb>,
): Promise<DriverTimeOff[]> {
  const timeOffs: DriverTimeOff[] = [];

  // Only create time-offs for some drivers (approximately 60-70%)
  const driversWithTimeOffs = drivers.filter(() =>
    faker.helpers.maybe(() => true, { probability: 0.65 }),
  );

  for (const driver of driversWithTimeOffs) {
    // Create 1 to 3 time-offs per driver
    const numTimeOffs = faker.number.int({ min: 1, max: 2 });

    for (let i = 0; i < numTimeOffs; i++) {
      const newTimeOffs = (await timeOffFactory(db).create([
        {
          driverId: driver.id,
          // The factory will generate appropriate dates and other fields
        },
      ])) as unknown as DriverTimeOff[];

      timeOffs.push(...newTimeOffs);
    }
  }

  console.log(
    `Seeded ${timeOffs.length} time-offs for ${driversWithTimeOffs.length} drivers`,
  );
  return timeOffs;
}
/**
 * Seeds medical checks for drivers (0 to 3 medical checks per driver)
 */
export async function seedDriverMedicalChecks(
  drivers: Driver[],
  db: ReturnType<typeof getFactoryDb>,
): Promise<DriverMedicalCheck[]> {
  const medicalChecks: DriverMedicalCheck[] = [];

  // Only create medical checks for some drivers (approximately 60-70%)
  const driversWithMedicalChecks = drivers.filter(() =>
    faker.helpers.maybe(() => true, { probability: 0.65 }),
  );

  for (const driver of driversWithMedicalChecks) {
    // Each driver can have 0 to 3 medical checks
    const numMedicalChecks = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < numMedicalChecks; i++) {
      const newMedicalChecks = (await medicalCheckFactory(db).create([
        {
          driverId: driver.id,
          // The factory will generate appropriate dates and other fields
        },
      ])) as unknown as DriverMedicalCheck[];

      medicalChecks.push(...newMedicalChecks);
    }
  }

  console.log(
    `Seeded ${medicalChecks.length} medical checks for ${driversWithMedicalChecks.length} drivers`,
  );
  return medicalChecks;
}
