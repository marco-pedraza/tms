import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import { Bus } from '@/inventory/fleet/buses/buses.types';
import { MedicalCheckResult } from '@/inventory/fleet/drivers/medical-checks/medical-checks.types';
import { BusLine } from '@/inventory/operators/bus-lines/bus-lines.types';
import { Transporter } from '@/inventory/operators/transporters/transporters.types';

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
