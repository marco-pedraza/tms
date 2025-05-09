import { Min } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

/**
 * Base interface representing a gate entity
 */
export interface Gate {
  /** Unique identifier for the gate */
  id: number;

  /** ID of the terminal this gate belongs to */
  terminalId: number;

  /** Whether the gate is currently active in the system */
  active: boolean;

  /** Timestamp when the gate record was created */
  createdAt: Date | null;

  /** Timestamp when the gate record was last updated */
  updatedAt: Date | null;
}

/**
 * Input for creating a new gate
 */
export interface CreateGatePayload {
  /**
   * The ID of the terminal this gate belongs to
   * Must be a positive number
   */
  terminalId: number & Min<1>;

  /**
   * Whether the gate is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a gate
 */
export interface UpdateGatePayload {
  /**
   * The ID of the terminal this gate belongs to
   * Must be a positive number
   */
  terminalId?: number & Min<1>;

  /**
   * Whether the gate is active
   */
  active?: boolean;
}

/**
 * Response type for the list gates endpoint (non-paginated)
 */
export interface Gates {
  /** List of gates */
  gates: Gate[];
}

export interface GatesQueryOptions {
  orderBy?: { field: keyof Gate; direction: 'asc' | 'desc' }[];
  filters?: Partial<Gate>;
}

/**
 * Paginated response type for the list gates endpoint
 */
export type PaginatedGates = PaginatedResult<Gate>;

export interface PaginationParamsGates
  extends PaginationParams,
    GatesQueryOptions {}
