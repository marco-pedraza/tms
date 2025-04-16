// API types
import { MinLen, MatchesRegexp } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

/**
 * Enum for driver status states
 */
export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  IN_TRAINING = 'IN_TRAINING',
  PROBATION = 'PROBATION',
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
  driverType: string;

  /** Position (Clave Puesto) */
  position: string | null;

  /** Office code (Clave Oficina) */
  officeCode: string | null;

  /** Office location */
  officeLocation: string | null;

  /** Date of hiring (Fec. Ingreso) */
  hireDate: Date | null;

  /** Current status (Estado Actual) */
  status: DriverStatus;

  /** Status date (Fecha Estado) */
  statusDate: Date;

  /** Federal license (Licencia Federal) */
  federalLicense: string | null;

  /** Federal license expiry (Fecha Lic. Fed) */
  federalLicenseExpiry: Date | null;

  /** State license (Licencia Estatal) */
  stateLicense: string | null;

  /** State license expiry (Fecha Lic. Est) */
  stateLicenseExpiry: Date | null;

  /** Credit card info (Tarjeta Crédito) */
  creditCard: string | null;

  /** Credit card expiry (Fecha T. Crédito) */
  creditCardExpiry: Date | null;

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
  createdAt: Date | null;

  /** Timestamp when the driver record was last updated */
  updatedAt: Date | null;
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
  driverType: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Department (Departamento)
   */
  department?: string;

  /**
   * Position (Clave Puesto)
   */
  position?: string;

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
  transporterId?: number;

  /**
   * The bus line this driver is associated with
   */
  busLineId?: number;

  /**
   * The bus this driver is assigned to
   */
  busId?: number;
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
  driverType?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Department (Departamento)
   */
  department?: string;

  /**
   * Position (Clave Puesto)
   */
  position?: string;

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
  transporterId?: number;

  /**
   * The bus line this driver is associated with
   */
  busLineId?: number;

  /**
   * The bus this driver is assigned to
   */
  busId?: number;
}

/**
 * Response containing a list of drivers
 */
export interface Drivers {
  /** List of drivers */
  drivers: Driver[];
}

/**
 * Paginated list of drivers
 */
export type PaginatedDrivers = PaginatedResult<Driver>;

/**
 * Response containing list of possible driver statuses
 */
export interface PossibleDriverStatuses {
  /** List of possible next statuses */
  statuses: string[];
}
