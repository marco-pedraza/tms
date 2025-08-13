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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull, relations } from 'drizzle-orm';
import { busModels } from '@/inventory/fleet/bus-models/bus-models.schema';
import { seatDiagrams } from '@/inventory/fleet/seat-diagrams/seat-diagrams.schema';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';
import { busLines } from '@/inventory/operators/bus-lines/bus-lines.schema';
import { transporters } from '@/inventory/operators/transporters/transporters.schema';
import { BusStatus } from './buses.types';

/**
 * Database table for buses
 */

// TODO: change numeric to reals and Dates to timestamps
export const buses = pgTable(
  'buses',
  {
    // Basic information
    id: serial('id').primaryKey(),
    economicNumber: text('economic_number').notNull(), // Economic number (Número Económico)
    registrationNumber: text('registration_number').notNull(), // License plate (Placas)
    licensePlateType: text('license_plate_type').notNull(), // Type of license plate (Tipo Placas)
    licensePlateNumber: text('license_plate_number').notNull(), // Plate number (Número de Placa)
    circulationCard: text('circulation_card'), // Circulation card (Tarj. Circulación)
    availableForTurismOnly: boolean('available_for_turism_only').default(false), // Available for turism service type only (Disponible solo para turismo)
    status: text('status').notNull().default(BusStatus.ACTIVE), // Operational status
    transporterId: integer('transporter_id').references(() => transporters.id), // Transporter (Empresa)
    alternateTransporterId: integer('alternate_transporter_id').references(
      () => transporters.id,
    ), // Alternate transporter (Empresa Alterna)
    busLineId: integer('bus_line_id').references(() => busLines.id), // Bus line (Línea)
    baseId: integer('base_id').references(() => nodes.id), // Base/station (Base)
    // Model and manufacturer information
    purchaseDate: date('purchase_date').notNull(), // Date of purchase (Ingreso)
    expirationDate: date('expiration_date').notNull(), // Date of purchase (Ingreso)
    erpClientNumber: text('erp_client_number'), // ERP client number (No. Cliente ERP)
    modelId: integer('model_id')
      .notNull()
      .references(() => busModels.id), // Model (Modelo)
    // Technical information
    vehicleId: text('vehicle_id'), // Vehicle ID (Conf. Vehicular)
    serialNumber: text('serial_number').notNull(), // Serial number (Número de Serie)
    engineNumber: text('engine_number'), // Engine number (Número de Motor)
    chassisNumber: text('chassis_number').notNull(), // Chassis number (Número de Chasis)
    grossVehicleWeight: numeric('gross_vehicle_weight').notNull(), // Gross vehicle weight (Peso Bruto Vehicular)
    sctPermit: text('sct_permit'), // SCT permit (Permiso SCT)
    // Maintenance information
    currentKilometer: numeric('current_kilometer'), // Current kilometer (Kilometraje Actual)
    gpsId: text('gps_id'), // GPS identifier
    lastMaintenanceDate: date('last_maintenance_date'), // Last maintenance date
    nextMaintenanceDate: date('next_maintenance_date'), // Next scheduled maintenance date
    // Seat diagram
    seatDiagramId: integer('seat_diagram_id')
      .notNull()
      .references(() => seatDiagrams.id),
    // System information
    active: boolean('active').notNull().default(true), // System status
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index().on(table.status),
    index().on(table.modelId),
    index().on(table.seatDiagramId),
    index().on(table.busLineId),
    index().on(table.baseId),
    index().on(table.economicNumber),
    index().on(table.engineNumber),
    index().on(table.nextMaintenanceDate),
    index().on(table.serialNumber),
    index().on(table.deletedAt),
    uniqueIndex().on(table.registrationNumber).where(isNull(table.deletedAt)),
    uniqueIndex().on(table.licensePlateNumber).where(isNull(table.deletedAt)),
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
  transporter: one(transporters, {
    fields: [buses.transporterId],
    references: [transporters.id],
  }),
  alternateTransporter: one(transporters, {
    fields: [buses.alternateTransporterId],
    references: [transporters.id],
  }),
  busLine: one(busLines, {
    fields: [buses.busLineId],
    references: [busLines.id],
  }),
  base: one(nodes, {
    fields: [buses.baseId],
    references: [nodes.id],
  }),
}));
