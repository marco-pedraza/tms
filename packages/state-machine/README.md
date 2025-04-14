# State Machine

A lightweight TypeScript state machine implementation for managing entity status transitions.

## Features

- Define allowed transitions between states
- Validate state transitions
- Get possible next states from current state
- Check if a transition is valid
- Validate initial states

## Installation

This package is internal to the project and is installed automatically with the main application.

## Usage

### Basic Usage

```typescript
import { createBaseStateMachine, StateTransition } from '@repo/state-machine';

// Define your states as an enum
enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Define allowed transitions
const STATUS_TRANSITIONS: StateTransition<OrderStatus>[] = [
  { from: OrderStatus.DRAFT, to: [OrderStatus.PENDING, OrderStatus.CANCELLED] },
  {
    from: OrderStatus.PENDING,
    to: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  },
  { from: OrderStatus.COMPLETED, to: [] }, // Terminal state
  { from: OrderStatus.CANCELLED, to: [] }, // Terminal state
];

// Create a state machine
const stateMachine = createBaseStateMachine<OrderStatus>(
  STATUS_TRANSITIONS,
  'Order', // Entity name for error messages
);

// Use the state machine
try {
  // This will succeed
  stateMachine.validateTransition(OrderStatus.DRAFT, OrderStatus.PENDING);

  // This will throw an error
  stateMachine.validateTransition(OrderStatus.DRAFT, OrderStatus.COMPLETED);
} catch (error) {
  console.error(error.message);
}

// Get possible next states
const nextStates = stateMachine.getPossibleNextStates(OrderStatus.PENDING);
// Returns [OrderStatus.COMPLETED, OrderStatus.CANCELLED]

// Check if a transition is valid
const isValid = stateMachine.canTransition(
  OrderStatus.DRAFT,
  OrderStatus.PENDING,
);
// Returns true
```

### Integration with Repository Pattern

```typescript
import { createBaseRepository } from '@repo/base-repo';
import { createBaseStateMachine, StateTransition } from '@repo/state-machine';

// Define your states and transitions
enum EntityStatus /* ... */ {}
const STATUS_TRANSITIONS: StateTransition<EntityStatus>[] = [
  /* ... */
];
const ALLOWED_INITIAL_STATES: EntityStatus[] = [
  /* ... */
];

// In your repository factory
export const createEntityRepository = () => {
  const baseRepository = createBaseRepository<
    Entity,
    CreatePayload,
    UpdatePayload,
    typeof schema
  >(db, schema, 'Entity');

  // Create a state machine
  const stateMachine = createBaseStateMachine<EntityStatus>(
    STATUS_TRANSITIONS,
    'Entity',
  );

  // Update status with validation
  const updateStatus = async (
    id: number,
    newStatus: EntityStatus,
  ): Promise<Entity> => {
    const entity = await baseRepository.findOne(id);
    stateMachine.validateTransition(entity.status, newStatus);

    return await baseRepository.update(id, {
      status: newStatus,
      statusDate: new Date(),
    });
  };

  // Create with initial state validation
  const create = async (data: CreateEntityPayload): Promise<Entity> => {
    stateMachine.validateInitialState(data.status, ALLOWED_INITIAL_STATES);
    return await baseRepository.create(data);
  };

  return {
    ...baseRepository,
    updateStatus,
    create,
    // other methods...
  };
};
```

## API Reference

### `createBaseStateMachine<T>`

Creates a state machine for managing state transitions.

#### Parameters:

- `transitions: StateTransition<T>[]` - Array of allowed state transitions
- `entityName: string = 'Entity'` - Name of the entity (used for error messages)

#### Returns:

An object with the following methods:

- `validateTransition(fromState: T, toState: T): void` - Validates a state transition, throws if invalid
- `validateInitialState(initialState: T, allowedInitialStates: T[]): void` - Validates an initial state
- `getPossibleNextStates(currentState: T): T[]` - Gets all possible next states
- `canTransition(fromState: T, toState: T): boolean` - Checks if a transition is possible

## Types

### `StateTransition<T>`

```typescript
type StateTransition<T extends string> = {
  from: T; // Current state
  to: T[]; // Array of allowed next states
};
```

## Errors

### `ValidationError`

Thrown when a state validation fails.

### `InvalidStateTransitionError`

Thrown when an invalid state transition is attempted.
