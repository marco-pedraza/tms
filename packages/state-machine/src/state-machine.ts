import { ValidationError, InvalidStateTransitionError } from './errors';

/**
 * Type for state transition validation
 */
export interface StateTransition<T extends string> {
  from: T;
  to: T[];
}

/**
 * Creates a base state machine that can be reused by different repositories
 *
 * @param transitions - Array of allowed state transitions
 * @param entityName - Name of the entity (used for error messages)
 * @returns Object with state machine operations
 */
export function createBaseStateMachine<T extends string>(
  transitions: StateTransition<T>[],
  entityName = 'Entity',
) {
  /**
   * Validates a state transition
   * @param fromState - Current state
   * @param toState - Desired state
   * @throws {InvalidStateTransitionError} If the transition is invalid
   */
  const validateTransition = (fromState: T, toState: T): void => {
    const transition = transitions.find((t) => t.from === fromState);

    if (!transition) {
      throw new ValidationError(`Unknown current status: ${fromState}`);
    }

    if (!transition.to.includes(toState)) {
      throw new InvalidStateTransitionError(fromState, toState, entityName);
    }
  };

  /**
   * Validates an initial state
   * @param initialState - The initial state to validate
   * @param allowedInitialStates - Array of allowed initial states
   * @throws {ValidationError} If the initial state is invalid
   */
  const validateInitialState = (
    initialState: T,
    allowedInitialStates: T[],
  ): void => {
    if (!allowedInitialStates.includes(initialState)) {
      throw new ValidationError(
        `Invalid initial state for new ${entityName.toLowerCase()}: ${initialState}. ` +
          `Allowed initial states: ${allowedInitialStates.join(', ')}`,
      );
    }
  };

  /**
   * Gets all possible next states from the current state
   * @param currentState - The current state
   * @returns Array of allowed next states
   */
  const getPossibleNextStates = (currentState: T): T[] => {
    const transition = transitions.find((t) => t.from === currentState);
    return transition ? transition.to : [];
  };

  /**
   * Checks if a transition is possible
   * @param fromState - Current state
   * @param toState - Desired state
   * @returns boolean indicating if the transition is valid
   */
  const canTransition = (fromState: T, toState: T): boolean => {
    try {
      validateTransition(fromState, toState);
      return true;
    } catch {
      return false;
    }
  };

  return {
    validateTransition,
    validateInitialState,
    getPossibleNextStates,
    canTransition,
  };
}
