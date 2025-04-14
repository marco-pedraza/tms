import { expect, describe, test } from 'vitest';
import { createBaseStateMachine, StateTransition } from './state-machine';
import { ValidationError } from './errors';

// Mock types and transitions for testing
enum TestStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

const TEST_TRANSITIONS: StateTransition<TestStatus>[] = [
  { from: TestStatus.DRAFT, to: [TestStatus.PENDING, TestStatus.REJECTED] },
  { from: TestStatus.PENDING, to: [TestStatus.APPROVED, TestStatus.REJECTED] },
  { from: TestStatus.APPROVED, to: [] },
  { from: TestStatus.REJECTED, to: [TestStatus.DRAFT] },
];

const ALLOWED_INITIAL_STATES = [TestStatus.DRAFT];

describe('Base State Machine', () => {
  // Create a state machine for testing
  const stateMachine = createBaseStateMachine<TestStatus>(
    TEST_TRANSITIONS,
    'TestEntity',
  );

  describe('validateTransition', () => {
    test('should allow valid transitions', () => {
      // Should not throw
      expect(() => {
        stateMachine.validateTransition(TestStatus.DRAFT, TestStatus.PENDING);
      }).not.toThrow();

      expect(() => {
        stateMachine.validateTransition(
          TestStatus.PENDING,
          TestStatus.APPROVED,
        );
      }).not.toThrow();

      expect(() => {
        stateMachine.validateTransition(TestStatus.REJECTED, TestStatus.DRAFT);
      }).not.toThrow();
    });

    test('should reject invalid transitions', () => {
      // Should throw for invalid transitions
      expect(() => {
        stateMachine.validateTransition(TestStatus.DRAFT, TestStatus.APPROVED);
      }).toThrow();

      expect(() => {
        stateMachine.validateTransition(TestStatus.PENDING, TestStatus.DRAFT);
      }).toThrow();

      expect(() => {
        stateMachine.validateTransition(
          TestStatus.APPROVED,
          TestStatus.PENDING,
        );
      }).toThrow();
    });

    test('should reject unknown states', () => {
      // @ts-expect-error - intentionally testing invalid input
      expect(() => {
        stateMachine.validateTransition('UNKNOWN_STATE', TestStatus.DRAFT);
      }).toThrow(ValidationError);
    });

    test('should include entity name in error message', () => {
      try {
        stateMachine.validateTransition(TestStatus.APPROVED, TestStatus.DRAFT);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('testentity');
      }
    });
  });

  describe('validateInitialState', () => {
    test('should allow valid initial states', () => {
      // Should not throw
      expect(() => {
        stateMachine.validateInitialState(
          TestStatus.DRAFT,
          ALLOWED_INITIAL_STATES,
        );
      }).not.toThrow();
    });

    test('should reject invalid initial states', () => {
      // Should throw for invalid initial states
      expect(() => {
        stateMachine.validateInitialState(
          TestStatus.APPROVED,
          ALLOWED_INITIAL_STATES,
        );
      }).toThrow(ValidationError);

      expect(() => {
        stateMachine.validateInitialState(
          TestStatus.PENDING,
          ALLOWED_INITIAL_STATES,
        );
      }).toThrow(ValidationError);
    });

    test('should include allowed states in error message', () => {
      try {
        stateMachine.validateInitialState(
          TestStatus.APPROVED,
          ALLOWED_INITIAL_STATES,
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain(ALLOWED_INITIAL_STATES.join(', '));
      }
    });
  });

  describe('getPossibleNextStates', () => {
    test('should return correct next states', () => {
      expect(stateMachine.getPossibleNextStates(TestStatus.DRAFT)).toEqual([
        TestStatus.PENDING,
        TestStatus.REJECTED,
      ]);

      expect(stateMachine.getPossibleNextStates(TestStatus.PENDING)).toEqual([
        TestStatus.APPROVED,
        TestStatus.REJECTED,
      ]);

      expect(stateMachine.getPossibleNextStates(TestStatus.APPROVED)).toEqual(
        [],
      );

      expect(stateMachine.getPossibleNextStates(TestStatus.REJECTED)).toEqual([
        TestStatus.DRAFT,
      ]);
    });

    test('should return empty array for unknown state', () => {
      // @ts-expect-error - intentionally testing invalid input
      expect(stateMachine.getPossibleNextStates('UNKNOWN_STATE')).toEqual([]);
    });
  });

  describe('canTransition', () => {
    test('should return true for valid transitions', () => {
      expect(
        stateMachine.canTransition(TestStatus.DRAFT, TestStatus.PENDING),
      ).toBe(true);
      expect(
        stateMachine.canTransition(TestStatus.PENDING, TestStatus.APPROVED),
      ).toBe(true);
      expect(
        stateMachine.canTransition(TestStatus.REJECTED, TestStatus.DRAFT),
      ).toBe(true);
    });

    test('should return false for invalid transitions', () => {
      expect(
        stateMachine.canTransition(TestStatus.DRAFT, TestStatus.APPROVED),
      ).toBe(false);
      expect(
        stateMachine.canTransition(TestStatus.PENDING, TestStatus.DRAFT),
      ).toBe(false);
      expect(
        stateMachine.canTransition(TestStatus.APPROVED, TestStatus.DRAFT),
      ).toBe(false);
    });

    test('should return false for unknown states', () => {
      // @ts-expect-error - intentionally testing invalid input
      expect(
        stateMachine.canTransition('UNKNOWN_STATE', TestStatus.DRAFT),
      ).toBe(false);
      // @ts-expect-error - intentionally testing invalid input
      expect(
        stateMachine.canTransition(TestStatus.DRAFT, 'UNKNOWN_STATE'),
      ).toBe(false);
    });
  });

  describe('Entity name customization', () => {
    test('should use custom entity name in state machine', () => {
      const customMachine = createBaseStateMachine<TestStatus>(
        TEST_TRANSITIONS,
        'CustomEntity',
      );

      try {
        customMachine.validateTransition(TestStatus.APPROVED, TestStatus.DRAFT);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('customentity');
        expect(error.message).not.toContain('testentity');
      }
    });
  });
});
