import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import type { BusModel } from '@/inventory/fleet/bus-models/bus-models.types';
import type { SeatDiagram } from '@/inventory/fleet/seat-diagrams/seat-diagrams.types';
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

/**
 * Base interface representing a bus entity
 */
export interface Bus {
  // Basic information
  id: number;
  economicNumber: string;
  registrationNumber: string;
  licensePlateType: string;
  licensePlateNumber: string;
  circulationCard: string | null;
  availableForTurismOnly: boolean;
  status: BusStatus;
  transporterId?: number | null;
  alternateTransporterId?: number | null;
  busLineId?: number | null;
  baseId?: number | null;
  // Model and manufacturer information
  purchaseDate: Date;
  expirationDate: Date;
  erpClientNumber?: string | null;
  modelId: number;
  // Technical information
  vehicleId?: string | null;
  serialNumber: string;
  engineNumber?: string | null;
  chassisNumber: string;
  grossVehicleWeight: number;
  sctPermit?: string | null;
  // Maintenance information
  currentKilometer?: number | null;
  gpsId?: string | null;
  lastMaintenanceDate?: Date | null;
  nextMaintenanceDate?: Date | null;
  // Seat Diagram
  seatDiagramId: number;
  // System information
  active: boolean;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  deletedAt?: Date | string | null;
}

/**
 * Extended bus interface with all relationships
 */
export interface BusWithRelations extends Bus {
  model: BusModel;
  seatDiagram: SeatDiagram;
  transporter?: Transporter | null;
  alternateTransporter?: Transporter | null;
  busLine?: BusLine | null;
  base?: Node | null;
}

export interface CreateBusPayload {
  economicNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  registrationNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  licensePlateType: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  licensePlateNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  circulationCard: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  availableForTurismOnly: boolean;
  status: BusStatus;
  transporterId?: number | null;
  alternateTransporterId?: number | null;
  busLineId?: number | null;
  baseId?: number | null;
  // Model and manufacturer information
  purchaseDate: Date;
  expirationDate: Date;
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
  lastMaintenanceDate?: Date | null;
  nextMaintenanceDate?: Date | null;
  // Seat Diagram
  seatDiagramId: number;
  // System information
  active: boolean;
}

export interface UpdateBusPayload {
  economicNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  registrationNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  licensePlateType?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  licensePlateNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  circulationCard?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;
  availableForTurismOnly?: boolean;
  status?: BusStatus;
  transporterId?: number | null;
  alternateTransporterId?: number | null;
  busLineId?: number | null;
  baseId?: number | null;
  // Model and manufacturer information
  purchaseDate?: Date;
  expirationDate?: Date;
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
  lastMaintenanceDate?: Date | null;
  nextMaintenanceDate?: Date | null;
  // Seat Diagram
  seatDiagramId?: number;
  // System information
  active?: boolean;
}

export type ListBusesQueryParams = ListQueryParams<Bus>;
export type ListBusesResult = ListQueryResult<Bus>;

export type PaginatedListBusesQueryParams = PaginatedListQueryParams<Bus>;
export type PaginatedListBusesResult = PaginatedListQueryResult<Bus>;

export type ListBusStatusesResult = ListQueryResult<BusStatus>;
