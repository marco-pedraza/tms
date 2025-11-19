import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import { BaseDomainEntity } from '@/shared/domain/base-entity';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import { Bus } from '@/inventory/fleet/buses/buses.types';
import type { MedicalCheckRepository } from '@/inventory/fleet/drivers/medical-checks/medical-checks.repository';
import type {
  CreateDriverMedicalCheckPayload,
  DriverMedicalCheck,
  MedicalCheckResult,
} from '@/inventory/fleet/drivers/medical-checks/medical-checks.types';
import { Node } from '@/inventory/locations/nodes/nodes.types';
import type { BusLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import { BusLine } from '@/inventory/operators/bus-lines/bus-lines.types';
import { Transporter } from '@/inventory/operators/transporters/transporters.types';
import type {
  CreateDriverTimeOffPayload,
  DriverTimeOff,
  UpdateDriverTimeOffPayload,
} from './time-offs/time-offs.types';
import type { DriverRepository } from './drivers.repository';
import type { TimeOffRepository } from './time-offs/time-offs.repository';

/**
 * Enum for driver status states
 */
export enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
  IN_TRAINING = 'in_training',
  PROBATION = 'probation',
}

/**
 * Base interface representing a driver entity
 */
export interface Driver {
  /** Unique identifier for the driver */
  id: number;

  /** Employee ID (Clave) */
  driverKey: string;

  /** Payroll key (Clave Nómina) */
  payrollKey: string;

  /** First name of the driver */
  firstName: string;

  /** Last name of the driver */
  lastName: string;

  /** Address */
  address: string | null;

  /** Phone number */
  phone: string | null;

  /** Email address */
  email: string | null;

  /** Date of hiring */
  hireDate: Date | string | null;

  /** Current status */
  status: DriverStatus;

  /** Status date */
  statusDate: Date | string | null;

  /** License */
  license: string;

  /** License expiry */
  licenseExpiry: Date | string | null;

  /** The bus line this driver is associated with */
  busLineId: number;

  /** Base node (Base/station) */
  baseId: number | null;

  /** Emergency contact name */
  emergencyContactName: string | null;

  /** Emergency contact phone */
  emergencyContactPhone: string | null;

  /** Emergency contact relationship */
  emergencyContactRelationship: string | null;

  /** Timestamp when the driver record was created */
  createdAt: Date | string | null;

  /** Timestamp when the driver record was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new driver
 */
export interface CreateDriverPayload {
  /**
   * Employee ID (Clave)
   * Must have at least 1 non-whitespace character
   */
  driverKey: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Payroll key (Clave Nómina)
   */
  payrollKey: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * First name of the driver
   * Must have at least 1 non-whitespace character
   */
  firstName: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Last name of the driver
   * Must have at least 1 non-whitespace character
   */
  lastName: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Address
   */
  address?: string | null;

  /**
   * Phone number
   */
  phone?: string | null;

  /**
   * Email address
   */
  email?: string | null;

  /**
   * Date of hiring
   * Must be in YYYY-MM-DD format if provided or date object
   */
  hireDate?:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date
    | null;

  /**
   * Current status
   */
  status: DriverStatus;

  /**
   * Status date
   * Must be in YYYY-MM-DD format if provided or date object
   */
  statusDate?:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date
    | null;

  /**
   * License
   */
  license: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * License expiry
   * Must be in YYYY-MM-DD format if provided or date object
   */
  licenseExpiry:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date;

  /**
   * The bus line this driver is associated with
   * Must be a positive number
   */
  busLineId: number & Min<1>;

  /**
   * Base node (Base/station)
   * Must be a positive number if provided
   */
  baseId?: (number & Min<1>) | null;

  /**
   * Emergency contact name
   */
  emergencyContactName?: string | null;

  /**
   * Emergency contact phone
   */
  emergencyContactPhone?: string | null;

  /**
   * Emergency contact relationship
   */
  emergencyContactRelationship?: string | null;
}

/**
 * Input for updating a driver
 */
export interface UpdateDriverPayload {
  /**
   * Employee ID (Clave)
   * Must have at least 1 non-whitespace character
   */
  driverKey?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Payroll key (Clave Nómina)
   */
  payrollKey?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * First name of the driver
   * Must have at least 1 non-whitespace character
   */
  firstName?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Last name of the driver
   * Must have at least 1 non-whitespace character
   */
  lastName?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Address
   */
  address?: string | null;

  /**
   * Phone number
   */
  phone?: string | null;

  /**
   * Email address
   */
  email?: string | null;

  /**
   * Date of hiring
   * Must be in YYYY-MM-DD format if provided or date object
   */
  hireDate?:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date
    | null;

  /**
   * Current status
   */
  status?: DriverStatus;

  /**
   * Status date
   * Must be in YYYY-MM-DD format if provided or date object
   */
  statusDate?:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date
    | null;

  /**
   * License
   */
  license?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * License expiry
   * Must be in YYYY-MM-DD format if provided or date object
   */
  licenseExpiry?:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | Date;

  /**
   * The bus line this driver is associated with
   * Must be a positive number (if provided)
   */
  busLineId?: number & Min<1>;

  /**
   * Base node (Base/station)
   * Must be a positive number if provided
   */
  baseId?: (number & Min<1>) | null;

  /**
   * Emergency contact name
   */
  emergencyContactName?: string | null;

  /**
   * Emergency contact phone
   */
  emergencyContactPhone?: string | null;

  /**
   * Emergency contact relationship
   */
  emergencyContactRelationship?: string | null;
}

export interface DriverWithRelations extends Driver {
  transporter: Transporter;
  busLine: BusLine;
  base?: Node | null;
  assignedBus?: Bus | null;
}

export type ListDriversQueryParams = ListQueryParams<Driver>;
export type ListDriversResult = ListQueryResult<Driver>;

export type PaginatedListDriversQueryParams = PaginatedListQueryParams<Driver>;
export type PaginatedListDriversResult =
  PaginatedListQueryResult<DriverWithRelations>;

/**
 * Query parameters for getting drivers availability with filtering and ordering support
 */
export interface ListDriversAvailabilityQueryParams
  extends ListQueryParams<Driver> {
  /**
   * Start date for availability check
   * Must be in YYYY-MM-DD format. If not provided, current date will be used.
   */
  startDate?:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | null;

  /**
   * End date for availability check
   * Must be in YYYY-MM-DD format. If not provided, current date will be used.
   */
  endDate?:
    | (string &
        MatchesRegexp<'^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'>)
    | null;
}

/**
 * Details about availability checks for a driver
 */
export interface DriverAvailabilityDetails {
  /** Whether the driver has a valid status (active, probation, in_training) */
  hasValidStatus: boolean;
  /** Current driver status */
  currentStatus: DriverStatus;
  /** Whether the license is valid until the end date */
  hasValidLicense: boolean;
  /** License expiry date */
  licenseExpiry: Date | string | null;
  /** Whether the driver has a valid medical check */
  hasValidMedicalCheck: boolean;
  /** Whether the driver is not in a time-off period */
  hasNoTimeOffConflict: boolean;
  /** Details about the medical check */
  medicalCheckDetails: {
    /** Whether the driver has any medical check */
    hasMedicalCheck: boolean;
    /** Result of the most recent medical check */
    latestResult: MedicalCheckResult | null;
    /** Date of the most recent medical check */
    latestCheckDate: Date | string | null;
    /** Date when the next medical check is due */
    nextCheckDate: Date | string | null;
    /** Whether the medical check is still current (not expired) */
    isCurrent: boolean;
  };
}

/**
 * Driver availability information
 */
export interface DriverAvailability extends Driver {
  /** Availability status for the requested period */
  isAvailable: boolean;
  /** Detailed information about availability checks */
  availabilityDetails: DriverAvailabilityDetails;
}

/**
 * Response type for drivers availability
 */
export interface ListDriversAvailabilityResult
  extends ListQueryResult<DriverAvailability> {
  /** Start date used for availability check */
  startDate: string;
  /** End date used for availability check */
  endDate: string;
}

// =============================================================================
// DRIVER ENTITY DEPENDENCIES AND INTERFACE
// =============================================================================

/**
 * Dependencies required by the driver entity
 * Uses Pick to select only the methods needed from each repository
 * The application service will provide transaction-aware repositories when needed
 */
export interface DriverEntityDependencies {
  driverRepository: Pick<
    DriverRepository,
    'create' | 'update' | 'findOne' | 'checkUniqueness'
  >;
  busLineRepository: Pick<BusLineRepository, 'findOneWithRelations'>;
  medicalCheckRepository: Pick<
    MedicalCheckRepository,
    'findAll' | 'create' | 'findOne'
  >;
  timeOffRepository: Pick<
    TimeOffRepository,
    'hasOverlappingTimeOffs' | 'create' | 'findOne' | 'update' | 'delete'
  >;
  // Note: psychomotorCheckRepository will be added in Phase 2
}

/**
 * Driver entity with domain behavior
 * Extends all driver properties for direct access (e.g., instance.firstName instead of instance.data.firstName)
 */
export interface DriverEntity
  extends Omit<Driver, 'id'>,
    BaseDomainEntity<DriverEntity, UpdateDriverPayload> {
  /**
   * Extracts plain driver data from the entity
   * @returns Plain driver object without entity methods
   */
  toDriver: () => Driver;

  /**
   * Checks if the driver is available for a given date range
   * @param startDate - Start date for availability check (YYYY-MM-DD format)
   * @param endDate - End date for availability check (YYYY-MM-DD format)
   * @returns Availability status with detailed information
   * @throws {FieldValidationError} If driver is not persisted
   */
  checkAvailability: (
    startDate: string,
    endDate: string,
  ) => Promise<{ isAvailable: boolean; details: DriverAvailabilityDetails }>;

  /**
   * Adds a medical check to this driver
   * @param payload - Medical check data (driverId set automatically)
   * @returns The created medical check
   * @throws {FieldValidationError} If validation fails
   * @throws {ValidationError} If driver is not persisted
   */
  addMedicalCheck: (
    payload: CreateDriverMedicalCheckPayload,
  ) => Promise<DriverMedicalCheck>;

  /**
   * Adds a time-off to this driver
   * @param payload - Time-off data (driverId set automatically)
   * @returns The created time-off
   * @throws {FieldValidationError} If validation fails
   * @throws {ValidationError} If driver is not persisted
   */
  addTimeOff: (payload: CreateDriverTimeOffPayload) => Promise<DriverTimeOff>;

  /**
   * Updates a time-off for this driver
   * @param timeOffId - The ID of the time-off to update
   * @param payload - Time-off update data
   * @returns The updated time-off
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If time-off not found or doesn't belong to this driver
   * @throws {ValidationError} If driver is not persisted
   */
  updateTimeOff: (
    timeOffId: number,
    payload: UpdateDriverTimeOffPayload,
  ) => Promise<DriverTimeOff>;

  /**
   * Removes a time-off from this driver
   * @param timeOffId - The ID of the time-off to remove
   * @returns The deleted time-off
   * @throws {NotFoundError} If time-off not found or doesn't belong to this driver
   * @throws {ValidationError} If driver is not persisted
   */
  removeTimeOff: (timeOffId: number) => Promise<DriverTimeOff>;
}

/**
 * Dependencies required by the driver application service
 * Note: This type is primarily for documentation. The application service
 * will inject concrete repository instances and factories.
 */
export interface DriverApplicationServiceDependencies {
  driverRepository: DriverRepository; // Concrete repository instance
  busLineRepository: BusLineRepository; // Concrete repository instance
  medicalCheckRepository: MedicalCheckRepository; // Concrete repository instance
  timeOffRepository: TimeOffRepository; // Concrete repository instance
  driverEntityFactory: {
    create: (payload: CreateDriverPayload) => DriverEntity;
    fromData: (data: Driver) => DriverEntity;
    findOne: (id: number) => Promise<DriverEntity>;
  };
  // Note: psychomotorCheckRepository will be added in Phase 2
}
