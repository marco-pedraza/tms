import { fakerES_MX as faker } from '@faker-js/faker';
import { defineFactory } from '@praha/drizzle-factory';
import { schema } from '../../db';
import { busLineFactory } from './bus-line.factory';
import { busFactory } from './buses.factory';
import { extractTablesFromSchema, generateId } from './factory-utils';
import { transporterFactory } from './transporters.factory';

export const driverFactory = defineFactory({
  schema: extractTablesFromSchema(schema),
  table: 'drivers',
  resolver: ({ sequence, use }) => {
    const id = generateId(sequence);
    const civilStatuses = ['single', 'married', 'divorced', 'widowed'];
    const driverTypes = ['standard', 'substitute', 'temporary', 'tourist'];
    const positions = [
      'driver',
      'senior_driver',
      'auxiliary_driver',
      'tourist_driver',
      'premium_driver',
    ];
    const driverStatuses = [
      'active',
      'inactive',
      'suspended',
      'on_leave',
      'in_training',
    ];
    const officeCodes = ['CDMX', 'GDL', 'MTY', 'CUN', 'PUE', 'OAX'];
    const companies = ['Main Company', 'Secondary', 'Subsidiary', 'Contractor'];

    return {
      id,
      driverKey: `DRV${String(id).padStart(3, '0')}`,
      fullName: faker.person.fullName(),
      rfc:
        faker.string.alpha(4).toUpperCase() +
        faker.string.numeric(6) +
        faker.string.alpha(3).toUpperCase(),
      curp:
        faker.string.alpha(4).toUpperCase() +
        faker.string.numeric(6) +
        faker.string.alpha(6).toUpperCase() +
        faker.string.numeric(2),
      imss: faker.helpers.maybe(() => faker.string.numeric(11), {
        probability: 0.7,
      }),
      civilStatus: faker.helpers.arrayElement(civilStatuses),
      dependents: faker.number.int({ min: 0, max: 4 }),
      addressStreet: faker.location.street(),
      addressNeighborhood: faker.location.county(),
      addressCity: faker.location.city(),
      addressState: faker.location.state(),
      postalCode: faker.location.zipCode('#####'),
      phoneNumber: faker.phone.number({ style: 'international' }),
      email: faker.internet.email(),
      driverType: faker.helpers.arrayElement(driverTypes),
      position: faker.helpers.arrayElement(positions),
      officeCode: faker.helpers.arrayElement(officeCodes),
      officeLocation: faker.helpers.arrayElement([
        'Mexico City HQ',
        'Regional Office',
        'Terminal',
        'Operations Center',
      ]),
      hireDate: faker.date.past({ years: 7 }),
      status: faker.helpers.arrayElement(driverStatuses),
      statusDate: faker.date.recent({ days: 365 }),
      federalLicense: `FED${faker.string.alphanumeric(5).toUpperCase()}`,
      federalLicenseExpiry: faker.date.future({ years: 3 }),
      stateLicense: `ST${faker.string.alphanumeric(5).toUpperCase()}`,
      stateLicenseExpiry: faker.date.future({ years: 2 }),
      ...(() => {
        const hasCreditCard = faker.helpers.maybe(() => true, {
          probability: 0.75,
        });
        return hasCreditCard
          ? {
              creditCard: `CC${faker.string.numeric(5)}`,
              creditCardExpiry: faker.date.future({ years: 2 }),
            }
          : {
              creditCard: null,
              creditCardExpiry: null,
            };
      })(),
      company: faker.helpers.arrayElement(companies),
      transporterId: faker.helpers.maybe(
        () => () =>
          use(transporterFactory)
            .create()
            .then((transporter) => transporter.id),
        { probability: 0.5 },
      ),
      busLineId: faker.helpers.maybe(
        () => () =>
          use(busLineFactory)
            .create({ active: true, deletedAt: null })
            .then((busLine) => busLine.id),
        { probability: 0.33 },
      ),
      busId: faker.helpers.maybe(
        () => () =>
          use(busFactory)
            .create()
            .then((bus) => bus.id),
        { probability: 0.25 },
      ),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
});
