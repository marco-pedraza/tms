import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '../../shared/types';
import { BusLine } from '../bus-lines/bus-lines.types';
import { Transporter } from '../transporters/transporters.types';

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

export enum DriverType {
  STANDARD = 'standard',
  SUBSTITUTE = 'substitute',
  TEMPORARY = 'temporary',
  TOURIST = 'tourist',
}

export enum DriverPosition {
  DRIVER = 'driver',
  SENIOR_DRIVER = 'senior_driver',
  AUXILIARY_DRIVER = 'auxiliary_driver',
  TOURIST_DRIVER = 'tourist_driver',
  PREMIUM_DRIVER = 'premium_driver',
}

/**
 * Base interface representing a driver entity
 */
export interface Driver {
  /** Unique identifier for the driver */
  id: number;

  /** Employee ID (Clave) */
  driverKey: string;

  /** Full name of the driver */
  fullName: string;

  /** Mexican tax ID (RFC) */
  rfc: string;

  /** CURP Mexican national ID */
  curp: string;

  /** Social security number (IMSS) */
  imss: string | null;

  /** Civil status (Estado Civil) */
  civilStatus: string | null;

  /** Number of dependents (Escolaridad) */
  dependents: number | null;

  /** Street address (Calle) */
  addressStreet: string | null;

  /** Neighborhood (Colonia) */
  addressNeighborhood: string | null;

  /** City (Ciudad) */
  addressCity: string | null;

  /** State (Estado) */
  addressState: string | null;

  /** Postal code (Código Postal) */
  postalCode: string | null;

  /** Phone number (Teléfono) */
  phoneNumber: string;

  /** Email address (E-Mail) */
  email: string;

  /** Type of operator (Tipo Operador) */
  driverType: DriverType;

  /** Position (Clave Puesto) */
  position: DriverPosition | null;

  /** Office code (Clave Oficina) */
  officeCode: string | null;

  /** Office location */
  officeLocation: string | null;

  /** Date of hiring (Fec. Ingreso) */
  hireDate: Date | string | null;

  /** Current status (Estado Actual) */
  status: DriverStatus;

  /** Status date (Fecha Estado) */
  statusDate: Date | string;

  /** Federal license (Licencia Federal) */
  federalLicense: string | null;

  /** Federal license expiry (Fecha Lic. Fed) */
  federalLicenseExpiry: Date | string | null;

  /** State license (Licencia Estatal) */
  stateLicense: string | null;

  /** State license expiry (Fecha Lic. Est) */
  stateLicenseExpiry: Date | string | null;

  /** Credit card info (Tarjeta Crédito) */
  creditCard: string | null;

  /** Credit card expiry (Fecha T. Crédito) */
  creditCardExpiry: Date | string | null;

  /** Company (Empresa Alterna) */
  company: string | null;

  /** The transporter this driver is associated with */
  transporterId: number | null;

  /** The bus line this driver is associated with */
  busLineId: number | null;

  /** The bus this driver is assigned to */
  busId: number | null;

  /** Whether the driver is currently active in the system */
  active: boolean;

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
   * Full name of the driver
   * Must have at least 1 non-whitespace character
   */
  fullName: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Mexican tax ID (RFC)
   * Must have at least 1 non-whitespace character
   */
  rfc: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * CURP Mexican national ID
   * Must have at least 1 non-whitespace character
   */
  curp: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Social security number (IMSS)
   */
  imss?: string;

  /**
   * Civil status (Estado Civil)
   */
  civilStatus?: string;

  /**
   * Number of dependents (Escolaridad)
   */
  dependents?: number;

  /**
   * Street address (Calle)
   */
  addressStreet?: string;

  /**
   * Neighborhood (Colonia)
   */
  addressNeighborhood?: string;

  /**
   * City (Ciudad)
   */
  addressCity?: string;

  /**
   * State (Estado)
   */
  addressState?: string;

  /**
   * Postal code (Código Postal)
   */
  postalCode?: string;

  /**
   * Phone number (Teléfono)
   * Must have at least 1 non-whitespace character
   */
  phoneNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Email address (E-Mail)
   * Must be a valid email format
   */
  email: string;

  /**
   * Type of operator (Tipo Operador)
   * Must have at least 1 non-whitespace character
   */
  driverType: DriverType;

  /**
   * Department (Departamento)
   */
  department?: string;

  /**
   * Position (Clave Puesto)
   */
  position?: DriverPosition;

  /**
   * Office code (Clave Oficina)
   */
  officeCode?: string;

  /**
   * Office location
   */
  officeLocation?: string;

  /**
   * Date of hiring (Fec. Ingreso)
   */
  hireDate?: Date;

  /**
   * Current status (Estado Actual)
   */
  status: DriverStatus;

  /**
   * Status date (Fecha Estado)
   */
  statusDate: Date;

  /**
   * Federal license (Licencia Federal)
   */
  federalLicense?: string;

  /**
   * Federal license expiry (Fecha Lic. Fed)
   */
  federalLicenseExpiry?: Date;

  /**
   * State license (Licencia Estatal)
   */
  stateLicense?: string;

  /**
   * State license expiry (Fecha Lic. Est)
   */
  stateLicenseExpiry?: Date;

  /**
   * Credit card info (Tarjeta Crédito)
   */
  creditCard?: string;

  /**
   * Credit card expiry (Fecha T. Crédito)
   */
  creditCardExpiry?: Date;

  /**
   * Company (Empresa Alterna)
   */
  company?: string;

  /**
   * Whether the driver is active
   * @default true
   */
  active?: boolean;

  /**
   * The transporter this driver is associated with
   */
  transporterId?: number | null;

  /**
   * The bus line this driver is associated with
   */
  busLineId?: number | null;

  /**
   * The bus this driver is assigned to
   */
  busId?: number | null;
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
   * Full name of the driver
   * Must have at least 1 non-whitespace character
   */
  fullName?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Mexican tax ID (RFC)
   * Must have at least 1 non-whitespace character
   */
  rfc?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * CURP Mexican national ID
   * Must have at least 1 non-whitespace character
   */
  curp?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Social security number (IMSS)
   */
  imss?: string;

  /**
   * Civil status (Estado Civil)
   */
  civilStatus?: string;

  /**
   * Number of dependents (Escolaridad)
   */
  dependents?: number;

  /**
   * Street address (Calle)
   */
  addressStreet?: string;

  /**
   * Neighborhood (Colonia)
   */
  addressNeighborhood?: string;

  /**
   * City (Ciudad)
   */
  addressCity?: string;

  /**
   * State (Estado)
   */
  addressState?: string;

  /**
   * Postal code (Código Postal)
   */
  postalCode?: string;

  /**
   * Phone number (Teléfono)
   * Must have at least 1 non-whitespace character
   */
  phoneNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Email address (E-Mail)
   * Must be a valid email format
   */
  email?: string;

  /**
   * Type of operator (Tipo Operador)
   * Must have at least 1 non-whitespace character
   */
  driverType?: DriverType;

  /**
   * Department (Departamento)
   */
  department?: string;

  /**
   * Position (Clave Puesto)
   */
  position?: DriverPosition;

  /**
   * Office code (Clave Oficina)
   */
  officeCode?: string;

  /**
   * Office location
   */
  officeLocation?: string;

  /**
   * Date of hiring (Fec. Ingreso)
   */
  hireDate?: Date;

  /**
   * Current status (Estado Actual)
   */
  status?: DriverStatus;

  /**
   * Status date (Fecha Estado)
   */
  statusDate?: Date;

  /**
   * Federal license (Licencia Federal)
   */
  federalLicense?: string;

  /**
   * Federal license expiry (Fecha Lic. Fed)
   */
  federalLicenseExpiry?: Date;

  /**
   * State license (Licencia Estatal)
   */
  stateLicense?: string;

  /**
   * State license expiry (Fecha Lic. Est)
   */
  stateLicenseExpiry?: Date;

  /**
   * Credit card info (Tarjeta Crédito)
   */
  creditCard?: string;

  /**
   * Credit card expiry (Fecha T. Crédito)
   */
  creditCardExpiry?: Date;

  /**
   * Company (Empresa Alterna)
   */
  company?: string;

  /**
   * Whether the driver is active
   */
  active?: boolean;

  /**
   * The transporter this driver is associated with
   */
  transporterId?: number | null;

  /**
   * The bus line this driver is associated with
   */
  busLineId?: number | null;

  /**
   * The bus this driver is assigned to
   */
  busId?: number | null;
}

export interface DriverWithRelations extends Driver {
  transporter: Transporter;
  busLine: BusLine;
}

export type ListDriversQueryParams = ListQueryParams<Driver>;
export type ListDriversResult = ListQueryResult<Driver>;

export type PaginatedListDriversQueryParams = PaginatedListQueryParams<Driver>;
export type PaginatedListDriversResult =
  PaginatedListQueryResult<DriverWithRelations>;

export type ListStatusesResult = ListQueryResult<DriverStatus>;
