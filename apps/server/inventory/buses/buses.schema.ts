import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { busModels } from '../bus-models/bus-models.schema';
import { seatDiagrams } from '../seat-diagrams/seat-diagrams.schema';
import { BusStatus } from './buses.types';

/**
 * Database table for buses
 */

// TODO: change numeric to reals and Dates to timestamps
export const buses = pgTable(
  'buses',
  {
    id: serial('id').primaryKey(),
    registrationNumber: text('registration_number').notNull().unique(), // License plate (Placas)
    modelId: integer('model_id')
      .notNull()
      .references(() => busModels.id),
    seatDiagramId: integer('seat_diagram_id')
      .notNull()
      .references(() => seatDiagrams.id),
    typeCode: integer('type_code'), // Bus type code (Tipo)
    brandCode: text('brand_code'), // Brand code (Marca)
    modelCode: text('model_code'), // Model code (Modelo)
    maxCapacity: integer('max_capacity'), // Maximum capacity (Cupo Máximo)
    purchaseDate: date('purchase_date'), // Date of purchase (Ingreso)
    economicNumber: text('economic_number'), // Economic number (Número Económico)
    licensePlateType: text('license_plate_type'), // Type of license plate (Tipo Placas)
    circulationCard: text('circulation_card'), // Circulation card (Tarj. Circulación)
    year: integer('year'), // Year of manufacture (Año)
    sctPermit: text('sct_permit'), // SCT permit (Permiso SCT)
    vehicleId: text('vehicle_id'), // Vehicle ID (Conf. Vehicular)
    grossVehicleWeight: numeric('gross_vehicle_weight'), // Gross vehicle weight (Peso Bruto Vehicular)
    engineNumber: text('engine_number'), // Engine number (Número de Motor)
    serialNumber: text('serial_number'), // Serial number (Número de Serie)
    chassisNumber: text('chassis_number'), // Chassis number (Número de Chasis)
    sapKey: text('sap_key'), // SAP key (Clave Sap)
    baseCode: text('base_code'), // Base/station code (Base)
    erpClientNumber: text('erp_client_number'), // ERP client number (No. Cliente ERP)
    costCenter: text('cost_center'), // Cost center (Centro de Costo Alt)
    fuelEfficiency: numeric('fuel_efficiency'), // Fuel efficiency (Rendimiento por Litro)
    alternateCompany: text('alternate_company'), // Alternate company (Empresa Alterna)
    serviceType: text('service_type'), // Service type (Tipo de Servicio)
    commercialTourism: boolean('commercial_tourism').default(false), // Commercial tourism module
    available: boolean('available').default(true), // Available (Disponible)
    tourism: boolean('tourism').default(false), // Tourism usage (Turismo)
    status: text('status').notNull().default(BusStatus.ACTIVE), // Current operational status
    lastMaintenanceDate: date('last_maintenance_date'), // Last maintenance date
    nextMaintenanceDate: date('next_maintenance_date'), // Next scheduled maintenance date
    gpsId: text('gps_id'), // GPS identifier
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index().on(table.modelId),
    index().on(table.seatDiagramId),
    index().on(table.economicNumber),
    index().on(table.engineNumber),
    index().on(table.serialNumber),
    index().on(table.status),
    index().on(table.nextMaintenanceDate),
  ],
);

/**
 * Relations for buses
 */
export const busesRelations = relations(buses, ({ one }) => ({
  model: one(busModels, {
    fields: [buses.modelId],
    references: [busModels.id],
  }),
  seatDiagram: one(seatDiagrams, {
    fields: [buses.seatDiagramId],
    references: [seatDiagrams.id],
  }),
}));
