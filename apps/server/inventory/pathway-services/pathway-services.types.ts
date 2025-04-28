import { MinLen, MatchesRegexp, Min, Max } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

// TODO: Implementar estas interfaces en un módulo compartido para ser reutilizadas
// entre terminales, servicios de ruta y otros componentes que requieran coordenadas
// y horarios de operación.

/**
 * Represents a time slot for operating hours
 */
export interface TimeSlot {
  /** Opening time in format HH:MM (24-hour format) */
  open: string;

  /** Closing time in format HH:MM (24-hour format) */
  close: string;
}

/**
 * Represents operating hours for a provider
 */
export interface OperatingHours {
  /** Monday opening hours */
  monday?: TimeSlot[];

  /** Tuesday opening hours */
  tuesday?: TimeSlot[];

  /** Wednesday opening hours */
  wednesday?: TimeSlot[];

  /** Thursday opening hours */
  thursday?: TimeSlot[];

  /** Friday opening hours */
  friday?: TimeSlot[];

  /** Saturday opening hours */
  saturday?: TimeSlot[];

  /** Sunday opening hours */
  sunday?: TimeSlot[];
}

/**
 * Base interface representing a pathway service entity
 */
export interface PathwayService {
  /** Unique identifier for the pathway service */
  id: number;

  /** Name of the service */
  name: string;

  /** Type of service (washing, diesel_charge, medical_service, etc.) */
  serviceType: string;

  /** Latitude coordinate of the service location */
  latitude: number;

  /** Longitude coordinate of the service location */
  longitude: number;

  /** Grouping of similar services */
  category: string;

  /** Name of service provider */
  provider: string;

  /** Provider's schedule hours */
  providerScheduleHours: OperatingHours;

  /** Typical duration of the service in minutes */
  duration: number;

  /** Timestamp when the pathway service was created */
  createdAt: Date;

  /** Timestamp when the pathway service was last updated */
  updatedAt: Date;
}

/**
 * Interface for creating a new pathway service
 */
export interface CreatePathwayServicePayload {
  /**
   * Name of the service
   * Must have at least 1 character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Type of service (washing, diesel_charge, medical_service, etc.)
   * Must have at least 1 character
   */
  serviceType: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Latitude coordinate of the service location
   * Must be a number between -90 and 90
   */
  latitude: number & Min<-90> & Max<90>;

  /**
   * Longitude coordinate of the service location
   * Must be a number between -180 and 180
   */
  longitude: number & Min<-180> & Max<180>;

  /**
   * Grouping of similar services
   * Must have at least 1 character
   */
  category: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Name of service provider
   * Must have at least 1 character
   */
  provider: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Provider's schedule hours
   */
  providerScheduleHours: OperatingHours;

  /**
   * Typical duration of the service in minutes
   * Must be a positive number
   */
  duration: number & Min<1>;
}

/**
 * Interface for updating a pathway service
 */
export interface UpdatePathwayServicePayload {
  /**
   * Name of the service
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Type of service (washing, diesel_charge, medical_service, etc.)
   */
  serviceType?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Latitude coordinate of the service location
   * Must be a number between -90 and 90
   */
  latitude?: number & Min<-90> & Max<90>;

  /**
   * Longitude coordinate of the service location
   * Must be a number between -180 and 180
   */
  longitude?: number & Min<-180> & Max<180>;

  /**
   * Grouping of similar services
   */
  category?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Name of service provider
   */
  provider?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Provider's schedule hours
   */
  providerScheduleHours?: OperatingHours;

  /**
   * Typical duration of the service in minutes
   */
  duration?: number & Min<1>;
}

/**
 * Interface for listing pathway services
 */
export interface PathwayServices {
  pathwayServices: PathwayService[];
}

/**
 * Paginated response type for the list pathway services endpoint
 */
export type PaginatedPathwayServices = PaginatedResult<PathwayService>;
