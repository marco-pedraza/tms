import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import type { BusModel } from '@/inventory/fleet/bus-models/bus-models.types';
import type { Chromatic } from '@/inventory/fleet/chromatics/chromatics.types';
import type { Driver } from '@/inventory/fleet/drivers/drivers.types';
import type { SeatDiagram } from '@/inventory/fleet/seat-diagrams/seat-diagrams.types';
import type { Technology } from '@/inventory/fleet/technologies/technologies.types';
import type { Node } from '@/inventory/locations/nodes/nodes.types';
import type { BusLine } from '@/inventory/operators/bus-lines/bus-lines.types';
import type { Transporter } from '@/inventory/operators/transporters/transporters.types';

/**
 * Enum for bus operational status
 */
export enum BusStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  RESERVED = 'RESERVED',
  IN_TRANSIT = 'IN_TRANSIT',
  RETIRED = 'RETIRED',
}

export enum BusLicensePlateType {
  NATIONAL = 'NATIONAL',
  INTERNATIONAL = 'INTERNATIONAL',
  TOURISM = 'TOURISM',
}

export interface Bus {
  // Basic information
  id: number;
  economicNumber: string;
  registrationNumber: string;
  licensePlateType: BusLicensePlateType;
  licensePlateNumber: string;
  circulationCard: string | null;
  availableForTourismOnly: boolean;
  status: BusStatus;
  transporterId: number | null;
  alternateTransporterId: number | null;
  busLineId: number | null;
  baseId: number | null;
  // Model and manufacturer information
  purchaseDate: Date;
  expirationDate: Date;
  erpClientNumber: string | null;
  modelId: number;
  // Technical information
  vehicleId: string | null;
  serialNumber: string;
  engineNumber: string | null;
  chassisNumber: string;
  grossVehicleWeight: number;
  sctPermit: string | null;
  // Maintenance information
  currentKilometer: number | null;
  gpsId: string | null;
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  // Seat Diagram
  seatDiagramId: number;
  // Chromatic
  chromaticId: number | null;
  // System information
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

export interface ExtendedBusData extends Bus {
  manufacturer: string;
  busModel: string;
  year: number;
  seatingCapacity: number;
  numFloors: number;
  engineType?: string | null;
  technologies: Technology[];
  busCrew: BusCrewWithRelations[];
  chromatic?: Chromatic | null;
}

/**
 * Represents the association between a bus and its crew members
 */
export interface BusCrew {
  /** Unique identifier for the bus crew assignment */
  id: number;
  /** The ID of the bus */
  busId: number;
  /** The ID of the driver assigned to this bus */
  driverId: number;
}

/**
 * Bus crew with optional related entities
 */
export interface BusCrewWithRelations extends BusCrew {
  /** The related bus entity */
  bus?: Bus;
  /** The related driver entity */
  driver?: Driver;
}

/**
 * Extended bus interface with all relationships
 */
export interface BusWithRelations extends Bus {
  busModel: BusModel;
  seatDiagram: SeatDiagram;
  transporter?: Transporter | null;
  alternateTransporter?: Transporter | null;
  busLine?: BusLine | null;
  base?: Node | null;
  technologies: Technology[];
  chromatic?: Chromatic | null;
  busCrew: BusCrewWithRelations[];
}

export interface CreateBusPayload {
  economicNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  registrationNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  licensePlateType: BusLicensePlateType;
  licensePlateNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  circulationCard: (string & MinLen<1> & MatchesRegexp<'.*\\S.*'>) | null;
  availableForTourismOnly: boolean;
  status: BusStatus;
  transporterId?: number | null;
  alternateTransporterId?: number | null;
  busLineId?: number | null;
  baseId?: number | null;
  // Model and manufacturer information
  purchaseDate: Date | string;
  expirationDate: Date | string;
  erpClientNumber?: string | null;
  modelId: number;
  // Technical information
  vehicleId?: string | null;
  serialNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  engineNumber?: string | null;
  chassisNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  grossVehicleWeight: number;
  sctPermit?: string | null;
  // Maintenance information
  currentKilometer?: number | null;
  gpsId?: string | null;
  lastMaintenanceDate?: Date | string | null;
  nextMaintenanceDate?: Date | string | null;
  // Seat Diagram
  seatDiagramId: number;
  // Chromatic
  chromaticId?: number | null;
  // System information
  active: boolean;
}

export interface UpdateBusPayload {
  economicNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  registrationNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  licensePlateType?: BusLicensePlateType;
  licensePlateNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  circulationCard?: (string & MinLen<1> & MatchesRegexp<'.*\\S.*'>) | null;
  availableForTourismOnly?: boolean;
  status?: BusStatus;
  transporterId?: number | null;
  alternateTransporterId?: number | null;
  busLineId?: number | null;
  baseId?: number | null;
  // Model and manufacturer information
  purchaseDate?: Date | string | null;
  expirationDate?: Date | string | null;
  erpClientNumber?: string | null;
  modelId?: number;
  // Technical information
  vehicleId?: string | null;
  serialNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  engineNumber?: string | null;
  chassisNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  grossVehicleWeight?: number;
  sctPermit?: string | null;
  // Maintenance information
  currentKilometer?: number | null;
  gpsId?: string | null;
  lastMaintenanceDate?: Date | string | null;
  nextMaintenanceDate?: Date | string | null;
  // Seat Diagram
  seatDiagramId?: number;
  // Chromatic
  chromaticId?: number | null;
  // System information
  active?: boolean;
}

/**
 * Payload for assigning multiple technologies to a bus
 */
export interface AssignTechnologiesToBusPayload {
  /** Array of technology IDs */
  technologyIds: number[];
}

/**
 * Payload for assigning drivers to a bus crew
 */
export interface AssignDriverToBusCrewPayload {
  driverIds: number[];
}

export type ListBusesQueryParams = ListQueryParams<Bus>;
export type ListBusesResult = ListQueryResult<Bus>;

export type PaginatedListBusesQueryParams = PaginatedListQueryParams<Bus>;
export type PaginatedListBusesResult = PaginatedListQueryResult<Bus>;

export type ListBusStatusesResult = ListQueryResult<BusStatus>;
