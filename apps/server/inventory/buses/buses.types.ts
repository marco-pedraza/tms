import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

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
  /** Unique identifier for the bus */
  id: number;

  /** Registration number / license plate */
  registrationNumber: string;

  /** ID of the bus model */
  modelId: number;

  /** ID of the seat diagram */
  seatDiagramId: number;

  /** Bus type code */
  typeCode?: number | null;

  /** Brand code */
  brandCode?: string | null;

  /** Model code */
  modelCode?: string | null;

  /** Maximum passenger capacity */
  maxCapacity?: number | null;

  /** Date of purchase */
  purchaseDate?: string | null;

  /** Economic number */
  economicNumber?: string | null;

  /** Type of license plate */
  licensePlateType?: string | null;

  /** Circulation card */
  circulationCard?: string | null;

  /** Year of manufacture */
  year?: number | null;

  /** SCT permit */
  sctPermit?: string | null;

  /** Vehicle ID */
  vehicleId?: string | null;

  /** Gross vehicle weight */
  grossVehicleWeight?: number | null;

  /** Engine number */
  engineNumber?: string | null;

  /** Serial number */
  serialNumber?: string | null;

  /** Chassis number */
  chassisNumber?: string | null;

  /** SAP key */
  sapKey?: string | null;

  /** Base/station code */
  baseCode?: string | null;

  /** ERP client number */
  erpClientNumber?: string | null;

  /** Cost center */
  costCenter?: string | null;

  /** Fuel efficiency (km/liter) */
  fuelEfficiency?: number | null;

  /** Alternate company */
  alternateCompany?: string | null;

  /** Service type */
  serviceType?: string | null;

  /** Commercial tourism module flag */
  commercialTourism?: boolean | null;

  /** Available for use flag */
  available?: boolean | null;

  /** Tourism usage flag */
  tourism?: boolean | null;

  /** Current operational status */
  status: BusStatus;

  /** Last maintenance date */
  lastMaintenanceDate?: string | null;

  /** Next scheduled maintenance date */
  nextMaintenanceDate?: string | null;

  /** GPS identifier */
  gpsId?: string | null;

  /** Whether the bus is active */
  active: boolean;

  /** Timestamp when the bus was created */
  createdAt: Date;

  /** Timestamp when the bus was last updated */
  updatedAt: Date;
}

/**
 * Input for creating a new bus
 */
export interface CreateBusPayload {
  /**
   * Registration number / license plate
   * Must have at least 1 character
   */
  registrationNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * ID of the bus model
   * Must be a positive number
   */
  modelId: number;

  /**
   * ID of the seat layout model
   * Must be a positive number
   */
  seatLayoutModelId?: number;

  /**
   * Bus type code
   */
  typeCode?: number;

  /**
   * Brand code
   */
  brandCode?: string;

  /**
   * Model code
   */
  modelCode?: string;

  /**
   * Maximum passenger capacity
   */
  maxCapacity?: number;

  /**
   * Date of purchase
   */
  purchaseDate?: Date | null;

  /**
   * Economic number
   */
  economicNumber?: string;

  /**
   * Type of license plate
   */
  licensePlateType?: string;

  /**
   * Circulation card
   */
  circulationCard?: string;

  /**
   * Year of manufacture
   */
  year?: number;

  /**
   * SCT permit
   */
  sctPermit?: string;

  /**
   * Vehicle ID
   */
  vehicleId?: string;

  /**
   * Gross vehicle weight
   */
  grossVehicleWeight?: number;

  /**
   * Engine number
   */
  engineNumber?: string;

  /**
   * Serial number
   */
  serialNumber?: string;

  /**
   * Chassis number
   */
  chassisNumber?: string;

  /**
   * SAP key
   */
  sapKey?: string;

  /**
   * Base/station code
   */
  baseCode?: string;

  /**
   * ERP client number
   */
  erpClientNumber?: string;

  /**
   * Cost center
   */
  costCenter?: string;

  /**
   * Fuel efficiency (km/liter)
   */
  fuelEfficiency?: number;

  /**
   * Alternate company
   */
  alternateCompany?: string;

  /**
   * Service type
   */
  serviceType?: string;

  /**
   * Commercial tourism module flag
   * @default false
   */
  commercialTourism?: boolean;

  /**
   * Available for use flag
   * @default true
   */
  available?: boolean;

  /**
   * Tourism usage flag
   * @default false
   */
  tourism?: boolean;

  /**
   * Current operational status
   * @default BusStatus.ACTIVE
   */
  status?: BusStatus;

  /**
   * Last maintenance date
   */
  lastMaintenanceDate?: Date;

  /**
   * Next scheduled maintenance date
   */
  nextMaintenanceDate?: Date;

  /**
   * GPS identifier
   */
  gpsId?: string;

  /**
   * Whether the bus is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a bus
 */
export interface UpdateBusPayload {
  /**
   * Registration number / license plate
   * Must have at least 1 character
   */
  registrationNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * ID of the bus model
   * Must be a positive number
   */
  modelId?: number;

  /**
   * Bus type code
   */
  typeCode?: number;

  /**
   * Brand code
   */
  brandCode?: string;

  /**
   * Model code
   */
  modelCode?: string;

  /**
   * Maximum passenger capacity
   */
  maxCapacity?: number;

  /**
   * Date of purchase
   */
  purchaseDate?: Date;

  /**
   * Economic number
   */
  economicNumber?: string;

  /**
   * Type of license plate
   */
  licensePlateType?: string;

  /**
   * Circulation card
   */
  circulationCard?: string;

  /**
   * Year of manufacture
   */
  year?: number;

  /**
   * SCT permit
   */
  sctPermit?: string;

  /**
   * Vehicle ID
   */
  vehicleId?: string;

  /**
   * Gross vehicle weight
   */
  grossVehicleWeight?: number;

  /**
   * Engine number
   */
  engineNumber?: string;

  /**
   * Serial number
   */
  serialNumber?: string;

  /**
   * Chassis number
   */
  chassisNumber?: string;

  /**
   * SAP key
   */
  sapKey?: string;

  /**
   * Base/station code
   */
  baseCode?: string;

  /**
   * ERP client number
   */
  erpClientNumber?: string;

  /**
   * Cost center
   */
  costCenter?: string;

  /**
   * Fuel efficiency (km/liter)
   */
  fuelEfficiency?: number;

  /**
   * Alternate company
   */
  alternateCompany?: string;

  /**
   * Service type
   */
  serviceType?: string;

  /**
   * Commercial tourism module flag
   */
  commercialTourism?: boolean;

  /**
   * Available for use flag
   */
  available?: boolean;

  /**
   * Tourism usage flag
   */
  tourism?: boolean;

  /**
   * Current operational status
   */
  status?: BusStatus;

  /**
   * Last maintenance date
   */
  lastMaintenanceDate?: Date;

  /**
   * Next scheduled maintenance date
   */
  nextMaintenanceDate?: Date;

  /**
   * GPS identifier
   */
  gpsId?: string;

  /**
   * Whether the bus is active
   */
  active?: boolean;
}

/**
 * Response containing a list of buses
 */
export interface Buses {
  /** List of buses */
  buses: Bus[];
}

/**
 * Paginated list of buses
 */
export type PaginatedBuses = PaginatedResult<Bus>;

/**
 * Query options for buses listing
 */
export interface BusesQueryOptions {
  orderBy?: { field: keyof Bus; direction: 'asc' | 'desc' }[];
  filters?: Partial<Bus>;
}

/**
 * Paginated parameters with query options for buses
 */
export interface PaginationParamsBuses
  extends PaginationParams,
    BusesQueryOptions {}
